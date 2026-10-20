import { all, call, put, take, takeLatest } from 'redux-saga/effects';
import { selectors as orderSelectors } from '../reducers/Order';

import { selectors as configSelectors } from 'js/redux/reducers/Configuration';
import printActions, {
  actionTypes as printActionTypes,
} from 'js/redux/reducers/PrintPreview';
import { actionTypes } from '../reducers/PrintTask';
import EPValues from 'js/redux/selectors/EPValues';
import { assignVariables } from 'e-p';
import { ORDER_MODE_FREE_DISPENSE } from 'js/Constants';
import { SOURCE_USER } from '../../Constants';
import log from '../../api/Logger';

const BEFORE = 'BEFORE';
const AFTER = 'AFTER';
const BEFORE_ALL = 'BEFORE_ALL';
const AFTER_ERROR = 'AFTER_ERROR';

/** Check if `layout` contains a barcode item that has a non-empty value in `values` */
function has_barcode(layout, values) {
  for (const { itemType, varCode } of Object.values(layout.data.items)) {
    if (itemType === 'barcode' && values[varCode]) {
      return true;
    }
  }
  return false;
}

export function check_conditions(task, order, labeldata) {
  // Check label valid
  // Check conditions
  if (task.conditions.length === 0) {
    return true;
  }
  const valid = task.conditions.map((c) => {
    const compare =
      c.contains === 'true'
        ? (a, b) => a.includes(b)
        : c.startsWith === 'true'
          ? (a, b) => a.startsWith(b)
          : (a, b) => a === b;
    let v = true;
    //base
    if (c.baseCode && order.item.basecode) {
      v = compare(order.item.basecode, c.baseCode);
    }
    // product
    else if (c.productName && order.item.productname) {
      v = compare(order.item.productname, c.productName);
    }
    //can name
    else if (c.canName && order.item.cansizecode) {
      v = compare(order.item.cansizecode, c.canName);
    }
    // can
    else if (c.customCanSize) {
      v = order.can.canid === null;
    }
    // color
    else if (c.colourCode && order.item.colourcode) {
      v = compare(order.item.colourcode, c.colourCode);
    }
    // barcode
    else if (c.barcodeExists) {
      v = has_barcode(task.layout, labeldata);
    }
    // Formula
    else if (c.addition) {
      v = order.item.additionOnly;
    } else if (c.customFormula) {
      v = order.item.source === SOURCE_USER;
    } else if (c.freeDispense) {
      v = order.order_mode === ORDER_MODE_FREE_DISPENSE;
    } else if (c.hasUfi) {
      v = labeldata ? !!labeldata['extraInfo.formulaUFIs'] : false;
    }

    return c.negate === 'true' ? !v : v;
  });

  if (task.logical_conjunction === 'OR') {
    // Some condition valid
    return valid.some(Boolean);
  } else {
    // All conditions valid
    return valid.every(Boolean);
  }
}

function* check_task(when, reduxState) {
  const tasks = configSelectors
    .localPrintTasks(reduxState)
    .filter((t) =>
      when === BEFORE_ALL
        ? t.all_before_tint
        : when === BEFORE
          ? t.before_tint
          : when === AFTER
            ? t.after_tint
            : t.after_error
    );
  if (tasks.length === 0) {
    // No task valid to be executed
    console.log('No print tasks to be executed');
    return;
  }
  const order = orderSelectors.order(reduxState);
  const canNumber =
    when === AFTER ? order.ncans_tinted : order.ncans_tinted + 1;

  const labeldata = EPValues(reduxState, 1);
  for (const task of tasks) {
    if (check_conditions(task, order, labeldata)) {
      if (when === BEFORE_ALL) {
        for (let i = canNumber; i <= order.item.ncans; i++) {
          printSilent(task, i, reduxState);
        }
      } else {
        if (task.show_preview) {
          yield* showPreview(task, order, canNumber);
        } else {
          printSilent(task, canNumber, reduxState);
        }
      }
    }
  }
}

function printSilent(task, canNumber, reduxState) {
  console.log('Print task silent');
  if (window.qtside) {
    // Only need the labeldata as JSON on QtSide
    // File it_pos_app/Printer.py handles this call!
    const labeldata = EPValues(reduxState, canNumber);
    const label = assignVariables(task.layout.data, labeldata);
    window.qtside.printer.printLabel(
      JSON.stringify(label),
      task.printer,
      task.num_labels
    );
  }
}

function* showPreview(task, order, canNumber) {
  yield put(printActions.setOrder(order, canNumber));
  yield put(
    printActions.setLayout({
      taskname: task.name,
      name: task.layout.name,
      ...task.layout.data,
    })
  );
  yield put(printActions.setPrinter(task.printer));
  yield put(printActions.setCopies(task.num_labels));
  yield put(printActions.setVisible(true));
  // Waiting for popup to close before next label task
  yield take(printActionTypes.SET_VISIBLE);
}

function* check_before_tint(action) {
  try {
    /**
     * Handle before tint printing
     * Payload contains full redux state
     * */
    const { payload } = action;
    yield call(check_task, BEFORE_ALL, payload);
    yield call(check_task, BEFORE, payload);
  } catch (e) {
    log.error(e);
  }
}

function* check_after_each_can(action) {
  try {
    /**
     * Handle after tint printing
     * Payload contains full redux state
     * */
    const { payload } = action;
    yield call(check_task, AFTER, payload);

    /**
     * Handle before tint templates for next if all cans are not tinted
     */

    const order = orderSelectors.order(payload);

    if (order.ncans_tinted < order.item.ncans) {
      yield call(check_task, BEFORE, payload);
    }
  } catch (e) {
    log.error(e);
  }
}

function* check_after_error(action) {
  try {
    /**
     * Handle after error printing
     * Payload contains full redux state
     * */
    const { payload } = action;
    yield call(check_task, AFTER_ERROR, payload);
  } catch (e) {
    log.error(e);
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.PROCESS_TASKS_BEFORE_TINT, check_before_tint),
    takeLatest(actionTypes.PROCESS_TASKS_AFTER_CAN, check_after_each_can),
    takeLatest(actionTypes.PROCESS_TASKS_AFTER_ERROR, check_after_error),
  ]);
}

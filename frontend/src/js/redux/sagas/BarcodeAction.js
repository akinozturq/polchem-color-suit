import { all, call, put, select, take, takeLatest } from 'redux-saga/effects';
import actions, { actionTypes, selectors } from '../reducers/BarcodeAction';
import machineActions, {
  actionTypes as machineActionTypes,
  selectors as machineSelectors,
} from '../reducers/Machine';
import WebRequest from './WebRequest';
import { barcodeResolve } from 'js/api/BarcodeActions';
import {
  AMOUNT_CARD,
  BARCODE_ACTIONS_IN_MODE,
  BARCODE_CANISTER,
  BARCODE_COLOR,
  BARCODE_COLORANT,
  BARCODE_FORMULA,
  BARCODE_MODE_DISPENSE,
  BARCODE_PREFIXCOLOURCODE,
  BARCODE_PREFIXORDERLOAD,
  BARCODE_PREFIXORDERLOADBYITEM,
  BARCODE_PRODUCT,
  BARCODE_VALIDATION_CONFIRM,
  BARCODE_VALIDATION_ERROR,
  BARCODE_VALIDATION_OK,
  COLOR_SEARCH_CARD,
  INFO_CARD,
  ORDER_MODE_NORMAL,
  PRODUCT_SEARCH_CARD,
} from '../../Constants';
import busyActions from '../reducers/Busy';
import formulaActions from '../reducers/Formula';
import _ from 'lodash';
import orderActions, {
  selectors as orderSelectors,
  actionTypes as orderActionTypes,
} from '../reducers/Order';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { selectors as configSelectors } from '../reducers/Configuration';
import { selectors as userSelectors } from '../reducers/User';
import { push } from 'connected-react-router';
import i18n from '../../localization/i18n';
import log from '../../api/Logger';

function* resolveCanisterBarcode(barcode) {
  const [dispID, canister] = yield select(
    machineSelectors.find_dispID_canister,
    barcode
  );
  if (canister) {
    return {
      action: BARCODE_CANISTER,
      dispID,
      canisterid: canister.id,
      cntcode: canister.code,
      barcode,
      canister,
    };
  }
  return null;
}

function* resolveColorantBarcode(barcode) {
  const cnts = yield select(cacheSelectors.cnts);
  for (let cnt of cnts) {
    for (let cntcan of cnt.cntcans) {
      if (cntcan.barcodes.includes(barcode)) {
        return {
          action: BARCODE_COLORANT,
          cntid: cnt.cntid,
          cansizeid: cntcan.cansizeid,
          cntcanid: cntcan.cntcanid,
          barcode,
        };
      }
    }
  }
  return null;
}

function* resolveBarcode(action) {
  const barcode = action.payload;
  yield put(busyActions.setBusy(true));
  const mode = yield select(selectors.barcodemode);
  yield put({ type: actionTypes.RESOLVE_BARCODE_PENDING, payload: true });

  try {
    yield put({ type: actionTypes.SETBARCODE, payload: barcode });

    // check local barcodes before calling server
    let ba =
      (yield* resolveCanisterBarcode(barcode)) ||
      (yield* resolveColorantBarcode(barcode));
    if (!ba) {
      const response = yield call(WebRequest, barcodeResolve(barcode));
      ba = response.data;
    }
    /**
     * Handling action barcodes
            "R": "actionRetry",
            "K": "actionOk",
            "I": "actionSkip",
            "A": "actionCancel",
            "U": "actionContinue",
            "O": "actionCreateNew",
            "D": "actionDispense",
            "S": "actionSave",
            "T": "actionSaveAndDispense",
     */
    if (ba.action && ba.action.startsWith('action')) {
      // Only trigger actions valid for mode
      if (_.includes(BARCODE_ACTIONS_IN_MODE[mode], ba.action)) {
        // Trying to fire that action in UI by clicking the item having the id
        const elm = document.getElementById(ba.action);
        if (elm) {
          elm.click();
        }
      }
    } else {
      // send returned object back to reducer as payload:
      yield put({
        type: actionTypes.RESOLVE_BARCODE_FULFILLED,
        payload: ba,
      });

      if (mode === BARCODE_MODE_DISPENSE) {
        /**
         * Dispensing and need to validate can barcode
         */
        yield* handleCanValidation(ba);
      } else {
        if (
          // In case of product, color or formula barcode search rest!
          ba.action === BARCODE_PRODUCT ||
          ba.action === BARCODE_COLOR ||
          ba.action === BARCODE_FORMULA ||
          ba.action === BARCODE_PREFIXCOLOURCODE
        ) {
          yield* handleProductColorFormulaBarcode(ba);
        } else if (ba.action === BARCODE_COLORANT) {
          yield* handleColorantBarcode(barcode, ba);
        } else if (ba.action === BARCODE_PREFIXORDERLOAD) {
          // Loading one item of the order
          yield put(orderActions.fetchOrderitem(ba.itemid, false, ba.zoneid));
        } else if (ba.action === BARCODE_PREFIXORDERLOADBYITEM) {
          yield put(orderActions.fetchOrderitem(ba.itemid, false, ba.zoneid));
        } else if (ba.action === BARCODE_CANISTER) {
          yield* handleCanisterBarcode(ba);
        } else {
          yield put({
            type: actionTypes.RESOLVE_BARCODE_REJECTED,
            payload: {
              msg: i18n.t(
                'msg.barcodeNotValid',
                'Barcode not valid, please check it'
              ),
            },
          });
        }
      }
    }
  } catch (e) {
    log.error(e);
    yield put({ type: actionTypes.RESOLVE_BARCODE_REJECTED, payload: e });
  } finally {
    yield put({
      type: actionTypes.RESOLVE_BARCODE_PENDING,
      payload: false,
    });
    yield put(busyActions.setBusy(false));
  }
}

function* handleCanValidation(ba) {
  const { barcode_can_check_before_dispensing_confirmation } = yield select(
    configSelectors.config_values
  );
  const can = yield select(orderSelectors.can);
  const valid =
    (ba.action === BARCODE_PRODUCT || ba.action === BARCODE_FORMULA) &&
    can &&
    ba.canids.includes(can.canid);
  yield put(
    actions.setValidationState(
      valid
        ? barcode_can_check_before_dispensing_confirmation
          ? BARCODE_VALIDATION_CONFIRM
          : BARCODE_VALIDATION_OK
        : BARCODE_VALIDATION_ERROR
    )
  );
}

function* handleProductColorFormulaBarcode(ba) {
  let can = yield select(orderSelectors.can);
  let base = yield select(orderSelectors.base);
  // Normal mode
  if (ba.action === BARCODE_PRODUCT || ba.action === BARCODE_FORMULA) {
    // Select product, base and cansize for order
    let product = yield select(cacheSelectors.getProduct, ba.productid);
    if (product) {
      yield put(orderActions.setProduct(product));
      base = _.find(product.basepaints, (x) => x.baseid === ba.baseid);
      if (base) {
        yield put(orderActions.setBase(base));
        can = _.find(base.cans, (x) => x.canid === ba.canid);
      }
    } else {
      base = null;
      can = null;
    }
  }
  if (
    ba.action === BARCODE_COLOR ||
    ba.action === BARCODE_FORMULA ||
    ba.action === BARCODE_PREFIXCOLOURCODE
  ) {
    const colour = _.pick(ba, 'colourcode', 'rgb', 'colourid');
    yield put(orderActions.setColor(colour));
  }

  // Check if product and color exists
  const color = yield select(orderSelectors.color);
  const product = yield select(orderSelectors.product);

  if (color && product && color.colourid && product.productid) {
    yield put(orderActions.setOrderMode(ORDER_MODE_NORMAL));
    // Product and colour set --> load formula
    yield put(
      formulaActions.loadFormula(color.colourid, product.productid, can)
    );
    // Formula loaded
    const frm = yield take(orderActionTypes.SET_FORMULA_FULFILLED);
    if (frm.payload) {
      if (!base) base = yield select(orderSelectors.base);
      // In case that we have scanned some canid with last product
      if (base && !can) {
        const canid = yield select(selectors.last_scanned_canid);
        can = _.find(base.cans, (x) => x.canid === canid);
      }

      if (frm.payload.baseid === base.baseid && can) {
        yield put(orderActions.setCan(can));
        yield put(orderActions.setOpenSection(INFO_CARD));
        const { barcode_formula_auto_tint } = yield select(
          configSelectors.config_values
        );
        if (barcode_formula_auto_tint) {
          yield put(orderActions.initiateTinting());
        }
      } else {
        // Notify user about incorrect base
        if (
          (frm.payload.baseid !== base.baseid && can) ||
          (frm.payload.baseid === base.baseid && !can) //                  ba.action === BARCODE_FORMULA
        ) {
          yield put({
            type: actionTypes.RESOLVE_BARCODE_REJECTED,
            payload: {
              msg: i18n.t(
                'msg.barcodeValidBaseInvalid',
                "Barcode is valid formula barcode, but formula base paint doesn't match with barcode base paint!"
              ),
            },
          });
        }

        yield put(orderActions.setOpenSection(AMOUNT_CARD));
      }
    } else {
      // No formula for this pair! Notify user
      yield put({
        type: actionTypes.RESOLVE_BARCODE_REJECTED,
        payload: {
          msg: i18n.t(
            'msg.barcodeValidNoFormulaForPair',
            'Barcode is valid barcode, but formula for selected product and color code does not exist'
          ),
        },
      });
    }
  } else if (color && !product) {
    // Move color first
    yield put(orderActions.setOrderMode(ORDER_MODE_NORMAL, COLOR_SEARCH_CARD));
    // Load products
    yield put(formulaActions.fetchProductsWithFormulas(color.colourid));

    yield put(orderActions.moveToNextSection(COLOR_SEARCH_CARD));
  } else if (!color && product) {
    // Move product first
    yield put({ type: orderActionTypes.SET_BASE, payload: base });
    yield put(orderActions.setCan(can));

    yield put(
      orderActions.setOrderMode(ORDER_MODE_NORMAL, PRODUCT_SEARCH_CARD)
    );
    yield put(orderActions.moveToNextSection(PRODUCT_SEARCH_CARD));
  }
  // Navigate to order page if not already there
  yield put(push('/orderpage'));
}

function* handleColorantBarcode(barcode, ba) {
  /* {
            action: 'colorant',
            cansizeid: 3,
            cntcanid: 32,
            cntid: 18, ....
          }; */
  // Check barcode refill privilege
  const privileges = yield select(userSelectors.privileges);

  if (!_.includes(privileges, 'canister_level_change')) {
    yield put({
      type: actionTypes.RESOLVE_BARCODE_REJECTED,
      payload: {
        msg: i18n.t(
          'msg.barcodeValidAccessDenied',
          'Barcode valid, access denied'
        ),
      },
    });
    return;
  }

  const [dispID, canisters] = yield select(
    machineSelectors.find_dispID_canisters,
    ba.cntid
  );
  let canister = canisters[0];
  if (!canister) {
    return;
  }
  canister = { ...canister, alt_canisters: canisters };

  yield put({
    type: machineActionTypes.SET_MACHINE_BARCODE_REFILL_ACTION,
    payload: {
      cntid: ba.cntid,
      cansizeid: ba.cansizeid,
      barcode,
      canisterid: canister.id,
    },
  });

  const current_target_canister = yield select(
    machineSelectors.refill_target_canister
  );

  if (!current_target_canister) {
    // Refill modal is not open
    yield put({
      type: machineActionTypes.SET_CURRENT_MACHINE,
      payload: { dispID },
    });
    yield put({
      type: machineActionTypes.CMD_MOVE_TO_FILL,
      payload: {
        dispID,
        canid: canister.id,
        code: canister.code,
      },
    });

    // Need to check that if we are ready page --> no need to navigate
    const state = yield select();
    const path = state.router.location.pathname;
    if (
      ['/orderpage', '/localformula', '/matching', '/freedispense'].includes(
        path
      )
    ) {
      yield put({
        type: machineActionTypes.SET_MACHINE_SLIDE_OVER_VISIBLE,
        payload: { dispID, visible: true },
      });
    } else {
      yield put(push('/machine'));
    }
    yield put(machineActions.setRefillTargetCanister(canister));
  }
}

function* handleCanisterBarcode(ba) {
  /*  ba is like this:
  {
      action: BARCODE_CANISTER,
      dispID,
      canisterid,
      cntcode,
      barcode,
      canister,
    }
  */
  // Check barcode refill privilege
  const privileges = yield select(userSelectors.privileges);

  if (!_.includes(privileges, 'canister_level_change')) {
    yield put({
      type: actionTypes.RESOLVE_BARCODE_REJECTED,
      payload: {
        msg: i18n.t(
          'msg.barcodeValidAccessDenied',
          'Barcode valid, access denied'
        ),
      },
    });
    return;
  }

  yield put({
    type: machineActionTypes.SET_MACHINE_BARCODE_CANISTER_ACTION,
    payload: ba,
  });

  const current_target_canister = yield select(
    machineSelectors.refill_target_canister
  );
  const current_dispID = yield select(machineSelectors.current_dispID);

  if (current_target_canister) {
    // Refill modal is already open
    if (
      current_target_canister.id !== ba.canisterid &&
      current_dispID === ba.dispID &&
      current_target_canister.code === ba.cntcode
    ) {
      // Different canister for same colorant, change canister
      yield put({
        type: machineActionTypes.CMD_MOVE_TO_FILL,
        payload: {
          dispID: ba.dispID,
          canid: ba.canisterid,
          code: ba.cntcode,
        },
      });
      yield put(machineActions.setRefillTargetCanister(ba.canister));
    }
  } else {
    // Refill modal is not open
    yield put({
      type: machineActionTypes.SET_CURRENT_MACHINE,
      payload: { dispID: ba.dispID },
    });

    // Need to check that if we are ready page --> no need to navigate
    const state = yield select();
    const path = state.router.location.pathname;
    if (
      ['/orderpage', '/localformula', '/matching', '/freedispense'].includes(
        path
      )
    ) {
      yield put({
        type: machineActionTypes.SET_MACHINE_SLIDE_OVER_VISIBLE,
        payload: { dispID: ba.dispID, visible: true },
      });
    } else {
      yield put(push('/machine'));
    }
    yield put(machineActions.setRefillTargetCanister(ba.canister));
  }
}

function* manualCntBarcodeDetails(action) {
  const barcode = action.payload;

  try {
    const ba = yield* resolveColorantBarcode(barcode);

    yield put({
      type: machineActionTypes.SET_MACHINE_BARCODE_REFILL_ACTION,
      payload: null,
    });
    yield put({
      type: actionTypes.MANUAL_CNT_BARCODE_DETAILS_FULFILLED,
      payload: ba,
    });
  } catch (e) {
    // Ignore
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.RESOLVE_BARCODE, resolveBarcode),
    takeLatest(actionTypes.MANUAL_CNT_BARCODE_DETAILS, manualCntBarcodeDetails),
  ]);
}

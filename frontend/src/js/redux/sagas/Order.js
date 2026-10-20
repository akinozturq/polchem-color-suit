import _ from 'lodash';
import {
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import actions, {
  actionTypes as orderActionTypes,
  actionTypes,
  RETINT_TYPE_CORRECTION,
  RETINT_TYPE_FORMULA,
  selectors as orderSelectors,
} from '../reducers/Order';

import { selectors as hoverSelectors } from '../reducers/HoverColor';
import formulaActions, {
  actionTypes as formulaTypes,
  selectors as formulaSelectors,
} from '../reducers/Formula';
import queueActions, {
  actionTypes as queueActionTypes,
  selectors as orderQueueSelectors,
} from '../reducers/OrderQueue';
import machineActions, {
  actionTypes as machineActionTypes,
  selectors as machineSelectors,
} from '../reducers/Machine';
import printTaskActions from '../reducers/PrintTask';
import barcodeActions from '../reducers/BarcodeAction';
import busyActions from '../reducers/Busy';
import {
  actionTypes as configActionTypes,
  selectors as configSelectors,
} from '../reducers/Configuration';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { selectors as protectionSelectors } from '../reducers/Protection';
import { preDispenseModals, readyToDispense } from '../selectors/OrderReady';
import {
  base_addition_scaling_factor,
  can_scaling_factor,
  update_extender_volume_from_redux,
} from 'js/mylib/Formula';
import {
  delete_customer,
  hide_orderitem,
  post_dispense,
  save_customer,
  save_localorder,
  save_orderitem,
  close_orderitem,
} from 'js/api/Order';
import { actionTypes as customerTypes } from 'js/redux/reducers/Customer';

import {
  deleteWithSiteid,
  saveWithSiteid,
  waitForConfigValues,
  waitForIsPro,
  waitForZone,
} from './Configuration';
import webRequest from './WebRequest';
import { fulfilled, rejected } from '../factories/ApiCall';
import {
  AMOUNT_CARD,
  ARTICLE_SEARCH_CARD,
  BARCODE_VALIDATION_NONE,
  BARCODE_VALIDATION_SCAN,
  COLOR_CODE_ALTERNATIVE,
  COLOR_CODE_UNIQUE,
  COLOR_SEARCH_CARD,
  COLORCODE_MAX_LENGTH,
  FORMULA_CORRECTION_TYPE_ADD_BASE,
  FORMULA_CORRECTION_TYPE_REFORMULATE,
  FORMULA_INPUT_CARD,
  FORMULA_SEARCH_CARD,
  INFO_CARD,
  MATCH_SEARCH,
  MATCH_SEARCH_CARD,
  NUMERIC_ORDER_STATUS,
  ORDER_MODE_FORMULA_CORRECTION,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_LOCAL_FORMULA,
  ORDER_MODE_MATCHING,
  ORDER_MODE_NORMAL,
  ORDER_STATUS_DONE,
  ORDER_STATUS_WAITING,
  PRODUCT_SEARCH_CARD,
  PRODUCT_SEARCH_MODE_MATCH,
  SOURCE_ADDITION,
  SOURCE_USER,
  UAC_AUTO_LOGOUT_AFTER_ORDER,
} from '../../Constants';
import { push } from 'connected-react-router';
// import transferActions from 'js/redux/reducers/Transfer';
import errorActions from 'js/redux/reducers/Errors';
import i18n from 'js/localization/i18n';
import FormulaAPI from 'js/api/Formula';
import userActions, { selectors as userSelectors } from '../reducers/User';
import { isAlmostEqual, isSubset } from '../../mylib/Utils';
import historyActions from '../reducers/History';
import customersActions from '../reducers/Customer';
import log from '../../api/Logger';
import { get_cnt_for_product } from '../../mylib/Product';
import { is_colourcode_free } from '../../api/Order.js';

function* setColor(action) {
  const { color } = action.payload;
  if (color && color.colourid != null) {
    const zone = yield call(waitForZone);
    try {
      yield put({ type: formulaTypes.FETCH_COLOR_DETAILS_PENDING });
      const response = yield call(
        webRequest,
        FormulaAPI.fetchColorDetails(zone.zoneid, color.colourid)
      );
      let data = response.data;
      let { colourcode, colournames } = data;
      const uniquecode = colourcode;
      const { color_code_name_swap, unique_color_codes } =
        yield call(waitForConfigValues);
      // If not unique color codes then show the alternatives if available
      if (!unique_color_codes) {
        colourcode = data.altcolourcode || colourcode;
        if (colourcode !== uniquecode) {
          // Ensure that a color card is set if alternative color code is used
          const card = yield select(orderSelectors.card);
          if (!card || !data.colourcardids.includes(card.colourcardid)) {
            const colourcardid = data.colourcardids[0];
            const newCard = yield select(cacheSelectors.getCard, colourcardid);
            if (newCard) {
              yield put({
                type: actionTypes.SET_CARD,
                payload: newCard,
              });
            }
          }
        }
      }

      if (color_code_name_swap && colournames?.length) {
        [colourcode, colournames] = [colournames[0], [colourcode]];
      }

      if (color.colournames && !isSubset(color.colournames, colournames)) {
        // preserve edited color name when loading order
        colournames = color.colournames;
      }

      data = { ...data, colourcode, colournames, uniquecode };
      // Fetch clicked color name from hover color
      const selected_name = yield select(hoverSelectors.name);

      yield put({
        type: formulaTypes.FETCH_COLOR_DETAILS_FULFILLED,
        payload: data,
      });
      yield put({
        type: actionTypes.SET_COLOR_DETAILS,
        payload: {
          ...data,
          selected_name: colournames.includes(selected_name)
            ? selected_name
            : undefined,
        },
      });
    } catch (e) {
      yield put({
        type: formulaTypes.FETCH_COLOR_DETAILS_REJECTED,
        payload: e,
      });
    }
  }
}

function* setScaledCnts(action) {
  const section = yield select(orderSelectors.open_section);
  const cnts = action.payload;
  const orderMode = yield select(orderSelectors.order_mode);
  if (cnts != null) {
    const shouldFetchPrice = section !== FORMULA_INPUT_CARD;
    // call extra info calculation
    if (shouldFetchPrice) {
      yield put({ type: actionTypes.FETCH_ORDERITEM_PRICE });
    }
  }
}

function* validateFormula() {
  const cnts = yield select(orderSelectors.itemCnts);
  const dispID = yield select(machineSelectors.current_dispID);
  if (cnts && dispID != null) {
    const base_dosing = yield select(configSelectors.base_dosing);
    const machine_order = yield select(
      orderSelectors.machineFormat,
      base_dosing
    );
    if (machine_order?.formula.cnts.length) {
      yield put(
        machineActions.checkFormula(dispID, machine_order.formula.cnts)
      );
    } else {
      yield put({ type: actionTypes.CHECK_FORMULA_FULFILLED, payload: [] });
    }
  }
}

function* addPrimerToOrder(action) {
  try {
    const { itemid, primer_color } = action.payload;
    const is_pro = yield call(waitForIsPro);
    const { enable_primer, unique_color_codes } =
      yield call(waitForConfigValues);

    if (!primer_color || !is_pro || !enable_primer) {
      yield put({ type: rejected(action.type), payload: 'Not authorized' });
      return;
    }
    const { siteid, systemgroupid } = yield select(configSelectors.site);
    const { zoneid } = yield select(configSelectors.zone);
    const order = yield select(orderSelectors.order);

    // Check if primer color is already in order
    const local_queue = yield select(orderQueueSelectors.local_queue);
    const queue_order = local_queue.find((x) => x.orderid === order.orderid);
    if (queue_order?.orderitems.find((x) => x.parentitemid === itemid)) {
      yield put({ type: fulfilled(action.type), payload: primer_color });
      return;
    }

    let response;
    try {
      response = yield call(
        webRequest,
        FormulaAPI.formulaAsOrderitem(
          systemgroupid,
          zoneid,
          primer_color.colourid,
          primer_color.productid,
          order.can,
          siteid,
          true,
          unique_color_codes
        )
      );
    } catch (e) {
      if (e.response?.status !== 404) {
        throw e;
      } // 409: formula not found, empty response handled below
    }

    if (response) {
      const orderitem = response.data;
      orderitem.parentitemid = itemid;
      orderitem.orderid = order.orderid;
      yield call(webRequest, save_orderitem(orderitem));

      yield put(queueActions.fetchLocalQueue());
      yield take(fulfilled(queueActionTypes.FETCH_LOCAL_QUEUE));

      yield put({ type: fulfilled(action.type), payload: primer_color });
    } else {
      yield put({
        type: rejected(action.type),
        payload: 'Primer formula not found',
      });
      yield put(
        errorActions.showError(
          i18n.t('msg.primerProductNoFormula', 'Primer formula not found'),
          null,
          i18n.t(
            'msg.primerProductNoFormulaReason',
            'Primer product missing formula for primer color. Please check your configuration.'
          )
        )
      );
    }
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showError(
        i18n.t('msg.primerAddingFailed', 'Primer adding failed'),
        e,
        i18n.t(
          'msg.primerAddingFailed',
          'Adding primer item into order failed.'
        )
      )
    );
  }
}

function* saveOrderitem(action) {
  let { navigate_to, itemstatus } = action.payload;
  if (navigate_to || itemstatus === ORDER_STATUS_DONE) {
    yield put(busyActions.setBusy(true));
  }
  const { siteid, localclient } = yield select(configSelectors.site);
  const { zoneid } = yield select(configSelectors.zone);
  const localuserid = yield select(userSelectors.localuserid);
  const { color_code_name_swap } = yield call(waitForConfigValues);
  try {
    if (siteid == null) throw new Error('Site not set');

    // wait for prices
    if (yield select(orderSelectors.price_pending)) {
      const price_action = yield take([
        orderActionTypes.FETCH_ORDERITEM_PRICE_FULFILLED,
        orderActionTypes.FETCH_ORDERITEM_PRICE_REJECTED,
      ]);
      if (
        price_action.type === orderActionTypes.FETCH_ORDERITEM_PRICE_REJECTED
      ) {
        throw new Error(price_action.payload);
      }
    }

    const { clear_item_after_saving } = action.payload;
    if (itemstatus)
      yield put({ type: actionTypes.SET_ITEM_STATUS, payload: itemstatus });
    else itemstatus = yield select(orderSelectors.itemstatus);

    // save localorder
    const order = yield select(orderSelectors.order);
    const localorder = _.pick(order, 'orderid', 'customerid', 'notes');
    localorder.siteid = siteid;
    localorder.zoneid = zoneid;
    localorder.clientid = (localclient || {}).clientid;
    localorder.localuserid = localuserid;
    // Need to check other items related to this order.
    if (localorder.orderid) {
      // Multi item case and order saved
      const local_queue = yield select(orderQueueSelectors.local_queue);

      const items =
        _.find(local_queue, ['orderid', localorder.orderid])?.orderitems || [];
      let status_min = items
        .filter((x) => x.itemid !== order?.item?.itemid)
        .map((x) => x.status);

      status_min.push(NUMERIC_ORDER_STATUS[itemstatus]);
      localorder.orderstatus = Math.min(...status_min);
    } else {
      localorder.orderstatus = NUMERIC_ORDER_STATUS[itemstatus];
    }

    const now = new Date(Date.now()).toISOString();
    localorder.orderdate = order.orderdate || now;
    localorder.modificationdate = now;
    yield put({
      type: actionTypes.SET_ORDER_DATE,
      payload: localorder.orderdate,
    });

    const {
      data: { orderid },
    } = yield call(webRequest, save_localorder(localorder));

    // save orderitem
    const {
      manually_set_colorcode,
      cnts,
      notes,
      additionOnly,
      source,
      formulaCorrectionScalingFactor,
      ...item
    } = order.item;
    let { basevolume, nominalamount } = order.can;

    if (additionOnly && formulaCorrectionScalingFactor > 1) {
      // correction with base addition: save as custom can
      basevolume *= formulaCorrectionScalingFactor;
      nominalamount *= formulaCorrectionScalingFactor;
      item.cansizecode = null;
    }
    item.orderitemprice = yield select(orderSelectors.orderitemprice);

    // Save initialvolume as originalvolume, and only if different from volume.
    // Save additionvolume as volume if addition.
    const cntsinitem = cnts
      ? cnts.map((x) => {
          const volume = additionOnly ? x.additionvolume : x.volume;
          const cumulativevolume = additionOnly ? x.volume : null;
          return {
            ...x,
            originalvolume:
              isAlmostEqual(x.initialvolume, x.volume) || manually_set_colorcode
                ? null
                : x.initialvolume,
            volume,
            cumulativevolume,
          };
        })
      : null;
    const orderitem = {
      ...item,
      orderid,
      siteid,
      cntsinitem,
      originalcode: order.item.originalCode || order.color?.colourcode,
      itemnotes: notes,
      fcomment: order.formula?.fcomment,
      source: additionOnly ? SOURCE_ADDITION : source,
      status: NUMERIC_ORDER_STATUS[itemstatus],
      basevolume,
      nominalamount,
      gravimetricnominal: order.can ? order.can.gravimetric : null,
      reflectance: order.color?.reflectance,
    };
    if (color_code_name_swap && orderitem.colourname) {
      const name = orderitem.colourname;
      orderitem.colourname = orderitem.colourcode;
      orderitem.colourcode = name;
      orderitem.originalcode =
        order.color.colournames.length > 0
          ? order.color.colournames[0]
          : order.color.colourcode;
    }

    orderitem.colourcodetype =
      orderitem.colourcode === order.color?.uniquecode
        ? COLOR_CODE_UNIQUE
        : orderitem.colourcode === order.color?.altcolourcode
          ? COLOR_CODE_ALTERNATIVE
          : null;

    const {
      data: { itemid },
    } = yield call(webRequest, save_orderitem(orderitem));

    yield put({ type: actionTypes.SET_IDS, payload: { itemid, orderid } });

    yield put(queueActions.fetchLocalQueue());
    yield take(fulfilled(queueActionTypes.FETCH_LOCAL_QUEUE));

    // Save primer color
    if (item.primer_color) {
      yield put({
        type: orderActionTypes.ADD_PRIMER_TO_ORDER,
        payload: { itemid, primer_color: item.primer_color },
      });
      // wait for primer to be added or rejected
      yield take([
        orderActionTypes.ADD_PRIMER_TO_ORDER_FULFILLED,
        orderActionTypes.ADD_PRIMER_TO_ORDER_REJECTED,
      ]);
    }

    if (clear_item_after_saving) {
      yield put({ type: actionTypes.CLEAR_ORDER_ITEM });
    }

    yield put({ type: fulfilled(action.type), payload: null });

    if (navigate_to) {
      yield put(push(navigate_to));
    }
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
  yield put(busyActions.setBusy(false));
}

function formulaWithNonZeroVolumes(formula) {
  return {
    ...formula,
    cntinformula: formula.cntinformula.filter((x) => x.volume > 0),
  };
}

function* clearAddition(reset_initial) {
  const cnts = (yield select(orderSelectors.itemCnts))
    .map((cnt) => ({
      ...cnt,
      additionvolume: 0,
      originalvolume: cnt.volume,
      initialvolume: reset_initial ? cnt.volume : cnt.initialvolume,
    }))
    .filter((cnt) => cnt.volume > 0 || cnt.initialvolume > 0);

  const formula = formulaWithNonZeroVolumes(
    yield select(orderSelectors.formula)
  );
  const initial_formula = reset_initial
    ? formula
    : formulaWithNonZeroVolumes(yield select(orderSelectors.initial_formula));
  const original_formula = formula;
  yield put({ type: actionTypes.SET_FORMULA_FULFILLED, payload: formula });
  yield put({
    type: actionTypes.SET_ORIGINAL_FORMULA,
    payload: { original_formula, initial_formula },
  });
  yield put({ type: actionTypes.SET_SCALED_CNTS, payload: cnts });
  yield put({ type: actionTypes.SET_ADDITION_ONLY, payload: false });
}

function* retintOrderitem(action) {
  if (action.payload !== RETINT_TYPE_CORRECTION) {
    const isAdditionOnly = yield select(orderSelectors.isAdditionOnly);
    if (isAdditionOnly || action.payload === RETINT_TYPE_FORMULA) {
      const itemEdited = yield select(orderSelectors.itemEdited);
      // if true, we have original volumes and can regenerate color code if user makes further edit
      const resetInitialFormula =
        action.payload === RETINT_TYPE_FORMULA || !itemEdited;
      yield* clearAddition(resetInitialFormula);
    }
    yield put(formulaActions.choosePrimer());
  }
  const root = yield select();
  const cnts = update_extender_volume_from_redux(root.order.item.cnts, root);
  yield put({ type: actionTypes.SET_SCALED_CNTS, payload: cnts });
}

function* closeOrderItems(action) {
  try {
    let items = action.payload;
    const order = yield select(orderSelectors.order);
    const local_queue = yield select(orderQueueSelectors.local_queue);

    if (!items) {
      // Removing order item only if not already done!
      const orderitem = order.item;
      if (orderitem.status !== ORDER_STATUS_DONE && orderitem.itemid != null) {
        items = [orderitem.itemid];
      } else {
        items = [];
      }
    }

    if (items.length) {
      yield put(queueActions.closeItems(items));
    }

    let item_count = (
      _.find(local_queue, ['orderid', order.orderid])?.orderitems || []
    ).length;

    if (item_count === 1) {
      // Clear selected order
      yield put({ type: actionTypes.CLEAR_ORDER });
    } else {
      yield put({ type: actionTypes.CLEAR_ORDER_ITEM });
    }

    yield put({ type: fulfilled(action.type), payload: null });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* hideOrderitem(action) {
  try {
    const itemid = action.payload;
    const { siteid } = yield select(configSelectors.site);

    yield call(webRequest, hide_orderitem({ itemid, siteid }));

    yield put({ type: fulfilled(action.type), payload: null });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* initiateTinting(action) {
  const order_mode = yield select(orderSelectors.order_mode);
  if (order_mode === ORDER_MODE_NORMAL) {
    const primer_check_pending = yield select(
      formulaSelectors.primer_check_pending
    );
    if (primer_check_pending) {
      yield take([
        formulaTypes.CHOOSE_PRIMER_FULFILLED,
        formulaTypes.CHOOSE_PRIMER_REJECTED,
      ]);
    }
    const show_primer = yield select(formulaSelectors.show_primer);
    if (show_primer) {
      return;
    }
  }
  const { allow_dispense } = yield select(readyToDispense);
  if (!allow_dispense) {
    return;
  }
  const modals = yield select(preDispenseModals);
  yield put(actions.setPreTintModals(modals));
  if (!modals.length) {
    const dispID = yield select(machineSelectors.current_dispID);
    yield put(actions.tintOrderitem(dispID));
  }
}

function* isBarcodeCheckRequired() {
  const is_pro = yield select(protectionSelectors.is_pro);
  const { barcode_action_enable, barcode_can_check_before_dispensing } =
    yield select(configSelectors.config_values);
  const order_mode = yield select(orderSelectors.order_mode);
  const can = yield select(orderSelectors.can);
  const is_custom_can = can?.canid == null;
  return (
    is_pro &&
    barcode_action_enable &&
    barcode_can_check_before_dispensing &&
    !is_custom_can &&
    order_mode !== ORDER_MODE_FREE_DISPENSE
  );
}

function* tintOrderitem(action) {
  const itemid = yield select(orderSelectors.itemid);
  if (itemid == null) {
    // orderitem must be saved before tinting because we need the itemid to record cans tinted
    yield put(actions.saveOrderitem(ORDER_STATUS_WAITING));
    const res = yield take([
      actionTypes.SAVE_ORDERITEM_FULFILLED,
      actionTypes.SAVE_ORDERITEM_REJECTED,
    ]);
    if (res.type === actionTypes.SAVE_ORDERITEM_REJECTED) {
      // TODO: handle error
      return;
    }
  }
  const { dispID, skip_tdf_base } = action.payload;
  const base_dosing = yield select(configSelectors.base_dosing);
  const machine_order = yield select(orderSelectors.machineFormat, base_dosing);
  yield put(machineActions.setDropColors(machine_order.dropColors));
  const summary = yield select(orderSelectors.summary);
  log.info(`Start tinting: ${summary}`);

  yield put(printTaskActions.processTasksBeforeTint());

  if (machine_order?.formula.cnts.length) {
    const barcode_check_required = yield call(isBarcodeCheckRequired);
    yield put(
      barcodeActions.setValidationState(
        barcode_check_required
          ? BARCODE_VALIDATION_SCAN
          : BARCODE_VALIDATION_NONE
      )
    );
    yield put(
      machineActions.tintOrder(
        dispID,
        machine_order,
        skip_tdf_base,
        barcode_check_required
      )
    );
  } else {
    log.info('Formula is empty, tinting skipped');
    yield put(
      actions.canTinted(
        machine_order.itemID,
        undefined,
        machine_order.cansTinted,
        machine_order.lotSize,
        machine_order.lotSize
      )
    );
    for (let i = machine_order.cansTinted; i < machine_order.lotSize; ++i) {
      yield put(actions.tintCanReady(machine_order.itemID, undefined));
    }
    yield put({
      type: actionTypes.ORDERITEM_TINTED,
      payload: action.payload.order,
    });
  }
}

function* orderitemTinted() {
  try {
    const closed = yield select(orderSelectors.itemclosed);
    if (!closed) {
      // Wait for item to be closed
      yield take(orderActionTypes.SET_ITEM_CLOSED);
    }
    yield put({
      type: orderActionTypes.SET_ITEM_STATUS,
      payload: ORDER_STATUS_DONE,
    });

    //const { payload } = action;
    // Set user to null if supposed to log out after tinting.
    const { uac_auto_logout, open_queue_after_tinting } = yield select(
      configSelectors.config_values
    );
    if (uac_auto_logout === UAC_AUTO_LOGOUT_AFTER_ORDER) {
      yield put(userActions.loginUser(null, null));
    }

    if (open_queue_after_tinting) {
      // Navigate to queue if option set
      yield put(push('/order-queue'));
      return;
    }

    const order = yield select(orderSelectors.order);
    const local_queue = yield select(orderQueueSelectors.local_queue);

    // Check if order has multiple items. Then move to next not dispensed item
    const queue_order = _.find(local_queue, ['orderid', order.orderid]);
    const next_item = queue_order?.orderitems.find(
      (x) => x.ncans > x.ncans_tinted && x.itemid !== order.item.itemid
    );
    if (next_item) {
      // Load one of the items still not tinted.
      yield put(actions.fetchOrderitem(next_item.itemid));
    } else {
      // Navigate back to home after printing is finished and no items to be tinted
      yield put(push('/'));
    }
  } catch (e) {
    log.error(e);
  }
}

function* saveCustomer(action) {
  const customer = yield select(orderSelectors.customer);
  const { type } = action;
  if (customer != null)
    yield* saveWithSiteid(save_customer, { type, payload: customer });
  const orderid = yield select(orderSelectors.orderid);
  if (orderid != null) {
    yield call(
      webRequest,
      save_localorder({ orderid, customerid: customer?.customerid ?? null })
    );
  }
}

function* deleteCustomer(action) {
  const { payload, type } = action;
  if (payload !== null) {
    yield* deleteWithSiteid(delete_customer, { type, payload });
    yield put({
      type: customerTypes.SEARCH_CUSTOMERS,
      payload: { search: '', page: 0 },
    });
  }
}

function* applyCustomer(action) {
  try {
    const {
      type,
      payload: {
        customer,
        orderid,
        historySearchParams: {
          search,
          fromDate,
          toDate,
          onlyCustomFormulas,
          onlyLocalOrders,
          seek,
        },
      },
    } = action;
    yield put(busyActions.setBusy(true));

    let customerid = customer ? customer.customerid : null;
    // If applying a new customer, save the customer first
    if (customer && customerid == null) {
      const data = yield* saveWithSiteid(save_customer, {
        type,
        payload: customer,
      });
      customerid = data.customerid;
      yield put(customersActions.searchCustomers(customer.customername, 0));
    }

    const localorder = {
      orderid,
      customerid,
    };
    yield call(webRequest, save_localorder(localorder));
    const { allow_hiding_orders } = yield select(configSelectors.config_values);
    yield put(
      historyActions.searchOrderitems(
        search,
        fromDate,
        toDate,
        onlyCustomFormulas,
        onlyLocalOrders,
        seek,
        !allow_hiding_orders
      )
    );

    yield put(busyActions.setBusy(false));
  } catch (e) {
    log.error(e);
    yield put(busyActions.setBusy(false));
    errorActions.showCriticalError(
      i18n.t('msg.unableApplyCustomer', 'Unable to apply customer to order'),
      e
    );
  }
}

function* machineCanTinted(action) {
  try {
    const { itemid, machineid, count_before, count, total } = action.payload;

    const localuserid = yield select(userSelectors.localuserid);
    for (let i = count_before; i < count; ++i) {
      yield call(
        webRequest,
        post_dispense({
          itemid,
          dispensetime: new Date().toISOString(),
          machineid,
          localuserid,
        })
      );
    }
    if (count >= total) {
      console.log('All cans tinted, closing item');
      // All cans tinted, close the item
      const { siteid } = yield select(configSelectors.site);
      yield call(webRequest, close_orderitem({ siteid, itemid }));
      yield put({ type: actionTypes.SET_ITEM_CLOSED });
    }
    yield put(queueActions.fetchLocalQueue());
  } catch (e) {
    log.error(e);
    errorActions.showCriticalError(
      i18n.t('msg.unableReportDispense', 'Unable to report dispense'),
      e
    );
  }

  // Save orderitem ncans change

  /*
  // Notify QT side about finished dispense
  try {
    const { siteid } = yield select(configSelectors.site);
    const { zoneid } = yield select(configSelectors.zone);
    const order = yield select(orderSelectors.order);
    const localorder = _.pick(order, 'orderid', 'customerid', 'notes');
    const itemstatus = yield select(orderSelectors.itemstatus);
    localorder.siteid = siteid;
    localorder.zoneid = zoneid;
    localorder.orderstatus = NUMERIC_ORDER_STATUS[itemstatus];

    const { cnts, notes, ...item } = order.item;
    const orderitem = {
      ...item,
      cntsinitem: cnts,
      itemnotes: notes,
      status: NUMERIC_ORDER_STATUS[itemstatus],
      ..._.pick(order.can, 'basevolume', 'nominalamount'),
      gravimetricnominal: order.can ? order.can.gravimetric : null,
    };

    // also call the Qt side for external transfer
    yield put(
      transferActions.sendOrderQt({
        ...localorder,
        orderitem: { ...orderitem },
      })
    );
  } catch (e) {
    // TODO: handle failure
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSendOrderToQt', 'Unable to send order to Qt'),
        e
      )
    );
  }
  */
}

/**
 * Helper function to calculate color code based on formula changes
 */
function* calculateColorCode({
  originalFormula,
  newFormula,
  originalCode,
  scaledby,
  shotFormatter,
  order,
}) {
  // Get required data
  const cntmap = yield select(cacheSelectors.cntmap);
  const factor =
    order.can && order.base ? can_scaling_factor(order.base, order.can) : 1;

  // Build color code parts
  const colorCodeParts = [originalCode || order.item.colourcode];

  // Add percentage if needed
  const percent = (scaledby - 1) * 100;
  if (percent) {
    const sign = percent > 0 ? '+' : '-';
    const rounded = Math.abs(Math.round(percent));
    colorCodeParts.push(`${sign}${rounded}%`);
  }

  // Calculate formula differences
  const initial_cnts = originalFormula.cntinformula.map((c) => c.cntid);
  const cnts = newFormula.cntinformula.map((c) => c.cntid);

  // Get the formula changes
  const diff = _.union(cnts, initial_cnts)
    .map((cntid) => {
      const o = originalFormula.cntinformula.find((c) => c.cntid === cntid);
      const n = newFormula.cntinformula.find((c) => c.cntid === cntid);

      return {
        ...get_cnt_for_product(cntid, cntmap, order.product),
        volume: n?.volume || 0,
        initial_volume: (o?.volume || 0) * scaledby,
      };
    })
    .filter((x) => !isAlmostEqual(x.volume, x.initial_volume));

  // Add colorant differences to parts
  for (const x of _.sortBy(diff, 'cntcode')) {
    const v = shotFormatter.format({
      volume: (x.volume - x.initial_volume) * factor,
      specificgravity: x.specificgravity,
    });
    colorCodeParts.push(`${x.cntcode} ${v}`);
  }

  // Join and truncate if needed
  let code = colorCodeParts.join(' ');
  if (code.length > COLORCODE_MAX_LENGTH) {
    code = code.slice(0, COLORCODE_MAX_LENGTH - 1) + '\u2026'; // ellipsis
  }

  return code;
}

function* setColourCodeAfterFormulaEdit(action) {
  try {
    yield put(actions.setOrderitemSource(SOURCE_USER));

    const shotFormatter = action.payload.shotFormatter
      ? action.payload.shotFormatter
      : yield select(configSelectors.shotFormatter);
    const order = yield select(orderSelectors.order);
    const formula = action.payload.frm || order.formula;
    yield put(formulaActions.synthesizeRgb(formula));
    const scaledby = action.payload.scaledby || order.item.scaledby;

    const code = yield* calculateColorCode({
      originalFormula: order.initial_formula,
      newFormula: formula,
      originalCode: order.item.originalCode,
      scaledby,
      shotFormatter,
      order,
    });

    yield put({
      type: actionTypes.SET_COLOURCODE,
      payload: { manual_set_code: false, code },
    });
  } catch (e) {
    yield put({
      type: actionTypes.SET_COLOURCODE_AFTER_FORMULA_EDIT_REJECTED,
      payload: e,
    });
  }
}

function* setFormulaAfterCorrection(action) {
  try {
    yield put(actions.setOrderitemSource(SOURCE_USER));

    const { correctionType, correctionData } = action.payload;

    // Set formula before correction as original_formula
    const original_formula = yield select(orderSelectors.formula);
    yield put(actions.setOriginalFormula(original_formula));
    const { rgb, formula: corrected_frm } = correctionData;

    yield put(actions.setFormulaCorrectionType(correctionType));
    yield put(
      actions.setAdditionOnly(
        correctionType !== FORMULA_CORRECTION_TYPE_REFORMULATE
      )
    );
    const scalingFactor =
      correctionType === FORMULA_CORRECTION_TYPE_ADD_BASE
        ? base_addition_scaling_factor(
            corrected_frm.cntinformula,
            original_formula.cntinformula
          )
        : 1;
    yield put(actions.setFormulaCorrectionScalingFactor(scalingFactor));

    yield put(actions.setFormula(corrected_frm));
    const order = yield select(orderSelectors.order);
    yield put(actions.setCan(order.can));
    yield take(actionTypes.SET_SCALED_CNTS);

    // Get shotFormatter and scaledby
    const shotFormatter = action.payload.shotFormatter
      ? action.payload.shotFormatter
      : yield select(configSelectors.shotFormatter);
    const { scaledby } = order.item;

    // Calculate color code using the helper function
    const code = yield* calculateColorCode({
      originalFormula: original_formula,
      newFormula: corrected_frm,
      originalCode: order.item.originalCode,
      scaledby,
      shotFormatter,
      order,
    });

    yield put({
      type: actionTypes.SET_RGB,
      payload: rgb,
    });
    yield put({
      type: actionTypes.SET_COLOURCODE,
      payload: { manual_set_code: false, code },
    });

    yield put({
      type: actionTypes.SET_ITEM_EDITED,
      payload: true,
    });
  } catch (e) {
    yield put({
      type: actionTypes.SET_FORMULA_AFTER_CORRECTION_REJECTED,
      payload: e,
    });
  }
}

function* setProductAfterConfirmation() {
  try {
    const order = yield select(orderSelectors.order);
    const matchingMode =
      order.color_search_mode === MATCH_SEARCH ||
      order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH;
    const currentOrderColor = yield select(orderSelectors.color);
    if (currentOrderColor.colourid && !matchingMode) {
      const product = yield select(orderSelectors.product);

      const oldCan = yield select(orderSelectors.can);

      yield put({
        type: formulaTypes.FETCH_FORMULA,
        payload: {
          colourid: currentOrderColor.colourid,
          productid: product.productid,
        },
      });
      const newBase = yield take(actionTypes.SET_BASE);
      yield take(actionTypes.SET_FORMULA_FULFILLED);

      if (
        newBase.payload.cans.find(
          (can) => can.cansizecode === oldCan?.cansizecode
        )
      ) {
        yield put(
          actions.setCan(
            newBase.payload.cans.find(
              (can) => can.cansizecode === oldCan.cansizecode
            )
          )
        );
        yield put({
          type: actionTypes.SET_PREVIOUS_SECTION,
          payload: PRODUCT_SEARCH_CARD,
        });
        yield put({
          type: actionTypes.SET_OPEN_SECTION,
          payload: INFO_CARD,
        });
        yield put({
          type: actionTypes.SET_PRODUCT_AFTER_CONFIRMATION_FULFILLED,
          payload: true,
        });
      } else {
        yield put(actions.setCan(null));
        yield put({ type: actionTypes.SET_OPEN_SECTION, payload: AMOUNT_CARD });
      }
    } else {
      yield put(actions.setColor(null));
      yield put(actions.setCard(null));
      yield put(actions.setCan(null));
      yield put(actions.clearFormula());
      yield put({
        type: actionTypes.SET_OPEN_SECTION,
        payload: COLOR_SEARCH_CARD,
      });
      yield put({
        type: actionTypes.SET_PRODUCT_AFTER_CONFIRMATION_FULFILLED,
        payload: true,
      });
    }
  } catch (e) {
    yield put({
      type: actionTypes.SET_PRODUCT_AFTER_CONFIRMATION_REJECTED,
      payload: e,
    });
  }
}

function* setColorAfterConfirmation() {
  try {
    const order = yield select(orderSelectors.order);
    const matchingMode =
      order.color_search_mode === MATCH_SEARCH ||
      order.product_search_mode === PRODUCT_SEARCH_MODE_MATCH;
    const product = yield select(orderSelectors.product);
    const can = yield select(orderSelectors.can);
    let formula;
    if (product?.productid && !matchingMode) {
      const colour = yield select(orderSelectors.color);
      yield put({
        type: formulaTypes.FETCH_FORMULA,
        payload: {
          colourid: colour.colourid,
          productid: product.productid,
        },
      });
      formula = (yield take(actionTypes.SET_FORMULA_FULFILLED)).payload;
    }
    if (formula) {
      yield put(actions.setCan(can));
      yield put({
        type: actionTypes.SET_PREVIOUS_SECTION,
        payload: COLOR_SEARCH_CARD,
      });
      yield put({
        type: actionTypes.SET_OPEN_SECTION,
        payload: INFO_CARD,
      });
      yield put({
        type: actionTypes.SET_COLOR_AFTER_CONFIRMATION_FULFILLED,
        payload: true,
      });
    } else {
      yield put({ type: actionTypes.SET_PRODUCT, payload: null });
      yield put(actions.setCan(null));
      yield put(actions.clearFormula());
      yield put({
        type: actionTypes.SET_OPEN_SECTION,
        payload: PRODUCT_SEARCH_CARD,
      });
      yield put({
        type: actionTypes.SET_COLOR_AFTER_CONFIRMATION_FULFILLED,
        payload: true,
      });
    }
  } catch (e) {
    yield put({
      type: actionTypes.SET_COLOR_AFTER_CONFIRMATION_REJECTED,
      payload: e,
    });
  }
}

function sectionOrder(
  order_mode,
  order_start_section,
  color_search_mode,
  product_search_mode
) {
  switch (order_mode) {
    case ORDER_MODE_NORMAL: {
      switch (order_start_section) {
        case PRODUCT_SEARCH_CARD:
          if (color_search_mode === MATCH_SEARCH) {
            return [
              PRODUCT_SEARCH_CARD,
              COLOR_SEARCH_CARD,
              AMOUNT_CARD,
              FORMULA_SEARCH_CARD,
              INFO_CARD,
            ];
          } else {
            return [
              PRODUCT_SEARCH_CARD,
              COLOR_SEARCH_CARD,
              AMOUNT_CARD,
              INFO_CARD,
            ];
          }
        case ARTICLE_SEARCH_CARD:
          return [
            ARTICLE_SEARCH_CARD,
            PRODUCT_SEARCH_CARD,
            AMOUNT_CARD,
            INFO_CARD,
          ];
        default:
          if (product_search_mode === PRODUCT_SEARCH_MODE_MATCH)
            return [
              COLOR_SEARCH_CARD,
              PRODUCT_SEARCH_CARD,
              AMOUNT_CARD,
              FORMULA_SEARCH_CARD,
              INFO_CARD,
            ];
          else
            return [
              COLOR_SEARCH_CARD,
              PRODUCT_SEARCH_CARD,
              AMOUNT_CARD,
              INFO_CARD,
            ];
      }
    }
    case ORDER_MODE_FORMULA_CORRECTION:
      return [MATCH_SEARCH_CARD, FORMULA_SEARCH_CARD, INFO_CARD];
    case ORDER_MODE_FREE_DISPENSE:
      return [FORMULA_INPUT_CARD, INFO_CARD];
    case ORDER_MODE_LOCAL_FORMULA:
      return [
        COLOR_SEARCH_CARD,
        PRODUCT_SEARCH_CARD,
        AMOUNT_CARD,
        FORMULA_INPUT_CARD,
        INFO_CARD,
      ];
    case ORDER_MODE_MATCHING:
      return [
        COLOR_SEARCH_CARD,
        PRODUCT_SEARCH_CARD,
        AMOUNT_CARD,
        FORMULA_SEARCH_CARD,
        INFO_CARD,
      ];
    default:
      // should be unnecessary
      return [COLOR_SEARCH_CARD, PRODUCT_SEARCH_CARD, AMOUNT_CARD, INFO_CARD];
  }
}

/**
 * Added support for moving forward or backward as well as setting currenct section
 * @param action
 * @returns {IterableIterator<<"PUT", PutEffectDescriptor<{payload: *, type: *}>>|<"PUT", PutEffectDescriptor<{payload: null, type: *}>>|<"SELECT", SelectEffectDescriptor>|<"PUT", PutEffectDescriptor<{type: *}>>>}
 */
function* setOpenSection(action) {
  const order_mode = yield select(orderSelectors.order_mode);
  const order_start_section = yield select(orderSelectors.order_start_section);
  const color_search_mode = yield select(orderSelectors.color_search_mode);
  const product_search_mode = yield select(orderSelectors.product_search_mode);
  const sections = sectionOrder(
    order_mode,
    order_start_section,
    color_search_mode,
    product_search_mode
  );
  const open_sction = yield select(orderSelectors.open_section);
  yield put({ type: actionTypes.SET_PREVIOUS_SECTION, payload: open_sction });
  const prev_section = yield select(orderSelectors.prev_section);
  let section = action.payload.section || open_sction;
  if (action.payload.moveToNext) {
    const i = sections.indexOf(section);
    if (i < sections.length - 1) {
      section = sections[i + 1];
    } else {
      return;
    }
  } else if (action.payload.moveToPrev) {
    const i = sections.indexOf(section);
    if (i > 0) {
      section = sections[i - 1];
    } else {
      return;
    }
  }

  if (prev_section !== INFO_CARD) {
    const sec_i = sections.indexOf(section);
    if (sec_i > -1) {
      const color_i = sections.indexOf(COLOR_SEARCH_CARD);
      const product_i = sections.indexOf(PRODUCT_SEARCH_CARD);
      const amount_i = sections.indexOf(AMOUNT_CARD);
      const formulaSearch_i = sections.indexOf(FORMULA_SEARCH_CARD);

      if (sec_i < color_i && color_i > -1) {
        yield put(actions.setColor(null));
      }

      if (sec_i < product_i && product_i > -1) {
        yield put({ type: actionTypes.SET_PRODUCT, payload: null });
      }

      if (
        (sec_i < amount_i &&
          amount_i > -1 &&
          (order_mode === ORDER_MODE_NORMAL ||
            order_mode === ORDER_MODE_MATCHING)) ||
        (sec_i === 0 && order_mode !== ORDER_MODE_FORMULA_CORRECTION) // If in first section and not formula correction clear rest
      ) {
        // clear formula here
        yield put(actions.clearFormula());
        yield put(formulaActions.clearPrimer());
        yield put({
          type: formulaTypes.MATCH_FORMULA_FULFILLED,
          payload: null,
        });
        yield put({
          type: formulaTypes.SEARCH_CLOSEST_FULFILLED,
          payload: null,
        });
      }
      if (
        sec_i === formulaSearch_i &&
        ![ORDER_MODE_FORMULA_CORRECTION, ORDER_MODE_MATCHING].includes(
          order_mode
        )
      ) {
        yield put({ type: actionTypes.SET_BASE, payload: null });
      }
    }
  }
  if (section === FORMULA_INPUT_CARD) {
    yield put(formulaActions.synthesizeRgbBeforeEdit());
  }
  if (section === INFO_CARD && order_mode === ORDER_MODE_FREE_DISPENSE)
    yield put({ type: actionTypes.FETCH_ORDERITEM_PRICE });
  yield put({
    type: actionTypes.SET_OPEN_SECTION,
    payload: section,
  });
}

/**
 * Updates the order reducer based on configuration changes
 * @param action
 * @returns {IterableIterator<<"SELECT", SelectEffectDescriptor>|IterableIterator<<"SELECT", SelectEffectDescriptor>|<"CALL", CallEffectDescriptor>|<"PUT", PutEffectDescriptor<*>>>>}
 */
function* updateBasedOnConfig() {
  // TODO: Check how this should work!
  /*
  const card_search = _.get(action.payload, 'color_search_tree.value', true);
  if (!card_search) {
    yield put(actions.setColorSearchMode(COLOR_SEARCH));
  } else {
    yield put(actions.setColorSearchMode(CARD_SEARCH));
  }

  const prod_tree_search = _.get(
    action.payload,
    'product_search_table.value',
    false
  );
  if (!prod_tree_search) {
    yield put(actions.setProductSearchMode(PRODUCT_SEARCH_MODE_LIST));
  } else {
    yield put(actions.setProductSearchMode(PRODUCT_SEARCH_MODE_TREE));
  }

   */
}

export function* isColourCodeFree(action) {
  const { zoneid } = yield call(waitForZone);
  try {
    yield put({ type: actionTypes.IS_COLOURCODE_FREE_PENDING });
    const params = { ...action.payload, zoneid };
    const { data } = yield call(webRequest, is_colourcode_free(params));
    yield put({
      type: actionTypes.IS_COLOURCODE_FREE_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.IS_COLOURCODE_FREE_REJECTED, payload: e });
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.SET_COLOR, setColor),
    takeLatest(actionTypes.SET_SCALED_CNTS, setScaledCnts),
    takeLatest(
      [
        actionTypes.SET_SCALED_CNTS,
        actionTypes.SET_ADDITION_ONLY,
        machineActionTypes.SET_CURRENT_MACHINE,
      ],
      validateFormula
    ),
    takeLatest(actionTypes.SWITCH_OPEN_SECTION, setOpenSection),
    takeEvery(actionTypes.SAVE_ORDERITEM, saveOrderitem),
    takeLatest(
      [actionTypes.RETINT_ORDER, actionTypes.RETINT_ITEM],
      retintOrderitem
    ),
    takeEvery(actionTypes.CLOSE_ORDERITEMS, closeOrderItems),
    takeEvery(actionTypes.SAVE_CUSTOMER, saveCustomer),
    takeEvery(actionTypes.DELETE_CUSTOMER, deleteCustomer),
    takeLatest(actionTypes.APPLY_CUSTOMER, applyCustomer),
    takeLatest(actionTypes.INITIATE_TINTING, initiateTinting),
    takeLatest(actionTypes.TINT_ORDERITEM, tintOrderitem),
    takeEvery(actionTypes.CAN_TINTED, machineCanTinted),
    takeLatest(orderActionTypes.ORDERITEM_TINTED, orderitemTinted),
    takeLatest(configActionTypes.FETCH_CONFIG_FULFILLED, updateBasedOnConfig),
    takeLatest(
      actionTypes.SET_COLOR_AFTER_CONFIRMATION,
      setColorAfterConfirmation
    ),
    takeLatest(
      actionTypes.SET_PRODUCT_AFTER_CONFIRMATION,
      setProductAfterConfirmation
    ),
    takeLatest(
      actionTypes.SET_COLOURCODE_AFTER_FORMULA_EDIT,
      setColourCodeAfterFormulaEdit
    ),
    takeLatest(
      actionTypes.SET_FORMULA_AFTER_CORRECTION,
      setFormulaAfterCorrection
    ),
    takeLatest(actionTypes.ADD_PRIMER_TO_ORDER, addPrimerToOrder),
    takeEvery(actionTypes.HIDE_ITEM, hideOrderitem),
    takeLatest(actionTypes.IS_COLOURCODE_FREE, isColourCodeFree),
  ]);
}

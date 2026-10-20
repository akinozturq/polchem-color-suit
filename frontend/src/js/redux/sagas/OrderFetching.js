import _ from 'lodash';
import { all, call, put, select, take, takeLatest } from 'redux-saga/effects';
import actions, {
  actionTypes,
  RETINT_TYPE_FORMULA,
  selectors as orderSelectors,
} from '../reducers/Order';
import busyActions from '../reducers/Busy';
import formulaActions from '../reducers/Formula';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { normalize_volumes } from 'js/mylib/Formula';
import { refl_to_xyz, xyz_to_lab, xyz_to_rgb } from 'js/mylib/ColorCalc';
import { load_customer, orderitem_details } from 'js/api/Order';
import { orderitem_prices } from 'js/api/Pricing';
import { waitForConfigValues, waitForSite, waitForZone } from './Configuration';
import webRequest, { fetchAndPut } from './WebRequest';
import { rejected } from '../factories/ApiCall';
import {
  AMOUNT_CARD,
  INFO_CARD,
  NUMERIC_ORDER_STATUS,
  ORDER_MODE_FREE_DISPENSE,
  ORDER_MODE_LOCAL_FORMULA,
  ORDER_MODE_NORMAL,
  ORDER_STATUS_DONE,
  ORDER_STATUS_PREPARING,
  SOURCE_ADDITION,
  SOURCE_FREE_DISPENSE,
  SOURCE_MAIN,
  SOURCE_USER,
  STRING_ORDER_STATUS,
} from '../../Constants';
import { push } from 'connected-react-router';
// import transferActions from 'js/redux/reducers/Transfer';
import errorActions from 'js/redux/reducers/Errors';
import i18n from 'js/localization/i18n';
import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';
import { get_cnt_for_product } from '../../mylib/Product';
import {
  actionTypes as configActionType,
  selectors as configSelectors,
} from '../reducers/Configuration.js';
import { CheckRules } from '../../mylib/RulesChecker.js';

function* fetchOrderitemPrice() {
  try {
    yield put({ type: actionTypes.FETCH_ORDERITEM_PRICE_PENDING });
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);

    const order = yield select(orderSelectors.order);

    const orderitem = {
      colourid: order.color.colourid,
      productid: order.product.productid,
      cntsinitem: order.item.cnts || [],
      ...order.can,
      gravimetricnominal: order.can ? order.can.gravimetric : null,
    };

    const { data } = yield call(
      webRequest,
      orderitem_prices({ zoneid, siteid, orderitem })
    );
    yield put({
      type: actionTypes.FETCH_ORDERITEM_PRICE_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_ORDERITEM_PRICE_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToFetchOrderItemPrice',
          'Unable to fetch price of order item'
        ),
        e
      )
    );
  }
}

function* fetchOrderitemAlternativePrice(action) {
  try {
    yield put({ type: actionTypes.FETCH_ORDERITEM_ALTERNATIVE_PRICE_PENDING });
    const zoneid = action.payload;
    const { siteid } = yield call(waitForSite);

    const order = yield select(orderSelectors.order);

    const orderitem = {
      colourid: order.color.colourid,
      productid: order.product.productid,
      cntsinitem: order.item.cnts,
      ...order.can,
      gravimetricnominal: order.can ? order.can.gravimetric : null,
    };

    const { data } = yield call(
      webRequest,
      orderitem_prices({ zoneid, siteid, orderitem })
    );
    yield put({
      type: actionTypes.FETCH_ORDERITEM_ALTERNATIVE_PRICE_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({
      type: actionTypes.FETCH_ORDERITEM_ALTERNATIVE_PRICE_REJECTED,
      payload: e,
    });
    if (_.get(e, 'response.status') !== 404) {
      yield put(
        errorActions.showCriticalError(
          i18n.t(
            'msg.unableToFetchOrderItemPrice',
            'Unable to fetch price of order item'
          ),
          e
        )
      );
    }
  }
}

export function* fetchOrderitem(action) {
  // Notify busy
  yield put(busyActions.setBusy(true));
  // Issue with getting the orignal formula
  let current_zone = yield call(waitForZone);

  try {
    // Check if zone changing is needed
    const new_zoneid = action.payload.zoneid;
    if (new_zoneid && new_zoneid !== current_zone.zoneid) {
      // need to change the zone

      const zones = yield select(cacheSelectors.zones);
      const new_zone = zones.find((z) => z.zoneid === new_zoneid);
      if (new_zone) {
        yield put({ type: configActionType.SET_ZONE, payload: new_zone });
        yield take(configActionType.SET_ZONE_FULLFILLED);
        current_zone = yield call(waitForZone);
      }
    }

    const params = {
      itemid: action.payload.itemid,
      zoneid: current_zone.zoneid,
    };
    const { retint, resume } = action.payload;
    const { data } = yield call(webRequest, orderitem_details(params));

    const { colour, colourname } = yield* colorFromData(data);
    const { product, base, can } = yield* productBaseCanFromData(data);
    const { cnts, initial_cnts, original_cnts, isEdited, additionOnly } =
      yield* cntsFromData(data, product);
    const { formula, initial_formula, original_formula } =
      yield* formulaFromData(
        data,
        colour,
        product,
        base,
        cnts,
        initial_cnts,
        original_cnts
      );

    const { cardname, colourcardid, localorder } = data;
    const card = cardname ? { cardname, colourcardid } : null;

    const numeric_item_status =
      data.status != null ? data.status : localorder.orderstatus;
    const { customerid, orderdate, modificationdate } = localorder;

    // Clearing all previous data first
    yield put({
      type: retint ? actionTypes.CLEAR_ORDER_ITEM : actionTypes.CLEAR_ORDER,
    });

    // Use source from order if consistent with data
    let { source } = data;
    if (
      source === SOURCE_MAIN &&
      (isEdited || colour.colourid == null || base?.baseid == null)
    ) {
      source = SOURCE_USER;
    }
    if (additionOnly && !retint) {
      source = SOURCE_ADDITION;
    }
    if (data.basecode == null) {
      source = SOURCE_FREE_DISPENSE;
    }
    yield put(actions.setOrderitemSource(source));

    // Loading new data
    yield put({
      type: actionTypes.SET_IDS,
      payload: retint
        ? { zoneid: data.zoneid }
        : {
            itemid: data.itemid,
            orderid: localorder.orderid,
            zoneid: data.zoneid,
          },
    });
    yield put(
      actions.setColor(colour, colourname, data.originalcode, isEdited)
    );
    if (data.rgb != null) {
      yield put(actions.setRgb(data.rgb));
    }
    yield put(actions.setPrimer(null));
    yield put(actions.setCard(card));
    yield put(actions.setProduct(product));
    yield put({ type: actionTypes.SET_BASE, payload: base });

    yield put(actions.setAdditionOnly(additionOnly));
    yield put(actions.setOriginalFormula(original_formula, initial_formula));
    yield put({ type: actionTypes.SET_FORMULA_FULFILLED, payload: formula });
    yield put(actions.setCan(can, false));
    if (!formula) {
      // basevolume unknown, must set scaled formula directly
      yield put({ type: actionTypes.SET_SCALED_CNTS, payload: cnts });
    }

    // Set discount
    yield put(actions.setDiscount(data.discount));
    yield put(actions.setBasePriceAdjustment(data.basepriceadjustment));
    yield put(actions.setCntPriceAdjustment(data.cntpriceadjustment));

    //Calculate added colorants compare to original from the history order
    if (formula && formula.baseid && data.cntsinitem.length > 0) {
      yield put({
        type: actionTypes.SET_SCALEDBY,
        payload: data.scaledby || 1,
      });
    }
    if (retint === RETINT_TYPE_FORMULA) {
      // Loading existing local formula.
      yield put(actions.setNumberOfCans(1));
    } else {
      yield put(actions.setNumberOfCans(data.ncans));
      yield put(actions.setNumberOfCansTinted(data.dispenses.length));
      yield put(actions.setItemNotes(data.itemnotes));
      yield put(actions.setOrderNotes(localorder.notes));

      if (customerid !== null) {
        yield put(actions.fetchCustomer(customerid));
      } else {
        yield put(actions.setCustomer(null));
      }
    }
    // NOTE: retint is true if isLocalFormula is true
    if (retint) {
      yield put(actions.reTintItem(retint));
    } else {
      yield put({
        type: actionTypes.SET_ITEM_STATUS,
        payload: resume
          ? ORDER_STATUS_PREPARING
          : STRING_ORDER_STATUS[numeric_item_status],
      });
      yield put({ type: actionTypes.SET_ORDER_DATE, payload: orderdate });
      yield put({
        type: actionTypes.SET_MODIFICATION_DATE,
        payload: modificationdate,
      });
    }
    switch (resume ? SOURCE_MAIN : source) {
      case SOURCE_USER: {
        yield put(actions.setOrderMode(ORDER_MODE_LOCAL_FORMULA));
        if (retint === RETINT_TYPE_FORMULA) {
          yield put(actions.setOpenSection(AMOUNT_CARD));
        } else {
          yield put(actions.setOpenSection(INFO_CARD));
        }

        // Navigate to order page
        if (window.location.hash !== '#/localformula')
          yield put(push('/localformula'));
        break;
      }
      case SOURCE_FREE_DISPENSE: {
        yield put(actions.setOrderMode(ORDER_MODE_FREE_DISPENSE));
        yield put(actions.setOpenSection(INFO_CARD));

        // Navigate to order page
        yield put(push('/freedispense'));
        break;
      }
      default:
        yield put(actions.setOrderMode(ORDER_MODE_NORMAL));
        yield put(actions.setOpenSection(INFO_CARD));

        // Navigate to order page
        yield put(push('/orderpage'));

        break;
    }
    // Choose primer
    if (data.status !== NUMERIC_ORDER_STATUS[ORDER_STATUS_DONE]) {
      yield put(formulaActions.choosePrimer());
    }
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }

  // Notify busy
  yield put(busyActions.setBusy(false));
}

function* productBaseCanFromData(data) {
  let product = yield select(cacheSelectors.getProduct, data.productid);
  let base;
  let can;
  if (product) {
    base = _.find(product.basepaints, (x) => x.baseid === data.baseid);
    if (base) {
      can = _.find(base.cans, (x) => x.cansizeid === data.cansizeid);
      if (can && Math.abs(can.basevolume - data.basevolume) > 0.1) {
        // Mismatch in base volume
        const f = new NumberFormatter({ symbol: 'l' });
        can = {
          cansizecode: f.format(data.basevolume / base.nominalfill / 1000),
          basevolume: data.basevolume,
          baseid: base.baseid,
          canid: null,
        };
      }
    }
  }
  const baseid = base?.baseid ?? null;
  if (!can) {
    const cansize = yield select(cacheSelectors.getCansize, data.cansizeid);
    if (cansize) {
      can = {
        ...cansize,
        basevolume: data.basevolume,
        baseid,
        canid: null,
      };
    } else {
      can = {
        ..._.pick(data, ['basevolume', 'cansizecode', 'nominalamount']),
        gravimetric: data.gravimetricnominal,
        baseid,
        cansizeid: null,
        canid: null,
      };
    }
  }
  if (!base) {
    base =
      data.basecode && data.basevolume
        ? {
            baseid,
            basecode: data.basecode,
            coefficient: 1,
            cans: [can],
          }
        : null;
  }
  if (!product) {
    product = {
      productid: null,
      productzname: data.productname,
      basepaints: [base],
    };
  }
  return { base, product, can };
}

function* cntsFromData(data, product) {
  const cnts = [];
  const initial_cnts = [];
  const original_cnts = [];
  const additionOnly = data.cntsinitem.some((x) => x.cumulativevolume != null);
  const isEdited = data.cntsinitem.some((x) => x.originalvolume != null);
  const cntmap = yield select(cacheSelectors.cntmap);
  for (const {
    cntcode,
    cntid,
    volume,
    originalvolume,
    cumulativevolume,
  } of data.cntsinitem) {
    const cumvol = additionOnly
      ? (cumulativevolume ?? originalvolume + volume)
      : volume;
    const origvol = originalvolume ?? cumvol;
    const additionvolume = additionOnly ? volume : cumvol - origvol;
    const c = {
      cntcode,
      ...get_cnt_for_product(cntid, cntmap, product),
      volume: cumvol,
      additionvolume,
    };
    cnts.push(c);

    // true original volume before all additions
    initial_cnts.push({ ...c, volume: origvol });
    // original volume before latest addition
    original_cnts.push({
      ...c,
      volume: additionOnly ? cumvol - additionvolume : origvol,
    });
  }
  return { cnts, initial_cnts, original_cnts, isEdited, additionOnly };
}

function* formulaFromData(
  data,
  color,
  product,
  base,
  cnts,
  initial_cnts,
  original_cnts
) {
  let formula = null;
  let initial_formula = null;
  let original_formula = null;
  if (data.basevolume && base) {
    // Use the saved basevolume for scaling
    const original_can = { basevolume: data.basevolume };
    formula = {
      colourid: color.colourid,
      productid: product.productid,
      baseid: base.baseid,
      cntinformula: normalize_volumes(cnts, base, original_can),
      fcomment: data.fcomment,
      icomment: data.icomment,
    };
    initial_formula = {
      ...formula,
      cntinformula: normalize_volumes(initial_cnts, base, original_can),
    };
    original_formula = {
      ...formula,
      cntinformula: normalize_volumes(original_cnts, base, original_can),
    };
  } else {
    // Everything without base volume should be handled like free dispense
    formula = {
      baseid: base?.baseid ?? null,
      cntinformula: normalize_volumes(cnts, base, _, 'freeDispense'),
      fcomment: data.fcomment,
      icomment: data.icomment,
    };
    original_formula = {
      ...formula,
      cntinformula: normalize_volumes(cnts, base, _, 'freeDispense'),
    };
    initial_formula = original_formula;
    yield put(actions.setOrderMode(ORDER_MODE_FREE_DISPENSE));
  }
  if (product && base?.baseid) {
    const { enable_overfill_checking } = yield select(
      configSelectors.config_values
    );
    formula.rules = CheckRules(
      product,
      base,
      formula,
      enable_overfill_checking
    );
  }
  return { initial_formula, original_formula, formula };
}

function* colorFromData(data) {
  const { color_code_name_swap } = yield call(waitForConfigValues);
  const colour = _.pick(data, 'colourcode', 'rgb', 'colourid', 'reflectance');
  let colourname = data.colourname;
  if (color_code_name_swap && colourname) {
    colour.colourcode = colourname;
    colourname = data.colourcode;
  }
  colour.colournames = colourname ? [colourname] : [];

  if (colour.colourid == null && colour.reflectance != null) {
    const xyz = refl_to_xyz(
      colour.reflectance.rinf || colour.reflectance.rw || []
    );
    if (xyz) {
      colour.xyz = xyz;
      colour.lab = xyz_to_lab(xyz);
      colour.rgb = xyz_to_rgb(xyz);
    }
  }
  return { colour, colourname };
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.FETCH_ORDERITEM, fetchOrderitem),
    takeLatest(actionTypes.FETCH_CUSTOMER, fetchAndPut, load_customer),
    takeLatest(actionTypes.FETCH_ORDERITEM_PRICE, fetchOrderitemPrice),
    takeLatest(
      actionTypes.FETCH_ORDERITEM_ALTERNATIVE_PRICE,
      fetchOrderitemAlternativePrice
    ),
  ]);
}

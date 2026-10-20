import { call, select } from 'redux-saga/effects';
import { save_localorder, save_orderitem } from 'js/api/Order';
import { barcodeResolve } from 'js/api/BarcodeActions';
import {
  NUMERIC_ORDER_STATUS,
  ORDER_STATUS_WAITING,
  COLORCODE_MAX_LENGTH,
  COLORNAME_MAX_LENGTH,
  BASECODE_MAX_LENGTH,
  CANSIZECODE_MAX_LENGTH,
  SOURCE_EXTERNAL,
  BARCODE_PRODUCT,
} from '../../Constants';
import { selectors as cacheSelectors } from '../reducers/Cache';
import { waitForSite, waitForZone } from './Configuration';
import { waitForColorants } from './Cache';
import webRequest from './WebRequest';
import FormulaAPI from '../../api/Formula';
import { adjust_cnt_for_product } from '../../mylib/Product';

/** Add new order from Flink object parsed on qtside */
export function* addOrderFromFlink(flink) {
  const { siteid, systemgroupid } = yield call(waitForSite);
  const { zoneid } = yield call(waitForZone);
  yield call(waitForColorants);

  const product =
    (yield call(barcodeProduct, flink)) || (yield call(flinkProduct, flink));
  const color = yield call(flinkColor, flink);
  const formula = flink.formula
    ? yield call(flinkFormula, flink, product.productid)
    : yield call(databaseFormula, systemgroupid, zoneid, product, color);

  const now = new Date().toISOString();
  const localorder = {
    siteid: siteid,
    zoneid: zoneid,
    orderstatus: NUMERIC_ORDER_STATUS[ORDER_STATUS_WAITING],
    orderdate: now,
    modificationdate: now,
  };

  const f = flink;
  const orderitem = {
    source: SOURCE_EXTERNAL,
    status: NUMERIC_ORDER_STATUS[ORDER_STATUS_WAITING],
    scaledby: 1,
    ...color,
    ...product,
    // The following must come last, to override
    ...formula, // Full orderitem if from databaseFormula
    ncans: f.counter || 1,
  };

  const {
    data: { orderid },
  } = yield call(webRequest, save_localorder(localorder));

  orderitem.orderid = orderid;
  yield call(webRequest, save_orderitem(orderitem));
}

function* barcodeProduct({ barcode }) {
  if (barcode) {
    const response = yield call(webRequest, barcodeResolve(barcode));
    const ba = response.data;
    if (ba.action === BARCODE_PRODUCT) {
      const product = yield select(cacheSelectors.getProduct, ba.productid);
      const base = product?.basepaints.find((x) => x.baseid === ba.baseid);
      const can = base?.cans.find((x) => x.canid === ba.canid);

      if (can) {
        return {
          productid: ba.productid,
          productname: product.productzname,
          basecode: base.basecode,
          cansizecode: can.cansizecode,
          cansizeid: can.cansizeid,
          nominalamount: can.nominalamount,
          gravimetricnominal: can.gravimetric,
          basevolume: can.basevolume,
        };
      }
    }
    throw `Product not found by barcode "${barcode}"`;
  }
}

function* flinkProduct(flink) {
  let productname = flink.subproduct_descr || flink.product_descr;
  let basecode = truncate(flink.base_descr, BASECODE_MAX_LENGTH);
  let cansizecode = truncate(flink.can_descr, CANSIZECODE_MAX_LENGTH);
  let cansizeid;
  let nominalamount = flink.can_nomq;
  let gravimetricnominal = Boolean(flink.can_wgh);
  let basevolume = flink.base_vol || flink.frm_nomq;

  let productid = flink.subproduct_code || flink.product_code;
  const products = yield select(cacheSelectors.products);
  const product = products.find((x) =>
    productid ? x.productid === productid : x.productzname === productname
  );
  const base = product?.basepaints.find(
    (x) => x.basecode === basecode || x.baseid === flink.base_code
  );
  const can = base?.cans.find(
    (x) => x.cansizecode === cansizecode || x.cansizeid === flink.can_code
  );
  if (product) {
    productname = product.productzname;
    productid = product.productid;
  }
  if (base) {
    basecode = base.basecode;
  }
  if (can) {
    cansizecode = can.cansizecode;
    cansizeid = can.cansizeid;
    nominalamount = can.nominalamount;
    gravimetricnominal = can.gravimetric;
    basevolume = can.basevolume;
  } else {
    const cansizes = yield select(cacheSelectors.cansizes);
    const cansize = cansizes.find((x) => x.cansizecode === cansizecode);
    cansizeid = cansize?.cansizeid;
  }
  return {
    productid,
    productname,
    basecode,
    cansizecode,
    cansizeid,
    nominalamount,
    gravimetricnominal,
    basevolume,
  };
}

function* flinkColor(flink) {
  const descr = [
    flink.frm_descr_1,
    flink.frm_descr_2,
    flink.frm_descr_3,
    flink.frm_descr_4,
  ].filter(Boolean);
  const colourcode = truncate(descr[0], COLORCODE_MAX_LENGTH);
  const colourname = truncate(descr[1], COLORNAME_MAX_LENGTH);

  let colourid;
  let rgb;
  if (colourcode) {
    const r = yield call(webRequest, FormulaAPI.colorByCode(colourcode));
    if (r?.data?.length) {
      const c = r.data[0];
      colourid = c.colourid;
      rgb = c.rgb;
    }
  }
  return { colourid, colourcode, colourname, rgb };
}

function* flinkFormula(flink, productid) {
  const cntmap = yield select(cacheSelectors.cntmap);
  const cntcodemap = yield select(cacheSelectors.cntcodemap);
  const product = yield select(cacheSelectors.getProduct, productid);

  const scaling =
    (flink.can_nomq / flink.frm_nomq) * (flink.unit / flink.fraction);
  const cntsinitem = flink.formula.map(([key, amount]) => {
    const scaled = amount * scaling;
    const cnt =
      flink.formula_type == 'by_descr'
        ? // finds only altcode if that is in use; it3 finds either
          cntcodemap.get(key)
        : cntmap.get(key);
    if (!cnt) {
      if (flink.wgh_mode) {
        // cannot save gravimetric formula without density data
        throw `Unknown colorant: ${key}`;
      } else {
        return { cntcode: key, volume: scaled };
      }
    }
    const { specificgravity } = adjust_cnt_for_product(cnt, product);
    const volume = flink.wgh_mode ? scaled / specificgravity : scaled;
    return {
      cntcode: cnt.cntcode,
      cntid: cnt.cntid,
      specificgravity,
      volume,
    };
  });
  return { cntsinitem };
}

function* databaseFormula(systemgroupid, zoneid, product, color) {
  const { productid, cansizeid } = product;
  const { colourid } = color;
  if (!productid) throw 'Product not found';
  if (!cansizeid) throw 'Can size not found';
  if (!colourid) throw 'Color not found';
  try {
    const r = yield call(
      webRequest,
      FormulaAPI.formulaAsOrderitem(
        systemgroupid,
        zoneid,
        colourid,
        productid,
        { cansizeid }
      )
    );
    return r.data;
  } catch (e) {
    if (e.response?.status === 404) {
      throw 'Formula not found';
    }
    throw e;
  }
}

function truncate(str, length) {
  return str != null ? str.slice(0, length).trim() : null;
}

import { call, put, takeLatest } from 'redux-saga/effects';
import { actionTypes } from '../reducers/Pricing';
import { waitForSite, waitForZone } from './Configuration';
import {
  price_colorants,
  price_bundle,
  price_product,
  price_common_set,
  price_colorants_set,
  price_cansizes_set,
  price_product_set,
} from 'js/api/Pricing';
import WebRequest from './WebRequest';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';

function* fetchPricingBundle() {
  yield put({ type: actionTypes.FETCH_PRICING_BUNDLE_PENDING, payload: true });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = { zoneid, siteid };
    const { data } = yield call(WebRequest, price_bundle(params));
    yield put({
      type: actionTypes.FETCH_PRICING_BUNDLE_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_PRICING_BUNDLE_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToFetchPricing', 'Unable to fetch pricing'),
        e
      )
    );
  }
}

function* fetchColorantsPrice() {
  yield put({
    type: actionTypes.FETCH_COLORANTS_PRICING_PENDING,
    payload: true,
  });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = { zoneid, siteid };
    const { data } = yield call(WebRequest, price_colorants(params));
    yield put({
      type: actionTypes.FETCH_COLORANTS_PRICING_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({
      type: actionTypes.FETCH_COLORANTS_PRICING_REJECTED,
      payload: e,
    });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToFetchPricing', 'Unable to fetch pricing'),
        e
      )
    );
  }
}

function* fetchProductPrice(action) {
  const id = action.payload;
  yield put({
    type: actionTypes.FETCH_PRODUCTS_PRICING_PENDING,
    payload: true,
  });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = {
      zoneid,
      siteid,
      productid: id,
    };
    const { data } = yield call(WebRequest, price_product(params));
    yield put({
      type: actionTypes.FETCH_PRODUCTS_PRICING_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({
      type: actionTypes.FETCH_PRODUCTS_PRICING_REJECTED,
      payload: e,
    });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToFetchPricing', 'Unable to fetch pricing'),
        e
      )
    );
  }
}

function* setCommonPrice(action) {
  try {
    yield put({ type: actionTypes.SET_COMMON_PRICING_PENDING, payload: true });
    const common = action.payload;
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = {
      zoneid,
      siteid,
      common,
    };
    yield call(WebRequest, price_common_set(params));
    yield put({
      type: actionTypes.SET_COMMON_PRICING_FULFILLED,
      payload: common,
    });
  } catch (e) {
    yield put({ type: actionTypes.SET_COMMON_PRICING_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSetPricing', 'Unable to save pricing'),
        e
      )
    );
  }
}

function* setColorantsPrice(action) {
  try {
    yield put({
      type: actionTypes.SET_COLORANTS_PRICING_PENDING,
      payload: true,
    });
    const colorants = action.payload;
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = {
      zoneid,
      siteid,
      colorants,
    };
    yield call(WebRequest, price_colorants_set(params));
    yield put({
      type: actionTypes.SET_COLORANTS_PRICING_FULFILLED,
      payload: colorants,
    });
  } catch (e) {
    yield put({ type: actionTypes.SET_COLORANTS_PRICING_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSetPricing', 'Unable to save pricing'),
        e
      )
    );
  }
}

function* setCansizesPrice(action) {
  try {
    yield put({
      type: actionTypes.SET_CANSIZES_PRICING_PENDING,
      payload: true,
    });
    const cansizes = action.payload;
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = {
      zoneid,
      siteid,
      cansizes,
    };
    yield call(WebRequest, price_cansizes_set(params));
    yield put({
      type: actionTypes.SET_CANSIZES_PRICING_FULFILLED,
      payload: cansizes,
    });
  } catch (e) {
    yield put({ type: actionTypes.SET_CANSIZES_PRICING_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSetPricing', 'Unable to save pricing'),
        e
      )
    );
  }
}

function* setProductPrice(action) {
  try {
    yield put({ type: actionTypes.SET_PRODUCT_PRICING_PENDING, payload: true });
    const product = action.payload;
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const params = {
      zoneid,
      siteid,
      productid: product.productid,
      product,
    };
    yield call(WebRequest, price_product_set(params));
    yield put({
      type: actionTypes.SET_PRODUCT_PRICING_FULFILLED,
      payload: product,
    });
  } catch (e) {
    yield put({ type: actionTypes.SET_PRODUCT_PRICING_REJECTED, payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToSetPricing', 'Unable to save pricing'),
        e
      )
    );
  }
}

export default function* saga() {
  yield takeLatest(actionTypes.FETCH_COLORANTS_PRICING, fetchColorantsPrice);
  yield takeLatest(actionTypes.FETCH_PRICING_BUNDLE, fetchPricingBundle);
  yield takeLatest(actionTypes.FETCH_PRODUCTS_PRICING, fetchProductPrice);
  yield takeLatest(actionTypes.SET_COMMON_PRICING, setCommonPrice);
  yield takeLatest(actionTypes.SET_COLORANTS_PRICING, setColorantsPrice);
  yield takeLatest(actionTypes.SET_CANSIZES_PRICING, setCansizesPrice);
  yield takeLatest(actionTypes.SET_PRODUCT_PRICING, setProductPrice);
}

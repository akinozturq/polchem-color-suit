import { all, call, put, select, take, takeLatest } from 'redux-saga/effects';
import CacheAPI from 'js/api/Cache';
import actions, { actionTypes, selectors } from '../reducers/Cache';
import {
  actionTypes as configActionTypes,
  selectors as configSelectors,
} from '../reducers/Configuration';
import { waitForSite, waitForZone } from './Configuration';
import WebRequest, { fetchAndPut } from './WebRequest';
import { basevolume_of_can } from '../../mylib/Formula';

function* loadProducts(action) {
  try {
    const { bundle } = action.payload;
    if (bundle) {
      const { cansizes, products, productgroups } = bundle;
      yield put(actions.setProductsCansizes(products, cansizes, productgroups));
      return;
    }

    yield put({ type: actionTypes.FETCH_PRODUCTS_PENDING });

    // load can sizes because we add can size data to cans
    const cansizes_resp = yield call(WebRequest, CacheAPI.loadCanSizes());

    const zone = yield call(waitForZone);
    const site = yield call(waitForSite);
    const response = yield call(
      WebRequest,
      CacheAPI.loadProducts(zone.zoneid, site.siteid, site.systemgroupid)
    );

    yield put(actions.setProductsCansizes(response.data, cansizes_resp.data));
  } catch (e) {
    yield put({ type: actionTypes.FETCH_PRODUCTS_REJECTED, payload: e });
  }
}

function* setProductsCansizes(action) {
  try {
    const { products, cansizes, productgroups } = action.payload;
    const cansizemap = new Map(cansizes.map((x) => [x.cansizeid, x]));
    for (const product of products) {
      for (const base of product.basepaints) {
        const cans = base.cans.map((can) => {
          const cansize = cansizemap.get(can.cansizeid);
          const basevolume = basevolume_of_can(base, can, cansize);
          return { ...cansize, ...can, basevolume };
        });
        cans.sort((a, b) => a.nominalamount - b.nominalamount);
        base.cans = cans;
      }
    }

    yield put({
      type: actionTypes.FETCH_CANSIZES_FULFILLED,
      payload: { data: cansizes },
    });
    yield put({
      type: actionTypes.FETCH_PRODUCTS_FULFILLED,
      payload: { data: products },
    });

    if (productgroups) {
      yield put({
        type: actionTypes.FETCH_PRODUCT_GROUPS_FULFILLED,
        payload: { data: productgroups },
      });
    } else {
      // Load product groups
      yield put({ type: actionTypes.FETCH_PRODUCT_GROUPS });
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCH_PRODUCTS_REJECTED, payload: e });
  }
}

function* loadProductGroups() {
  // load can sizes first because we add can size data to cans
  yield put({ type: actionTypes.FETCH_PRODUCT_GROUPS_PENDING });
  const zone = yield call(waitForZone);
  try {
    const response = yield call(
      WebRequest,
      CacheAPI.loadProductGroups(zone.zoneid)
    );
    // send returned object back to reducer as payload:
    yield put({
      type: actionTypes.FETCH_PRODUCT_GROUPS_FULFILLED,
      payload: response,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_PRODUCT_GROUPS_REJECTED, payload: e });
  }
}

function* loadCards(action) {
  yield put({ type: actionTypes.FETCH_CARDS_PENDING });
  const zone = yield call(waitForZone);
  try {
    const { bundle } = action.payload;
    const response = bundle
      ? { data: bundle.colourcards }
      : yield call(WebRequest, CacheAPI.loadCards(zone.zoneid));

    // send returned object back to reducer as payload:
    yield put({ type: actionTypes.FETCH_CARDS_FULFILLED, payload: response });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_CARDS_REJECTED, payload: e });
  }
}

function* loadZones() {
  try {
    yield put({ type: actionTypes.FETCH_ZONES_PENDING });
    const response = yield call(WebRequest, CacheAPI.loadZones());
    // send returned object back to reducer as payload:
    yield put({ type: actionTypes.FETCH_ZONES_FULFILLED, payload: response });
    const zones = response ? response.data : [];
    // Re-select same zone
    let zone = yield select(configSelectors.zone);
    if (zone) {
      zone = zones.find((x) => x.zoneid === zone.zoneid);
    }
    // Select default zone
    if (!zone) {
      zone = zones.find((x) => x.default) || zones[0] || null;
    }
    yield put({ type: configActionTypes.SET_ZONE, payload: zone });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_ZONES_REJECTED, payload: e });
  }
}

function* loadSites(action) {
  try {
    yield put({ type: actionTypes.FETCH_SITES_PENDING });
    const site = action.payload;
    if (site) {
      let sites;
      if (site.replicationgroup) {
        const response = yield call(
          WebRequest,
          CacheAPI.loadSites(site.replicationgroup)
        );
        sites = response.data;
      } else {
        // no data sharing
        sites = [site];
      }
      yield put({
        type: actionTypes.FETCH_SITES_FULFILLED,
        payload: sites,
      });
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCH_SITES_REJECTED, payload: e });
  }
}

function* loadUnits(action) {
  try {
    yield put({ type: actionTypes.FETCH_UNITS_PENDING });
    const { bundle } = action.payload;
    const response = bundle
      ? { data: bundle.units }
      : yield call(WebRequest, CacheAPI.loadUnits());
    // send returned object back to reducer as payload:
    yield put({ type: actionTypes.FETCH_UNITS_FULFILLED, payload: response });
    yield put({ type: configActionTypes.UPDATE_SHOTFORMATTER });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_UNITS_REJECTED, payload: e });
  }
}

function* loadLanguages() {
  try {
    yield put({ type: actionTypes.FETCH_LANGUAGES_PENDING });
    const response = yield call(WebRequest, CacheAPI.loadLanguages());
    // send returned object back to reducer as payload:
    yield put({
      type: actionTypes.FETCH_LANGUAGES_FULFILLED,
      payload: response,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_LANGUAGES_REJECTED, payload: e });
  }
}

function* loadColorants(action) {
  yield put({ type: actionTypes.FETCH_CNTS_PENDING });
  const zone = yield call(waitForZone);
  try {
    const { bundle } = action.payload;
    const response = bundle
      ? { data: bundle.colorants }
      : yield call(WebRequest, CacheAPI.loadColorants(zone.zoneid));
    // send returned object back to reducer as payload:
    yield put({ type: actionTypes.FETCH_CNTS_FULFILLED, payload: response });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_CNTS_REJECTED, payload: e });
  }
}

export function* waitForColorants() {
  let cnts = yield select(selectors.cnts);
  while (!cnts.length) {
    const a = yield take(actionTypes.FETCH_CNTS_FULFILLED);
    cnts = a.payload.data;
  }
  return cnts;
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.FETCH_PRODUCTS, loadProducts),
    takeLatest(actionTypes.FETCH_PRODUCT_GROUPS, loadProductGroups),
    takeLatest(actionTypes.FETCH_CARDS, loadCards),
    takeLatest(actionTypes.SET_PRODUCTS_CANSIZES, setProductsCansizes),
    takeLatest(actionTypes.FETCH_UNITS, loadUnits),
    takeLatest(actionTypes.FETCH_CNTS, loadColorants),
    takeLatest(actionTypes.FETCH_ZONES, loadZones),
    takeLatest(configActionTypes.SET_SITE, loadSites),
    takeLatest(actionTypes.FETCH_LANGUAGES, loadLanguages),
    takeLatest(
      actionTypes.FETCH_COMMENTS_LIST,
      fetchAndPut,
      CacheAPI.loadCommentsList
    ),
  ]);
}

import {
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';

import {
  history_search_orderitems,
  load_last_order,
  move_orders_to_customer,
} from 'js/api/Order';
import { actionTypes, selectors } from '../reducers/History';

import {
  fetchWithSiteid,
  waitForConfigValues,
  waitForPriorityInit,
  waitForSite,
} from './Configuration';
import webRequest from './WebRequest';
import { fulfilled } from '../factories/ApiCall';
import log from '../../api/Logger';

function* loadLastOrder(action) {
  yield call(waitForPriorityInit); // let app initialize first
  const { allow_hiding_orders } = yield call(waitForConfigValues);
  yield* fetchWithSiteid(load_last_order, {
    type: action.type,
    payload: { include_hidden: !allow_hiding_orders },
  });
}

function* moveOrdersToCustomer(action) {
  const { siteid } = yield call(waitForSite);
  try {
    yield put({
      type: actionTypes.MOVE_ORDERS_TO_CUSTOMER_PENDING,
      payload: true,
    });
    const params = { ...action.payload, siteid };
    yield call(webRequest, move_orders_to_customer(params));

    // repeat the search
    const searchParams = (yield select(selectors.customer_orderitems)).params;
    yield put({
      type: actionTypes.SEARCH_CUSTOMER_ORDERITEMS,
      payload: { ...searchParams, seek: null },
    });
    yield take(fulfilled(actionTypes.SEARCH_CUSTOMER_ORDERITEMS));
  } catch (e) {
    log.error(e);
  }
  yield put({
    type: actionTypes.MOVE_ORDERS_TO_CUSTOMER_PENDING,
    payload: false,
  });
}

export default function* saga() {
  yield takeLatest(actionTypes.LAST_ORDERITEM, loadLastOrder);
  yield takeLatest(
    actionTypes.SEARCH_ORDERITEMS,
    fetchWithSiteid,
    history_search_orderitems
  );
  yield takeLatest(
    actionTypes.SEARCH_CUSTOMER_ORDERITEMS,
    fetchWithSiteid,
    history_search_orderitems
  );
  yield takeEvery(actionTypes.MOVE_ORDERS_TO_CUSTOMER, moveOrdersToCustomer);
}

import {
  put,
  all,
  takeLatest,
  call,
  actionChannel,
  take,
  select,
  takeEvery,
} from 'redux-saga/effects';
import actions, {
  actionTypes as queueActionTypes,
} from '../reducers/OrderQueue';
import { close_localorder, move_orders } from 'js/api/Order';

import { waitForSite, waitForConfigValues } from './Configuration';
import {
  actionTypes as configActionTypes,
  selectors as configSelectors,
} from '../reducers/Configuration';
import { actionTypes as loginActionTypes } from '../reducers/Login';
import webRequest from './WebRequest';
import { rejected, fulfilled } from '../factories/ApiCall';
import { date_diff_indays } from '../../mylib/DateUtils';
import { getSocket } from '../../api/Socket';
import { close_orderitem } from '../../api/Order';
import log from '../../api/Logger';

/**
 * Fetches order queue and waits for response
 */
function* fetchLocalQueue(action) {
  const { siteid } = yield call(waitForSite);
  try {
    yield call(fetchQueue, siteid);
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* fetchPoolQueue(action) {
  const { poolsiteid } = yield call(waitForSite);
  if (poolsiteid != null) {
    try {
      yield call(fetchQueue, poolsiteid);
    } catch (e) {
      yield put({ type: rejected(action.type), payload: e });
    }
  }
}

function* fetchQueues(...siteids) {
  yield all(siteids.map((siteid) => call(fetchQueue, siteid)));
}

function* fetchQueue(siteid) {
  getSocket().orders_list(siteid);
  while (true) {
    // Wait for data; it might be collected before our request was applied
    const response = yield take(queueActionTypes.SET_ORDER_QUEUE);
    if (response.payload.siteid === siteid) {
      break;
    }
  }
}

function* setOrderQueue(action) {
  const { payload } = action;
  const site = yield select(configSelectors.site);
  if (!site) {
    log.error('Queue update with no site active', payload);
    return;
  }
  const { siteid, poolsiteid } = site;
  if (payload.siteid === siteid) {
    yield put({
      type: fulfilled(queueActionTypes.FETCH_LOCAL_QUEUE),
      payload: payload.orders,
    });
  } else if (payload.siteid === poolsiteid) {
    yield put({
      type: fulfilled(queueActionTypes.FETCH_POOL_QUEUE),
      payload: payload.orders,
    });
  } else {
    log.error('Queue update for wrong site', payload);
  }
}

function* cleanLocalQueue() {
  // Keep track of closed to avoid eternal retries if closing fails for some reason
  const closed = new Set();

  while (true) {
    const action = yield take(fulfilled(queueActionTypes.FETCH_LOCAL_QUEUE));

    const config = yield call(waitForConfigValues);
    const auto_del = config.auto_delete_waiting_orders || 0;
    try {
      if (auto_del > 0) {
        const curr = new Date();
        const expired_orders = action.payload.filter((order) => {
          const diff = date_diff_indays(new Date(order.modificationdate), curr);
          return diff > auto_del && !closed.has(order.orderid);
        });
        if (expired_orders.length) {
          const ids = expired_orders.map((order) => order.orderid);
          for (const id of ids) {
            closed.add(id);
          }
          yield put({
            type: queueActionTypes.CLOSE_ORDERS,
            payload: ids,
          });
        }
      }
    } catch (e) {
      log.error(e);
    }
  }
}

function* closeOrders(siteid, orderids) {
  for (const orderid of orderids) {
    try {
      // Fire automatic deletion of order. No crashing here.
      yield call(webRequest, close_localorder({ siteid, orderid }));
    } catch (e) {
      log.error(e);
    }
  }
}

function* closeItems(siteid, itemids) {
  for (const itemid of itemids) {
    yield call(webRequest, close_orderitem({ siteid, itemid }));
  }
}

function* moveOrder(action, siteid, from_siteid, to_siteid) {
  try {
    const params = {
      ...action.payload,
      from_siteid,
      to_siteid,
      nofetch: true,
    };
    const response = yield call(webRequest, move_orders(siteid, params));
    yield put({ type: queueActionTypes.FETCH_LOCAL_QUEUE });
    yield put({ type: queueActionTypes.FETCH_POOL_QUEUE });
    yield put({ type: fulfilled(action.type), payload: response.status });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* subscribeSite() {
  try {
    getSocket().disconnect();
    const zone = yield select(configSelectors.zone);
    const site = yield select(configSelectors.site);
    if (zone && site) {
      getSocket().connect();
    }
  } catch (e) {
    log.error(e);
  }
}

// eslint-disable-next-line require-yield
function* logoutSite() {
  try {
    getSocket().disconnect();
  } catch (e) {
    log.error(e);
  }
}

function* watchRequests() {
  const channel = yield actionChannel([
    queueActionTypes.CLOSE_ITEMS,
    queueActionTypes.CLOSE_ORDERS,
    queueActionTypes.MOVE_ORDERS_TO_LOCAL,
    queueActionTypes.MOVE_ORDERS_TO_POOL,
  ]);
  while (true) {
    const action = yield take(channel);
    yield put(actions.localChangePending());
    const { siteid, poolsiteid } = yield call(waitForSite);

    try {
      switch (action.type) {
        case queueActionTypes.CLOSE_ITEMS:
          yield call(closeItems, siteid, action.payload);
          yield call(fetchQueue, siteid);
          break;
        case queueActionTypes.CLOSE_ORDERS:
          yield call(closeOrders, siteid, action.payload);
          yield call(fetchQueue, siteid);
          break;
        case queueActionTypes.MOVE_ORDERS_TO_LOCAL:
          if (poolsiteid != null) {
            yield call(moveOrder, action, siteid, poolsiteid, siteid);
            yield call(fetchQueues, siteid, poolsiteid);
          }
          break;
        case queueActionTypes.MOVE_ORDERS_TO_POOL:
          if (poolsiteid != null) {
            yield call(moveOrder, action, siteid, siteid, poolsiteid);
            yield call(fetchQueues, siteid, poolsiteid);
          }
          break;
      }
    } catch (e) {
      log.error(e);
      yield put({ type: rejected(action.type), payload: e });
    }
    yield put(actions.localChangePending(false));
  }
}

export default function* saga() {
  yield all([
    call(watchRequests),
    takeLatest(queueActionTypes.FETCH_LOCAL_QUEUE, fetchLocalQueue),
    takeLatest(queueActionTypes.FETCH_POOL_QUEUE, fetchPoolQueue),
    takeEvery(queueActionTypes.SET_ORDER_QUEUE, setOrderQueue),

    call(cleanLocalQueue),

    takeLatest(
      [
        configActionTypes.SET_ZONE_REDUX,
        configActionTypes.SET_SITE,
        loginActionTypes.LOGIN_SITE_FULFILLED,
      ],
      subscribeSite
    ),
    takeLatest(loginActionTypes.LOGOUT_SITE, logoutSite),
  ]);
}

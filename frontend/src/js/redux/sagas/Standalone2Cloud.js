import {
  all,
  call,
  cancel,
  cancelled,
  delay,
  fork,
  put,
  take,
  takeLatest,
} from 'redux-saga/effects';
import standalone2cloudActions, {
  actionTypes,
} from '../reducers/Standalone2Cloud';
import standalone2cloudApi from 'js/api/Standalone2Cloud';
import { getOrderUploadStatus } from 'js/api/UploadOrdersStatus';
import webRequest from './WebRequest';

function* listDatabases({ payload }) {
  try {
    const { host, port = 3306, user, password } = payload;
    const databases = yield call(() =>
      standalone2cloudApi.listDatabases(host, port, user, password)
    );
    yield put(standalone2cloudActions.listDatabasesSuccess(databases));
  } catch (error) {
    yield put(standalone2cloudActions.listDatabasesFailure(error.message));
  }
}

function* listSites({ payload }) {
  try {
    const { host, port = 3306, user, password, database } = payload;
    const sites = yield call(() =>
      standalone2cloudApi.listSites(host, port, user, password, database)
    );
    yield put(standalone2cloudActions.listSitesSuccess(sites));
  } catch (error) {
    yield put(standalone2cloudActions.listSitesFailure(error.message));
  }
}

function* startSync({ payload }) {
  try {
    yield call(() => standalone2cloudApi.startSync(payload));
    yield put(standalone2cloudActions.startSyncSuccess());
  } catch (error) {
    yield put(standalone2cloudActions.startSyncFailure(error.message));
  }
}

function* cancelSync() {
  try {
    yield call(() => standalone2cloudApi.cancelSync());
  } catch (error) {
    yield put(standalone2cloudActions.startSyncFailure(error.message));
  }
}

function* fetchOrderStatus(siteid) {
  if (!siteid) {
    return;
  }
  try {
    const status = yield call(webRequest, getOrderUploadStatus(siteid));

    yield put(standalone2cloudActions.orderStatusUpdated(status.data));
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Failed to fetch order import status';
    yield put(standalone2cloudActions.orderStatusFailure(message));
  }
}

function* pollOrderStatus(siteid) {
  try {
    while (true) {
      yield call(fetchOrderStatus, siteid);
      yield delay(3000);
    }
  } catch (error) {
    yield put(
      standalone2cloudActions.orderStatusFailure(
        error?.message || 'Order status polling interrupted'
      )
    );
  } finally {
    if (yield cancelled()) {
      yield put(standalone2cloudActions.orderStatusUpdated({ status: 'idle' }));
    }
  }
}

function* watchOrderStatusPolling() {
  let pollTask;
  while (true) {
    const action = yield take([
      actionTypes.POLL_ORDER_STATUS_START,
      actionTypes.POLL_ORDER_STATUS_STOP,
    ]);
    if (action.type === actionTypes.POLL_ORDER_STATUS_START) {
      const siteid = action.payload;
      if (!siteid) {
        continue;
      }
      if (pollTask) {
        yield cancel(pollTask);
      }
      pollTask = yield fork(pollOrderStatus, siteid);
    } else if (action.type === actionTypes.POLL_ORDER_STATUS_STOP) {
      if (pollTask) {
        yield cancel(pollTask);
        pollTask = null;
      }
    }
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.LIST_DATABASES, listDatabases),
    takeLatest(actionTypes.LIST_SITES, listSites),
    takeLatest(actionTypes.START_SYNC, startSync),
    takeLatest(actionTypes.CANCEL_SYNC, cancelSync),
    fork(watchOrderStatusPolling),
  ]);
}


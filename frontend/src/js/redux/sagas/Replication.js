import { actionTypes } from 'js/redux/reducers/Replication';
import ReplicationApi from 'js/api/Replication';
import { fetchWithSiteid, waitForSite } from './Configuration';
import webRequest from './WebRequest';

import { call, put, takeLatest, race, delay, take } from 'redux-saga/effects';
import { fulfilled, rejected } from '../factories/ApiCall';
import { NO_REPLICATION, REP_STATE_SLEEP } from '../../Constants';
import log from '../../api/Logger';

function* runReplicationAction(action) {
  const { siteid } = yield call(waitForSite);
  try {
    const { data } = yield call(
      webRequest,
      ReplicationApi.runReplicationAction({ siteid, ...action.payload })
    );
    yield put({
      type: fulfilled(actionTypes.REPLICATION_RUNACTION),
      payload: data,
    });
  } catch (err) {
    yield put({
      type: rejected(actionTypes.REPLICATION_RUNACTION),
      payload: err,
    });
  } finally {
    yield put({
      type: actionTypes.REPLICATION_FETCH_DETAILS,
    });
  }
}

function* resendOrders(action) {
  const { siteid } = yield call(waitForSite);
  try {
    const { data } = yield call(
      webRequest,
      ReplicationApi.resendOrders({ siteid, ...action.payload })
    );
    yield put({
      type: fulfilled(actionTypes.REPLICATION_RESEND_ORDERS),
      payload: data,
    });
  } catch (err) {
    yield put({
      type: rejected(actionTypes.REPLICATION_RESEND_ORDERS),
      payload: err,
    });
  } finally {
    yield put({
      type: actionTypes.REPLICATION_FETCH_DETAILS,
    });
  }
}

function* setFullSyncSchedule(action) {
  const { siteid } = yield call(waitForSite);
  try {
    const { data } = yield call(
      webRequest,
      ReplicationApi.setReplicationFullSync({ siteid, ...action.payload })
    );
    yield put({
      type: fulfilled(actionTypes.REPLICATION_SET_FULL_SYNC_SCHEDULE),
      payload: data,
    });
  } catch (err) {
    yield put({
      type: rejected(actionTypes.REPLICATION_SET_FULL_SYNC_SCHEDULE),
      payload: err,
    });
  } finally {
    yield put({
      type: actionTypes.REPLICATION_FETCH_DETAILS,
    });
  }
}

function* pollSagaWorker() {
  while (true) {
    let wait = 20; // Wait time in seconds
    try {
      yield put({ type: actionTypes.REPLICATION_FETCH_DETAILS });

      const { act, err } = yield race({
        act: take(fulfilled(actionTypes.REPLICATION_FETCH_DETAILS)),
        err: take(rejected(actionTypes.REPLICATION_FETCH_DETAILS)),
      });
      if (err !== undefined) {
        if (err.payload.response.data === NO_REPLICATION) {
          // No replication at all --> end auto checking
          break;
        }
        // Check if err data is NO_REPLICATION and the break the poll saga
      } else {
        if (!act.payload?.has_replication) {
          break;
        }

        if (
          act.payload.site?.formulas?.site.state !== REP_STATE_SLEEP ||
          act.payload.site?.sales?.site.state !== REP_STATE_SLEEP
        ) {
          wait = 5; // Checking faster!
        }
      }
    } catch (err) {
      log.error(err);
    }
    // once per 20 seconds check the version for production change this to something reasonable!!
    yield delay(1000 * wait);
  }
  log.info('No replication checking needed');
}

export default function* saga() {
  yield takeLatest(actionTypes.REPLICATION_RUNACTION, runReplicationAction);
  yield takeLatest(
    actionTypes.REPLICATION_FETCH_DETAILS,
    fetchWithSiteid,
    ReplicationApi.fetchReplicationDetails
  );

  yield takeLatest(
    actionTypes.REPLICATION_START_STATUS_CHECKING,
    pollSagaWorker
  );
  yield takeLatest(
    actionTypes.REPLICATION_SET_FULL_SYNC_SCHEDULE,
    setFullSyncSchedule
  );
  yield takeLatest(actionTypes.REPLICATION_RESEND_ORDERS, resendOrders);
}

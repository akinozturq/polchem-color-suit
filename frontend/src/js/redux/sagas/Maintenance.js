import actions, { actionTypes, selectors } from 'js/redux/reducers/Maintenance';
import {
  actionTypes as machineTypes,
  selectors as machineSelectors,
} from 'js/redux/reducers/Machine';
import maintenanceAPI from 'js/api/Maintenance';
import { fetchWithSiteid, waitForSite } from './Configuration';

import { call, delay, put, select, takeLatest } from 'redux-saga/effects';
import WebRequest from './WebRequest';
import { fulfilled, rejected } from '../factories/ApiCall';
import _ from 'lodash';
import log from '../../api/Logger';

export function* saveIntervention(apifunc, action) {
  const { siteid } = yield call(waitForSite);
  try {
    const params = { ...action.payload, siteid };
    let { data } = yield call(WebRequest, apifunc(params));

    // Send log files
    const { include_logs } = action.payload;
    if (include_logs && data.maintenanceid) {
      yield put(actions.sendLogFiles(siteid, data.maintenanceid));
      // wait a bit so that poss app has time to create zip package.. Do not wait sending!
      // TODO: Could be improved so that we wait the actual response from POS app
      yield delay(1000);
      data.logfilepath = data.maintenanceid + '.zip';
    }

    // Update the interverntion list
    const interventions = yield select(selectors.interventions);

    yield put({
      type: fulfilled(actionTypes.MAINTENANCE_FETCH),
      payload: _.unionBy([data], interventions.data, 'maintenanceid'),
    });

    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export function* deleteIntervention(apifunc, action) {
  const { siteid } = yield call(waitForSite);
  try {
    const params = { ...action.payload, siteid };
    const { data } = yield call(WebRequest, apifunc(params));
    yield put({ type: fulfilled(action.type), payload: data });
    // Update the interverntion list
    const interventions = yield select(selectors.interventions);

    yield put({
      type: fulfilled(actionTypes.MAINTENANCE_FETCH),
      payload: _.pullAllBy(interventions.data, [data], 'maintenanceid'),
    });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export function* update_next_service(action) {
  try {
    const { next_service, machinename, info } = action.payload;
    const m = yield select(machineSelectors.machine, machinename);

    yield put({
      type: machineTypes.SET_DBMACHINE_INFO,
      payload: {
        dispID: machinename,
        results: { ...m.dbinfo, nextservice: next_service, info: info },
      },
    });
  } catch (e) {
    log.error(e);
  }
}

export function* send_logs(action) {
  try {
    const { siteid, maintenanceid } = action.payload;

    yield call(() => maintenanceAPI.sendLogs(siteid, maintenanceid));
  } catch (e) {
    log.error(e);
  }
}

export function* browseLogs(action) {
  try {
    const { maintenanceid } = action.payload;

    yield call(() => maintenanceAPI.browseLogs(maintenanceid));
  } catch (e) {
    log.error(e);
  }
}

export default function* saga() {
  yield takeLatest(
    actionTypes.MAINTENANCE_FETCH,
    fetchWithSiteid,
    maintenanceAPI.get_site_maintenance
  );
  yield takeLatest(
    actionTypes.MAINTENANCE_SAVE,
    saveIntervention,
    maintenanceAPI.save_intervention
  );
  yield takeLatest(
    actionTypes.MAINTENANCE_SET_DATA,
    fetchWithSiteid,
    maintenanceAPI.set_service_data
  );
  yield takeLatest(
    actionTypes.FETCH_UNSEEN,
    fetchWithSiteid,
    maintenanceAPI.get_unseen
  );

  yield takeLatest(
    fulfilled(actionTypes.MAINTENANCE_SET_DATA),
    update_next_service
  );
  yield takeLatest(
    actionTypes.MAINTENANCE_DELETE,
    deleteIntervention,
    maintenanceAPI.delete_maintenance_case
  );
  yield takeLatest(actionTypes.MAINTENANCE_SEND_LOGS_QT, send_logs);
  yield takeLatest(actionTypes.MAINTENANCE_BROWSE_QT, browseLogs);
}

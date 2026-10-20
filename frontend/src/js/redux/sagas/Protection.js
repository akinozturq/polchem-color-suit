import { call, put, select, take, takeLatest } from 'redux-saga/effects';
import LicenseActions, {
  actionTypes,
  selectors as protectionSelectors,
} from '../reducers/Protection';
import LicenseApi from 'js/api/Protection';
import WebRequest from './WebRequest';
import errorActions from '../reducers/Errors';
import configActions from '../reducers/Configuration';
import {
  FEATURE_POS_MATCHING,
  LICENSE_TYPE_NALPEIRON,
  USERTYPE_IST,
  USERTYPE_IST_PRO,
  USERTYPE_SITE,
  USERTYPE_SITE_MATCHING,
} from '../../Constants';
import { getUserType } from '../../api/WebRequest';
import log from '../../api/Logger';

function* fetchLicenseStatus() {
  yield put({ type: actionTypes.FETCH_STATUS_STARTED, payload: true });
  try {
    const response = yield call(WebRequest, LicenseApi.LicenseStatus());

    yield put({
      type: actionTypes.FETCH_STATUS_FULLFILLED,
      payload: response.data,
    });

    // If running POS app send the license information to HQ
    try {
      const status = response.data;
      const version = document.getElementById('build_datetime').textContent;
      if (window.qtside) {
        const userTypeCode = getUserType();
        let user_type = `user type ${userTypeCode}`;
        switch (userTypeCode) {
          case USERTYPE_IST:
            user_type = 'IST';
            break;
          case USERTYPE_SITE:
          case USERTYPE_SITE_MATCHING:
            user_type =
              'Site' +
              (status?.features.includes(FEATURE_POS_MATCHING)
                ? ' with matching'
                : '');
            break;
          case USERTYPE_IST_PRO:
            user_type = 'IST Pro';
            break;
        }

        window.qtside.bridge.reportInfo(
          status?.license_code,
          status?.cloud ? userTypeCode : LICENSE_TYPE_NALPEIRON,
          status?.computerid,
          version,
          (status?.cloud ? 'Cloud' : `Standalone (${status?.license_code})`) +
            ' - ' +
            user_type
        );
      }
    } catch (e) {
      log.error(e);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCH_STATUS_REJECTED, payload: e });
  }
}
function* activateOnline(action) {
  yield put({ type: actionTypes.ACTION_STARTED, payload: true });
  try {
    const response = yield call(
      WebRequest,
      LicenseApi.ActivateOnline(action.payload)
    );

    yield put({
      type: actionTypes.ACTION_FULLFILLED,
      payload: { data: response.data, type: action.type },
    });

    yield put(LicenseActions.fetchStatus());
    yield put(errorActions.clearError());
    yield put(configActions.initializeApp());
  } catch (e) {
    yield put({
      type: actionTypes.ACTION_REJECTED,
      payload: {
        data: e.response ? e.response.data : e.response,
        type: action.type,
      },
    });
  }
}
function* deactivateOnline(action) {
  yield put({ type: actionTypes.ACTION_STARTED, payload: true });
  try {
    const response = yield call(WebRequest, LicenseApi.DeactivateOnline());

    yield put({
      type: actionTypes.ACTION_FULLFILLED,
      payload: { data: response.data, type: action.type },
    });

    yield put(LicenseActions.fetchStatus());
    yield put(errorActions.clearError());
    yield put(configActions.initializeApp());
  } catch (e) {
    yield put({
      type: actionTypes.ACTION_REJECTED,
      payload: {
        data: e.response ? e.response.data : e.response,
        type: action.type,
      },
    });
  }
}

function* generateCert(action) {
  yield put({ type: actionTypes.ACTION_STARTED, payload: true });
  try {
    const response = yield call(
      WebRequest,
      LicenseApi.ActivationCertificateRequest(action.payload)
    );

    yield put({
      type: actionTypes.ACTION_FULLFILLED,
      payload: { data: response.data, type: action.type },
    });
  } catch (e) {
    yield put({
      type: actionTypes.ACTION_REJECTED,
      payload: {
        data: e.response ? e.response.data : e.response,
        type: action.type,
      },
    });
  }
}

// return selected zone, waiting for SET_ZONE if necessary
export function* waitForProtectionStatus() {
  let status = yield select(protectionSelectors.status);
  while (!status) {
    const a = yield take(actionTypes.FETCH_STATUS_FULLFILLED);
    status = a.payload;
  }
  return status;
}

function* activateOffline(action) {
  yield put({ type: actionTypes.ACTION_STARTED, payload: true });
  try {
    const response = yield call(
      WebRequest,
      LicenseApi.ActivateOffline(action.payload)
    );

    yield put({
      type: actionTypes.ACTION_FULLFILLED,
      payload: { data: response.data, type: action.type },
    });

    yield put(LicenseActions.fetchStatus());
    yield put(errorActions.clearError());
    yield put(configActions.initializeApp());
  } catch (e) {
    yield put({
      type: actionTypes.ACTION_REJECTED,
      payload: {
        data: e.response ? e.response.data : e.response,
        type: action.type,
      },
    });
  }
}
function* deactivateOffline(action) {
  yield put({ type: actionTypes.ACTION_STARTED, payload: true });
  try {
    const response = yield call(
      WebRequest,
      LicenseApi.DeactivationCertificateRequest()
    );

    yield put({
      type: actionTypes.ACTION_FULLFILLED,
      payload: { data: response.data, type: action.type },
    });

    yield put(LicenseActions.fetchStatus());
    yield put(errorActions.clearError());
    yield put(configActions.initializeApp());
  } catch (e) {
    yield put({
      type: actionTypes.ACTION_REJECTED,
      payload: {
        data: e.response ? e.response.data : e.response,
        type: action.type,
      },
    });
  }
}

export default function* saga() {
  yield takeLatest(actionTypes.FETCH_STATUS, fetchLicenseStatus);
  yield takeLatest(actionTypes.ACTIVATE_ONLINE, activateOnline);
  yield takeLatest(actionTypes.DEACTIVATE_ONLINE, deactivateOnline);
  yield takeLatest(actionTypes.ACTIVATE_CERT_REQUEST, generateCert);
  yield takeLatest(actionTypes.MANUAL_ACTIVATION, activateOffline);
  yield takeLatest(actionTypes.DEACTIVATION_CERT_REQUEST, deactivateOffline);
}

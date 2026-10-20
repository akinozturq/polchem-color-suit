import { call, delay, put, select, take } from 'redux-saga/effects';
import i18n from '../../localization/i18n';
import errorActions from '../reducers/Errors';
import loginActions, {
  selectors as loginSelectors,
  actionTypes as loginActionTypes,
} from '../reducers/Login';
import offlineActions, {
  actionTypes as offlineActionTypes,
  selectors as offlineSelectors,
} from '../reducers/Offline';
import { fulfilled, rejected } from '../factories/ApiCall';

import _ from 'lodash';
import { MAX_REQUEST_TRIALS, offline_mode } from '../../Constants';
import log from '../../api/Logger';

export default function* webRequest(apifunc) {
  let trial_count = 0;

  while (true) {
    const logged_in = yield select(loginSelectors.logged_in);
    if (!logged_in) {
      yield take(loginActionTypes.LOGIN_SITE_FULFILLED);
    }
    try {
      trial_count += 1;
      const response = yield call(apifunc);
      return response;
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        throw error;
      }

      // If more than MAX_REQUEST_TRIALS then throw error
      if (trial_count > MAX_REQUEST_TRIALS) {
        throw error;
      }

      // ######################################################
      // Offline mode handling
      // ######################################################

      if (offline_mode) {
        // Re try after 1 sec
        if (status === 404) {
          throw error;
        }

        yield delay(1000);
        continue;
      }

      const offline_mode_available = yield select(
        offlineSelectors.is_offline_mode_available
      );
      if (
        offline_mode_available &&
        !_.includes([401, 400, 403, 404, 409, 422, 500, 503], status)
      ) {
        yield put(offlineActions.setOnlineAvailable(false));
        // wait for user to make decision what to do and then retry the call
        yield take(offlineActionTypes.RE_TRY_REQUEST);
        // restart the action
        continue;
      }

      // ######################################################
      // Refresh  handling
      // ######################################################
      if (
        status === 401 || // expired token
        status === 422 // unprocessable entity
      ) {
        // invalid token
        // Try to refresh token, and retry the request
        yield call(refreshToken);
        continue;
      }

      // Retry after 1 s.
      yield delay(1000);
    }
  }
}

export function* fetchAndPut(apifunc, action) {
  try {
    const { data } = yield call(webRequest, apifunc(action.payload));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export function* general_request(apifunc, action) {
  try {
    const params = { ...action.payload };
    const { data } = yield call(webRequest, apifunc(params));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.ErrorInServerConnection',
          'Unable to load data. Check connection to server.'
        ),
        e.response?.data?.error || e.response || e
      )
    );
  }
}

export function* refreshToken() {
  if (offline_mode) {
    log.info('Offline mode, skipping token refresh');
    return;
  }
  yield put(loginActions.refreshToken());
  const action = yield take([
    loginActionTypes.LOGIN_SITE_FULFILLED,
    loginActionTypes.LOGOUT_SITE_FULFILLED,
    loginActionTypes.REFRESH_TOKEN_NETWORK_ERROR,
  ]);
  return action.type;
}

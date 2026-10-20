import axios from 'axios';

import {

  all,

  call,

  put,

  race,

  select,

  take,

  takeLatest,

  delay,

} from 'redux-saga/effects';

import loginAPI from 'js/api/Login';

import offlineAPI from 'js/api/Offline';

import actions, { actionTypes } from '../reducers/Login';

import {

  getRefreshToken,

  hasToken,

  setOfflineToken,

  setToken,

  setUserType,

} from 'js/api/WebRequest';

import configActions, {

  selectors as configSelectors,

} from '../reducers/Configuration';

import { push } from 'connected-react-router';

import {

  DEFAULT_LOGIN_PASSWORD,

  DEFAULT_LOGIN_USERNAME,

  USERTYPE_IST,

  USERTYPE_IST_PRO,

  USERTYPE_SITE,

  USERTYPE_SITE_MATCHING,

  offline_mode,

  DB_NAME,

  OFFLINE_MODE_URL,

} from '../../Constants';

import errorActions from '../reducers/Errors';

import i18n from '../../localization/i18n';

import tokenApi from 'js/api/AccessToken';

import { waitForProtectionStatus } from './Protection';

import log from '../../api/Logger';

import protectionActions from '../reducers/Protection.js';



function getHash(token) {

  return token?.split('.')[2];

}



// log in with credentials as payload

function* logIn(action) {

  yield put({ type: actionTypes.LOGIN_SITE_PENDING });

  try {

    const [response] = yield race([

      call(loginAPI.login(action.payload)),

      take(actionTypes.LOGOUT_SITE),

    ]);

    if (response) {

      const { autologin } = action.payload;

      // Check usertype if not standalone mode auto login

      if (

        !autologin &&

        ![

          USERTYPE_SITE,

          USERTYPE_SITE_MATCHING,

          USERTYPE_IST,

          USERTYPE_IST_PRO,

        ].includes(response.data.usertype)

      ) {

        log.error('Invalid site user');

        yield put({

          type: actionTypes.LOGIN_SITE_REJECTED,

          payload: { response: { data: { msg: 'Invalid site user' } } },

        });

      } else {

        // Check database name exists on the response if so then set it

        if (response.data.database) {

          if (response.data.database !== DB_NAME) {

            log.info(`Redirecting to new database ${response.data.database}`);

            setToken(

              response.data.access_token,

              response.data.refresh_token,

              response.data.database

            );

            setUserType(response.data.usertype, response.data.database);



            if (window.qtside) {

              window.qtside.bridge.setNewUrl(

                `${window.location.origin}/db/${response.data.database}`

              );

            } else {

              window.location.href = `${window.location.origin}/db/${response.data.database}`;

            }

            yield delay(20000);

          }

        }



        log.info(

          'Site login successful ' + getHash(response.data.refresh_token)

        );

        setToken(response.data.access_token, response.data.refresh_token);

        setUserType(response.data.usertype);

        yield put({

          type: actionTypes.SAVE_OFFLINE_TOKEN,

          payload: response.data.offline_token_data,

        });



        yield put({ type: actionTypes.LOGIN_SITE_FULFILLED });

        // init app

        if (!autologin) {

          yield put(configActions.initializeApp());

        } // else: no need to re-initialize

      }

    } else {

      yield call(logOut);

    }

  } catch (e) {

    log.error('Error in site login: ' + e.response?.data?.msg || e.message);

    yield put({ type: actionTypes.LOGIN_SITE_REJECTED, payload: e });

  }

}



function* logOut() {

  if (offline_mode) {

    log.warning('Offline mode detected, skipping logout');

    return;

  }

  const is_standalone = yield select(configSelectors.is_standalone);

  if (is_standalone) {

    log.warning('Standalone mode: skipping logout, redoing login');

    yield call(autoLogin);

    return;

  }

  try {

    log.info('Site logout');

    if (hasToken()) {

      // Clear also QtSide token cache.

      yield call(loginAPI.logout());

    }

    if (window.qtside) {

      const { origin } = window.location;

      yield call(() => tokenApi.setToken(null, origin));

      yield call(() => tokenApi.setRefreshToken(null, origin));

    }

  } catch (e) {

    log.error(e);

  } finally {

    // Navigate to homepage

    yield put(push('/'));

    setToken(null);

    yield put({ type: actionTypes.LOGOUT_SITE_FULFILLED });

  }

}



export function* load_offline_token() {

  if (offline_mode) {

    const offline_token = yield call(() => offlineAPI.getOfflineAccessToken());

    if (offline_token) {

      setOfflineToken(offline_token);

      yield put({

        type: actionTypes.LOGIN_SITE_FULFILLED,

      });

    } else {

      yield put(actions.logOutSite());

    }

  }

}



export function* autoLogin() {

  if (offline_mode) {

    return;

  }

  try {

    const { data } = yield call(() => axios({ url: '/ping' }));



    if (data.standalone_mode) {

      log.info('Standalone mode');

      yield put(configActions.setIsStandalone(true));

      yield put(

        actions.logInSite(

          DEFAULT_LOGIN_USERNAME,

          DEFAULT_LOGIN_PASSWORD,

          undefined,

          true

        )

      );

      // wait for successful login

      let { success } = yield race({

        success: take(actionTypes.LOGIN_SITE_FULFILLED),

        failure: take(actionTypes.LOGIN_SITE_REJECTED),

      });

      if (success) {

        return;

      }

    }



    if (!hasToken()) {

      // The token in local storage is missing, try to get it from app

      if (yield call(loadQtTokens)) {

        yield put({

          type: actionTypes.LOGIN_SITE_FULFILLED,

        });

      }

    }

  } catch (e) {

    log.error(e);

  }

}



function* loadQtTokens(fallback = false) {

  if (window.qtside) {

    // Due to a bug in earlier versions, token can be under offline mode URL. #8425

    const origin = fallback ? OFFLINE_MODE_URL : window.location.origin;

    const token = yield call(() => tokenApi.getToken(origin));

    const refresh = yield call(() => tokenApi.getRefreshToken(origin));

    if (token && token !== 'None') {

      log.info(

        (fallback ? 'Using fallback tokens ' : 'Using app tokens ') +

          getHash(refresh)

      );

      setToken(token, refresh);

      return true;

    } else if (!fallback) {

      log.warning('Tokens missing in app');

    }

  }

  return false;

}



function* watchRefreshToken() {

  // using take in loop to ignore concurrent refresh token requests

  let tried_qtside = false;

  let tried_fallback = false;

  while (true) {

    yield take(actionTypes.REFRESH_TOKEN);

    try {

      let error_code;

      if (getRefreshToken()) {

        try {

          yield call(doRefreshToken);

          yield put({ type: actionTypes.LOGIN_SITE_FULFILLED });

          continue;

        } catch (e) {

          error_code = e.response?.data?.polchem_color_suit;

          // no need to handle (error_code === 'unconfirmed_access') after changes in backend

          if (error_code !== 'no_access') {

            throw e;

          }

        }

      }

      if (!tried_qtside) {

        tried_qtside = true;

        // Try to get the token from QtSide

        if (yield call(loadQtTokens)) {

          yield call(doRefreshToken);

          yield put({

            type: actionTypes.LOGIN_SITE_FULFILLED,

          });

          continue;

        }

      }

      if (!tried_fallback && tokenApi.version >= 2) {

        tried_fallback = true;

        // Try to get the token from QtSide fallback location.

        if (yield call(loadQtTokens, true)) {

          yield call(doRefreshToken);

          yield put({

            type: actionTypes.LOGIN_SITE_FULFILLED,

          });

          continue;

        }

      }

      if (error_code) {

        log.error('Refresh token has been revoked');

      } else {

        log.warning('Refresh token missing');

      }

    } catch (e) {

      log.error(

        `Error in refreshing token ${getHash(getRefreshToken())}: ${e.response?.data?.msg || e.message}`

      );

      if (e.response?.data?.polchem_color_suit !== 'no_access') {

        yield put({ type: actionTypes.REFRESH_TOKEN_NETWORK_ERROR });

        continue;

      }

      // 'no_access' = token is invalid, has expired, been revoked or user has been deleted

    }

    yield put(actions.logOutSite());

  }

}



function* doRefreshToken() {

  // Refresh the tokens using current refresh token in api/WebRequest.js

  const re = yield call(loginAPI.refresh_create());

  log.info('Token refreshed ' + getHash(re.data.refresh_token));

  setToken(re.data.access_token, re.data.refresh_token);

  yield put({

    type: actionTypes.SAVE_OFFLINE_TOKEN,

    payload: re.data.offline_token_data,

  });

  yield call(loginAPI.refresh_confirm(re.data));

  log.info('Token confirmed ' + getHash(re.data.refresh_token));

  yield put(protectionActions.fetchStatus());

}



function* refresh_tokens_to_libraries(action) {

  try {

    /**

     * Only refresh the token if the application is not running in offline_mode

     */

    if (window.qtside && !offline_mode) {

      // Check that cloud system is in place



      let prot_status = yield call(waitForProtectionStatus);



      if (prot_status && prot_status.cloud === true && action.payload) {

        // Is cloud setup so save offline token

        yield call(() => offlineAPI.createOfflineAccessToken(action.payload));

      }

    }

  } catch (e) {

    log.error(e);

    yield put(

      errorActions.showCriticalError(

        i18n.t(

          'msg.unableToPosAppToken',

          'Unable to set POS APP offline mode access token'

        ),

        e

      )

    );

  }

}



export default function* saga() {

  yield all([

    takeLatest(actionTypes.LOGIN_SITE, logIn),

    takeLatest(actionTypes.LOGOUT_SITE, logOut),

    takeLatest(actionTypes.SAVE_OFFLINE_TOKEN, refresh_tokens_to_libraries),

    call(watchRefreshToken),

    takeLatest(actionTypes.LOAD_OFFLINE_TOKEN, load_offline_token),

  ]);

}


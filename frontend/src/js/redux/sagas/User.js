import { takeLatest, call, put, select, take } from 'redux-saga/effects';
import { actionTypes, selectors } from '../reducers/User';
import {
  fetch_site_users,
  login_site_user,
  save_site_user,
  remove_site_user,
} from 'js/api/User';
import { waitForSite, waitForZone } from './Configuration';
import WebRequest from './WebRequest';
import log from '../../api/Logger';

function* fetchSiteUsers() {
  yield put({ type: actionTypes.FETCH_SITE_USERS_PENDING, payload: true });
  try {
    const { zoneid } = yield call(waitForZone);
    const { data } = yield call(WebRequest, fetch_site_users(zoneid));
    yield put({
      type: actionTypes.FETCH_SITE_USERS_FULFILLED,
      payload: data,
    });
  } catch (e) {
    yield put({ type: actionTypes.FETCH_SITE_USERS_REJECTED, payload: null });
    // yield put(errorActions.showCriticalError(i18n.t('msg.unableToLoadDataCheckConnectionToServer', 'Unable to load data. Check connection to server.'),e.response || e));
  }
}

function* loginSiteUser(action) {
  yield put({ type: actionTypes.LOGIN_USER_PENDING, payload: true });
  let d = action.payload || {};
  const username_to_log = d.username ? `user "${d.username}"` : 'guest';
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const started_as_admin = yield select(selectors.started_as_admin);

    const { data } = yield call(
      WebRequest,
      login_site_user(zoneid, siteid, d.username, d.password, started_as_admin)
    );
    delete d['password'];
    yield put({
      type: actionTypes.LOGIN_USER_FULFILLED,
      payload: {
        ...d,
        privileges: data.privileges,
        localuserid: data.localuserid,
      },
    });
    log.info('Logged in as ' + username_to_log);
  } catch (e) {
    log.error(
      `Error in ${username_to_log} login: ${e.response?.data?.msg || e.message}`
    );
    yield put({ type: actionTypes.LOGIN_USER_REJECTED, payload: e });
    // yield put(errorActions.showCriticalError(i18n.t('msg.unableToLoadDataCheckConnectionToServer', 'Unable to load data. Check connection to server.'),e.response || e));
  }
}

function* addLocalUser(action) {
  yield put({ type: actionTypes.ADD_LOCAL_USER_PENDING, payload: true });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const { username, password, groups } = action.payload;
    const user = {
      username,
      password,
      groups,
    };
    const { data } = yield call(
      WebRequest,
      save_site_user(zoneid, siteid, user)
    );
    yield put({
      type: actionTypes.ADD_LOCAL_USER_FULFILLED,
      payload: data,
    });
    const users = yield select(selectors.users);
    if (users.filter((user) => !user.posuserid).length === 1)
      yield put({
        type: actionTypes.LOGIN_USER,
        payload: user,
      });
  } catch (e) {
    yield put({ type: actionTypes.ADD_LOCAL_USER_REJECTED, payload: e });
  }
}

function* deleteLocalUser(action) {
  yield put({ type: actionTypes.DELETE_LOCAL_USER_PENDING, payload: true });
  try {
    const { siteid } = yield call(waitForSite);
    yield call(WebRequest, remove_site_user(siteid, action.payload));
    yield put({
      type: actionTypes.DELETE_LOCAL_USER_FULFILLED,
      payload: action.payload,
    });
  } catch (e) {
    yield put({ type: actionTypes.DELETE_LOCAL_USER_REJECTED, payload: e });
  }
}

function* editLocalUserGroup(action) {
  yield put({ type: actionTypes.EDIT_LOCAL_USER_GROUP_PENDING, payload: true });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const { username, editedGroups: groups, localuserid } = action.payload;
    const user = {
      username,
      groups,
      localuserid,
    };
    yield call(WebRequest, save_site_user(zoneid, siteid, user));
    yield put({
      type: actionTypes.EDIT_LOCAL_USER_GROUP_FULFILLED,
      payload: user,
    });
  } catch (e) {
    yield put({ type: actionTypes.EDIT_LOCAL_USER_GROUP_REJECTED, payload: e });
  }
}

function* editLocalUserPassword(action) {
  yield put({
    type: actionTypes.EDIT_LOCAL_USER_PASSWORD_PENDING,
    payload: true,
  });
  try {
    const { zoneid } = yield call(waitForZone);
    const { siteid } = yield call(waitForSite);
    const { username, password, localuserid } = action.payload;
    const user = {
      username,
      password: password.value,
      localuserid,
    };
    yield call(WebRequest, save_site_user(zoneid, siteid, user));
    yield put({
      type: actionTypes.EDIT_LOCAL_USER_PASSWORD_FULFILLED,
      payload: user,
    });
  } catch (e) {
    yield put({
      type: actionTypes.EDIT_LOCAL_USER_PASSWORD_REJECTED,
      payload: e,
    });
  }
}

// returns when user has tint privileges
export function* waitForTintPrivileges() {
  let privileges = yield select(selectors.privileges);

  while (!privileges.includes('order_tinting_process')) {
    const a = yield take(actionTypes.LOGIN_USER_FULFILLED);
    privileges = a.payload.privileges;
  }
  return true;
}

export default function* saga() {
  yield takeLatest(actionTypes.FETCH_SITE_USERS, fetchSiteUsers);
  yield takeLatest(actionTypes.LOGIN_USER, loginSiteUser);
  yield takeLatest(actionTypes.ADD_LOCAL_USER, addLocalUser);
  yield takeLatest(actionTypes.DELETE_LOCAL_USER, deleteLocalUser);
  yield takeLatest(actionTypes.EDIT_LOCAL_USER_GROUP, editLocalUserGroup);
  yield takeLatest(actionTypes.EDIT_LOCAL_USER_PASSWORD, editLocalUserPassword);
}

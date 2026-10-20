import { call, put, all, takeLatest, delay } from 'redux-saga/effects';
import { actionTypes } from '../reducers/PosAppPermissions';

import PosAppPermissionsApi from 'js/api/PosAppPermissions';
import { fulfilled, rejected } from '../factories/ApiCall';

function* getState(action) {
  try {
    const state = yield call(() => PosAppPermissionsApi.getState());
    yield put({ type: fulfilled(action.type), payload: state });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

function* reStartAsAdmin(action) {
  try {
    yield delay(2000);
    const state = yield call(() => PosAppPermissionsApi.reStartAsAdmin());
    yield put({ type: fulfilled(action.type), payload: state });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.GET_STATE, getState),
    takeLatest(actionTypes.RE_START_AS_ADMIN, reStartAsAdmin),
  ]);
}

import { takeLatest, call, put } from 'redux-saga/effects';
import { actionTypes } from '../reducers/LostPassword';
import { resetPassword, sendResetPasswordLink } from '../../api/User';
import { fulfilled, rejected } from '../factories/ApiCall';

function* general_unauth(apifunc, action) {
  try {
    const params = { ...action.payload };
    const { data } = yield call(apifunc(params));
    yield put({ type: fulfilled(action.type), payload: data });
  } catch (e) {
    yield put({ type: rejected(action.type), payload: e });
  }
}

export default function* saga() {
  yield takeLatest(actionTypes.RESET_PASSWORD, general_unauth, resetPassword);
  yield takeLatest(
    actionTypes.SEND_PSW_RESET_LINK,
    general_unauth,
    sendResetPasswordLink
  );
}

import { all, takeLatest, call, put, delay } from 'redux-saga/effects';
import { actionTypes as remoteSupportActionTypes } from '../reducers/RemoteSupport';
import remoteSupportApi from '../../api/RemoteSupport';
import errorActions from '../reducers/Errors';
import i18n from '../../localization/i18n';
import { fulfilled, pending } from '../factories/ApiCall';

export function* openTeamViewer(action) {
  try {
    yield put({ type: pending(action.type) });
    const rs = yield call(() => remoteSupportApi.openTeamviewer());
    if (!rs) {
      yield put(
        errorActions.showCriticalError(
          i18n.t(
            'msg.unableToStartRemoteSupport',
            'Unable to start remote support'
          ),
          'Unable to start remote support'
        )
      );
    }
    // Wait 2 seconds
    yield delay(2000);

    yield put({ type: fulfilled(action.type) });
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToStartRemoteSupport',
          'Unable to start remote support'
        ),
        e
      )
    );
  }
}
export function* isRemoteSupportAvailable(action) {
  try {
    const rs = yield call(() => remoteSupportApi.isRemoteSupportAvailable());
    yield put({ type: fulfilled(action.type), payload: rs });
  } catch (e) {
    errorActions.showCriticalError(
      i18n.t(
        'msg.unableToCheckRemoteSupport',
        'Unable to check if remote support is available or not'
      ),
      e
    );
  }
}

export default function* saga() {
  yield all([
    takeLatest(remoteSupportActionTypes.OPEN_TEAMVIEWER, openTeamViewer),
    takeLatest(
      remoteSupportActionTypes.IS_REMOTE_SUPPORT_AVAILABLE,
      isRemoteSupportAvailable
    ),
  ]);
}

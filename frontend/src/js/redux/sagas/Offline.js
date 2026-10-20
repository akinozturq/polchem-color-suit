import {
  call,
  put,
  all,
  takeLatest,
  select,
  take,
  delay,
} from 'redux-saga/effects';
import offlineActions, {
  actionTypes,
  selectors as offlineSelectors,
} from '../reducers/Offline';

import offlineApi from 'js/api/Offline';
import errorActions from 'js/redux/reducers/Errors';
import i18n from 'js/localization/i18n';
import { OFFLINE_MODE_URL, offline_mode } from '../../Constants';
import { fulfilled } from '../factories/ApiCall';

function* getCloudServerAddress() {
  try {
    // Notify busy
    // yield put(busyActions.setBusy(true));
    const address = yield call(() => offlineApi.getCloudServerAddress());
    const info = yield call(() => offlineApi.get_offline_info());

    yield put(offlineActions.setCloudAddress(address));
    yield put(offlineActions.setOfflineInfo(info));
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToLoadCloudServerAddress',
          'Unable to load cloud server address'
        ),
        e
      )
    );
  } finally {
    // Notify busy
    //yield put(busyActions.setBusy(false));
  }
}

function* startOfflineMode() {
  try {
    // Notify busy
    // yield put(busyActions.setBusy(true));
    const offline_mode_available = yield select(
      offlineSelectors.is_offline_mode_available
    );

    if (offline_mode_available) {
      const started = yield call(() => offlineApi.start_fall_backend());
      console.log(started);

      if (started) {
        // Reload the UI
        yield put({ type: actionTypes.OFFLINE_MODE_STARTED });
        window.location.href = OFFLINE_MODE_URL;
      } else {
        yield put({ type: actionTypes.OFFLINE_MODE_STOPPED });
      }
    }
    yield put(offlineActions.reTryRequest());
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToStartOfflineMode', 'Unable to start offline mode'),
        e
      )
    );
  } finally {
    // Notify busy
    //yield put(busyActions.setBusy(false));
  }
}
function* stopOfflineMode() {
  try {
    // Notify busy
    // yield put(busyActions.setBusy(true));

    const stopped = yield call(() => offlineApi.stop_fall_backend());
    if (stopped) {
      yield put({ type: actionTypes.OFFLINE_MODE_STOPPED });
      yield put(offlineActions.reTryRequest());
    }
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToStopOfflineMode', 'Unable to stop offline mode'),
        e
      )
    );
  } finally {
    // Notify busy
    //yield put(busyActions.setBusy(false));
  }
}
function* checkOfflineFiles() {
  try {
    // Notify busy
    // yield put(busyActions.setBusy(true));
    yield put(offlineActions.setForceCheckRunning(true));
    yield call(() => offlineApi.force_check_offline_db_updates());
    // wait for check finish
    yield take(actionTypes.QT_FORCE_CHECK_FILES_FINISHED);
    const info = yield call(() => offlineApi.get_offline_info());
    yield put(offlineActions.setOfflineInfo(info));
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToStopOfflineMode', 'Unable to stop offline mode'),
        e
      )
    );
  } finally {
    // Notify busy
    //yield put(busyActions.setBusy(false));
    yield put(offlineActions.setForceCheckRunning(false));
  }
}

function* removeOfflineFilesAndSettings() {
  try {
    // Notify busy
    // yield put(busyActions.setBusy(true));
    yield call(() => offlineApi.remove_offline_mode_files_and_settings());
    // wait for check finish
    const info = yield call(() => offlineApi.get_offline_info());
    yield put(offlineActions.setOfflineInfo(info));
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t('msg.unableToStopOfflineMode', 'Unable to stop offline mode'),
        e
      )
    );
  } finally {
    // Notify busy
    //yield put(busyActions.setBusy(false));
  }
}

function* checkOfflineTimeRemaining() {
  const wait = 5 * 60; // 5 minutes
  try {
    // Only needed to check this when in offline mode
    while (offline_mode) {
      // Run the initial fetch
      const info = yield call(() => offlineApi.getOfflineTimeRemaining());
      yield put({
        type: fulfilled(actionTypes.OFFLINE_TIME_REMAINING),
        payload: info,
      });

      yield delay(1000 * wait);
    }
  } catch (e) {
    yield put(
      errorActions.showCriticalError(
        i18n.t(
          'msg.unableToFetchOfflineTime',
          'Unable to fetch offline mode time left'
        ),
        e
      )
    );
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.QT_GET_CLOUD_SERVER_ADDRESS, getCloudServerAddress),
    takeLatest(actionTypes.START_OFFLINE_MODE, startOfflineMode),
    takeLatest(actionTypes.STOP_OFFLINE_MODE, stopOfflineMode),
    takeLatest(actionTypes.QT_FORCE_CHECK_FILES, checkOfflineFiles),
    takeLatest(actionTypes.OFFLINE_TIME_REMAINING, checkOfflineTimeRemaining),
    takeLatest(
      actionTypes.OFFLINE_REMOVE_FILES_AND_SETTINGS,
      removeOfflineFilesAndSettings
    ),
  ]);
}

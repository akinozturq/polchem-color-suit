import i18n from 'js/localization/i18n';
import {
  all,
  call,
  takeEvery,
  takeLatest,
  take,
  put,
  select,
} from 'redux-saga/effects';

import spectroApi, { consts } from 'js/api/Spectro';
import actions, { actionTypes, selectors } from '../reducers/Spectro';

function* fetchConfig() {
  try {
    yield put(actions.fetching());
    const data = yield call(() => spectroApi.getConfig());
    yield put(actions.receiveConfig(data));
    yield* fetchModelInfo();
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* fetchModelInfo() {
  try {
    const config = yield select(selectors.config);
    if (!config.driver_name) return;

    let data = config?.model_info;
    // undefined in current pos app which implements getModelInfo
    if (data === undefined) {
      yield put(actions.fetching());
      data = yield call(() => spectroApi.getModelInfo());
    }
    yield put(actions.receiveModelInfo(data));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* setDriver(action) {
  try {
    yield put(actions.fetching());
    const data = yield call(() => spectroApi.setDriver(action.payload.name));
    yield put(actions.receiveConfig(data));
    yield* fetchModelInfo();
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* configure() {
  try {
    yield put(actions.fetching());
    const data = yield call(() => spectroApi.configure());
    yield put(actions.receiveConfig(data));
    yield* fetchModelInfo();
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* setPort(action) {
  try {
    yield put(actions.fetching());
    const data = yield call(() =>
      spectroApi.setPort(action.payload.name, action.payload.address)
    );
    yield put(actions.receiveConfig(data));
    yield* fetchModelInfo();
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* fetchStatus() {
  try {
    yield put(actions.fetching());
    const data = yield call(() => spectroApi.getStatus());
    yield put(actions.receiveStatus(data));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

/* FOR TRANSLATIONS SCANNER:
t('msg.spectroInstall.0', 'Select folder containing unit driver files');
t('msg.spectroInstall.1', 'Select folder containing white standard files');
t('msg.spectroInstall.2', 'Select license file for the device');
*/

function* install() {
  try {
    const model_info = yield select(selectors.model_info) || {};
    if (!model_info.installSequence) {
      return;
    }
    yield put(actions.fetching());
    const steps = model_info.installSequence.map((x) => [
      x,
      i18n.t('msg.spectroInstall.' + x),
    ]);
    yield call(() => spectroApi.installPrompts(steps));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
  yield* fetchConfig();
}

function* calibrate() {
  const status = yield select(selectors.status);
  if (!status) {
    return;
  }
  const device_button_uses = yield select(selectors.device_button_uses);
  try {
    yield put(actions.clearError());
    let r = consts.RESULT_UNKNOWN;
    let finished = false;

    for (const step of status.calibrationSequence) {
      const waitForDevice =
        device_button_uses.calibrate &&
        ![consts.CALIB_DEVICE_UI, consts.CALIB_GUI].includes(step);
      if (step !== consts.CALIB_GUI) {
        yield put(
          actions.setDialog({
            messageKey: `msg.spectroCalibration.${step}`,
            showButton: !waitForDevice,
            finished: step === consts.CALIB_DEVICE_UI,
          })
        );
        if (!waitForDevice) {
          yield take(actionTypes.CALIB_PROCEED);
        }
      }
      yield put(actions.setBusy(true));
      r = yield call(() => spectroApi.calibrate(step, waitForDevice));
      r = r ?? consts.RESULT_OK; // In case no return statement on Python side
      yield put(actions.setBusy(false));
      if (step === consts.CALIB_DEVICE_UI)
        // no need to show another message
        finished = true;
    }
    // set status.calibrationNeeded
    yield put(
      actions.receiveCalibResult(r === consts.RESULT_OK ? false : null)
    );
    if (!finished) {
      yield put(
        actions.setDialog({
          messageKey:
            r === consts.RESULT_OK
              ? 'msg.spectroCalibrationResult.ok'
              : 'msg.spectroCalibrationResult.unknown',
          showButton: true,
          finished: true,
        })
      );
      yield take(actionTypes.CALIB_PROCEED);
    }
    yield put(actions.setDialog(null));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* measure(resultAction) {
  const status = yield select(selectors.status);
  if (!status) return;
  yield put(actions.clearError());
  const device_button_uses = yield select(selectors.device_button_uses);
  const waitForTrigger = device_button_uses.measure;
  try {
    let glossValue = null;
    if (yield select(selectors.use_gloss_compensation)) {
      yield put(actions.showGlossModal());
      glossValue = (yield take(actionTypes.SET_GLOSS)).payload;
    }
    yield put(actions.setBusy(true));
    if (waitForTrigger) {
      yield put(
        actions.setDialog({
          messageKey: 'msg.spectroMeasureUseButton',
          showButton: false,
          finished: false,
        })
      );
    }
    let r = yield call(() => spectroApi.measure(waitForTrigger, glossValue));
    if (waitForTrigger) {
      yield put(actions.setDialog(null));
    }

    // gloss compensation is now on Python side
    r.coldataclass = r.coldataClass || status.coldataClass;
    delete r.coldataClass; // c/C confusion

    yield put(resultAction(r));

    yield put(actions.setBusy(false));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* setMode(action) {
  const status = yield select(selectors.status);
  if (!status) {
    return;
  }
  try {
    const { aperture, specularMode, uvMode } = action.payload;
    yield call(() => spectroApi.setMode(aperture, specularMode, uvMode));
  } catch (e) {
    yield put(actions.receiveError(e));
  } finally {
    // reload spectro status
    yield put(actions.fetchStatus());
  }
}

function* download() {
  try {
    yield put(actions.fetching());
    const status = yield select(selectors.status);
    let data = yield call(() => spectroApi.download());
    data = data.map((measurement) => {
      measurement.coldataclass =
        measurement.coldataClass || status.coldataClass;
      delete measurement.coldataClass; // c/C confusion
      return measurement;
    });
    yield put(actions.receiveDownload(data));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* clearStored() {
  try {
    yield put(actions.setBusy(true));
    yield call(() => spectroApi.clearStored());
    yield put(actions.receiveDownload([]));
    yield put(actions.setBusy(false));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.FETCH_CONFIG, fetchConfig),
    takeLatest(actionTypes.SET_DRIVER, setDriver),
    takeLatest(actionTypes.SET_PORT, setPort),
    takeLatest(actionTypes.CONFIGURE, configure),
    takeLatest(actionTypes.INSTALL, install),
    takeLatest(actionTypes.FETCH_STATUS, fetchStatus),
    takeLatest(actionTypes.SET_MODE, setMode),
    takeEvery(actionTypes.CALIBRATE, calibrate),
    takeEvery(
      actionTypes.MEASURE_TARGET,
      measure,
      actions.receiveMeasureTarget
    ),
    takeEvery(actionTypes.MEASURE_PAINT, measure, actions.receiveMeasurePaint),
    takeLatest(actionTypes.FETCH_DOWNLOAD, download),
    takeLatest(actionTypes.CLEAR_STORED, clearStored),
  ]);
}

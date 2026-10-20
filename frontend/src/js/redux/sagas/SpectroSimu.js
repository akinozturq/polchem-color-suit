import {
  all,
  delay,
  takeEvery,
  takeLatest,
  take,
  put,
} from 'redux-saga/effects';

import { consts } from 'js/api/Spectro';
import actions, { actionTypes } from '../reducers/Spectro';
import { COLDATACLASS_SPHERE } from '../../Constants';

const DRIVER_NAME = 'Simulation';

const CONFIG = {
  driver_info: {
    driverName: DRIVER_NAME,
    driverType: 'Integrated',
    silentConfigure: true,
  },
  driver_name: DRIVER_NAME,
  drivers: [DRIVER_NAME],
  ports: ['Virtual'],
  selected_port: 'Virtual',
};

const STATUS = {
  aperture: 'MAV',
  apertures: ['MAV'],
  calibrationNeeded: false,
  calibrationSequence: [consts.CALIB_BLACK, consts.CALIB_WHITE],
  coldataClass: COLDATACLASS_SPHERE,
  download: true,
  geometry: 'd/8',
  instrumentSerial: '12345',
  modelName: DRIVER_NAME,
  resCode: consts.RESULT_OK,
  specularMode: 'SCI',
  specularModes: ['SCI'],
  storedCount: 0,
  triggers: [consts.TRIGGER_CALIB_SW, consts.TRIGGER_MEAS_SW],
  uvMode: 'UVINC',
  uvModes: ['UVINC'],
  whiteSerial: '67890',
};

const MEASUREMENTS = [
  {
    resCode: 0,
    wlInterval: 10,
    refl: [
      51.08, 53.63, 56.08, 58.35, 60.34, 61.95, 63.1, 63.69, 63.63, 62.97,
      61.88, 60.52, 59.09, 57.74, 56.68, 56.06, 56.01, 56.48, 57.35, 58.5,
      59.82, 61.2, 62.52, 63.68, 64.63, 65.41, 66.03, 66.53, 66.94, 67.29,
      67.61,
    ],
    lab: [81.26, 1.75, -2.01],
    xyz: [56.6, 58.95, 65.57],
    rgb: 13421006,
    coldataclass: 'SP',
  },
  {
    resCode: 0,
    wlInterval: 10,
    refl: [
      56.9, 56.26, 55.69, 55.22, 54.92, 54.84, 55.04, 55.57, 56.47, 57.72,
      59.19, 60.74, 62.24, 63.55, 64.56, 65.12, 65.15, 64.73, 64.01, 63.11,
      62.17, 61.33, 60.72, 60.47, 60.61, 61.1, 61.88, 62.89, 64.07, 65.36,
      66.71,
    ],
    lab: [83.14, -2.23, 6.51],
    xyz: [58.26, 62.42, 59.61],
    rgb: 13684931,
    coldataclass: 'SP',
  },
  {
    resCode: 0,
    wlInterval: 10,
    refl: [
      56.83, 58.96, 60.98, 62.79, 64.29, 65.37, 65.93, 65.85, 65.04, 63.58,
      61.67, 59.57, 57.49, 55.69, 54.39, 53.82, 54.15, 55.25, 56.91, 58.93,
      61.1, 63.21, 65.06, 66.45, 67.33, 67.74, 67.78, 67.52, 67.03, 66.38,
      65.67,
    ],
    lab: [81.01, 5.04, -5.3],
    xyz: [57.5, 58.5, 68.94],
    rgb: 13551571,
    coldataclass: 'SP',
  },
  {
    resCode: 0,
    wlInterval: 10,
    refl: [
      51.67, 51.77, 51.85, 51.9, 51.9, 51.83, 51.68, 51.42, 51.06, 50.62, 50.21,
      49.92, 49.85, 50.1, 50.77, 51.97, 53.73, 55.96, 58.48, 61.12, 63.74,
      66.17, 68.23, 69.79, 70.78, 71.3, 71.42, 71.22, 70.78, 70.17, 69.49,
    ],
    lab: [79.23, 9.59, 3.76],
    xyz: [56.23, 55.33, 55.38],
    rgb: 14270142,
    coldataclass: 'SP',
  },
];

let memory = MEASUREMENTS.map((x, i) => ({ ...x, name: 'MEMORY ' + (i + 1) }));

function* fetchConfig() {
  yield put(actions.receiveConfig(CONFIG));
}

function* fetchStatus() {
  const result = { ...STATUS, storedCount: memory.length };
  yield put(actions.receiveStatus(result));
}

function* calibrate() {
  try {
    yield put(actions.clearError());

    for (const step of STATUS.calibrationSequence) {
      yield put(
        actions.setDialog({
          messageKey: `msg.spectroCalibration.${step}`,
          showButton: true,
          finished: false,
        })
      );

      yield take(actionTypes.CALIB_PROCEED);

      yield put(actions.setBusy(true));
      yield delay(2000);
      yield put(actions.setBusy(false));
    }
    // set status.calibrationNeeded
    yield put(actions.receiveCalibResult(false));
    yield put(
      actions.setDialog({
        messageKey: 'msg.spectroCalibrationResult.ok',
        showButton: true,
        finished: true,
      })
    );
    yield take(actionTypes.CALIB_PROCEED);

    yield put(actions.setDialog(null));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* measure(resultAction) {
  yield put(actions.clearError());
  try {
    yield put(actions.setBusy(true));
    yield delay(1000);
    const random_index = Math.floor(Math.random() * MEASUREMENTS.length);
    const result = MEASUREMENTS[random_index];
    yield put(resultAction(result));

    yield put(actions.setBusy(false));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* download() {
  try {
    yield put(actions.fetching());
    yield delay(1000);
    yield put(actions.receiveDownload(memory));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

function* clearStored() {
  try {
    yield put(actions.setBusy(true));
    yield delay(300);
    memory = [];
    yield put(actions.receiveDownload([]));
    yield put(actions.clearMeasurement());
    yield put(actions.setBusy(false));
  } catch (e) {
    yield put(actions.receiveError(e));
  }
}

export default function* saga() {
  yield all([
    takeLatest(actionTypes.FETCH_CONFIG, fetchConfig),
    takeLatest(actionTypes.FETCH_STATUS, fetchStatus),
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

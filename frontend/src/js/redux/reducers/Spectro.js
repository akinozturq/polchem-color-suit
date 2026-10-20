import { globalizeSelectors } from '../Utils';
import { consts } from 'js/api/Spectro';
import { selectors as configSelectors } from './Configuration';
import { COLDATACLASS_45 } from '../../Constants';

const actionTypes = {
  FETCHING: 'SPECTRO/FETCHING',

  FETCH_CONFIG: 'SPECTRO/FETCH_CONFIG',
  RECEIVE_CONFIG: 'SPECTRO/RECEIVE_CONFIG',
  RECEIVE_MODEL_INFO: 'SPECTRO/RECEIVE_MODEL_INFO',
  SET_DRIVER: 'SPECTRO/SET_DRIVER',
  SET_PORT: 'SPECTRO/SET_PORT',
  CONFIGURE: 'SPECTRO/CONFIGURE',

  FETCH_STATUS: 'SPECTRO/FETCH_STATUS',
  RECEIVE_STATUS: 'SPECTRO/RECEIVE_STATUS',
  INSTALL: 'SPECTRO/INSTALL',
  RECEIVE_CALIB_RESULT: 'SPECTRO/RECEIVE_CALIB_RESULT',

  CALIBRATE: 'SPECTRO/CALIBRATE',
  CALIB_PROCEED: 'SPECTRO/CALIB_PROCEED',

  SHOW_GLOSS_MODAL: 'SPECTRO/SHOW_GLOSS_MODAL',
  SET_GLOSS: 'SPECTRO/SET_GLOSS',

  MEASURE_TARGET: 'SPECTRO/MEASURE_TARGET',
  MEASURE_PAINT: 'SPECTRO/MEASURE_PAINT',
  RECEIVE_MEASURE_TARGET: 'SPECTRO/RECEIVE_MEASURE_TARGET',
  RECEIVE_MEASURE_PAINT: 'SPECTRO/RECEIVE_MEASURE_PAINT',
  CLEAR_MEASUREMENT: 'SPECTRO/CLEAR_MEASUREMENT',

  FETCH_DOWNLOAD: 'SPECTRO/FETCH_DOWNLOAD',
  RECEIVE_DOWNLOAD: 'SPECTRO/RECEIVE_DOWNLOAD',
  CLEAR_STORED: 'SPECTRO/CLEAR_STORED',

  SET_DIALOG: 'SPECTRO/SET_DIALOG',
  RECEIVE_ERROR: 'SPECTRO/RECEIVE_ERROR',
  CLEAR_ERROR: 'SPECTRO/CLEAR_ERROR',

  SET_MODE: 'SPECTRO/SET_MODE',
  SET_BUSY: 'SPECTRO/SET_BUSY',
};

const actions = {
  fetching: () => ({ type: actionTypes.FETCHING }),
  fetchConfig: () => ({ type: actionTypes.FETCH_CONFIG }),
  receiveConfig: (payload) => ({ type: actionTypes.RECEIVE_CONFIG, payload }),
  receiveModelInfo: (payload) => ({
    type: actionTypes.RECEIVE_MODEL_INFO,
    payload,
  }),
  setDriver: (name) => ({ type: actionTypes.SET_DRIVER, payload: { name } }),
  setPort: (name, address = null) => ({
    type: actionTypes.SET_PORT,
    payload: { name, address },
  }),
  configure: () => ({ type: actionTypes.CONFIGURE }),
  fetchStatus: () => ({ type: actionTypes.FETCH_STATUS }),
  receiveStatus: (payload) => ({ type: actionTypes.RECEIVE_STATUS, payload }),
  install: () => ({ type: actionTypes.INSTALL }),
  receiveCalibResult: (calibrationNeeded) => ({
    type: actionTypes.RECEIVE_CALIB_RESULT,
    payload: calibrationNeeded,
  }),

  calibrate: () => ({ type: actionTypes.CALIBRATE }),
  calibProceed: () => ({ type: actionTypes.CALIB_PROCEED }),

  showGlossModal: () => ({ type: actionTypes.SHOW_GLOSS_MODAL }),
  setGloss: (glossValue) => ({
    type: actionTypes.SET_GLOSS,
    payload: glossValue,
  }),

  measureTarget: () => ({ type: actionTypes.MEASURE_TARGET }),
  measurePaint: () => ({ type: actionTypes.MEASURE_PAINT }),
  receiveMeasureTarget: (payload) => ({
    type: actionTypes.RECEIVE_MEASURE_TARGET,
    payload,
  }),
  receiveMeasurePaint: (payload) => ({
    type: actionTypes.RECEIVE_MEASURE_PAINT,
    payload,
  }),
  clearMeasurement: () => ({
    type: actionTypes.CLEAR_MEASUREMENT,
  }),

  fetchDownload: () => ({ type: actionTypes.FETCH_DOWNLOAD }),
  receiveDownload: (data) => ({
    type: actionTypes.RECEIVE_DOWNLOAD,
    payload: data || [],
  }),

  setDialog: (payload) => ({ type: actionTypes.SET_DIALOG, payload }),
  receiveError: (payload) => ({ type: actionTypes.RECEIVE_ERROR, payload }),
  clearError: () => ({ type: actionTypes.CLEAR_ERROR }),
  clearStoredMeasurements: () => ({ type: actionTypes.CLEAR_STORED }),

  setMode: (aperture, specularMode, uvMode) => ({
    type: actionTypes.SET_MODE,
    payload: { aperture, specularMode, uvMode },
  }),

  setBusy: (busy) => ({ type: actionTypes.SET_BUSY, payload: busy }),
};

// reducer

const mountPath = 'spectro'; // mount point in global state, must match root reducer

const initialState = {
  busy: false, // set to true when measuring etc action in progress.
  config: null,
  model_info: null,
  status: null,
  error: null,
  dialog: null,
  measurement_target: null,
  measurement_paint: null,
  downloaded_measurements: [],

  show_gloss_modal: false,
  gloss_value: null,
  gloss_options: [
    { key: 'matt', value: 5, range: [0, 9] },
    { key: 'eggshell', value: 20, range: [10, 25] },
    { key: 'semiGloss', value: 40, range: [26, 40] },
    { key: 'gloss', value: 60, range: [41, 69] },
    { key: 'highGloss', value: 80, range: [70, 89] },
  ],
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCHING: {
      return { ...state, busy: true, error: null };
    }
    case actionTypes.SET_BUSY: {
      return { ...state, busy: action.payload };
    }
    case actionTypes.RECEIVE_CONFIG: {
      return {
        ...state,
        busy: false,
        config: action.payload,
        status: null,
        error: null,
      };
    }
    case actionTypes.RECEIVE_MODEL_INFO: {
      return {
        ...state,
        model_info: action.payload,
        busy: false,
        error: null,
      };
    }
    case actionTypes.RECEIVE_STATUS: {
      return {
        ...state,
        busy: false,
        status: action.payload,
        error: null,
      };
    }
    case actionTypes.RECEIVE_CALIB_RESULT: {
      return {
        ...state,
        status: { ...state.status, calibrationNeeded: action.payload },
      };
    }
    case actionTypes.SET_DIALOG: {
      return { ...state, dialog: action.payload };
    }
    case actionTypes.SHOW_GLOSS_MODAL: {
      return { ...state, show_gloss_modal: true, gloss_value: null };
    }
    case actionTypes.SET_GLOSS: {
      return { ...state, show_gloss_modal: false, gloss_value: action.payload };
    }
    case actionTypes.RECEIVE_MEASURE_TARGET: {
      return { ...state, measurement_target: action.payload };
    }
    case actionTypes.RECEIVE_MEASURE_PAINT: {
      return { ...state, measurement_paint: action.payload };
    }
    case actionTypes.CLEAR_MEASUREMENT: {
      return {
        ...state,
        measurement_target: null,
        measurement_paint: null,
      };
    }
    case actionTypes.RECEIVE_DOWNLOAD: {
      return { ...state, downloaded_measurements: action.payload, busy: false };
    }
    case actionTypes.RECEIVE_ERROR: {
      return {
        ...state,
        busy: false,
        dialog: null,
        error: action.payload,
      };
    }
    case actionTypes.CLEAR_ERROR: {
      return { ...state, error: null };
    }

    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  config: (state) => state.config,
  model_info: (state) => state.model_info,
  status: (state) => state.status,
  error: (state) => state.error,
  dialog: (state) => state.dialog,
  busy: (state) => state.busy,
  measurement_target: (state) => state.measurement_target,
  measurement_paint: (state) => state.measurement_paint,
  downloaded_measurements: (state) => state.downloaded_measurements,
  gloss_options: (state) => state.gloss_options,
  show_gloss_modal: (state) => state.show_gloss_modal,

  /** True if either calibration or measuring has both options */
  has_button_option: ({ status }) => {
    if (status) {
      const { triggers } = status;
      return (
        (triggers.includes(consts.TRIGGER_CALIB_DEVICE) &&
          triggers.includes(consts.TRIGGER_CALIB_SW)) ||
        (triggers.includes(consts.TRIGGER_MEAS_DEVICE) &&
          triggers.includes(consts.TRIGGER_MEAS_SW))
      );
    }
    return false;
  },
};

const globalized = globalizeSelectors(localSelectors, mountPath);
const selectors = {
  ...globalized,
  use_gloss_compensation: (state) => {
    // true when option enabled and device requires compensation
    const status = globalized.status(state);
    const { spectro_gloss_compensation } = configSelectors.config_values(state);
    return (
      status &&
      status.coldataClass === COLDATACLASS_45 &&
      spectro_gloss_compensation
    );
  },
  device_button_uses: (state) => {
    const status = globalized.status(state);
    if (status) {
      const { triggers } = status;
      const { spectro_read_with_dev_btn } =
        configSelectors.config_values(state);
      return {
        calibrate: spectro_read_with_dev_btn
          ? triggers.includes(consts.TRIGGER_CALIB_DEVICE)
          : !triggers.includes(consts.TRIGGER_CALIB_SW),
        measure: spectro_read_with_dev_btn
          ? triggers.includes(consts.TRIGGER_MEAS_DEVICE)
          : !triggers.includes(consts.TRIGGER_MEAS_SW),
      };
    } else return {};
  },
};

export { actionTypes, actions as default, selectors, reducer };

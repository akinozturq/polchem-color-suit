import { globalizeSelectors } from '../Utils';
import PropTypes from 'prop-types';
import { fulfilled } from '../factories/ApiCall';
import { offline_mode } from '../../Constants';
import log from '../../api/Logger';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  QT_GET_CLOUD_SERVER_ADDRESS: 'OFFLINE/QT_GET_CLOUD_SERVER_ADDRESS',
  QT_SET_ORDERS_SYNCED: 'OFFLINE/QT_SET_ORDERS_SYNCED',
  SET_ONLINE_AVAILABLE: 'OFFLINE/SET_ONLINE_AVAILABLE',
  SET_CLOUD_ADDRESS: 'OFFLINE/SET_CLOUD_ADDRESS',
  SET_OFFLINE_INFO: 'OFFLINE/SET_OFFLINE_INFO',
  START_OFFLINE_MODE: 'OFFLINE/START_OFFLINE_MODE',
  OFFLINE_MODE_STARTED: 'OFFLINE/OFFLINE_MODE_STARTED',
  STOP_OFFLINE_MODE: 'OFFLINE/STOP_OFFLINE_MODE',
  OFFLINE_MODE_STOPPED: 'OFFLINE/OFFLINE_MODE_STOPPED',
  SET_OFFLINE_MODE_AVAILABLE: 'OFFLINE/SET_OFFLINE_MODE_AVAILABLE',
  SET_FALL_BACKEND_RUNNING: 'OFFLINE/SET_FALL_BACKEND_RUNNING',
  RE_TRY_REQUEST: 'OFFLINE/RE_TRY_REQUEST',
  QT_FORCE_CHECK_FILES: 'OFFLINE/QT_FORCE_CHECK_FILES',
  QT_FORCE_CHECK_FILES_RUNNING: 'OFFLINE/QT_FORCE_CHECK_FILES_RUNNING',
  QT_FORCE_CHECK_FILES_FINISHED: 'OFFLINE/QT_FORCE_CHECK_FILES_FINISHED',
  OFFLINE_TIME_REMAINING: 'OFFLINE/OFFLINE_TIME_REMAINING',
  OFFLINE_REMOVE_FILES_AND_SETTINGS:
    'OFFLINE/OFFLINE_REMOVE_FILES_AND_SETTINGS',
};

/*
 * action creators
 */

const actions = {
  setOnlineAvailable: (bool) => ({
    type: types.SET_ONLINE_AVAILABLE,
    payload: bool,
  }),
  setOrdersSynced: (bool) => ({
    type: types.QT_SET_ORDERS_SYNCED,
    payload: bool,
  }),
  setForceCheckRunning: (bool) => ({
    type: types.QT_FORCE_CHECK_FILES_RUNNING,
    payload: bool,
  }),
  setOfflineAvailable: (bool) => ({
    type: types.SET_OFFLINE_MODE_AVAILABLE,
    payload: bool,
  }),
  setCloudAddress: (address) => ({
    type: types.SET_CLOUD_ADDRESS,
    payload: address,
  }),
  setOfflineInfo: (info) => ({
    type: types.SET_OFFLINE_INFO,
    payload: info,
  }),
  checkOfflineFiles: () => ({ type: types.QT_FORCE_CHECK_FILES }),
  forceCheckFinished: () => ({ type: types.QT_FORCE_CHECK_FILES_FINISHED }),
  startOfflineMode: () => ({ type: types.START_OFFLINE_MODE }),
  stopOfflineMode: () => ({ type: types.STOP_OFFLINE_MODE }),
  setFallBackendRunning: (bool) => ({
    type: types.SET_FALL_BACKEND_RUNNING,
    payload: bool,
  }),
  reTryRequest: () => ({
    type: types.RE_TRY_REQUEST,
  }),
  getCloudServerAddress: () => ({
    type: types.QT_GET_CLOUD_SERVER_ADDRESS,
  }),
  getOfflineTimeRemaining: () => ({
    type: types.OFFLINE_TIME_REMAINING,
  }),
  removeOfflineFilesAndSettings: () => ({
    type: types.OFFLINE_REMOVE_FILES_AND_SETTINGS,
  }),
};
const mountPath = 'offline'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  is_online_mode_available: true, // Notify user about the connection lost / recovered to online
  orders_synced: false,
  cloud_address: null, // Address of the cloud server (set by qt side)
  offline_info: null, // info about the files etc available on offline mode
  is_offline_mode_available: false, // Notify from QT side about the offline mode availability
  fall_backend_running: false, // State of fall backend
  show_modal: false, // Show offline modal
  force_check_running: false,
  time_remaining: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.OFFLINE_MODE_STARTED: {
      log.info('OFFLINE_MODE_STARTED');
      return { ...state, show_modal: false };
    }
    case fulfilled(types.OFFLINE_TIME_REMAINING): {
      return { ...state, time_remaining: action.payload };
    }
    case types.OFFLINE_MODE_STOPPED: {
      log.info('OFFLINE_MODE_STOPPED');
      return { ...state, show_modal: false };
    }
    case types.SET_ONLINE_AVAILABLE: {
      // Show only if state changes
      let show = state.show_modal;
      if (!offline_mode === !action.payload && !show) {
        log.info(`SET_ONLINE_AVAILABLE: ${action.payload}`);
        show = true;
      }

      return {
        ...state,
        is_online_mode_available: action.payload,
        show_modal: show,
      };
    }
    case types.RE_TRY_REQUEST: {
      return {
        ...state,
        show_modal: false,
      };
    }
    case types.SET_OFFLINE_MODE_AVAILABLE: {
      return { ...state, is_offline_mode_available: action.payload };
    }
    case types.SET_CLOUD_ADDRESS: {
      return { ...state, cloud_address: action.payload };
    }
    case types.SET_OFFLINE_INFO: {
      return { ...state, offline_info: action.payload };
    }
    case types.QT_FORCE_CHECK_FILES_RUNNING: {
      return { ...state, force_check_running: action.payload };
    }
    case types.SET_FALL_BACKEND_RUNNING: {
      return { ...state, fall_backend_running: action.payload };
    }
    case types.QT_SET_ORDERS_SYNCED: {
      return { ...state, orders_synced: action.payload };
    }

    default: {
      return state;
    }
  }
}

const propType = PropTypes.shape({
  is_online_mode_available: PropTypes.bool, // Notify user about the connection lost / recovered to online
  orders_synced: PropTypes.bool,
  cloud_address: PropTypes.string, // Address of the cloud server (set by qt side)
  is_offline_mode_available: PropTypes.bool, // Notify from QT side about the offline mode availability
  fall_backend_running: PropTypes.bool, // State of fall backend
  show_modal: PropTypes.bool, //
  offline_info: PropTypes.any,
  time_remaining: PropTypes.shape({
    days: PropTypes.number,
    hours: PropTypes.number,
    minutes: PropTypes.number,
    expiration_date: PropTypes.string,
  }),
});

// selectors

const localSelectors = {
  is_online_mode_available: (state) => state.is_online_mode_available,
  cloud_address: (state) => state.cloud_address,
  is_offline_mode_available: (state) => state.is_offline_mode_available,
  orders_synced: (state) => state.orders_synced,
  time_remaining: (state) => state.time_remaining,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  selectors,
  reducer,
  propType,
};

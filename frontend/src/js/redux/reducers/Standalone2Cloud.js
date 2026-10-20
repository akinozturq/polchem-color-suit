import PropTypes from 'prop-types';
import { globalizeSelectors } from '../Utils';

const types = {
  LIST_DATABASES: 'STANDALONE2CLOUD/LIST_DATABASES',
  LIST_DATABASES_SUCCESS: 'STANDALONE2CLOUD/LIST_DATABASES_SUCCESS',
  LIST_DATABASES_FAILURE: 'STANDALONE2CLOUD/LIST_DATABASES_FAILURE',
  LIST_SITES: 'STANDALONE2CLOUD/LIST_SITES',
  LIST_SITES_SUCCESS: 'STANDALONE2CLOUD/LIST_SITES_SUCCESS',
  LIST_SITES_FAILURE: 'STANDALONE2CLOUD/LIST_SITES_FAILURE',
  START_SYNC: 'STANDALONE2CLOUD/START_SYNC',
  START_SYNC_SUCCESS: 'STANDALONE2CLOUD/START_SYNC_SUCCESS',
  START_SYNC_FAILURE: 'STANDALONE2CLOUD/START_SYNC_FAILURE',
  CANCEL_SYNC: 'STANDALONE2CLOUD/CANCEL_SYNC',
  PROGRESS_UPDATED: 'STANDALONE2CLOUD/PROGRESS_UPDATED',
  SYNC_STARTED: 'STANDALONE2CLOUD/SYNC_STARTED',
  SYNC_FINISHED: 'STANDALONE2CLOUD/SYNC_FINISHED',
  SYNC_CANCELLED: 'STANDALONE2CLOUD/SYNC_CANCELLED',
  ORDER_STATUS_UPDATED: 'STANDALONE2CLOUD/ORDER_STATUS_UPDATED',
  ORDER_STATUS_FAILURE: 'STANDALONE2CLOUD/ORDER_STATUS_FAILURE',
  POLL_ORDER_STATUS_START: 'STANDALONE2CLOUD/POLL_ORDER_STATUS_START',
  POLL_ORDER_STATUS_STOP: 'STANDALONE2CLOUD/POLL_ORDER_STATUS_STOP',
};

const mountPath = 'standalone2cloud';

const initialState = {
  databases: [],
  sites: [],
  isFetchingDatabases: false,
  isFetchingSites: false,
  isSyncRunning: false,
  progressMessage: null,
  progressPercent: 0,
  error: null,
  resultMessage: null,
  orderSyncStatus: 'idle',
  orderSyncPercentage: 0,
  orderSyncStats: {},
  orderSyncError: null,
  orderSyncTaskId: null,
};

const actions = {
  listDatabases: (payload) => ({ type: types.LIST_DATABASES, payload }),
  listDatabasesSuccess: (databases) => ({
    type: types.LIST_DATABASES_SUCCESS,
    payload: databases,
  }),
  listDatabasesFailure: (error) => ({
    type: types.LIST_DATABASES_FAILURE,
    payload: error,
  }),
  listSites: (payload) => ({ type: types.LIST_SITES, payload }),
  listSitesSuccess: (sites) => ({
    type: types.LIST_SITES_SUCCESS,
    payload: sites,
  }),
  listSitesFailure: (error) => ({
    type: types.LIST_SITES_FAILURE,
    payload: error,
  }),
  startSync: (payload) => ({ type: types.START_SYNC, payload }),
  startSyncSuccess: () => ({ type: types.START_SYNC_SUCCESS }),
  startSyncFailure: (error) => ({
    type: types.START_SYNC_FAILURE,
    payload: error,
  }),
  cancelSync: () => ({ type: types.CANCEL_SYNC }),
  progressUpdated: (message, percent) => ({
    type: types.PROGRESS_UPDATED,
    payload: { message, percent },
  }),
  syncStarted: () => ({ type: types.SYNC_STARTED }),
  syncFinished: (success, message) => ({
    type: types.SYNC_FINISHED,
    payload: { success, message },
  }),
  syncCancelled: () => ({ type: types.SYNC_CANCELLED }),
  orderStatusUpdated: (status) => ({
    type: types.ORDER_STATUS_UPDATED,
    payload: status,
  }),
  orderStatusFailure: (error) => ({
    type: types.ORDER_STATUS_FAILURE,
    payload: error,
  }),
  pollOrderStatusStart: (siteid) => ({
    type: types.POLL_ORDER_STATUS_START,
    payload: siteid,
  }),
  pollOrderStatusStop: () => ({ type: types.POLL_ORDER_STATUS_STOP }),
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.LIST_DATABASES:
      return {
        ...state,
        isFetchingDatabases: true,
        error: null,
        databases: [],
      };
    case types.LIST_DATABASES_SUCCESS:
      return {
        ...state,
        isFetchingDatabases: false,
        databases: action.payload,
      };
    case types.LIST_DATABASES_FAILURE:
      return {
        ...state,
        isFetchingDatabases: false,
        error: action.payload,
      };
    case types.LIST_SITES:
      return {
        ...state,
        isFetchingSites: true,
        error: null,
        sites: [],
      };
    case types.LIST_SITES_SUCCESS:
      return {
        ...state,
        isFetchingSites: false,
        sites: action.payload,
      };
    case types.LIST_SITES_FAILURE:
      return {
        ...state,
        isFetchingSites: false,
        error: action.payload,
      };
    case types.SYNC_STARTED:
      return {
        ...state,
        isSyncRunning: true,
        progressMessage: null,
        progressPercent: 0,
        resultMessage: null,
        error: null,
      };
    case types.PROGRESS_UPDATED:
      return {
        ...state,
        progressMessage: action.payload.message,
        progressPercent: action.payload.percent,
      };
    case types.SYNC_FINISHED:
      return {
        ...state,
        isSyncRunning: false,
        resultMessage: action.payload.message,
        progressPercent: action.payload.success ? 100 : state.progressPercent,
      };
    case types.SYNC_CANCELLED:
      return {
        ...state,
        isSyncRunning: false,
        resultMessage: 'Cancelled',
        progressMessage: 'Cancelled',
      };
    case types.START_SYNC_FAILURE:
      return {
        ...state,
        isSyncRunning: false,
        error: action.payload,
      };
    case types.START_SYNC_SUCCESS:
      return {
        ...state,
        error: null,
      };
    case types.ORDER_STATUS_UPDATED: {
      const { payload = {} } = action;
      const status = payload.status || 'idle';
      return {
        ...state,
        orderSyncStatus: status,
        orderSyncPercentage: Number.isFinite(payload.percentage)
          ? payload.percentage
          : 0,
        orderSyncStats: payload.stats || {},
        orderSyncError: payload.error || null,
        orderSyncTaskId: payload.task_id || null,
      };
    }
    case types.ORDER_STATUS_FAILURE:
      return {
        ...state,
        orderSyncError: action.payload,
      };
    default:
      return state;
  }
}

const localSelectors = {
  databases: (state) => state.databases,
  sites: (state) => state.sites,
  isFetchingDatabases: (state) => state.isFetchingDatabases,
  isFetchingSites: (state) => state.isFetchingSites,
  isSyncRunning: (state) => state.isSyncRunning,
  progressMessage: (state) => state.progressMessage,
  progressPercent: (state) => state.progressPercent,
  error: (state) => state.error,
  resultMessage: (state) => state.resultMessage,
  orderSyncStatus: (state) => state.orderSyncStatus,
  orderSyncPercentage: (state) => state.orderSyncPercentage,
  orderSyncStats: (state) => state.orderSyncStats,
  orderSyncError: (state) => state.orderSyncError,
  orderSyncTaskId: (state) => state.orderSyncTaskId,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

const propType = PropTypes.shape({
  databases: PropTypes.arrayOf(PropTypes.string),
  sites: PropTypes.arrayOf(
    PropTypes.shape({
      siteid: PropTypes.number,
      sitename: PropTypes.string,
    })
  ),
  isFetchingDatabases: PropTypes.bool,
  isFetchingSites: PropTypes.bool,
  isSyncRunning: PropTypes.bool,
  progressMessage: PropTypes.string,
  progressPercent: PropTypes.number,
  error: PropTypes.string,
  resultMessage: PropTypes.string,
});

export { types as actionTypes, actions as default, selectors, reducer, propType };

import { globalizeSelectors } from '../Utils';
import {
  FEATURE_PRO,
  FEATURE_POS_MATCHING,
  FEATURE_IST_PRO,
  PRIVILEGE_MATCHING,
  offline_mode,
} from '../../Constants';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  FETCH_STATUS: 'PROTECTION/FETCH_STATUS',
  FETCH_STATUS_REJECTED: 'PROTECTION/FETCH_STATUS_REJECTED',
  FETCH_STATUS_STARTED: 'PROTECTION/FETCH_STATUS_STARTED',
  FETCH_STATUS_FULLFILLED: 'PROTECTION/FETCH_STATUS_FULLFILLED',
  ACTIVATE_ONLINE: 'PROTECTION/ACTIVATE_ONLINE',
  DEACTIVATE_ONLINE: 'PROTECTION/DEACTIVATE_ONLINE',
  ACTIVATE_CERT_REQUEST: 'PROTECTION/ACTIVATE_CERT_REQUEST',
  ACTIVATE_CERT_REQUEST_RESET: 'PROTECTION/ACTIVATE_CERT_REQUEST_RESET',
  DEACTIVATION_CERT_REQUEST: 'PROTECTION/DEACTIVATION_CERT_REQUEST',
  MANUAL_ACTIVATION: 'PROTECTION/MANUAL_ACTIVATION',
  ACTION_STARTED: 'PROTECTION/ACTION_STARTED',
  ACTION_FULLFILLED: 'PROTECTION/ACTION_FULLFILLED',
  ACTION_REJECTED: 'PROTECTION/ACTION_REJECTED',
};

/*
 * action creators
 */

const actions = {
  fetchStatus: () => ({ type: types.FETCH_STATUS }),
  activateOnline: (license_code) => ({
    type: types.ACTIVATE_ONLINE,
    payload: license_code,
  }),
  deactivateOnline: () => ({
    type: types.DEACTIVATE_ONLINE,
  }),
  activationCertificateRequest: (license_code) => ({
    type: types.ACTIVATE_CERT_REQUEST,
    payload: license_code,
  }),
  activationCertificateReset: () => ({
    type: types.ACTIVATE_CERT_REQUEST_RESET,
  }),
  activateOffline: (certificate) => ({
    type: types.MANUAL_ACTIVATION,
    payload: certificate,
  }),
  deactivationCertificateRequest: () => ({
    type: types.DEACTIVATION_CERT_REQUEST,
  }),
  // Used to set the license status
  setStatus: (status) => ({
    type: types.FETCH_STATUS_FULLFILLED,
    payload: status,
  }),
};

const mountPath = 'protection'; // mount point in global state, must match root reducer

const initialState = {
  status: null,
  status_error: null,
  status_pending: false,

  action_result_type: null,
  action_results: null,
  action_started: false,
  action_error: null,
  is_pro: false,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.ACTION_STARTED: {
      return {
        ...state,
        action_results: null,
        action_error: null,
        action_started: true,
        action_result_type: null,
      };
    }
    case types.ACTION_REJECTED: {
      return {
        ...state,
        action_results: null,
        action_error: action.payload.data,
        action_started: false,
        action_result_type: action.payload.type,
      };
    }
    case types.ACTION_FULLFILLED: {
      return {
        ...state,
        action_results: action.payload.data,
        action_error: null,
        action_started: false,
        action_result_type: action.payload.type,
      };
    }
    case types.FETCH_STATUS_STARTED: {
      return {
        ...state,
        status: null,
        status_error: null,
        status_pending: true,
      };
    }
    case types.FETCH_STATUS_REJECTED: {
      return {
        ...state,
        status: null,
        status_error: action.payload,
        status_pending: false,
      };
    }
    case types.FETCH_STATUS_FULLFILLED: {
      return {
        ...state,
        status: action.payload,
        status_error: null,
        status_pending: false,
        is_pro: action.payload.features.includes(FEATURE_PRO),
      };
    }
    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  status: (state) => state.status,
  // Use this for checking for application version. Basic / Pro
  is_pro: (state) => state.is_pro,
  is_cloud: (state) => (state.status?.cloud ? true : false),
};

const selectors = globalizeSelectors(localSelectors, mountPath);
selectors.allow_matching = (state) =>
  Boolean(
    (state[mountPath].status?.features.includes(FEATURE_POS_MATCHING) &&
      !offline_mode &&
      state.user?.current_user?.privileges?.includes(PRIVILEGE_MATCHING)) ||
      false
  );

selectors.is_ist_pro = (state) =>
  Boolean(
    state[mountPath].status?.cloud_features?.includes(FEATURE_IST_PRO) &&
      !offline_mode
  );
export { types as actionTypes, actions as default, selectors, reducer };

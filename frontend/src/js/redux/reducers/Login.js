import { globalizeSelectors } from '../Utils';
import { hasToken } from 'js/api/WebRequest';
import { offline_mode } from '../../Constants';

/*
 * action types
 */

const types = {
  LOGOUT_SITE: 'LOGIN/LOGOUT_SITE',
  LOGOUT_SITE_FULFILLED: 'LOGIN/LOGOUT_SITE_FULFILLED',
  LOGIN_SITE: 'LOGIN/LOGIN_SITE',
  LOGIN_SITE_PENDING: 'LOGIN/LOGIN_SITE_PENDING',
  LOGIN_SITE_FULFILLED: 'LOGIN/LOGIN_SITE_FULFILLED',
  LOGIN_SITE_REJECTED: 'LOGIN/LOGIN_SITE_REJECTED',

  REFRESH_TOKEN: 'LOGIN/REFRESH_TOKEN',
  REFRESH_TOKEN_NETWORK_ERROR: 'LOGIN/REFRESH_TOKEN_NETWORK_ERROR',
  SAVE_OFFLINE_TOKEN: 'LOGIN/SAVE_OFFLINE_TOKEN',

  LOAD_OFFLINE_TOKEN: 'LOGIN/LOAD_OFFLINE_TOKEN',
};

/*
 * action creators
 */

const actions = {
  logInSite: (username, password, activationcode, autologin = false) => ({
    type: types.LOGIN_SITE,
    payload: { username, password, activationcode, autologin },
  }),
  loadOfflineToken: () => ({ type: types.LOAD_OFFLINE_TOKEN }),
  logOutSite: () => ({ type: types.LOGOUT_SITE }),
  refreshToken: () => ({ type: types.REFRESH_TOKEN }),
};

const mountPath = 'login'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  site_logged_in: offline_mode ? false : hasToken(),
  site_login_start: false,
  site_login_error: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.LOGIN_SITE_PENDING: {
      return {
        ...state,
        site_logged_in: false,
        site_login_start: true,
        site_login_error: null,
      };
    }
    case types.LOGIN_SITE_REJECTED: {
      return {
        ...state,
        site_logged_in: false,
        site_login_start: false,
        site_login_error: action.payload,
      };
    }
    case types.LOGIN_SITE_FULFILLED: {
      return {
        ...state,
        site_logged_in: true,
        site_login_start: false,
        site_login_error: null,
      };
    }

    case types.LOGOUT_SITE_FULFILLED: {
      return {
        ...state,
        site_logged_in: false,
        site_login_start: false,
        site_login_error: null,
      };
    }

    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  logged_in: (state) => state.site_logged_in,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

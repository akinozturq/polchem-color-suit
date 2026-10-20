import { globalizeSelectors } from '../Utils';
import { ERROR_CRITICAL, ERROR_WARNING } from 'js/Constants';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  SET_ERROR: 'ERRORS/SET_ERROR',
  CLEAR: 'ERRORS/CLEAR',
};

/*
 * action creators
 */

const actions = {
  showCriticalError: (msg, e, type = ERROR_CRITICAL) => ({
    type: types.SET_ERROR,
    payload: { msg, e, type },
  }),
  showError: (msg, e, title, type = ERROR_WARNING) => ({
    type: types.SET_ERROR,
    payload: { msg, e, type, title },
  }),
  clearError: () => ({ type: types.CLEAR }),
};

const mountPath = 'errors'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  msg: null,
  e: null,
  type: ERROR_CRITICAL,
  title: null, // use default
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_ERROR: {
      return { ...state, ...action.payload };
    }
    case types.CLEAR: {
      return initialState;
    }
    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  error: (state) => state,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

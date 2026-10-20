import { globalizeSelectors } from '../Utils';
import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { createSingleDataReducer, singleDataType } from '../factories/ApiCall';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  GET_STATE: 'STATE/GET_STATE',
  RE_START_AS_ADMIN: 'STATE/RE_START_AS_ADMIN',
};

/*
 * action creators
 */

const actions = {
  getState: () => ({
    type: types.GET_STATE,
  }),
  reStartAsAdmin: () => ({
    type: types.RE_START_AS_ADMIN,
  }),
};
const mountPath = 'pos_app_permissions'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const reducer = combineReducers({
  permissions: createSingleDataReducer(types.GET_STATE),
});

const propType = PropTypes.shape({
  permissions: singleDataType, // Notify user about the connection lost / recovered to online
});

// selectors

const localSelectors = {
  permissions: (state) => state.permissions,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  selectors,
  reducer,
  propType,
};

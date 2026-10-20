import { globalizeSelectors } from '../Utils';
import {
  createArrayDataReducer,
  createSingleDataReducer,
  singleDataType,
} from '../factories/ApiCall';
import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  GENERATE_MINI_GDATA: 'MACHINE/GENERATE_MINI_GDATA',
  LIST_MINI_GDATA: 'MACHINE/LIST_MINI_GDATA',
};

/*
 * action creators
 */

const actions = {
  generateMiniGdata: () => ({
    type: types.GENERATE_MINI_GDATA,
  }),
  listGdata: () => ({
    type: types.LIST_MINI_GDATA,
  }),
};

const mountPath = 'minigdata'; // mount point in global state, must match root reducer

/*
 * state shape
 */
const propType = PropTypes.shape({
  generateminigdata: singleDataType,
  listminigdata: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  generateminigdata: createSingleDataReducer(types.GENERATE_MINI_GDATA),
  listminigdata: createArrayDataReducer(types.LIST_MINI_GDATA),
});

/*
 * selectors
 */
const localSelectors = {
  generateminigdata: (state) => state.generateminigdata,
  listminigdata: (state) => state.listminigdata,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

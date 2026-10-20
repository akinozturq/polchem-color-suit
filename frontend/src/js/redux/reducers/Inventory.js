import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import {
  arrayDataType,
  createArrayDataReducer,
  createSingleDataReducer,
  singleDataType,
} from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  FETCH: 'INVENTORY/FETCH',
  UPDATE: 'INVENTORY/UPDATE',
  REPORT: 'INVENTORY/REPORT',
};

const mountPath = 'inventory'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  fetchInventory: () => ({ type: types.FETCH, payload: {} }),
  updateInventory: (data) => ({ type: types.UPDATE, payload: data }),
  reportConsumption: (data) => ({ type: types.REPORT, payload: data }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  colorants: arrayDataType,
  update: singleDataType,
  report: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  colorants: createArrayDataReducer(types.FETCH),
  update: createSingleDataReducer(types.UPDATE),
  report: createSingleDataReducer(types.UPDATE),
});

/*
 * selectors
 */
const localSelectors = {
  colorants: (state) => state.colorants,
  update: (state) => state.update,
  report: (state) => state.report,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

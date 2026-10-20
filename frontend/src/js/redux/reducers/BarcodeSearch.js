import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import { createArrayDataReducer, arrayDataType } from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  SEARCH_BARCODES: 'BARCODEACTIONS/SEARCH_BARCODES',
};

const mountPath = 'barcodesearch'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  searchBarcodes: (search) => ({
    type: types.SEARCH_BARCODES,
    payload: { search },
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  barcodes: arrayDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  barcodes: createArrayDataReducer(types.SEARCH_BARCODES),
});

/*
 * selectors
 */
const localSelectors = {
  barcodes: (state) => state.barcodes,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

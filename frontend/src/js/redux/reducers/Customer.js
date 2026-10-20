import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import {
  createSingleDataReducer,
  singleDataType,
  clearResults,
  setData,
} from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  SEARCH_CUSTOMERS: 'CUSTOMER/SEARCH_CUSTOMERS',
  LOAD_CUSTOMER: 'CUSTOMER/LOAD_CUSTOMER',
  SAVE_CUSTOMER: 'CUSTOMER/SAVE_CUSTOMER',
};

const mountPath = 'customer'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  searchCustomers: (search, page, only_local_customers = undefined) => ({
    type: types.SEARCH_CUSTOMERS,
    payload: { search, page, only_local_customers },
  }),
  clearSearchCustomers: () => ({ type: clearResults(types.SEARCH_CUSTOMERS) }),
  loadCustomer: (customerid) => ({
    type: types.LOAD_CUSTOMER,
    payload: { customerid },
  }),
  selectCustomer: (customer) => ({
    type: setData(types.LOAD_CUSTOMER),
    payload: customer,
  }),
  saveCustomer: (customer) => ({
    type: types.SAVE_CUSTOMER,
    payload: customer,
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  search_results: singleDataType,
  selected_customer: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  search_results: createSingleDataReducer(types.SEARCH_CUSTOMERS, false),
  selected_customer: createSingleDataReducer(types.LOAD_CUSTOMER),
});

/*
 * selectors
 */
const localSelectors = {
  search_results: (state) => state.search_results,
  selected_customer: (state) => state.selected_customer.data,
  selected_customer_pending: (state) => state.selected_customer.pending,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

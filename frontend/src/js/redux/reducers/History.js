import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import {
  createIncrementalDataReducer,
  incrementalDataType,
  clearResults,
} from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  SEARCH_ORDERITEMS: 'HISTORY/SEARCH_ORDERITEMS',
  SEARCH_CUSTOMER_ORDERITEMS: 'HISTORY/SEARCH_CUSTOMER_ORDERITEMS',
  LAST_ORDERITEM: 'HISTORY/LAST_ORDERITEM',
  MOVE_ORDERS_TO_CUSTOMER: 'HISTORY/MOVE_ORDERS_TO_CUSTOMER',
  MOVE_ORDERS_TO_CUSTOMER_PENDING: 'HISTORY/MOVE_ORDERS_TO_CUSTOMER_PENDING',
};

const mountPath = 'history'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  searchOrderitems: (
    search,
    start_date,
    end_date,
    custom_only,
    local_only,
    seek,
    include_hidden
  ) => ({
    type: types.SEARCH_ORDERITEMS,
    payload: {
      search,
      start_date,
      end_date,
      custom_only,
      local_only,
      seek,
      include_hidden,
    },
  }),

  searchCustomerOrderitems: (
    search,
    start_date,
    end_date,
    custom_only,
    local_only,
    customerid,
    seek
  ) => ({
    type: types.SEARCH_CUSTOMER_ORDERITEMS,
    payload: {
      search,
      customerid,
      start_date,
      end_date,
      custom_only,
      local_only,
      seek,
    },
  }),
  clearCustomerOrderitems: () => ({
    type: clearResults(types.SEARCH_CUSTOMER_ORDERITEMS),
  }),

  loadLastOrder: () => ({ type: types.LAST_ORDERITEM, payload: {} }),
  moveOrdersToCustomer: (orderids, from_customerid, to_customerid) => ({
    type: types.MOVE_ORDERS_TO_CUSTOMER,
    payload: { orderids, from_customerid, to_customerid },
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  orderitems: incrementalDataType,
  customer_orderitems: incrementalDataType,
  lastorder: incrementalDataType,
});

const initialState = { move_pending: false };

/*
 * reducer
 */
const reducer = combineReducers({
  orderitems: createIncrementalDataReducer(types.SEARCH_ORDERITEMS),
  customer_orderitems: createIncrementalDataReducer(
    types.SEARCH_CUSTOMER_ORDERITEMS
  ),
  lastorder: createIncrementalDataReducer(types.LAST_ORDERITEM),
  move_pending: (state = initialState.move_pending, action) =>
    action.type === types.MOVE_ORDERS_TO_CUSTOMER_PENDING
      ? action.payload
      : state,
});

/*
 * selectors
 */
const localSelectors = {
  orderitems: (state) => state.orderitems,
  customer_orderitems: (state) => state.customer_orderitems,
  lastorder: (state) => state.lastorder,
  move_pending: (state) => state.move_pending,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

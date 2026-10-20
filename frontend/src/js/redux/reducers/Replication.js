import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import { singleDataType, createSingleDataReducer } from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  REPLICATION_FETCH_DETAILS: 'REPLICATION/FETCH_DETAILS',
  REPLICATION_RUNACTION: 'REPLICATION/RUNACTION',
  REPLICATION_TOGGLE_MODAL: 'REPLICATION/REPLICATION_TOGGLE_MODAL',
  REPLICATION_START_STATUS_CHECKING:
    'REPLICATION/REPLICATION_START_STATUS_CHECKING',
  REPLICATION_SET_FULL_SYNC_SCHEDULE:
    'REPLICATION/REPLICATION_SET_FULL_SYNC_SCHEDULE',
  REPLICATION_RESEND_ORDERS: 'REPLICATION/RESEND_ORDERS',
};

const mountPath = 'replication'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  fetchReplicationDetails: () => ({
    type: types.REPLICATION_FETCH_DETAILS,
  }),
  runReplicationAction: (action) => ({
    type: types.REPLICATION_RUNACTION,
    payload: action,
  }),
  resendOrders: () => ({
    type: types.REPLICATION_RESEND_ORDERS,
  }),
  startStatusChecking: () => ({
    type: types.REPLICATION_START_STATUS_CHECKING,
  }),
  toggleModal: () => ({
    type: types.REPLICATION_TOGGLE_MODAL,
  }),
  setFullSyncSchedule: (state, executiontime) => ({
    type: types.REPLICATION_SET_FULL_SYNC_SCHEDULE,
    payload: { state, executiontime },
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  details: singleDataType,
  action_results: singleDataType,
  schedule_set: singleDataType,
  resend_orders: singleDataType,
});

/*
 * reducer
 */

const initialState = {
  open: false,
};

function modalReducer(state = initialState, action) {
  switch (action.type) {
    case types.REPLICATION_TOGGLE_MODAL: {
      return { ...state, open: !state.open };
    }
    default: {
      return state;
    }
  }
}

const reducer = combineReducers({
  details: createSingleDataReducer(types.REPLICATION_FETCH_DETAILS, false),
  action_results: createSingleDataReducer(types.REPLICATION_RUNACTION),
  schedule_set: createSingleDataReducer(
    types.REPLICATION_SET_FULL_SYNC_SCHEDULE
  ),
  resend_orders: createSingleDataReducer(types.REPLICATION_RESEND_ORDERS),
  modal: modalReducer,
});

/*
 * selectors
 */
const localSelectors = {
  details: (state) => state.details,
  action_results: (state) => state.action_results,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

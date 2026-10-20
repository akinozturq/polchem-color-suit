import PropTypes from 'prop-types';
import { globalizeSelectors } from '../Utils';
import { fulfilled } from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  FETCH_LOCAL_QUEUE: 'ORDER_QUEUE/FETCH_LOCAL_QUEUE',
  FETCH_POOL_QUEUE: 'ORDER_QUEUE/FETCH_POOL_QUEUE',
  CHANGE_PENDING: 'ORDER_QUEUE/CHANGE_PENDING',
  SET_ORDER_QUEUE: 'ORDER_QUEUE/SET_ORDER_QUEUE',
  MOVE_ORDERS_TO_POOL: 'ORDER_QUEUE/MOVE_ORDERS_TO_POOL',
  MOVE_ORDERS_TO_LOCAL: 'ORDER_QUEUE/MOVE_ORDERS_TO_LOCAL',
  CLOSE_ITEMS: 'ORDER_QUEUE/CLOSE_ITEMS',
  CLOSE_ORDERS: 'ORDER_QUEUE/CLOSE_ORDERS',
};

const mountPath = 'order_queue'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  fetchLocalQueue: () => ({ type: types.FETCH_LOCAL_QUEUE, payload: {} }),
  fetchPoolQueue: () => ({ type: types.FETCH_POOL_QUEUE, payload: {} }),
  localChangePending: (value = true) => ({
    type: types.CHANGE_PENDING,
    payload: value,
  }),
  setOrderQueue: (siteid, orders, requestid) => ({
    type: types.SET_ORDER_QUEUE,
    payload: { siteid, orders, requestid },
  }),
  moveOrdersToPool: (orders) => ({
    type: types.MOVE_ORDERS_TO_POOL,
    payload: { orders },
  }),
  moveOrdersToLocal: (orders) => ({
    type: types.MOVE_ORDERS_TO_LOCAL,
    payload: { orders },
  }),
  closeItems: (itemids) => ({ type: types.CLOSE_ITEMS, payload: itemids }),
  closeOrders: (orderids) => ({ type: types.CLOSE_ORDERS, payload: orderids }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  local_queue: PropTypes.array.isRequired,
  pool_queue: PropTypes.array.isRequired,
  change_pending: PropTypes.bool.isRequired,
  initialized: PropTypes.bool.isRequired,
});

const initial_state = {
  local_queue: [],
  pool_queue: [],
  change_pending: false,
  initialized: false,
};

/*
 * reducer
 */
function reducer(state = initial_state, action) {
  switch (action.type) {
    case types.CHANGE_PENDING:
      return { ...state, change_pending: action.payload };
    case fulfilled(types.FETCH_LOCAL_QUEUE): {
      return { ...state, local_queue: action.payload, initialized: true };
    }
    case fulfilled(types.FETCH_POOL_QUEUE): {
      return { ...state, pool_queue: action.payload };
    }

    default:
      return state;
  }
}

/*
 * selectors
 */
const localSelectors = {
  local_queue: (state) => state.local_queue,
  pool_queue: (state) => state.pool_queue,
  queue_change_pending: (state) => state.change_pending || !state.initialized,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

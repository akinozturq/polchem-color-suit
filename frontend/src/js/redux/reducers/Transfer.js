import { globalizeSelectors } from '../Utils';
/**
 * To handle recieving and sendind order to external sources
 * for example flink reading
 */

/*
 * action types
 */

const types = {
  ADD_ORDER: 'TRANSFER/ADD_ORDER',
  ADD_ORDER_FULLFILLED: 'TRANSFER/ADD_ORDER_FULLFILLED',
  ADD_ORDER_REJECTED: 'TRANSFER/ADD_ORDER_REJECTED',
  ADD_ORDER_PENDING: 'TRANSFER/ADD_ORDER_PENDING',
};

/*
 * action creators
 */

const actions = {
  addOrder: (order) => ({ type: types.ADD_ORDER, payload: order }),
};

const mountPath = 'transfer'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  add_order_pending: false,
  add_order_error: null,
  add_order: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.ADD_ORDER_FULLFILLED: {
      return {
        ...state,
        add_order: action.payload,
        add_order_pending: false,
        add_order_error: null,
      };
    }
    case types.ADD_ORDER_REJECTED: {
      return {
        ...state,
        add_order: null,
        add_order_pending: false,
        add_order_error: action.payload,
      };
    }
    case types.ADD_ORDER_PENDING: {
      return {
        ...state,
        add_order: null,
        add_order_pending: true,
        add_order_error: null,
      };
    }
    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  busy: (state) => state.busy,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

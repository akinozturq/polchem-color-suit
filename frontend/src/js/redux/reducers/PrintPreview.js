import PropTypes from 'prop-types';
import { globalizeSelectors } from '../Utils';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  SET_VISIBLE: 'PRINT_PREVIEW/SET_VISIBLE',
  SET_ORDER: 'PRINT_PREVIEW/SET_ORDER',
  SET_LAYOUT: 'PRINT_PREVIEW/SET_LAYOUT',
  SET_PRINTER: 'PRINT_PREVIEW/SET_PRINTER',
  SET_NUMBER_OF_COPIES: 'PRINT_PREVIEW/SET_NUMBER_OF_COPIES',
};

/*
 * action creators
 */

const actions = {
  setVisible: (visible) => ({ type: types.SET_VISIBLE, payload: visible }),
  setOrder: (order, canNumber = 1) => ({
    type: types.SET_ORDER,
    payload: { order, canNumber },
  }),
  setLayout: (layout) => ({ type: types.SET_LAYOUT, payload: layout }),
  setPrinter: (printer) => ({ type: types.SET_PRINTER, payload: printer }),
  setCopies: (copies) => ({
    type: types.SET_NUMBER_OF_COPIES,
    payload: copies,
  }),
};

const mountPath = 'print_preview'; // mount point in global state, must match root reducer

const propType = PropTypes.shape({
  visible: PropTypes.bool,
  order: PropTypes.shape(),
  canNumber: PropTypes.number,
  layout: PropTypes.shape(),
  copies: PropTypes.any,
  printer: PropTypes.any,
});

const initialState = {
  visible: false,
  order: {},
  canNumber: 1,
  layout: null,
  printer: null,
  copies: 1,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_VISIBLE: {
      return { ...state, visible: action.payload };
    }
    case types.SET_ORDER: {
      const { order, canNumber } = action.payload;
      return { ...state, order, canNumber };
    }
    case types.SET_LAYOUT: {
      return { ...state, layout: action.payload };
    }
    case types.SET_PRINTER: {
      return { ...state, printer: action.payload };
    }
    case types.SET_NUMBER_OF_COPIES: {
      return { ...state, copies: action.payload };
    }
    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  visible: (state) => state.visible,
  order: (state) => state.order,
  layout: (state) => state.layout,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  selectors,
  reducer,
  propType,
};

import PropTypes from 'prop-types';
import { isForbidden } from 'js/api/WebRequest';

export function fulfilled(actionType) {
  return actionType + '_FULFILLED';
}

export function pending(actionType) {
  return actionType + '_PENDING';
}

export function rejected(actionType) {
  return actionType + '_REJECTED';
}

export function clearResults(actionType) {
  return actionType + '_CLEAR';
}

export function setData(actionType) {
  return actionType + '_SET_DATA';
}

function createReducer(actionType, emptyData, clear = true) {
  const initial_state = {
    data: emptyData,
    pending: false,
    forbidden: false,
    error: null,
    params: undefined,
  };
  const FULFILLED = fulfilled(actionType);
  const REJECTED = rejected(actionType);
  const CLEAR = clearResults(actionType);
  const SET_DATA = setData(actionType);

  function reducer(state = initial_state, action) {
    switch (action.type) {
      case actionType: {
        const s = clear ? initial_state : state;
        return { ...s, pending: true, params: action.payload };
      }
      case FULFILLED: {
        return { ...initial_state, params: state.params, data: action.payload };
      }
      case REJECTED: {
        return {
          ...initial_state,
          params: state.params,
          error: action.payload,
          forbidden: isForbidden(action.payload),
        };
      }
      case CLEAR: {
        return { ...initial_state };
      }
      case SET_DATA: {
        return { ...initial_state, data: action.payload };
      }
      default:
        return state;
    }
  }

  return reducer;
}

export function createSingleDataReducer(
  actionType,
  clear = true,
  initalState = null
) {
  return createReducer(actionType, initalState, clear);
}

export function createArrayDataReducer(actionType, clear = true) {
  return createReducer(actionType, [], clear);
}

export function createIncrementalDataReducer(actionType) {
  const initial_state = {
    data: [],
    next_seek: null,
    at_start: true,
    at_end: true,
    pending: false,
    forbidden: false,
    error: null,
    params: undefined,
  };
  const FULFILLED = fulfilled(actionType);
  const REJECTED = rejected(actionType);
  const CLEAR = clearResults(actionType);

  function reducer(state = initial_state, action) {
    switch (action.type) {
      case actionType: {
        if (!action.payload.seek) {
          return { ...initial_state, params: action.payload, pending: true };
        } else {
          return { ...state, at_start: false, pending: true };
        }
      }
      case FULFILLED: {
        if (Boolean(state.at_start) !== Boolean(action.payload.at_start)) {
          // ignore unexpected data (initial vs. incremental request)
          return state;
        }
        return {
          ...initial_state,
          ...action.payload,
          params: state.params,
          data: state.at_start
            ? action.payload.data
            : [...state.data, ...action.payload.data],
        };
      }
      case REJECTED: {
        return {
          ...initial_state,
          params: state.params,
          error: action.payload,
          forbidden: isForbidden(action.payload),
        };
      }
      case CLEAR: {
        return { ...initial_state };
      }
      default:
        return state;
    }
  }

  return reducer;
}

export const singleDataType = PropTypes.shape({
  data: PropTypes.object,
  pending: PropTypes.bool,
  error: PropTypes.string,
});

export const arrayDataType = PropTypes.shape({
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  pending: PropTypes.bool,
  error: PropTypes.string,
});

export const incrementalDataType = PropTypes.shape({
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  next_seek: PropTypes.object,
  at_start: PropTypes.bool,
  at_end: PropTypes.bool,
  pending: PropTypes.bool,
  error: PropTypes.string,
});

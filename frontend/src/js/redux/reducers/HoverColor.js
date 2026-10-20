import { globalizeSelectors } from '../Utils';

const types = {
  SET_HOVER_COLOR: 'SET_HOVER_COLOR',
  SET_SELECTED_NAME: 'SET_SELECTED_NAME',
};

const actions = {
  setHoverColor: (color) => ({ type: types.SET_HOVER_COLOR, payload: color }),
  setSelectedName: (name) => ({ type: types.SET_SELECTED_NAME, payload: name }),
};

const initial_state = {
  color: null,
  name: null,
};

/**
 * This needs to be separate store for performance reasons as mouse over changes data a lot
 * multiple repaints are avoided when this is connected to minimal amount of components!
 * reducer which updates the order state in data store
 * @param {*} state
 * @param {*} action
 */
function reducer(state = initial_state, action) {
  switch (action.type) {
    case types.SET_HOVER_COLOR: {
      return { ...state, color: action.payload };
    }
    case types.SET_SELECTED_NAME: {
      return { ...state, name: action.payload };
    }
    default: {
      return state;
    }
  }
}

const mountPath = 'hover_color';

const localSelectors = {
  name: (state) => state.name,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, reducer, selectors };

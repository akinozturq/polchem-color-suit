import { globalizeSelectors } from '../Utils';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  SET_BUSY: 'BUSY/SET_BUSY',
};

/*
 * action creators
 */

const actions = {
  setBusy: (busy) => ({ type: types.SET_BUSY, payload: busy }),
};

const mountPath = 'busy'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  busy: false,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_BUSY: {
      return { ...state, busy: action.payload };
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

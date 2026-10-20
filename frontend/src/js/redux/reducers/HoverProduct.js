const types = {
  SET_HOVER_PRODUCT: 'SET_HOVER_PRODUCT',
};

const actions = {
  setHoverProduct: (product) => ({
    type: types.SET_HOVER_PRODUCT,
    payload: { product },
  }),
};

const initial_state = {
  product: null,
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
    case types.SET_HOVER_PRODUCT: {
      return {
        ...state,
        product: action.payload.product,
      };
    }

    default: {
      return state;
    }
  }
}

export { types as actionTypes, actions as default, reducer };

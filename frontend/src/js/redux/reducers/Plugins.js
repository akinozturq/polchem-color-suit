const types = {
  AX_SEND_FORMULA: 'PLUGINS/AX_SEND_FORMULA',
};

// const mountPath = 'plugins';

/*
 * action creators
 */

const actions = {
  axSendFormula: (params) => ({
    type: types.AX_SEND_FORMULA,
    payload: params,
  }),
};

export {
  types as actionTypes,
  actions as default,
  // propType,
  // selectors,
  // reducer,
};

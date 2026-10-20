import _ from 'lodash';

export function globalizeSelectors(selectors, mountPath) {
  const result = {};
  // eslint-disable-next-line no-unused-vars
  for (const funcName in selectors) {
    const func = selectors[funcName];
    result[funcName] = (state, ...args) =>
      func(_.get(state, mountPath), ...args);
  }
  return result;
}

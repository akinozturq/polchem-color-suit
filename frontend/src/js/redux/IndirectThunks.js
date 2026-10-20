/** This module exists to avoid cyclic import between, for example, ./reducers/Order and ./thunks/Order
 *
 * Thunks are imported and registered here by ./Store
 */

const registry = {};

export function registerCreators(thunks) {
  for (const [actionType, thunk] of thunks) {
    registry[actionType] = thunk;
  }
}

export function createThunk(action) {
  const thunk = registry[action.type];
  if (thunk) {
    return thunk(action);
  }
  return {}; //TODO: what to return?
}

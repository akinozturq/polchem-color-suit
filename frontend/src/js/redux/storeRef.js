/** To avoid cyclic dependencies, import getState and dispatch from here instead of Store.js */

let _store = null;

export function setStore(store) {
  _store = store;
}

export function getState() {
  if (!_store) {
    throw new Error(
      'Redux store not set. Call setStore(store) during app bootstrap.'
    );
  }
  return _store.getState();
}

export function dispatch(action) {
  if (!_store) {
    throw new Error(
      'Redux store not set. Call setStore(store) during app bootstrap.'
    );
  }
  return _store.dispatch(action);
}

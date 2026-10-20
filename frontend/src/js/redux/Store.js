import { createStore, applyMiddleware, compose } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';

import createRootReducer from './reducers';
import rootSaga from './sagas';
import allThunks from './thunks';
import { registerCreators } from './IndirectThunks';
import { initSocket } from '../api/Socket';
import { setStore } from './storeRef';

registerCreators(allThunks);
const sagaMiddleware = createSagaMiddleware();
export const history = createHashHistory();

const middleware = [
  routerMiddleware(history), // for dispatching history actions
  // ... other middlewares ...
  thunk,
  sagaMiddleware,
  logger,
];

// Be sure to ONLY add this middleware in development!
// if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_IMMU_CHECK) {
//   console.log('Enabling Redux immutability checks');
//   //middleware.unshift(require('redux-immutable-state-invariant').default());
// }

function configureStore(preloadedState) {
  const store = createStore(
    createRootReducer(history), // root reducer with router state
    preloadedState,
    compose(applyMiddleware(...middleware))
  );

  sagaMiddleware.run(rootSaga);

  return store;
}

const store = configureStore();

// To avoid cyclic dependencies, inject the store after creation
setStore(store);
initSocket(store);

export default store;

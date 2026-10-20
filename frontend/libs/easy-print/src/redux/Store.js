import { createStore, applyMiddleware } from 'redux';
import undoMiddleware from './reducers/undoMiddleware';
import logger from 'redux-logger';
import reducer from './reducers';

const middleware = applyMiddleware(logger, undoMiddleware);

export default createStore(reducer, middleware);

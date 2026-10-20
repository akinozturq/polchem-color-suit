import { globalizeSelectors } from '../Utils';
import {
  clearResults,
  createSingleDataReducer,
  singleDataType,
} from '../factories/ApiCall';
import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  SEND_EMAIL: 'EMAIL/SEND_EMAIL',
};

/*
 * action creators
 */

const actions = {
  sendEmail: (subject, html, recievers) => ({
    type: types.SEND_EMAIL,
    payload: { subject, html, recievers },
  }),
  clear: () => ({
    type: clearResults(types.SEND_EMAIL),
  }),
};

const mountPath = 'email'; // mount point in global state, must match root reducer

/*
 * state shape
 */
const propType = PropTypes.shape({
  send_mail: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  send_mail: createSingleDataReducer(types.SEND_EMAIL),
});

/*
 * selectors
 */
const localSelectors = {
  send_mail: (state) => state.send_mail,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

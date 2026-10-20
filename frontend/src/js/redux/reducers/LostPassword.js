import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { createSingleDataReducer, singleDataType } from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  GET_USERS: 'USER/GET_USERS',
  SAVE_USERS: 'USER/SAVE_USERS',
  ADD_USER: 'USER/ADD_USER',
  REMOVE_USER: 'USER/REMOVE_USER',
  UPDATE_USER: 'USER/UPDATE_USER',
  RESET_PASSWORD: 'USER/RESET_PASSWORD',
  SEND_PSW_RESET_LINK: 'USER/SEND_PSW_RESET_LINK',
  GET_PRIVILEGES: 'USER/GET_PRIVILEGES',
};

/*
 * action creators
 */

const actions = {
  resetPassword: (code, password) => ({
    type: types.RESET_PASSWORD,
    payload: { code, password },
  }),
  sendPasswordResetLink: (username, server_url) => ({
    type: types.SEND_PSW_RESET_LINK,
    payload: { username, server_url },
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  resetPassword: singleDataType,
  sendPasswordResetLink: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  resetPassword: createSingleDataReducer(types.RESET_PASSWORD),
  sendPasswordResetLink: createSingleDataReducer(types.SEND_PSW_RESET_LINK),
});

export { types as actionTypes, actions as default, propType, reducer };

import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { createSingleDataReducer, singleDataType } from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  BACKUP_SETTINGS: 'SERVER/BACKUP_SETTINGS',
  SAVE_BACKUP_SETTINGS: 'SERVER/SAVE_BACKUP_SETTINGS',
  BACKUP_NOW: 'SERVER/BACKUP_NOW',
};

/*
 * action creators
 */

const actions = {
  loadBackupSettings: () => ({ type: types.BACKUP_SETTINGS }),
  saveBackupSettings: (settings) => ({
    type: types.SAVE_BACKUP_SETTINGS,
    payload: settings,
  }),
  backupNow: (settings) => ({
    type: types.BACKUP_NOW,
    payload: settings,
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  backup_settings: singleDataType,
  backup_settings_save: singleDataType,
  backup_now: singleDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  backup_settings: createSingleDataReducer(types.BACKUP_SETTINGS),
  backup_settings_save: createSingleDataReducer(types.SAVE_BACKUP_SETTINGS),
  backup_now: createSingleDataReducer(types.BACKUP_NOW),
});

export {
  types as actionTypes,
  actions as default,
  propType,
  //  selectors,
  reducer,
};

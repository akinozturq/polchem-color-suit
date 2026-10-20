import PropTypes from 'prop-types';
import { combineReducers } from 'redux';
import { globalizeSelectors } from '../Utils';
import {
  singleDataType,
  createSingleDataReducer,
  createArrayDataReducer,
  arrayDataType,
} from '../factories/ApiCall';

/*
 * action types
 */

const types = {
  FETCH_UNSEEN: 'MAINTENANCE/FETCH_UNSEEN',
  // Get list of maintenance actions
  MAINTENANCE_FETCH: 'MAINTENANCE/FETCH',
  // Add or edit maintenance case
  MAINTENANCE_SAVE: 'MAINTENANCE/SAVE',
  // Delete maintenance case
  MAINTENANCE_DELETE: 'MAINTENANCE/DELETE',
  // Set next service date for machine
  MAINTENANCE_SET_DATA: 'MAINTENANCE/SET_SERVICE_DATA',
  // Send log files (QT)
  MAINTENANCE_SEND_LOGS_QT: 'MAINTENANCE/SEND_LOGS_QT',
  // Browse log files (QT)
  MAINTENANCE_BROWSE_QT: 'MAINTENANCE/BROWSE_QT',
};

const mountPath = 'maintenance'; // mount point in global state, must match root reducer

/*
 * action creators
 */

const actions = {
  fetchUnseen: () => ({
    type: types.FETCH_UNSEEN,
  }),
  fetchInterventions: (machineid) => ({
    type: types.MAINTENANCE_FETCH,
    payload: { machinedbid: machineid },
  }),
  saveIntervention: (data) => ({
    type: types.MAINTENANCE_SAVE,
    payload: data,
  }),
  setServiceData: (machineid, data) => ({
    type: types.MAINTENANCE_SET_DATA,
    payload: { machinedbid: machineid, ...data },
  }),
  deleteIntervention: (maintenanceid) => ({
    type: types.MAINTENANCE_DELETE,
    payload: { maintenanceid },
  }),
  sendLogFiles: (siteid, maintenanceid) => ({
    type: types.MAINTENANCE_SEND_LOGS_QT,
    payload: { siteid, maintenanceid },
  }),
  browseLogs: (maintenanceid) => ({
    type: types.MAINTENANCE_BROWSE_QT,
    payload: { maintenanceid },
  }),
};

/*
 * state shape
 */
const propType = PropTypes.shape({
  save: singleDataType,
  delete: singleDataType,
  unseen: arrayDataType,
  set_service: singleDataType,
  send_logs: singleDataType,
  browse_logs: singleDataType,
  interventions: arrayDataType,
});

/*
 * reducer
 */
const reducer = combineReducers({
  save: createSingleDataReducer(types.MAINTENANCE_SAVE),
  unseen: createArrayDataReducer(types.FETCH_UNSEEN),
  delete: createSingleDataReducer(types.MAINTENANCE_DELETE),
  set_service: createSingleDataReducer(types.MAINTENANCE_SET_DATA),
  interventions: createArrayDataReducer(types.MAINTENANCE_FETCH),
  send_logs: createSingleDataReducer(types.MAINTENANCE_SEND_LOGS_QT),
  browse_logs: createSingleDataReducer(types.MAINTENANCE_BROWSE_QT),
});

/*
 * selectors
 */
const localSelectors = {
  set_service: (state) => state.set_service,
  save: (state) => state.save,
  interventions: (state) => state.interventions,
  unseen: (state) => state.unseen,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

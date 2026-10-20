import _ from 'lodash';
import PropTypes from 'prop-types';
import { globalizeSelectors } from '../Utils';
import { MACHINE_MSG_ID_OPEN_REFILL_PANEL } from '../../Constants';
import { fulfilled, rejected } from '../factories/ApiCall';

const types = {
  FETCH_DRIVER_CONFIG: 'MACHINE/FETCH_DRIVER_CONFIG',
  SET_DRIVER_CONFIG: 'MACHINE/SET_DRIVER_CONFIG',
  CMD_SET_DRIVER_CONFIG: 'MACHINE/CMD_SET_DRIVER_CONFIG',
  FETCH_MACHINES_LIST: 'MACHINE/FETCH_MACHINES_LIST',
  SET_MACHINE_MISSING: 'MACHINE/SET_MACHINE_MISSING',
  SET_DISPIDS: 'MACHINE/SET_DISPIDS',
  MACHINE_CONFIG_VISIBLE: 'MACHINE/MACHINE_CONFIG_VISIBLE',
  SET_CURRENT_MACHINE: 'MACHINE/SET_CURRENT_MACHINE',
  SET_MACHINE_INFO: 'MACHINE/SET_MACHINE_INFO',
  SET_DBMACHINE_INFO: 'MACHINE/SET_DBMACHINE_INFO',
  FETCH_MACHINE_COLORANTS: 'MACHINE/FETCH_MACHINE_COLORANTS',
  SET_MACHINE_COLORANTS: 'MACHINE/SET_MACHINE_COLORANTS',
  CMD_SET_MACHINE_CONFIG: 'MACHINE/CMD_SET_MACHINE_CONFIG',
  CMD_SET_MACHINE_COLORANTS: 'MACHINE/CMD_SET_MACHINE_COLORANTS',
  CMD_PURGE: 'MACHINE/CMD_PURGE',
  CMD_PURGE_ALL: 'MACHINE/CMD_PURGE_ALL',
  CMD_PURGE_AUTOMATIC: 'MACHINE/CMD_PURGE_AUTOMATIC',
  CMD_PURGE_AUTOMATIC_PREPARE: 'MACHINE/CMD_PURGE_AUTOMATIC_PREPARE',
  CMD_STIR: 'MACHINE/CMD_STIR',
  CMD_STIR_ALL: 'MACHINE/CMD_STIR_ALL',
  CMD_CLEAR_DISPENSER_WARNING: 'MACHINE/CMD_CLEAR_DISPENSER_WARNING',
  CMD_CLEAR_HOPPER_WARNING: 'MACHINE/CMD_CLEAR_HOPPER_WARNING',
  CMD_MOVE_TO_FILL: 'MACHINE/CMD_MOVE_TO_FILL',
  CMD_MOVE_TO_HOME: 'MACHINE/CMD_MOVE_TO_HOME',
  FETCH_MACHINE_STATE: 'MACHINE/FETCH_MACHINE_STATE',
  FETCH_MACHINE_CONFIG: 'MACHINE/FETCH_MACHINE_CONFIG',
  FETCH_MACHINE_ERROR: 'MACHINE/FETCH_MACHINE_ERROR',
  CLEAR_MACHINE_ERROR: 'MACHINE/CLEAR_MACHINE_ERROR',
  SET_MACHINE_STATE: 'MACHINE/SET_MACHINE_STATE',
  SET_MACHINE_STATE_REDUX: 'MACHINE/SET_MACHINE_STATE_REDUX',
  FETCH_MACHINE_REFILLS_LIST: 'MACHINE/FETCH_MACHINE_REFILLS_LIST',
  SET_MACHINE_BATCH_REFILLS_LIST: 'MACHINE/SET_MACHINE_BATCH_REFILLS_LIST',
  FETCH_MACHINE_BATCH_REFILLS_LIST: 'MACHINE/FETCH_MACHINE_BATCH_REFILLS_LIST',
  SET_MACHINE_REFILLS_LIST: 'MACHINE/SET_MACHINE_REFILLS_LIST',
  SET_MACHINE_REFILLS_LIST_SAGA: 'MACHINE/SET_MACHINE_REFILLS_LIST_SAGA',
  SET_MACHINE_REFILLS_BATCH_LIST_SAGA:
    'MACHINE/SET_MACHINE_REFILLS_BATCH_LIST_SAGA',
  SET_MACHINE_CONFIG: 'MACHINE/SET_MACHINE_CONFIG',
  SET_MACHINE_ERROR: 'MACHINE/SET_MACHINE_ERROR',

  CMD_MACHINE_ACTION: 'MACHINE/CMD_MACHINE_ACTION',
  CMD_CHECK_FORMULA: 'MACHINE/CMD_CHECK_FORMULA',
  CMD_TINT: 'MACHINE/CMD_TINT',

  RESUME_INTERRUPTED_TINT: 'MACHINE/RESUME_INTERRUPTED_TINT',

  CMD_RESET: 'MACHINE/CMD_RESET',
  CMD_RESET_HARD: 'MACHINE/CMD_RESET_HARD',
  CMD_INITIALIZE: 'MACHINE/CMD_INITIALIZE',

  CMD_CAP: 'MACHINE/CMD_CAP',

  CMD_CLEAN: 'MACHINE/CMD_CLEAN',
  CMD_CLEAN_ALL: 'MACHINE/CMD_CLEAN_ALL',

  TINT_WEIGHED: 'MACHINE/TINT_WEIGHED',
  TINT_ERROR_STATUS: 'MACHINE/TINT_ERROR_STATUS',

  SET_DROP_COLORS: 'MACHINE/SET_DROP_COLORS',
  SET_MACHINE_IN_PURGE: 'MACHINE/SET_MACHINE_IN_PURGE',

  SET_MACHINE_BARCODE_REFILL_ACTION:
    'MACHINE/SET_MACHINE_BARCODE_REFILL_ACTION',
  SET_MACHINE_BARCODE_CANISTER_ACTION:
    'MACHINE/SET_MACHINE_BARCODE_CANISTER_ACTION',
  SET_MACHINE_SELECTED_CNT_CODE: 'MACHINE/SET_MACHINE_SELECTED_CNT_CODE',
  CLEAR_BARCODE_ACTIONS: 'MACHINE/CLEAR_BARCODE_ACTIONS',

  CHECK_WARNING_BATCH: 'MACHINE/CHECK_WARNING_BATCH',
  SET_WARNING_BATCH: 'MACHINE/SET_WARNING_BATCH,',

  SET_MACHINE_SLIDE_OVER_VISIBLE: 'MACHINE/SET_MACHINE_SLIDE_OVER_VISIBLE,',

  SET_REFILL_TARGET_CANISTER: 'MACHINE/SET_REFILL_TARGET_CANISTER,',

  CMD_BACKUP: 'MACHINE/CMD_BACKUP',

  FETCH_MACHINE_CONFIG_BACKUP: 'MACHINE/FETCH_MACHINE_CONFIG_BACKUP',
  DELETE_MACHINE_CONFIG_BACKUP: 'MACHINE/DELETE_MACHINE_CONFIG_BACKUP',
};

const actions = {
  fetchClientData: (clientid) => ({
    type: types.FETCH_MACHINE_CONFIG_BACKUP,
    payload: { clientid },
  }),
  deleteClientData: (dataid) => ({
    type: types.DELETE_MACHINE_CONFIG_BACKUP,
    payload: { dataid },
  }),
  backup: (dispID, notes) => ({
    type: types.CMD_BACKUP,
    payload: { dispID, notes },
  }),
  fetchMachinesList: () => ({ type: types.FETCH_MACHINES_LIST, payload: null }),
  setMachineMissing: (value) => ({
    type: types.SET_MACHINE_MISSING,
    payload: value,
  }),
  setRefillTargetCanister: (canister) => ({
    type: types.SET_REFILL_TARGET_CANISTER,
    payload: canister,
  }),
  toggleMachineConfigVisible: (dispID) => ({
    type: types.MACHINE_CONFIG_VISIBLE,
    payload: { dispID },
  }),
  setMachineSlideOverVisible: (dispID, visible) => ({
    type: types.SET_MACHINE_SLIDE_OVER_VISIBLE,
    payload: { dispID, visible },
  }),

  setMachineBarcodeRefillAction: (cntid, canisterid) => ({
    type: types.SET_MACHINE_BARCODE_REFILL_ACTION,
    payload: {
      cntid: cntid,
      cansizeid: null,
      barcode: null,
      canisterid,
    },
  }),
  checkWarningBatch: () => ({ type: types.CHECK_WARNING_BATCH }),
  setWarningBatch: (batches) => ({
    type: types.SET_WARNING_BATCH,
    payload: batches,
  }),
  fetchDriverConfig: () => ({
    type: types.FETCH_DRIVER_CONFIG,
    payload: null,
  }),
  setDriverConfig: (config) => ({
    type: types.CMD_SET_DRIVER_CONFIG,
    payload: { config },
  }),
  setMachineSelectedCntCode: (dispID, code) => ({
    type: types.SET_MACHINE_SELECTED_CNT_CODE,
    payload: { dispID, code },
  }),
  setCurrentMachine: (dispID) => ({
    type: types.SET_CURRENT_MACHINE,
    payload: { dispID },
  }),

  fetchMachineState: (dispID) => ({
    type: types.FETCH_MACHINE_STATE,
    payload: { dispID },
  }),
  setMachineState: (machinestate) => ({
    type: types.SET_MACHINE_STATE,
    payload: JSON.parse(machinestate),
  }),
  fetchMachineBatchRefillsList: (dispID, canisterIndex, currLevel) => ({
    type: types.FETCH_MACHINE_BATCH_REFILLS_LIST,
    payload: { dispID, canisterIndex, currLevel },
  }),
  setMachineBatchRefillsList: (data) => ({
    type: types.SET_MACHINE_BATCH_REFILLS_LIST,
    payload: JSON.parse(data),
  }),
  fetchMachineRefillsList: (dispID, canisterIndex) => ({
    type: types.FETCH_MACHINE_REFILLS_LIST,
    payload: { dispID, canisterIndex },
  }),
  setMachineRefillsList: (refilllist) => ({
    type: types.SET_MACHINE_REFILLS_LIST,
    payload: JSON.parse(refilllist),
  }),
  setMachineRefillsListSaga: (data) => ({
    type: types.SET_MACHINE_REFILLS_LIST_SAGA,
    payload: data,
  }),
  setMachineRefillsBatchListSaga: (data) => ({
    type: types.SET_MACHINE_REFILLS_BATCH_LIST_SAGA,
    payload: data,
  }),
  fetchMachineError: (dispID) => ({
    type: types.FETCH_MACHINE_ERROR,
    payload: { dispID },
  }),
  clearMachineError: (dispID) => ({
    type: types.CLEAR_MACHINE_ERROR,
    payload: { dispID },
  }),
  clearHopperWarning: (dispID) => ({
    type: types.CMD_CLEAR_HOPPER_WARNING,
    payload: { dispID },
  }),
  clearDispenserWarning: (dispID) => ({
    type: types.CMD_CLEAR_DISPENSER_WARNING,
    payload: { dispID },
  }),

  fetchMachineConfig: (dispID) => ({
    type: types.FETCH_MACHINE_CONFIG,
    payload: { dispID },
  }),
  setMachineConfig: (dispID, config) => ({
    type: types.CMD_SET_MACHINE_CONFIG,
    payload: { dispID, config: config },
  }),

  fetchMachineColorants: (dispID) => ({
    type: types.FETCH_MACHINE_COLORANTS,
    payload: { dispID },
  }),
  setMachineColorants: (cnts) => ({
    type: types.SET_MACHINE_COLORANTS,
    payload: JSON.parse(cnts),
  }),
  setMachineColorantsQT: (dispID, cnts) => ({
    type: types.CMD_SET_MACHINE_COLORANTS,
    payload: { dispID, cnts: cnts },
  }),

  // Machine actions
  purge: (dispID, frm, sequential) => ({
    type: types.CMD_PURGE,
    payload: { dispID, frm, sequential },
  }),
  purgeAll: (dispID, amount, sequential) => ({
    type: types.CMD_PURGE_ALL,
    payload: { dispID, amount, sequential },
  }),
  purgeAutomatic: (dispID) => ({
    type: types.CMD_PURGE_AUTOMATIC,
    payload: { dispID },
  }),
  purgeAutomaticPrepare: (dispID) => ({
    type: types.CMD_PURGE_AUTOMATIC_PREPARE,
    payload: { dispID },
  }),
  stir: (dispID, canid, time) => ({
    type: types.CMD_STIR,
    payload: { dispID, canid: canid, time },
  }),
  stirAll: (dispID, time) => ({
    type: types.CMD_STIR_ALL,
    payload: { dispID, time },
  }),
  clean: (dispID, circuitid) => ({
    type: types.CMD_CLEAN,
    payload: { dispID, circuitid: circuitid },
  }),
  cleanAll: (dispID) => ({
    type: types.CMD_CLEAN_ALL,
    payload: { dispID },
  }),
  moveToFill: (dispID, canid) => ({
    type: types.CMD_MOVE_TO_FILL,
    payload: { dispID, canid },
  }),
  moveToHome: (dispID) => ({
    type: types.CMD_MOVE_TO_HOME,
    payload: { dispID },
  }),
  machineAction: (dispID, machine_action) => ({
    type: types.CMD_MACHINE_ACTION,
    payload: { dispID, machine_action: machine_action },
  }),

  checkFormula: (dispID, frm) => ({
    type: types.CMD_CHECK_FORMULA,
    payload: { dispID, frm: frm },
  }),
  tintOrder: (
    dispID,
    order,
    skip_tdf_base = false,
    barcodeValidation = false
  ) => ({
    type: types.CMD_TINT,
    payload: { dispID, order, skip_tdf_base, barcodeValidation },
  }),

  initialize: (dispID) => ({
    type: types.CMD_INITIALIZE,
    payload: { dispID },
  }),
  reset: (dispID) => ({ type: types.CMD_RESET, payload: { dispID } }),
  resetHard: (dispID) => ({
    type: types.CMD_RESET_HARD,
    payload: { dispID },
  }),

  cap: (dispID, value) => ({
    type: types.CMD_CAP,
    payload: { dispID, value },
  }),

  // animation colors
  setDropColors: (colors) => ({ type: types.SET_DROP_COLORS, payload: colors }),

  // Clear barcode actions
  clearBarcodeActions: () => ({
    type: types.CLEAR_BARCODE_ACTIONS,
    payload: {},
  }),
};

const mountPath = 'machine'; // mount point in global state, must match root reducer

const propType = PropTypes.shape({
  colorants: PropTypes.arrayOf(
    //FIXME: these are actually canisters, not colorants
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      circuits: PropTypes.array.isRequired,
      barcode: PropTypes.string,
      enabled: PropTypes.bool,
      minLevel: PropTypes.number.isRequired,
      rgb: PropTypes.number,
      currLevel: PropTypes.number.isRequired,
      warnLevel: PropTypes.number.isRequired,
      maxLevel: PropTypes.number.isRequired,
    })
  ),

  config: PropTypes.shape({}),
  machine_state: PropTypes.shape({
    busy: PropTypes.bool.isRequired,
  }),
});

const initial_machine_state = {
  //show_machine_config: false,
  dispID: null,
  colorants: [],
  commands: {},
  config: null,
  error: null,
  info: null,
  dbinfo: null, // Info of the machine in database
  machine_state: null,
  selected_cnt_code: null,
  machine_action_requests: null,
  refills_list: [],
  slide_over_visible: false,
};
const initial_state = {
  show_config_id: null,
  current_dispID: window.qtside ? undefined : '0',
  machines: window.qtside ? {} : { 0: initial_machine_state },
  dispIDs: window.qtside ? [] : ['0'],
  machine_missing: null,
  // animation colors
  drop_colors: ['#3Ff400'],
  machines_in_purge_state: [], // machines which have started purge process
  driver_config: null,
  warning_batch: [],
  backup_in_progress: false,
  backup_response: null,
  clientdata: { data: [], pending: false, error: null },
  refill_target_canister: null, // Opens the refill modal for a specific canister
  barcode_refill_action: null, // Canister refill action read by barcode reader
  barcode_canister_action: null, // Canister barcode action read by barcode reader
};

// reducer for one machine, called by main reducer
function machineReducer(state = initial_machine_state, action) {
  switch (action.type) {
    case types.SET_MACHINE_SLIDE_OVER_VISIBLE: {
      return { ...state, slide_over_visible: action.payload.visible };
    }
    case types.SET_MACHINE_COLORANTS: {
      return { ...state, colorants: action.payload.results };
    }
    case types.SET_MACHINE_CONFIG: {
      return { ...state, config: action.payload.results };
    }
    case types.SET_MACHINE_ERROR: {
      return { ...state, error: action.payload.results };
    }
    case types.SET_MACHINE_INFO: {
      const { info, commands } = action.payload.results;
      return { ...state, info, commands };
    }
    case types.SET_DBMACHINE_INFO: {
      return { ...state, dbinfo: action.payload.results };
    }
    case types.SET_MACHINE_STATE_REDUX: {
      return {
        ...state,
        machine_state: action.payload.results,
        slide_over_visible:
          action.payload.results?.msgID === MACHINE_MSG_ID_OPEN_REFILL_PANEL,
      };
    }
    case types.SET_MACHINE_REFILLS_LIST: {
      return { ...state, refills_list: action.payload.results };
    }
    case types.SET_MACHINE_BATCH_REFILLS_LIST: {
      return { ...state, refills_batch_list: action.payload.results };
    }
    case types.SET_MACHINE_SELECTED_CNT_CODE: {
      return { ...state, selected_cnt_code: action.payload.code };
    }

    default: {
      return state;
    }
  }
}

function reducer(state = initial_state, action) {
  switch (action.type) {
    // actions not related to a machine
    case types.SET_MACHINE_IN_PURGE: {
      const { dispID, purging } = action.payload;
      if (purging) {
        let tmp = _.union(state.machines_in_purge_state, [dispID]);
        return {
          ...state,
          machines_in_purge_state: tmp,
        };
      } else {
        return {
          ...state,
          machines_in_purge_state: _.difference(state.machines_in_purge_state, [
            dispID,
          ]),
        };
      }
    }
    case types.SET_WARNING_BATCH: {
      return { ...state, warning_batch: action.payload };
    }
    case types.CMD_BACKUP: {
      return { ...state, backup_in_progress: true, backup_response: null };
    }
    case fulfilled(types.CMD_BACKUP): {
      return {
        ...state,
        backup_in_progress: false,
        backup_response: action.payload,
      };
    }
    case rejected(types.CMD_BACKUP): {
      return {
        ...state,
        backup_in_progress: false,
        backup_response: action.payload,
      };
    }
    case types.FETCH_MACHINE_CONFIG_BACKUP: {
      return { ...state, clientdata: { data: [], pending: true, error: null } };
    }
    case fulfilled(types.FETCH_MACHINE_CONFIG_BACKUP): {
      return {
        ...state,
        clientdata: { data: action.payload, pending: false, error: null },
      };
    }
    case rejected(types.FETCH_MACHINE_CONFIG_BACKUP): {
      return {
        ...state,
        clientdata: { data: [], pending: false, error: action.payload },
      };
    }
    case types.SET_DROP_COLORS: {
      return { ...state, drop_colors: action.payload };
    }
    case types.SET_DISPIDS: {
      return { ...state, dispIDs: action.payload };
    }
    case types.SET_MACHINE_MISSING: {
      return { ...state, machine_missing: action.payload };
    }
    case types.MACHINE_CONFIG_VISIBLE: {
      const { dispID } = action.payload;
      const show_config_id = dispID !== state.show_config_id ? dispID : null;
      return { ...state, show_config_id };
    }
    case types.SET_CURRENT_MACHINE: {
      const current_dispID = action.payload.dispID;
      return { ...state, current_dispID };
    }
    case types.SET_DRIVER_CONFIG: {
      return { ...state, driver_config: action.payload };
    }

    case types.SET_REFILL_TARGET_CANISTER: {
      return { ...state, refill_target_canister: action.payload };
    }
    case types.SET_MACHINE_BARCODE_REFILL_ACTION: {
      return {
        ...state,
        barcode_refill_action: action.payload,
      };
    }
    case types.SET_MACHINE_BARCODE_CANISTER_ACTION: {
      return { ...state, barcode_canister_action: action.payload };
    }
    case types.CLEAR_BARCODE_ACTIONS: {
      return {
        ...state,
        barcode_canister_action: null,
        barcode_refill_action: null,
      };
    }

    // actions for a specific machine
    default: {
      const dispID = _.get(action, 'payload.dispID');
      if (dispID != null) {
        const mstate = state.machines[dispID];
        let new_mstate = machineReducer(mstate, action);
        if (!mstate) {
          new_mstate = { ...new_mstate, dispID };
        }
        if (new_mstate !== mstate) {
          return {
            ...state,
            machines: { ...state.machines, [dispID]: new_mstate },
          };
        }
      }
      return state;
    }
  }
}

const localSelectors = {
  driver_config: (state) => state.driver_config,
  refills_list: (state, dispID) => state.machines[dispID]?.refills_list,
  refills_batch_list: (state, dispID) =>
    state.machines[dispID]?.refills_batch_list,
  drop_colors: (state) => state.drop_colors,
  machine: (state, dispID) => state.machines[dispID],
  isMachineMissing: (state) => state.machine_missing,
  machines: (state) => state.machines,
  dispIDs: (state) => state.dispIDs,
  show_config_id: (state) => state.show_config_id,
  current_dispID: (state) => state.current_dispID,
  current_machine: (state) => state.machines[state.current_dispID],
  is_purging: (state, dispID) =>
    _.includes(state.machines_in_purge_state, dispID),
  machinesColorants: (state) =>
    _.map(state.machines, (machine) => machine.colorants).flat(),
  warning_batch: (state) => state.warning_batch,
  refill_target_canister: (state) => state.refill_target_canister,
  machinesStates: (state) =>
    _.map(state.machines, (machine) => machine.machine_state),
  slideOverVisible: (state, dispID) =>
    state.machines[dispID]?.slide_over_visible,
  find_dispID_canister: (state, barcode) => {
    for (let dispID of state.dispIDs) {
      const canister = state.machines[dispID].colorants?.find(
        (c) => c.barcode === barcode
      );
      if (canister) {
        return [dispID, canister];
      }
    }
    return [];
  },
  find_dispID_canisters: (state, cntid) => {
    for (let dispID of state.dispIDs) {
      const canisters = state.machines[dispID].colorants?.filter(
        (canister) => canister.cntid === cntid
      );
      if (canisters.length) {
        return [dispID, canisters];
      }
    }
    return [null, []];
  },
  backup_in_progress: (state) => state.backup_in_progress,
  clientdata: (state) => state.clientdata,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

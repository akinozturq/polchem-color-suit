import {
  BARCODE_VALIDATION_NONE,
  BARCODE_VALIDATION_SCAN,
} from '../../Constants';
import { globalizeSelectors } from '../Utils';
import { BARCODE_MODE_NORMAL } from 'js/Constants';
/**
 * Just a simple flag to notify the UI that progress modal needs to be shown!
 */

/*
 * action types
 */

const types = {
  MANUAL_CNT_BARCODE_DETAILS: 'BARCODEACTIONS/MANUAL_CNT_BARCODE_DETAILS',
  MANUAL_CNT_BARCODE_DETAILS_FULFILLED:
    'BARCODEACTIONS/MANUAL_CNT_BARCODE_DETAILS_FULFILLED',
  RESOLVE_BARCODE: 'BARCODEACTIONS/RESOLVE_BARCODE',
  RESOLVE_BARCODE_PENDING: 'BARCODEACTIONS/RESOLVE_BARCODE_PENDING',
  RESOLVE_BARCODE_FULFILLED: 'BARCODEACTIONS/RESOLVE_BARCODE_FULFILLED',
  RESOLVE_BARCODE_REJECTED: 'BARCODEACTIONS/RESOLVE_BARCODE_REJECTED',
  CLEAR_BARCODE_STATE: 'BARCODEACTIONS/CLEAR_BARCODE_STATE',
  SETMODE: 'BARCODEACTIONS/SETMODE',
  SET_VALIDATION_STATE: 'BARCODEACTIONS/SET_VALIDATION_STATE',
  RESET_VALIDATION_STATE_BETWEEN_CANS:
    'BARCODEACTIONS/RESET_VALIDATION_STATE_BETWEEN_CANS',
  SETBARCODE: 'BARCODEACTIONS/SETBARCODE',
};

/*
 * action creators
 */

const actions = {
  resolveBarcode: (barcode) => ({
    type: types.RESOLVE_BARCODE,
    payload: barcode,
  }),
  manualCntBarcodeDetails: (barcode) => ({
    type: types.MANUAL_CNT_BARCODE_DETAILS,
    payload: barcode,
  }),
  setMode: (mode) => ({
    type: types.SETMODE,
    payload: mode,
  }),
  clearBarcodeState: () => ({ type: types.CLEAR_BARCODE_STATE }),
  setValidationState: (state) => ({
    type: types.SET_VALIDATION_STATE,
    payload: state,
  }),
  resetValidationStateBetweenCans: () => ({
    type: types.RESET_VALIDATION_STATE_BETWEEN_CANS,
  }),
};

const mountPath = 'barcodeaction'; // mount point in global state, must match root reducer

/**
 * Handling login and log out site actions
 */

const initialState = {
  barcodemode: BARCODE_MODE_NORMAL,
  barcode: null,
  barcodeaction: null,
  validation_state: BARCODE_VALIDATION_NONE, // no validation needed
  fetch_barcodeaction_error: null,
  fetch_barcodeaction_start: false,
  last_scanned_canid: null,
  manual_cnt_barcode_details: null,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case types.SETMODE: {
      return {
        ...state,
        barcodemode: action.payload,
      };
    }
    case types.SET_VALIDATION_STATE: {
      return {
        ...state,
        validation_state: action.payload,
      };
    }
    case types.RESET_VALIDATION_STATE_BETWEEN_CANS: {
      return {
        ...state,
        validation_state:
          state.validation_state === BARCODE_VALIDATION_NONE
            ? BARCODE_VALIDATION_NONE
            : BARCODE_VALIDATION_SCAN,
      };
    }
    case types.SETBARCODE: {
      return {
        ...state,
        barcode: action.payload,
      };
    }
    case types.CLEAR_BARCODE_STATE: {
      return {
        ...state,
        validation_state: BARCODE_VALIDATION_NONE,
        barcodeaction: null,
        fetch_barcodeaction_start: false,
        fetch_barcodeaction_error: null,
        barcode: null,
        last_scanned_canid: null,
      };
    }
    case types.RESOLVE_BARCODE_PENDING: {
      return {
        ...state,
        fetch_barcodeaction_start: action.payload,
      };
    }
    case types.RESOLVE_BARCODE_REJECTED: {
      return {
        ...state,
        barcodeaction: null,
        fetch_barcodeaction_start: false,
        fetch_barcodeaction_error: action.payload,
      };
    }
    case types.RESOLVE_BARCODE_FULFILLED: {
      return {
        ...state,
        barcodeaction: action.payload,
        fetch_barcodeaction_start: false,
        fetch_barcodeaction_error: null,
        last_scanned_canid: action.payload.canid || state.last_scanned_canid,
      };
    }

    case types.MANUAL_CNT_BARCODE_DETAILS_FULFILLED: {
      return {
        ...state,
        manual_cnt_barcode_details: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}

// selectors

const localSelectors = {
  barcodeaction: (state) => state.barcodeAction,
  barcodemode: (state) => state.barcodemode,
  last_scanned_canid: (state) => state.last_scanned_canid,
  validation_state: (state) => state.validation_state,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

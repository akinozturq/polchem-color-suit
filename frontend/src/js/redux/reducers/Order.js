import PropTypes from 'prop-types';

import _ from 'lodash';

import {

  COLOR_SEARCH_CARD,

  COLOR_SEARCH,

  INFO_CARD,

  ORDER_STATUS_UNCONFIRMED,

  AMOUNT_CARD,

  ORDER_MODE_NORMAL,

  ORDER_MODE_FREE_DISPENSE,

  ORDER_STATUS_WAITING,

  PRODUCT_SEARCH_MODE_LIST,

  ORDER_MODE_MATCHING,

  SOURCE_MAIN,

  ZERO_VOLUME_THRESHOLD_ML,

  MACHINE_VALIDATE_OK,

} from '../../Constants';

import { globalizeSelectors } from '../Utils';

import { isForbidden } from 'js/api/WebRequest';

import barcodeActions from './BarcodeAction';

import { actionTypes as machineActionTypes } from './Machine';

import printTaskActions from './PrintTask';

import { CheckRules } from '../../mylib/RulesChecker';

import { EI_VARS_ORDERITEMPRICE_TABLE } from 'polchem_base/common/EIVariables';

import { createThunk } from '../IndirectThunks';

import { RGBColorToHex } from '../../mylib/Utils';

/*

 * action types

 */



const types = {

  SET_OPEN_SECTION: 'ORDER/SET_OPEN_SECTION',

  SWITCH_OPEN_SECTION: 'ORDER/SWITCH_OPEN_SECTION',

  SET_IDS: 'ORDER/SET_IDS',

  SET_COLOR: 'ORDER/SET_COLOR',

  SET_COLOR_DETAILS: 'ORDER/SET_COLOR_DETAILS',

  SET_CARD: 'ORDER/SET_CARD',

  SET_PRODUCT: 'ORDER/SET_PRODUCT',

  SET_CAN: 'ORDER/SET_CAN',

  SET_BASE: 'ORDER/SET_BASE',

  SET_FORMULA: 'ORDER/SET_FORMULA',

  SET_FORMULA_FULFILLED: 'ORDER/SET_FORMULA_FULFILLED',

  SET_SCALED_CNTS: 'ORDER/SET_SCALED_CNTS',

  CHECK_FORMULA_FULFILLED: 'ORDER/CHECK_FORMULA_FULFILLED',

  SET_NUMBER_OF_CANS: 'ORDER/SET_NUMBER_OF_CANS',

  SET_NUMBER_OF_CANS_TINTED: 'ORDER/SET_NUMBER_OF_CANS_TINTED',

  SET_ITEM_STATUS: 'ORDER/SET_ITEM_STATUS',

  SET_ITEM_CLOSED: 'ORDER/SET_ITEM_CLOSED',

  INITIATE_TINTING: 'ORDER/INITIATE_TINTING',

  SET_PRE_TINT_MODALS: 'ORDER/SET_PRE_TINT_MODALS',

  TINT_ORDERITEM: 'ORDER/TINT_ORDERITEM',

  TINT_CAN_READY: 'ORDER/TINT_CAN_READY',

  CAN_TINTED: 'ORDER/CAN_TINTED',

  ORDERITEM_TINTED: 'ORDER/ORDERITEM_TINTED',

  RETINT_ORDER: 'ORDER/RETINT_ORDER',

  RETINT_ITEM: 'ORDER/RETINT_ITEM',

  SET_ITEM_NOTES: 'ORDER/SET_ITEM_NOTES',

  SET_ORDER_NOTES: 'ORDER/SET_ORDER_NOTES',

  SET_ORDER_DATE: 'ORDER/SET_ORDER_DATE',

  SET_MODIFICATION_DATE: 'ORDER/SET_MODIFICATION_DATE',

  SET_CUSTOMER_MODAL_OPEN: 'ORDER/SET_CUSTOMER_MODAL_OPEN',

  SET_COLOR_SEARCH_MODE: 'ORDER/SET_COLOR_SEARCH_MODE',

  SET_PRODUCT_SEARCH_MODE: 'ORDER/SET_PRODUCT_SEARCH_MODE',

  CLEAR_ORDER_STATE: 'ORDER/CLEAR_ORDER_STATE',

  CLEAR_ORDER: 'ORDER/CLEAR_ORDER',

  CLEAR_ORDER_ITEM: 'ORDER/CLEAR_ORDER_ITEM',

  CLEAR_COLOURNAMES: 'ORDER/CLEAR_COLOURNAMES',

  CLEAR_COLOR_MEASUREMENT: 'ORDER/CLEAR_COLOR_MEASUREMENT',

  FETCH_ORDERITEM: 'ORDER/FETCH_ORDERITEM',

  SAVE_ORDERITEM: 'ORDER/SAVE_ORDERITEM',

  SAVE_ORDERITEM_FULFILLED: 'ORDER/SAVE_ORDERITEM_FULFILLED',

  SAVE_ORDERITEM_REJECTED: 'ORDER/SAVE_ORDERITEM_REJECTED',

  CLOSE_ORDERITEMS: 'ORDER/CLOSE_ORDERITEMS',

  CLOSE_ORDERITEM_FULFILLED: 'ORDER/CLOSE_ORDERITEM_FULFILLED',

  CLOSE_ORDERITEM_REJECTED: 'ORDER/CLOSE_ORDERITEM_REJECTED',

  FETCH_CUSTOMER: 'ORDER/FETCH_CUSTOMER',

  FETCH_CUSTOMER_FULFILLED: 'ORDER/FETCH_CUSTOMER_FULFILLED',

  FETCH_CUSTOMER_REJECTED: 'ORDER/FETCH_CUSTOMER_REJECTED',

  SAVE_CUSTOMER: 'ORDER/SAVE_CUSTOMER',

  SAVE_CUSTOMER_FULFILLED: 'ORDER/SAVE_CUSTOMER_FULFILLED',

  SAVE_CUSTOMER_REJECTED: 'ORDER/SAVE_CUSTOMER_REJECTED',

  SET_ORDER_MODE: 'ORDER/SET_ORDER_MODE',

  SET_ORDERITEM_SOURCE: 'ORDER/SET_ORDERITEM_SOURCE',

  DELETE_CUSTOMER: 'ORDER/DELETE_CUSTOMER',

  APPLY_CUSTOMER: 'ORDER/APPLY_CUSTOMER',

  DELETE_CUSTOMER_FULFILLED: 'ORDER/DELETE_CUSTOMER_FULFILLED',

  DELETE_CUSTOMER_REJECTED: 'ORDER/DELETE_CUSTOMER_REJECTED',

  FETCH_ORDERITEM_PRICE: 'ORDER/FETCH_ORDERITEM_PRICE',

  FETCH_ORDERITEM_PRICE_PENDING: 'ORDER/FETCH_ORDERITEM_PRICE_PENDING',

  FETCH_ORDERITEM_PRICE_FULFILLED: 'ORDER/FETCH_ORDERITEM_PRICE_FULFILLED',

  FETCH_ORDERITEM_PRICE_REJECTED: 'ORDER/FETCH_ORDERITEM_PRICE_REJECTED',

  FETCH_ORDERITEM_ALTERNATIVE_PRICE: 'ORDER/FETCH_ORDERITEM_ALTERNATIVE_PRICE',

  FETCH_ORDERITEM_ALTERNATIVE_PRICE_PENDING:

    'ORDER/FETCH_ORDERITEM_ALTERNATIVE_PRICE_PENDING',

  FETCH_ORDERITEM_ALTERNATIVE_PRICE_FULFILLED:

    'ORDER/FETCH_ORDERITEM_ALTERNATIVE_PRICE_FULFILLED',

  FETCH_ORDERITEM_ALTERNATIVE_PRICE_REJECTED:

    'ORDER/FETCH_ORDERITEM_ALTERNATIVE_PRICE_REJECTED',

  SET_PREVIOUS_SECTION: 'ORDER/SET_PREVIOUS_SECTION',

  SET_COLOR_AFTER_CONFIRMATION: 'ORDER/SET_COLOR_AFTER_CONFIRMATION',

  SET_PRODUCT_AFTER_CONFIRMATION: 'ORDER/SET_PRODUCT_AFTER_CONFIRMATION',

  SET_COLOR_AFTER_CONFIRMATION_FULFILLED:

    'ORDER/SET_COLOR_AFTER_CONFIRMATION_FULFILLED',

  SET_COLOR_AFTER_CONFIRMATION_REJECTED:

    'ORDER/SET_COLOR_AFTER_CONFIRMATION_REJECTED',

  SET_PRODUCT_AFTER_CONFIRMATION_FULFILLED:

    'ORDER/SET_PRODUCT_AFTER_CONFIRMATION_FULFILLED',

  SET_PRODUCT_AFTER_CONFIRMATION_REJECTED:

    'ORDER/SET_PRODUCT_AFTER_CONFIRMATION_REJECTED',

  SET_COLOURCODE_AFTER_FORMULA_EDIT: 'ORDER/SET_COLOURCODE_AFTER_FORMULA_EDIT',

  SET_FORMULA_AFTER_CORRECTION: 'ORDER/SET_FORMULA_AFTER_CORRECTION',

  SET_COLOURCODE_AFTER_FORMULA_EDIT_REJECTED:

    'ORDER/SET_COLOURCODE_AFTER_FORMULA_EDIT_REJECTED',

  SET_FORMULA_AFTER_CORRECTION_REJECTED:

    'ORDER/SET_FORMULA_AFTER_CORRECTION_REJECTED',

  SET_COLOURCODE: 'ORDER/SET_COLOURCODE',

  SET_RGB: 'ORDER/SET_RGB',

  SET_RGB_BEFORE_EDIT: 'ORDER/SET_RGB_BEFORE_EDIT',

  SET_ORIGINAL_FORMULA: 'ORDER/SET_ORIGINAL_FROMULA',

  SET_SCALEDBY: 'ORDER/SET_SCALEDBY',



  SET_FORMULA_CORRECTION_TYPE: 'ORDER/SET_FORMULA_CORRECTION_TYPE',

  SET_ADDITION_ONLY: 'ORDER/SET_ADDITION_ONLY',

  SET_ITEM_EDITED: 'ORDER/SET_ITEM_EDITED',

  SET_FORMULA_CORRECTION_SCALING_FACTOR:

    'ORDER/SET_FORMULA_CORRECTION_SCALING_FACTOR',

  SET_COLOR_NAME: 'ORDER/SET_COLOR_NAME',

  SET_DISCOUNT: 'ORDER/SET_DISCOUNT',

  SET_BASE_PRICE_ADJUSTMENT: 'ORDER/SET_BASE_PRICE_ADJUSTMENT',

  SET_CNT_PRICE_ADJUSTMENT: 'ORDER/SET_CNT_PRICE_ADJUSTMENT',

  SET_SELECTED_UNIT: 'ORDER/SET_SELECTED_UNIT',

  TOGGLE_FORMULA_VERSION_MODAL: 'ORDER/TOGGLE_FORMULA_VERSION_MODAL', // Alternative formula / history modal

  SAVE_STATE: 'ORDER/SAVE_STATE', // Copy current order to original_order in state for easy restore

  RESTORE_STATE: 'ORDER/RESTORE_STATE', // Restore original_order in state to current order

  POP_STATE: 'ORDER/POP_STATE',

  HIDE_ITEM: 'ORDER/HIDE_ITEM', // Hide order from history

  SET_PRIMER_COLOUR: 'ORDER/SET_PRIMER_COLOUR',



  ADD_PRIMER_TO_ORDER: 'ORDER/ADD_PRIMER_TO_ORDER',

  ADD_PRIMER_TO_ORDER_PENDING: 'ORDER/ADD_PRIMER_TO_ORDER_PENDING',

  ADD_PRIMER_TO_ORDER_FULFILLED: 'ORDER/ADD_PRIMER_TO_ORDER_FULFILLED',

  ADD_PRIMER_TO_ORDER_REJECTED: 'ORDER/ADD_PRIMER_TO_ORDER_REJECTED',



  IS_COLOURCODE_FREE: 'ORDER/IS_COLOURCODE_FREE',

  IS_COLOURCODE_FREE_PENDING: 'ORDER/IS_COLOURCODE_FREE_PENDING',

  IS_COLOURCODE_FREE_FULFILLED: 'ORDER/IS_COLOURCODE_FREE_FULFILLED',

  IS_COLOURCODE_FREE_REJECTED: 'ORDER/IS_COLOURCODE_FREE_REJECTED',

};



const mountPath = 'order'; // mount point in global state, must match root reducer



/*

 * action creators

 */



// options for retint parameter in fetchOrderItem

export const RETINT_TYPE_ORDER = 'ORDER';

export const RETINT_TYPE_FORMULA = 'FORMULA';

export const RETINT_TYPE_CORRECTION = 'CORRECTION';



const actions = {

  toggleFormulaVersionModal: (version) => ({

    type: types.TOGGLE_FORMULA_VERSION_MODAL,

    payload: version,

  }),

  setProductAfterConfirmation: () => ({

    type: types.SET_PRODUCT_AFTER_CONFIRMATION,

  }),

  setColorAfterConfirmation: () => ({

    type: types.SET_COLOR_AFTER_CONFIRMATION,

  }),

  setColourCodeAfterFormulaEdit: (payload) => ({

    type: types.SET_COLOURCODE_AFTER_FORMULA_EDIT,

    payload,

  }),

  setFormulaAfterCorrection: (correctionType, correctionData) => ({

    type: types.SET_FORMULA_AFTER_CORRECTION,

    payload: { correctionType, correctionData },

  }),



  setSelectedUnit: (unit) => ({ type: types.SET_SELECTED_UNIT, payload: unit }),

  setColorCode: (payload) => ({

    type: types.SET_COLOURCODE,

    payload: { manual_set_code: true, code: payload },

  }),

  setRgb: (rgb) => ({ type: types.SET_RGB, payload: rgb }),



  moveToNextSection: (section) => ({

    type: types.SWITCH_OPEN_SECTION,

    payload: { section: section, moveToNext: true },

  }),

  moveToPrevSection: (section) => ({

    type: types.SWITCH_OPEN_SECTION,

    payload: { section: section, moveToPrev: true },

  }),

  clearOrderState: () => ({ type: types.CLEAR_ORDER_STATE }),

  clearOrder: () => ({ type: types.CLEAR_ORDER, payload: null }),

  clearOrderItem: () => ({ type: types.CLEAR_ORDER_ITEM, payload: null }),

  clearFormula: () => ({ type: types.SET_FORMULA_FULFILLED, payload: null }),

  setColorSearchMode: (mode) => ({

    type: types.SET_COLOR_SEARCH_MODE,

    payload: mode,

  }),

  setProductSearchMode: (mode) => ({

    type: types.SET_PRODUCT_SEARCH_MODE,

    payload: mode,

  }),



  setBase: (base) => ({ type: types.SET_BASE, payload: base }),

  setOpenSection: (section) => ({

    type: types.SWITCH_OPEN_SECTION,

    payload: { section: section },

  }),

  setPreviousSection: (section) => ({

    type: types.SET_PREVIOUS_SECTION,

    payload: { section: section },

  }),

  setColor: (

    color,

    colourname = undefined,

    originalCode = undefined,

    edited = undefined

  ) => ({

    type: types.SET_COLOR,

    payload: { color, colourname, originalCode, edited },

  }),

  setColorName: (colourname) => ({

    type: types.SET_COLOR_NAME,

    payload: colourname,

  }),

  setCard: (card) => ({ type: types.SET_CARD, payload: card }),

  setCustomer: (customer) => ({

    type: types.FETCH_CUSTOMER_FULFILLED,

    payload: customer,

  }),

  setProduct: (product) => ({ type: types.SET_PRODUCT, payload: product }),

  setCan: (can, update_extender = true) =>

    createThunk({

      type: types.SET_CAN,

      payload: { can, update_extender },

    }),

  setOrderitemSource: (src) => ({

    type: types.SET_ORDERITEM_SOURCE,

    payload: src,

  }),

  setNumberOfCans: (num) => ({ type: types.SET_NUMBER_OF_CANS, payload: num }),

  setNumberOfCansTinted: (num) => ({

    type: types.SET_NUMBER_OF_CANS_TINTED,

    payload: num,

  }),

  setItemNotes: (notes) => ({ type: types.SET_ITEM_NOTES, payload: notes }),

  setOrderNotes: (notes) => ({ type: types.SET_ORDER_NOTES, payload: notes }),

  setFormula: (formula, isInitial = false) =>

    createThunk({ type: types.SET_FORMULA, payload: { formula, isInitial } }),

  setOriginalFormula: (original_formula, initial_formula = null) =>

    // initial_formula defaults to original_formula

    ({

      type: types.SET_ORIGINAL_FORMULA,

      payload: { original_formula, initial_formula },

    }),

  initiateTinting: () => ({ type: types.INITIATE_TINTING }),

  setPreTintModals: (modals) => ({

    type: types.SET_PRE_TINT_MODALS,

    payload: modals,

  }),

  tintOrderitem: (dispID, skip_tdf_base = false) => ({

    type: types.TINT_ORDERITEM,

    payload: { dispID, skip_tdf_base },

  }),

  /** Register can as tinted, and close order item all done */

  canTinted: (itemid, machineid, count_before, count, total) => ({

    type: types.CAN_TINTED,

    payload: { itemid, machineid, count_before, count, total },

  }),

  // Using thunk to dispatch multiple actions:

  tintCanReady: (itemid, machineid) => (dispatch) => {

    dispatch({

      type: types.TINT_CAN_READY,

      payload: { itemid, machineid },

    });

    dispatch(printTaskActions.processTasksAfterCan());

    dispatch(barcodeActions.resetValidationStateBetweenCans());

  },

  fetchOrderitem: (itemid, retint = false, zoneid = null, resume = false) => ({

    type: types.FETCH_ORDERITEM,

    payload: { itemid, retint, zoneid, resume },

  }),

  saveOrderitem: (

    itemstatus,

    clear_item_after_saving = false,

    navigate_to = null

  ) => ({

    type: types.SAVE_ORDERITEM,

    payload: { itemstatus, clear_item_after_saving, navigate_to },

  }),

  closeOrderItems: (items) => ({

    type: types.CLOSE_ORDERITEMS,

    payload: items,

  }),

  hideItem: (itemid) => ({

    type: types.HIDE_ITEM,

    payload: itemid,

  }),

  fetchCustomer: (customerid) => ({

    type: types.FETCH_CUSTOMER,

    payload: { customerid },

  }),

  saveCustomer: () => ({ type: types.SAVE_CUSTOMER }),

  deleteCustomer: (customer) => ({

    type: types.DELETE_CUSTOMER,

    payload: customer,

  }),

  applyCustomer: (orderid, customer, historySearchParams) => ({

    type: types.APPLY_CUSTOMER,

    payload: { orderid, customer, historySearchParams },

  }),

  setCustomerModalOpen: (open) => ({

    type: types.SET_CUSTOMER_MODAL_OPEN,

    payload: open,

  }),

  reTintOrder: (retintType) => ({

    type: types.RETINT_ORDER,

    payload: retintType,

  }),

  reTintItem: (retintType) => ({

    type: types.RETINT_ITEM,

    payload: retintType,

  }),

  setOrderMode: (order_mode, order_start_section = COLOR_SEARCH_CARD) => ({

    type: types.SET_ORDER_MODE,

    payload: { order_mode, order_start_section },

  }),



  fetchOrderItemPrice: () => ({ type: types.FETCH_ORDERITEM_PRICE }),

  fetchOrderItemAlternativePrice: (zoneid) => ({

    type: types.FETCH_ORDERITEM_ALTERNATIVE_PRICE,

    payload: zoneid,

  }),

  setScaledBy: (value) => ({

    type: types.SET_SCALEDBY,

    payload: value,

  }),

  clearColournames: () => ({

    type: types.CLEAR_COLOURNAMES,

  }),

  clearColorMeasurement: () => ({

    type: types.CLEAR_COLOR_MEASUREMENT,

  }),

  setItemEdited: (value) => ({

    type: types.SET_ITEM_EDITED,

    payload: value,

  }),

  setFormulaCorrectionType: (correction_type) => ({

    type: types.SET_FORMULA_CORRECTION_TYPE,

    payload: correction_type,

  }),

  setDiscount: (value) => ({

    type: types.SET_DISCOUNT,

    payload: value,

  }),



  setBasePriceAdjustment: (value) => ({

    type: types.SET_BASE_PRICE_ADJUSTMENT,

    payload: value,

  }),



  setCntPriceAdjustment: (value) => ({

    type: types.SET_CNT_PRICE_ADJUSTMENT,

    payload: value,

  }),



  setAdditionOnly: (value) => ({

    type: types.SET_ADDITION_ONLY,

    payload: value,

  }),



  setFormulaCorrectionScalingFactor: (value) => ({

    type: types.SET_FORMULA_CORRECTION_SCALING_FACTOR,

    payload: value,

  }),



  saveState: () => ({

    type: types.SAVE_STATE,

  }),

  restoreState: () => ({

    type: types.RESTORE_STATE,

  }),

  popState: () => ({ type: types.POP_STATE }),



  setPrimer: (primer_colour) => ({

    type: types.SET_PRIMER_COLOUR,

    payload: primer_colour,

  }),

  isColourcodeFree: (colourcode) => ({

    type: types.IS_COLOURCODE_FREE,

    payload: { colourcode },

  }),

};



/*

 * prop type for state shape

 */

const propType = PropTypes.shape({

  orderid: PropTypes.number,

  color: PropTypes.object,

  isColourcodeFree: PropTypes.bool,

  isColourcodeFree_pending: PropTypes.bool,

  isColourcodeFree_rejected: PropTypes.object,

  product: PropTypes.object,

  base: PropTypes.object,

  can: PropTypes.object,

  customer: PropTypes.object,

  notes: PropTypes.string,

  order_mode: PropTypes.string,

  order_start_section: PropTypes.string,

  formula_version_modal_type: PropTypes.string,

  open_section: PropTypes.string.isRequired,

  customer_modal_open: PropTypes.bool.isRequired,

  customer_pending: PropTypes.bool,

  pre_tint_modals: PropTypes.arrayOf(PropTypes.string),

  ncans_tinted: PropTypes.number.isRequired, // Counted after tinting completed

  tinting_error: PropTypes.string,

  tinting_result: PropTypes.shape({ cnts: PropTypes.array }),

  formula: PropTypes.shape({

    baseid: PropTypes.number,

    ishistory: PropTypes.bool,

  }),

  initial_formula: PropTypes.object, // true original formula for color code generation

  original_formula: PropTypes.object, // original formula before current edits

  item: PropTypes.shape({

    itemid: PropTypes.number,

    colourcode: PropTypes.string,

    colourname: PropTypes.string,

    rgb: PropTypes.number,

    cardname: PropTypes.string,

    productname: PropTypes.string,

    basecode: PropTypes.string,

    cansizecode: PropTypes.string,

    ncans: PropTypes.number,

    cnts: PropTypes.array,

    notes: PropTypes.string,

    source: PropTypes.string, // Formula source

    status: PropTypes.string.isRequired,

    closed: PropTypes.bool,

    formulaCorrectionType: PropTypes.string,

  }),

});



const empty_item_price = {

  analysis: {},

  excTaxCan: {},

  incTaxCan: {},

};



const empty_item = {

  itemid: null,

  colourcode: null,

  colourname: null,

  rgb: null,

  rgb_before_edit: null,

  productname: null,

  abasecode: null,

  basecode: null,

  cansizecode: null,

  ncans: 1,

  cnts: null,

  notes: null,

  source: SOURCE_MAIN,

  status: ORDER_STATUS_UNCONFIRMED,

  closed: false,

  price: empty_item_price,

  alternative_price: null,



  formulaCorrectionType: null,

  additionOnly: false,

  formulaCorrectionScalingFactor: 1,

  discount: 0, // Discount of the order in range 0-1 (percents)

  basepriceadjustment: 0, // Discount/surcharge of the order in range 0-1 (percents)

  cntpriceadjustment: 0, // Discount/surcharge of the order in range 0-1 (percents)

  scaledby: 1,

  itemEdited: false,

  manually_set_colorcode: false,

  primer_color: null, // example -> {"colourcode":"ASF 1204","colourid":1126,"productid":3,"rgb":16181709}

  primer_color_start: false,

  primer_color_error: null,

};



const empty_order_item = {

  // Order details related to item

  zoneid: null,

  color: null,

  product: null,

  base: null,

  formula: null,

  initial_formula: null,

  original_formula: null,

  card: null,

  can: null,

  ncans_tinted: 0,

  tinting_error: null,

  tinting_result: null, // Gravimetric results, Adler case

  engine_validation: null, // Results from machine

  engine_check: null, // Results from machine

  base_check: null, // Results from machine base dosing



  item: empty_item,

  selected_unit: null,

};



const empty_order = {

  ...empty_order_item,

  status: ORDER_STATUS_UNCONFIRMED,

  orderid: null,

  notes: null,

  customer: null, // This may remain null if user not permitted to customer data...

  customerid: null, // ...but the id is retained here.

  orderdate: null,

  modificationdate: null,

  isColourcodeFree: true,

  isColourcodeFree_pending: false,

  isColourcodeFree_rejected: null,

};



const initial_state = {

  ...empty_order,

  saved_state: null,

  // UI state

  open_section: COLOR_SEARCH_CARD,

  prev_section: null,

  color_search_mode: COLOR_SEARCH,

  product_search_mode: PRODUCT_SEARCH_MODE_LIST,

  order_mode: ORDER_MODE_NORMAL,

  order_start_section: COLOR_SEARCH_CARD,

  pre_tint_modals: [],

  customer_modal_open: false,

  formula_version_modal_type: null,

  customer_pending: false,

  customer_forbidden: false,

  customer_error: null,

  price_pending: false,

  price_error: null,

};



/** Helper to clear formula at product or color change */

function clearFormula(state) {

  return {

    ...state,

    base: null,

    formula: null,

    initial_formula: null,

    original_formula: null,

    item: { ...state.item, basecode: null, abasecode: null, cnts: null },

  };

}



function validateColouridProductid(state, formula) {

  const { productid, colourid } = formula;

  return (

    productid != null &&

    productid === state.product?.productid &&

    colourid != null &&

    colourid === state.color?.colourid

  );

}



/**

 * reducer which updates the order state in data store

 * @param {*} state

 * @param {*} action

 */

function reducer(state = initial_state, action) {

  const { item, color } = state;

  const isSourceMain = item.source === SOURCE_MAIN;

  const { payload } = action;



  switch (action.type) {

    case types.SAVE_STATE: {

      return { ...state, saved_state: state };

    }

    case types.RESTORE_STATE: {

      return state.saved_state || state;

    }

    case types.POP_STATE: {

      return { ...state, saved_state: state.saved_state?.saved_state || null };

    }



    case types.SET_DISCOUNT: {

      return { ...state, item: { ...state.item, discount: payload || 0 } };

    }

    case types.SET_BASE_PRICE_ADJUSTMENT: {

      return {

        ...state,

        item: { ...state.item, basepriceadjustment: payload || 0 },

      };

    }

    case types.SET_CNT_PRICE_ADJUSTMENT: {

      return {

        ...state,

        item: { ...state.item, cntpriceadjustment: payload || 0 },

      };

    }

    case types.CLEAR_ORDER_STATE: {

      return { ...initial_state };

    }

    case types.CLEAR_ORDER: {

      return {

        ...state,

        formula_version_modal_type: null,

        ...empty_order,

        open_section: state.order_start_section,

        saved_state: null,

      };

    }

    case types.CLEAR_ORDER_ITEM: {

      return {

        ...state,

        ...empty_order_item,

        open_section: state.order_start_section,

      };

    }

    case types.CLEAR_COLOURNAMES: {

      return {

        ...state,

        color: { ...color, colournames: [] },

        item: { ...item, colourname: null },

      };

    }

    case types.CLEAR_COLOR_MEASUREMENT: {

      return {

        ...state,

        color: { ...color, reflectance: null, lab: null },

      };

    }

    case types.SET_ORDER_MODE: {

      const { order_mode, order_start_section } = payload;

      return { ...state, order_mode, order_start_section };

    }

    case types.SET_SELECTED_UNIT: {

      return { ...state, selected_unit: payload };

    }

    case types.SET_CUSTOMER_MODAL_OPEN: {

      return { ...state, customer_modal_open: payload };

    }

    case types.TOGGLE_FORMULA_VERSION_MODAL: {

      return {

        ...state,

        // hide if same type given

        formula_version_modal_type:

          state.formula_version_modal_type !== payload ? payload : null,

      };

    }

    case types.SET_OPEN_SECTION: {

      let section = payload;

      // For free dispense allow going into last section before color, product or can is set

      if (state.order_mode === ORDER_MODE_FREE_DISPENSE) {

        return { ...state, open_section: section };

      }



      // Verify that color, product and can is set before going to ready section

      const amount_ok =

        state.order_mode === ORDER_MODE_NORMAL

          ? state.color != null && state.product != null

          : state.product != null;

      const info_ok = amount_ok && state.can != null;

      if (section === INFO_CARD && !info_ok) {

        section = AMOUNT_CARD;

      }

      if (section === AMOUNT_CARD && !amount_ok) {

        return state;

      } else {

        return { ...state, open_section: section };

      }

    }

    case types.SET_IDS: {

      const {

        orderid = state.orderid,

        itemid = state.item.itemid,

        zoneid = state.zoneid,

      } = payload;

      return {

        ...state,

        orderid,

        zoneid,

        item: { ...item, itemid },

      };

    }

    case types.SET_ORDERITEM_SOURCE: {

      return { ...state, item: { ...item, source: payload } };

    }

    case types.SET_NUMBER_OF_CANS: {

      return { ...state, item: { ...item, ncans: payload } };

    }

    case types.SET_NUMBER_OF_CANS_TINTED: {

      return { ...state, ncans_tinted: payload };

    }

    case types.SET_ITEM_NOTES: {

      return { ...state, item: { ...item, notes: payload } };

    }

    case types.SET_ORDER_NOTES: {

      return { ...state, notes: payload };

    }

    case types.SET_ORDER_DATE: {

      return { ...state, orderdate: payload };

    }

    case types.SET_MODIFICATION_DATE: {

      return { ...state, modificationdate: payload };

    }

    case types.SET_COLOR_SEARCH_MODE: {

      return { ...state, color_search_mode: payload };

    }

    case types.SET_PRODUCT_SEARCH_MODE: {

      return { ...state, product_search_mode: payload };

    }

    case types.SET_COLOR_NAME: {

      return {

        ...state,

        color: { ...color, colournames: payload ? [payload] : [] },

        item: { ...item, colourname: payload },

      };

    }

    case types.SET_COLOR: {

      let { color, colourname, originalCode, edited } = payload;

      if (colourname === undefined)

        colourname = _.get(color, 'colournames[0]', null);

      const s = isSourceMain ? clearFormula(state) : state;

      return {

        ...s,

        color,

        item: {

          ...s.item,

          colourcode: color ? color.colourcode : null,

          colourname,

          originalCode,

          rgb: color ? color.rgb : null,

          itemEdited: edited !== undefined ? edited : s.item.itemEdited,

          primer_color: null,

        },

      };

    }

    case types.SET_COLOR_DETAILS: {

      if (payload && state.color && payload.colourid === state.color.colourid) {

        return {

          ...state,

          color: payload,

          item: {

            ...item,

            colourcode: payload.colourcode,

            colourname: payload.selected_name

              ? payload.selected_name

              : payload.colournames.length > 0

                ? payload.colournames[0]

                : null,

          },

        };

      } else return state;

    }

    case types.FETCH_ORDERITEM_PRICE_FULFILLED: {

      return {

        ...state,

        item: { ...item, price: payload ? payload : empty_item_price },

        price_pending: false,

        price_error: null,

      };

    }

    case types.FETCH_CUSTOMER: {

      return {

        ...state,

        customerid: payload.customerid,

        customer: null,

        customer_pending: true,

        customer_error: null,

        customer_forbidden: false,

      };

    }

    case types.FETCH_CUSTOMER_FULFILLED: {

      return {

        ...state,

        customer: payload,

        customerid: _.get(payload, 'customerid'),

        customer_pending: false,

      };

    }

    case types.FETCH_CUSTOMER_REJECTED: {

      return {

        ...state,

        customer_pending: false,

        customer_error: payload,

        customer_forbidden: isForbidden(payload),

      };

    }

    case types.SAVE_CUSTOMER_FULFILLED: {

      const { customerid } = payload;

      return {

        ...state,

        customerid,

        customer: { ...state.customer, customerid },

      };

    }

    case types.SET_CARD: {

      return {

        ...state,

        card: payload,

        item: { ...item, cardname: payload ? payload.cardname : null },

      };

    }

    case types.FETCH_ORDERITEM_PRICE_PENDING: {

      return {

        ...state,

        item: { ...item, price: empty_item_price },

        price_pending: true,

        price_error: null,

      };

    }

    case types.FETCH_ORDERITEM_PRICE_REJECTED: {

      return {

        ...state,

        item: { ...item, price: empty_item_price },

        price_pending: false,

        price_error: payload,

      };

    }

    case types.FETCH_ORDERITEM_ALTERNATIVE_PRICE_FULFILLED: {

      return {

        ...state,

        item: {

          ...item,

          alternative_price: payload,

        },

        alternative_price_pending: false,

        alternative_price_error: null,

      };

    }

    case types.FETCH_ORDERITEM_ALTERNATIVE_PRICE_PENDING: {

      return {

        ...state,

        item: { ...item, alternative_price: null },

        alternative_price_pending: true,

        alternative_price_error: null,

      };

    }

    case types.FETCH_ORDERITEM_ALTERNATIVE_PRICE_REJECTED: {

      return {

        ...state,

        item: { ...item, alternative_price: null },

        alternative_price_pending: false,

        alternative_price_error: payload,

      };

    }

    case types.SET_PRODUCT: {

      const s = isSourceMain ? clearFormula(state) : state;

      return {

        ...s,

        product: payload,

        item: { ...s.item, productname: payload ? payload.productzname : null },

      };

    }



    case types.SET_CAN: {

      const { can } = payload;

      return {

        ...state,

        can,

        validation: null,

        item: {

          ...item,

          cansizecode: can ? can.cansizecode : null,

          cnts: null,

        },

      };

    }

    case types.SET_ITEM_STATUS: {

      return { ...state, item: { ...item, status: payload } };

    }

    case types.SET_ITEM_CLOSED: {

      return { ...state, item: { ...item, closed: true } };

    }

    case types.CHECK_FORMULA_FULFILLED: {

      let checked_cnts = [];



      for (let cnt of state.item.cnts) {

        const check_res = _.find(payload, (x) => x.code === cnt.cntcode);

        checked_cnts.push({ ...check_res, ...cnt });

      }

      const base = _.find(payload, (x) => x.code === state.base?.basecode);

      return {

        ...state,

        // cntcode is code in machine section

        engine_check: checked_cnts,

        base_check: base ? { ...base, ...state.base } : null,

        engine_validation: payload.length

          ? Math.max(...payload.map((x) => x.warn))

          : MACHINE_VALIDATE_OK,

      };

    }

    case types.SET_BASE: {

      const base = payload;

      const basecode = base ? base.basecode : null;

      const abasecode =

        base && base.abstractbase && base.abstractbase.abasecode;

      const s = isSourceMain ? clearFormula(state) : state;

      return { ...s, base, item: { ...s.item, basecode, abasecode } };

    }

    case types.SET_ORIGINAL_FORMULA: {

      const { original_formula } = payload;

      const initial_formula = payload.initial_formula || original_formula;

      if (!original_formula) {

        return clearFormula(state);

      }

      if (isSourceMain && !validateColouridProductid(state, original_formula)) {

        return state;

      }

      return { ...state, original_formula, initial_formula };

    }



    case types.SET_FORMULA_FULFILLED: {

      const formula = payload;

      if (!formula) {

        return clearFormula(state);

      }

      if (isSourceMain && !validateColouridProductid(state, formula)) {

        return state;

      }

      return {

        ...state,

        formula,

        item: {

          ...item,

          cnts: null,

        },

        engine_validation: null, // Results from machine

        engine_check: null, // Results from machine

        base_check: null, // Results from machine (base dosing)

      };

    }

    case types.SET_SCALED_CNTS: {

      return { ...state, item: { ...item, cnts: payload } };

    }

    case types.SET_PRE_TINT_MODALS: {

      return { ...state, pre_tint_modals: payload };

    }

    case machineActionTypes.TINT_ERROR_STATUS: {

      return {

        ...state,

        tinting_error: payload,

      };

    }

    case machineActionTypes.TINT_WEIGHED: {

      return {

        ...state,

        tinting_result: payload.tinting_result,

      };

    }

    case types.TINT_CAN_READY: {

      if (payload.itemid === state.item.itemid) {

        const ncans_tinted = state.ncans_tinted + 1;

        return {

          ...state,

          ncans_tinted,

        };

      } else {

        return state;

      }

    }

    case types.SET_PREVIOUS_SECTION: {

      return {

        ...state,

        prev_section: payload,

      };

    }



    case types.RETINT_ORDER: {

      const now = new Date().toISOString();

      return {

        ...state,

        orderdate: now,

        modificationdate: now,

        orderid: null,

        ncans_tinted: 0,

        tinting_error: null,

        tinting_result: null,

        notes: null,

        status: ORDER_STATUS_WAITING,

        item: {

          ...item,

          itemid: null,

          note: null,

          status: ORDER_STATUS_WAITING,

          closed: false,

        },

      };

    }

    case types.RETINT_ITEM: {

      const now = new Date().toISOString();

      return {

        ...state,

        orderdate: state.orderdate || now,

        modificationdate: now,

        ncans_tinted: 0,

        tinting_error: null,

        tinting_result: null,

        status: ORDER_STATUS_WAITING,

        item: {

          ...item,

          itemid: null,

          note: null,

          status: ORDER_STATUS_WAITING,

          closed: false,

        },

      };

    }



    case types.SET_COLOURCODE:

      if (isSourceMain) return state;

      if (state.item.manually_set_colorcode && !payload.manual_set_code) {

        return state;

      }

      return {

        ...state,

        item: {

          ...item,

          manually_set_colorcode: payload.manual_set_code,

          originalCode: payload.manual_set_code

            ? payload.code

            : item.originalCode

              ? item.originalCode

              : item.colourcode,

          colourcode: payload.code,

        },

      };



    case types.SET_RGB:

      return { ...state, item: { ...item, rgb: payload } };

    case types.SET_RGB_BEFORE_EDIT:

      return {

        ...state,

        item: { ...item, rgb_before_edit: payload },

      };



    case types.SET_SCALEDBY: {

      return {

        ...state,

        item: { ...item, scaledby: payload },

      };

    }



    case types.SET_ITEM_EDITED: {

      return {

        ...state,

        item: { ...item, itemEdited: payload },

      };

    }

    case types.SET_FORMULA_CORRECTION_TYPE: {

      return {

        ...state,

        item: { ...item, formulaCorrectionType: payload },

      };

    }

    case types.SET_ADDITION_ONLY: {

      return {

        ...state,

        item: { ...item, additionOnly: payload },

      };

    }

    case types.SET_FORMULA_CORRECTION_SCALING_FACTOR: {

      return {

        ...state,

        item: { ...item, formulaCorrectionScalingFactor: payload },

      };

    }

    case types.SET_PRIMER_COLOUR:

    case types.ADD_PRIMER_TO_ORDER_FULFILLED: {

      return {

        ...state,

        item: {

          ...item,

          primer_color: payload,

          primer_color_error: null,

          primer_color_start: false,

        },

      };

    }

    case types.ADD_PRIMER_TO_ORDER_PENDING: {

      return {

        ...state,

        item: {

          ...item,

          primer_color: null,

          primer_color_error: null,

          primer_color_start: true,

        },

      };

    }

    case types.ADD_PRIMER_TO_ORDER_REJECTED: {

      return {

        ...state,

        item: {

          ...item,

          primer_color: null,

          primer_color_error: payload,

          primer_color_start: false,

        },

      };

    }

    case types.IS_COLOURCODE_FREE_FULFILLED: {

      return {

        ...state,

        isColourcodeFree: payload,

        isColourcodeFree_pending: false,

        isColourcodeFree_rejected: null,

      };

    }

    case types.IS_COLOURCODE_FREE_PENDING: {

      return {

        ...state,

        isColourcodeFree: true,

        isColourcodeFree_pending: true,

        isColourcodeFree_rejected: null,

      };

    }

    case types.IS_COLOURCODE_FREE_REJECTED: {

      return {

        ...state,

        isColourcodeFree: false,

        isColourcodeFree_pending: false,

        isColourcodeFree_rejected: payload,

      };

    }

    default: {

      return state;

    }

  }

}



export function cnts_to_tint(order, check = false) {

  const { cnts, additionOnly } = order.item;

  const { engine_check } = order;

  if (cnts && (engine_check || !check)) {

    const filtered = cnts

      .map((cnt) => {

        const { volume, additionvolume, ...rest } = cnt;

        return { ...rest, volume: additionOnly ? additionvolume : volume };

      })

      .filter(({ volume }) => volume > ZERO_VOLUME_THRESHOLD_ML);



    if (check) {

      return filtered.map((cnt) => {

        const checked = engine_check.find((c) => c.cntcode === cnt.cntcode);

        return { ...cnt, warn: checked?.warn };

      });

    }



    return filtered;

  }

}



const localSelectors = {

  order: (state) => state,

  orderid: (state) => state.orderid,

  itemstatus: (state) => state.item.status,

  itemclosed: (state) => state.item.closed,

  itemid: (state) => state.item.itemid,

  primer_color: (state) => state.item.primer_color,

  itemCnts: (state) => state.item.cnts,

  itemColourcode: (state) =>

    state.item.colourcode ? state.item.colourcode : state.color.colourcode,

  itemEdited: (state) => state.item.itemEdited,

  card: (state) => state.card,

  product: (state) => state.product,

  base: (state) => state.base,

  color: (state) => state.color,

  colorcode: (state) => state.color.colourcode,

  can: (state) => state.can,

  formula: (state) => state.formula,

  initial_formula: (state) => state.initial_formula,

  original_formula: (state) => state.original_formula,

  number_of_cans: (state) => state.item.ncans,

  tinting_error: (state) => state.tinting_error,

  color_search_mode: (state) => state.color_search_mode,

  product_search_mode: (state) => state.product_search_mode,

  open_section: (state) => state.open_section,

  customer: (state) => state.customer,

  order_mode: (state) => state.order_mode,

  order_start_section: (state) => state.order_start_section,

  prev_section: (state) => state.prev_section,

  price_pending: (state) => state.price_pending,

  pre_tint_modals: (state) => state.pre_tint_modals,

  originalCode: (state) => state.item.originalCode || state.color.colourcode,

  allowAdditionOnly: (state) =>

    state.item.cnts?.every(

      ({ additionvolume: v }) => v != null && v > -ZERO_VOLUME_THRESHOLD_ML

    ),

  isAdditionOnly: (state) => state.item.additionOnly,

  formulaAdditionOnly: (state) => state.item.formulaAdditionOnly,

  formulaCorrectionScalingFactor: (state) =>

    state.item.formulaCorrectionScalingFactor,



  summary: (state, ncans_after = true) =>

    [

      state.item.colourcode,

      state.item.productname,

      state.item.basecode,

      state.item.cansizecode,

      `${state.ncans_tinted + (ncans_after ? 1 : 0)}/${state.item.ncans}`,

      `itemid ${state.item.itemid}`,

    ].join(', '),



  adjacentCans: (state) => {

    // previous and next can from base.cans array

    let prev = null;

    let next = null;

    if (

      state.order_mode === ORDER_MODE_NORMAL

        ? state.can && state.base

        : state.can

    ) {

      const { base, order_mode, product } = state;

      const { cansizeid } = state.can;

      const canSizeIds =

        order_mode === ORDER_MODE_MATCHING &&

        product &&

        new Set(

          product.basepaints

            .map((paint) => paint.cans.map((cansize) => cansize.cansizeid))

            .flat()

        );



      const allCanSizesObj =

        order_mode === ORDER_MODE_MATCHING &&

        product &&

        Array.from(canSizeIds)

          .map((value) =>

            product.basepaints

              .map((paint) =>

                paint.cans.filter((can) => can.cansizeid === value)

              )

              .flat()

          )

          .flat()

          .reduce((obj, can) => {

            obj[can.cansizeid] = can;

            return obj;

          }, {});



      const allCanSizes = allCanSizesObj

        ? Object.keys(allCanSizesObj).map((key) => ({

            ...allCanSizesObj[key],

          }))

        : [];



      const cans = base ? base.cans : (product && allCanSizes) || [];



      const current = cans.findIndex((x) => x.cansizeid === cansizeid);

      if (current > -1 && current < cans.length - 1) {

        next = cans[current + 1];

      }

      if (current > 0) {

        prev = cans[current - 1];

      }

    }

    return [prev, next];

  },



  machineFormat: (state, baseDosing) => {

    const order = state;

    const {

      productname,

      basecode,

      cansizecode,

      ncans,

      cnts,

      itemid,

      formulaCorrectionScalingFactor,

      additionOnly,

    } = order.item;

    if (cnts) {

      const to_tint = cnts_to_tint(order);

      const dropColors = to_tint.map(({ rgb }) => RGBColorToHex(rgb));

      const ingredients = to_tint.map(({ cntcode, volume }) => ({

        code: cntcode,

        volume,

      }));



      if (baseDosing && order.order_mode !== ORDER_MODE_FREE_DISPENSE) {

        let { basevolume } = order.can;

        if (additionOnly) {

          basevolume *= formulaCorrectionScalingFactor - 1;

        }

        if (basevolume > ZERO_VOLUME_THRESHOLD_ML) {

          ingredients.push({

            code: basecode,

            volume: basevolume,

          });

        }

      }



      return {

        itemID: itemid,

        productName: productname,

        cansTinted: order.ncans_tinted,

        lotSize: ncans,

        dropColors,

        formula: {

          base: basecode,

          cnts: ingredients,

        },

        can: {

          name: cansizecode,

          punch: 1, // ask user

          // shelfPositions: [-1, 0, 1], default on Driver side

        },

      };

    }

  },



  orderitemprice: (state) => {

    const values = state.item.price?.incTaxCan || {};

    const result = _.fromPairs(

      EI_VARS_ORDERITEMPRICE_TABLE.map((x) => [x.toLowerCase(), values[x]])

    );

    result.actual = true;

    return result;

  },



  /*apiFormat: state => {

    // Remove when format is finished!

    // eslint-disable-next-line no-unused-vars

    const {

      colourcode,

      rgb,

      productname,

      basecode,

      cansizecode,

      ncans,

      cnts,

      notes,

      status,

      itemid,

    } = state.item;



    return {};

  }, */

};



const selectors = globalizeSelectors(localSelectors, mountPath);



export {

  types as actionTypes,

  actions as default,

  propType,

  selectors,

  reducer,

};


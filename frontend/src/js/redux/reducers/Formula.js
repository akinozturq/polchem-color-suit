import PropTypes from 'prop-types';
import { globalizeSelectors } from '../Utils';
import { COLDATACLASS_SPHERE } from 'js/Constants';

const types = {
  CLEAR_SEARCHES: 'FORMULA/CLEAR_SEARCHES',

  FETCH_COLORS: 'FETCH_COLORS',
  FETCH_COLORS_PENDING: 'FETCH_COLORS_PENDING',
  FETCH_COLORS_FULFILLED: 'FETCH_COLORS_FULFILLED',
  FETCH_COLORS_REJECTED: 'FETCH_COLORS_REJECTED',
  FETCH_PRODUCT_CARDS: 'FORMULA/FETCH_PRODUCT_CARDS',
  FETCH_PRODUCT_CARDS_PENDING: 'FORMULA/FETCH_PRODUCT_CARDS_PENDING',
  FETCH_PRODUCT_CARDS_FULFILLED: 'FORMULA/FETCH_PRODUCT_CARDS_FULFILLED',
  FETCH_PRODUCT_CARDS_REJECTED: 'FORMULA/FETCH_PRODUCT_CARDS_REJECTED',

  FETCH_PROD_WITH_FORMULA: 'FORMULA/PROD_WITH_FORMULA',
  FETCH_PROD_WITH_FORMULA_PENDING: 'FORMULA/PROD_WITH_FORMULA_PENDING',
  FETCH_PROD_WITH_FORMULA_FULFILLED: 'FORMULA/PROD_WITH_FORMULA_FULFILLED',
  FETCH_PROD_WITH_FORMULA_REJECTED: 'FORMULA/PROD_WITH_FORMULA_REJECTED',

  SET_COLOR_DETAILS: 'FORMULA/SET_COLOR_DETAILS',
  SET_CLOSEST_SEARCH_COLORCARD: 'FORMULA/SET_CLOSEST_SEARCH_COLORCARD',

  FETCH_FORMULA: 'FETCH_FORMULA',
  FETCH_FORMULA_PENDING: 'FETCH_FORMULA_PENDING',
  FETCH_FORMULA_FULFILLED: 'FETCH_FORMULA_FULFILLED',
  FETCH_FORMULA_REJECTED: 'FETCH_FORMULA_REJECTED',

  FETCH_LOCAL_FORMULA: 'FORMULA/FETCH_LOCAL_FORMULA',
  FETCH_LOCAL_FORMULA_PENDING: 'FORMULA/FETCH_LOCAL_FORMULA_PENDING',
  FETCH_LOCAL_FORMULA_FULFILLED: 'FORMULA/FETCH_LOCAL_FORMULA_FULFILLED',
  FETCH_LOCAL_FORMULA_REJECTED: 'FORMULA/FETCH_LOCAL_FORMULA_REJECTED',
  HIDE_LOCAL_FORMULA: 'FORMULA/HIDE_LOCAL_FORMULA',

  SET_CUSTOM_FORMULA_MODE: 'FORMULA/SET_CUSTOM_FORMULA_MODE',

  FETCH_COMPATIBLE_LOCALFRM_PROD: 'FORMULA/FETCH_COMPATIBLE_LOCALFRM_PROD',
  FETCH_COMPATIBLE_LOCALFRM_PROD_PENDING:
    'FORMULA/FETCH_COMPATIBLE_LOCALFRM_PROD_PENDING',
  FETCH_COMPATIBLE_LOCALFRM_PROD_FULFILLED:
    'FORMULA/FETCH_COMPATIBLE_LOCALFRM_PROD_FULFILLED',
  FETCH_COMPATIBLE_LOCALFRM_PROD_REJECTED:
    'FORMULA/FETCH_COMPATIBLE_LOCALFRM_PROD_REJECTED',

  SYNTHESIZE_RGB: 'FORMULA/SYNTHESIZE_RGB',
  SYNTHESIZE_RGB_BEFORE_EDIT: 'FORMULA/SYNTHESIZE_RGB_BEFORE_EDIT',

  SEARCH_CLOSEST: 'FORMULA/SEARCH_CLOSEST',
  SEARCH_CLOSEST_PENDING: 'FORMULA/SEARCH_CLOSEST_PENDING',
  SEARCH_CLOSEST_FULFILLED: 'FORMULA/SEARCH_CLOSEST_FULFILLED',
  SEARCH_CLOSEST_REJECTED: 'FORMULA/SEARCH_CLOSEST_REJECTED',

  MATCH_FORMULA: 'FORMULA/MATCH_FORMULA',
  MATCH_FORMULA_PENDING: 'FORMULA/MATCH_FORMULA_PENDING',
  MATCH_FORMULA_FULFILLED: 'FORMULA/MATCH_FORMULA_FULFILLED',
  MATCH_FORMULA_REJECTED: 'FORMULA/MATCH_FORMULA_REJECTED',
  ALTERNATIVE_MATCHING: 'FORMULA/ALTERNATIVE_MATCHING',

  CORRECT_FORMULA: 'FORMULA/CORRECT_FORMULA',
  CORRECT_FORMULA_PENDING: 'FORMULA/CORRECT_FORMULA_PENDING',
  CORRECT_FORMULA_FULFILLED: 'FORMULA/CORRECT_FORMULA_FULFILLED',
  CORRECT_FORMULA_REJECTED: 'FORMULA/CORRECT_FORMULA_REJECTED',

  FETCH_COLOR_DETAILS: 'FORMULA/FETCH_COLOR_DETAILS',
  FETCH_COLOR_DETAILS_PENDING: 'FORMULA/FETCH_COLOR_DETAILS_PENDING',
  FETCH_COLOR_DETAILS_FULFILLED: 'FORMULA/FETCH_COLOR_DETAILS_FULFILLED',
  FETCH_COLOR_DETAILS_REJECTED: 'FORMULA/FETCH_COLOR_DETAILS_REJECTED',

  CLEAR_PRIMER: 'FORMULA/CLEAR_PRIMER',
  CHOOSE_PRIMER: 'FORMULA/CHOOSE_PRIMER',
  CHOOSE_PRIMER_PENDING: 'FORMULA/CHOOSE_PRIMER_PENDING',
  CHOOSE_PRIMER_FULFILLED: 'FORMULA/CHOOSE_PRIMER_FULFILLED',
  CHOOSE_PRIMER_REJECTED: 'FORMULA/CHOOSE_PRIMER_REJECTED',
  ACK_PRIMER: 'FORMULA/ACK_PRIMER',

  FETCH_FORMULA_CHANGES: 'FORMULA/FETCH_FORMULA_CHANGES',
  FETCH_FORMULA_CHANGES_PENDING: 'FORMULA/FETCH_FORMULA_CHANGES_PENDING',
  FETCH_FORMULA_CHANGES_FULFILLED: 'FORMULA/FETCH_FORMULA_CHANGES_FULFILLED',
  FETCH_FORMULA_CHANGES_REJECTED: 'FORMULA/FETCH_FORMULA_CHANGES_REJECTED',
};

export const CUSTOM_FORMULA_ORIGINAL = 'ORIGINAL';
export const CUSTOM_FORMULA_COMPATIBLE = 'COMPATIBLE';
export const CUSTOM_FORMULA_NEW = 'NEW';

const actions = {
  /**
   * Reading autohorisation token from local storage
   * @param search {string} to search
   * @returns action
   */
  clearSearches: () => ({ type: types.CLEAR_SEARCHES }),

  fetchProductsWithFormulas: (colourid) => ({
    type: types.FETCH_PROD_WITH_FORMULA,
    payload: colourid,
  }),
  fetchLocalFormulaCompatibleProducts: (itemid, baseid) => ({
    type: types.FETCH_COMPATIBLE_LOCALFRM_PROD,
    payload: { itemid, baseid },
  }),
  fetchCardsForProduct: (productid) => ({
    type: types.FETCH_PRODUCT_CARDS,
    payload: productid,
  }),
  searchColors: (search) => ({ type: types.FETCH_COLORS, payload: search }),

  loadFormula: (colourid, productid, can = null) => ({
    type: types.FETCH_FORMULA,
    payload: { colourid, productid, can },
  }),

  // Loading local formulas from database
  searchLocalFormulas: (search) => ({
    type: types.FETCH_LOCAL_FORMULA,
    payload: search,
  }),
  // "Delete" -actually hide- local formula
  hideLocalFormula: (itemid) => ({
    type: types.HIDE_LOCAL_FORMULA,
    payload: itemid,
  }),
  // Set custom formula mode
  // mode can be one of CUSTOM_FORMULA_ORIGINAL, CUSTOM_FORMULA_COMPATIBLE, CUSTOM_FORMULA_NEW
  setCustomFormulaMode: (mode) => ({
    type: types.SET_CUSTOM_FORMULA_MODE,
    payload: mode,
  }),

  synthesizeRgb: (formula) => ({
    type: types.SYNTHESIZE_RGB,
    payload: { before: false, formula },
  }),
  synthesizeRgbBeforeEdit: () => ({
    type: types.SYNTHESIZE_RGB_BEFORE_EDIT,
    payload: { before: true, formula: null },
  }),

  searchClosest: (
    lab,
    productid,
    can,
    colourid = null,
    coldataclass = COLDATACLASS_SPHERE,
    refl = null,
    colourcardid = null
  ) => ({
    type: types.SEARCH_CLOSEST,
    payload: {
      lab,
      productid,
      can,
      colourid,
      coldataclass,
      refl,
      colourcardid,
    },
  }),
  matchFormula: (
    refl,
    productid,
    can,
    baseids = null,
    template = null,
    cntids = null
  ) => ({
    type: types.MATCH_FORMULA,
    payload: { refl, productid, can, baseids, template, cntids },
  }),
  correctFormula: () => ({ type: types.CORRECT_FORMULA }),

  fetchColorDetails: (colourid) => ({
    type: types.FETCH_COLOR_DETAILS,
    payload: { colourid },
  }),
  setColorDetails: (color) => ({
    type: types.SET_COLOR_DETAILS,
    payload: color,
  }),
  alternativeMatching: (value) => ({
    type: types.ALTERNATIVE_MATCHING,
    payload: value,
  }),

  setClosestSearchColorCard: (colorCard) => ({
    type: types.SET_CLOSEST_SEARCH_COLORCARD,
    payload: colorCard,
  }),

  // Initiates the primer recommendation query if enabled
  choosePrimer: () => ({ type: types.CHOOSE_PRIMER }),

  clearPrimer: () => ({
    type: types.CLEAR_PRIMER,
  }),

  // Dismisses the primer recommendation card
  acknowledgePrimer: () => ({
    type: types.ACK_PRIMER,
  }),

  // fetches formula changes
  fetchFormulaChanges: () => ({
    type: types.FETCH_FORMULA_CHANGES,
  }),
};

/*
 * prop type for state shape
 */
const propType = PropTypes.shape({
  match_rs: PropTypes.object,
  correct_rs: PropTypes.object,
  match_rs_error: PropTypes.object,
  correct_rs_error: PropTypes.object,
  match_rs_start: PropTypes.bool,
  correct_rs_start: PropTypes.bool,
  search_closest_rs: PropTypes.object,
  search_closest_rs_start: PropTypes.bool,
  cntinformula: PropTypes.array,
  color_details: PropTypes.shape({
    reflectance: PropTypes.object,
    lab: PropTypes.array,
  }),
  rules: PropTypes.shape({
    cnt_violations: PropTypes.array,
  }),
  closest_search_colorcard: PropTypes.object,
});

const initial_state = {
  // Order details
  colors: [],
  color_search_str: null,
  fetch_colors_error: null,
  fetch_colors_start: false,

  product_cards: null,
  product_cards_error: null,
  product_cards_start: false,

  // Products which have formula
  products_having_formula: null,
  product_search_str: null,
  fetch_products_having_formula_error: null,
  fetch_products_having_formula_start: false,

  frms: [],
  fetch_frms_error: null,
  fetch_frms_start: false,
  alternative_matching: false,

  // Local formula related
  local_frms: [],
  local_fetch_frms_error: null,
  local_fetch_frms_start: false,

  compatible_local_frms: [],
  compatible_local_fetch_frms_error: null,
  compatible_local_fetch_frms_start: false,

  custom_formula_mode: CUSTOM_FORMULA_ORIGINAL,

  // Matching results
  search_closest_rs: {},
  search_closest_rs_error: null,
  search_closest_rs_start: false,
  match_rs: null,
  match_rs_error: null,
  match_rs_start: false,
  correct_rs: {},
  correct_rs_error: null,
  correct_rs_start: false,

  // color details
  color_details: null,
  color_details_error: null,
  color_details_start: false,
  // primer details
  recommended_primer: null,
  recommended_primer_error: null,
  recommended_primer_start: false,
  recommended_primer_ack: false,

  // formula changes
  formula_changes: null,
  fetch_formula_changes_error: null,
  fetch_formula_changes_start: false,
};

/**
 * reducer which updates the order state in data store
 * @param {*} state
 * @param {*} action
 */
function reducer(state = initial_state, action) {
  switch (action.type) {
    case types.CLEAR_SEARCHES: {
      return {
        ...initial_state,
        closest_search_colorcard: state.closest_search_colorcard,
      };
    }
    case types.FETCH_PRODUCT_CARDS_PENDING: {
      return { ...state, product_cards_start: true, product_cards_error: null };
    }
    case types.FETCH_PRODUCT_CARDS_FULFILLED: {
      return {
        ...state,
        product_cards_start: false,
        product_cards: action.payload,
        product_cards_error: null,
      };
    }
    case types.FETCH_PRODUCT_CARDS_REJECTED: {
      return {
        ...state,
        product_cards_start: false,
        product_cards: [],
        product_cards_error: action.payload,
      };
    }
    case types.FETCH_FORMULA_PENDING: {
      return { ...state, fetch_frms_start: true, fetch_frms_error: null };
    }
    case types.FETCH_FORMULA_REJECTED: {
      return {
        ...state,
        fetch_frms_start: false,
        frms: [],
        fetch_frms_error: action.payload,
      };
    }
    case types.FETCH_FORMULA_FULFILLED: {
      return {
        ...state,
        fetch_frms_start: false,
        frms: action.payload,
        fetch_frms_error: null,
      };
    }
    case types.FETCH_LOCAL_FORMULA_PENDING: {
      return {
        ...state,
        local_fetch_frms_start: true,
        local_fetch_frms_error: null,
      };
    }
    case types.FETCH_LOCAL_FORMULA_REJECTED: {
      return {
        ...state,
        local_fetch_frms_start: false,
        local_frms: [],
        local_fetch_frms_error: action.payload,
      };
    }
    case types.FETCH_LOCAL_FORMULA_FULFILLED: {
      return {
        ...state,
        local_fetch_frms_start: false,
        local_frms: action.payload,
        local_fetch_frms_error: null,
      };
    }
    case types.HIDE_LOCAL_FORMULA: {
      return {
        ...state,
        local_frms: state.local_frms.filter((x) => x.itemid !== action.payload),
      };
    }
    case types.FETCH_COMPATIBLE_LOCALFRM_PROD_PENDING: {
      return {
        ...state,
        compatible_local_fetch_frms_start: true,
        compatible_local_fetch_frms_error: null,
      };
    }
    case types.FETCH_COMPATIBLE_LOCALFRM_PROD_REJECTED: {
      return {
        ...state,
        compatible_local_fetch_frms_start: false,
        compatible_local_frms: [],
        compatible_local_fetch_frms_error: action.payload,
      };
    }
    case types.FETCH_COMPATIBLE_LOCALFRM_PROD_FULFILLED: {
      return {
        ...state,
        compatible_local_fetch_frms_start: false,
        compatible_local_frms: action.payload,
        compatible_local_fetch_frms_error: null,
      };
    }
    case types.SET_CUSTOM_FORMULA_MODE: {
      return {
        ...state,
        custom_formula_mode: action.payload,
      };
    }
    case types.FETCH_PROD_WITH_FORMULA_PENDING: {
      return {
        ...state,
        products_having_formula: [],
        fetch_products_having_formula_start: true,
        fetch_products_having_formula_error: null,
      };
    }
    case types.FETCH_PROD_WITH_FORMULA_REJECTED: {
      return {
        ...state,
        fetch_products_having_formula_start: false,
        fetch_products_having_formula_error: action.payload,
      };
    }
    case types.FETCH_PROD_WITH_FORMULA_FULFILLED: {
      return {
        ...state,
        fetch_products_having_formula_start: false,
        products_having_formula: action.payload,
        fetch_products_having_formula_error: null,
      };
    }

    case types.FETCH_COLORS_PENDING: {
      return { ...state, fetch_colors_start: true, fetch_colors_error: null };
    }
    case types.FETCH_COLORS_REJECTED: {
      return {
        ...state,
        fetch_colors_start: false,
        colors: [],
        fetch_colors_error: action.payload,
      };
    }
    case types.FETCH_COLORS_FULFILLED: {
      return {
        ...state,
        fetch_colors_start: false,
        colors: action.payload.data,
        fetch_colors_error: null,
        color_search_str: action.payload.search,
      };
    }

    case types.SEARCH_CLOSEST_PENDING: {
      return {
        ...state,
        search_closest_rs_start: true,
        search_closest_rs_error: null,
      };
    }
    case types.SEARCH_CLOSEST_REJECTED: {
      return {
        ...state,
        search_closest_rs_start: false,
        search_closest_rs: {},
        search_closest_rs_error: action.payload,
      };
    }
    case types.SEARCH_CLOSEST_FULFILLED: {
      return {
        ...state,
        search_closest_rs_start: false,
        search_closest_rs: action.payload,
        search_closest_rs_error: null,
      };
    }

    case types.MATCH_FORMULA_PENDING: {
      return { ...state, match_rs_start: true, match_rs_error: null };
    }
    case types.MATCH_FORMULA_REJECTED: {
      return {
        ...state,
        match_rs_start: false,
        match_rs: null,
        match_rs_error: action.payload,
      };
    }
    case types.MATCH_FORMULA_FULFILLED: {
      return {
        ...state,
        match_rs_start: false,
        match_rs: action.payload,
        match_rs_error: null,
      };
    }

    case types.CORRECT_FORMULA_PENDING: {
      return { ...state, correct_rs_start: true, correct_rs_error: null };
    }
    case types.CORRECT_FORMULA_REJECTED: {
      return {
        ...state,
        correct_rs_start: false,
        correct_rs: {},
        correct_rs_error: action.payload,
      };
    }
    case types.CORRECT_FORMULA_FULFILLED: {
      return {
        ...state,
        correct_rs_start: false,
        correct_rs: action.payload,
        correct_rs_error: null,
      };
    }

    case types.FETCH_COLOR_DETAILS_PENDING: {
      return { ...state, color_details_start: true, color_details_error: null };
    }
    case types.FETCH_COLOR_DETAILS_REJECTED: {
      return {
        ...state,
        color_details_start: false,
        color_details: null,
        match_rs_error: action.payload,
      };
    }
    case types.FETCH_COLOR_DETAILS_FULFILLED: {
      return {
        ...state,
        color_details_start: false,
        color_details: action.payload,
        color_details_error: null,
      };
    }
    case types.CHOOSE_PRIMER_PENDING: {
      return {
        ...state,
        recommended_primer_start: true,
        recommended_primer_error: null,
        recommended_primer: null,
        recommended_primer_ack: false,
      };
    }
    case types.CHOOSE_PRIMER_REJECTED: {
      return {
        ...state,
        recommended_primer_start: false,
        recommended_primer: null,
        recommended_primer_error: action.payload,
      };
    }
    case types.CHOOSE_PRIMER_FULFILLED: {
      return {
        ...state,
        recommended_primer_start: false,
        recommended_primer: action.payload,
        recommended_primer_error: null,
      };
    }

    case types.CLEAR_PRIMER: {
      return {
        ...state,
        recommended_primer_start: false,
        recommended_primer: null,
        recommended_primer_error: null,
        recommended_primer_ack: false,
      };
    }

    case types.ACK_PRIMER: {
      return {
        ...state,
        recommended_primer_ack: true,
      };
    }

    case types.SET_COLOR_DETAILS: {
      return {
        ...state,
        color_details: action.payload,
      };
    }
    case types.SET_CLOSEST_SEARCH_COLORCARD: {
      return {
        ...state,
        closest_search_colorcard: action.payload,
      };
    }
    case types.ALTERNATIVE_MATCHING: {
      return {
        ...state,
        alternative_matching: action.payload,
      };
    }

    case types.FETCH_FORMULA_CHANGES_PENDING: {
      return {
        ...state,
        fetch_formula_changes_start: true,
        fetch_formula_changes_error: null,
      };
    }
    case types.FETCH_FORMULA_CHANGES_REJECTED: {
      return {
        ...state,
        fetch_formula_changes_start: false,
        formula_changes: null,
        fetch_formula_changes_error: action.payload,
      };
    }
    case types.FETCH_FORMULA_CHANGES_FULFILLED: {
      return {
        ...state,
        fetch_formula_changes_start: false,
        formula_changes: action.payload,
        fetch_formula_changes_error: null,
      };
    }

    default: {
      return state;
    }
  }
}

const mountPath = 'formula';

const localSelectors = {
  recommended_primer: (state) => state.recommended_primer,
  primer_check_pending: (state) => state.recommended_primer_start,
  show_primer: (state) =>
    (state.recommended_primer_start || state.recommended_primer) &&
    !state.recommended_primer_ack,
  color_search_str: (state) => state.color_search_str,
  product_search_str: (state) => state.product_search_str,
  products_having_formula: (state) => state.products_having_formula,
  compatible_local_frms: (state) => state.compatible_local_frms,
  local_frms: (state) => state.local_frms,
  custom_formula_mode: (state) => state.custom_formula_mode,
  get_formula_correction: (state, key) => state.correct_rs[key],
  alternative_matching: (state) => state.alternative_matching,
  frms: (state) => state.frms,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export {
  types as actionTypes,
  actions as default,
  propType,
  selectors,
  reducer,
};

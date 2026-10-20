import _ from 'lodash';
import { globalizeSelectors } from '../Utils';

const mountPath = 'pricing';

const types = {
  FETCH_PRICING_BUNDLE: 'PRICING/FETCH_PRICING_BUNDLE',
  FETCH_PRICING_BUNDLE_PENDING: 'PRICING/FETCH_PRICING_BUNDLE_PENDING',
  FETCH_PRICING_BUNDLE_FULFILLED: 'PRCING/FETCH_PRICING_BUNDLE_FULFILLED',
  FETCH_PRICING_BUNDLE_REJECTED: 'PRICING/FETCH_PRICING_BUNDLE_REJECTED',

  FETCH_PRODUCTS_PRICING: 'PRICING/FETCH_PRODCUTS_PRICING',
  FETCH_PRODUCTS_PRICING_PENDING: 'PRICING/FETCH_PRODCUTS_PRICING_PENDING',
  FETCH_PRODUCTS_PRICING_FULFILLED: 'PRCING/FETCH_PRODCUTS_PRICING_FULFILLED',
  FETCH_PRODUCTS_PRICING_REJECTED: 'PRICING/FETCH_PRODCUTS_PRICING_REJECTED',

  FETCH_COLORANTS_PRICING: 'PRICING/FETCH_COLORANTS_PRICING',
  FETCH_COLORANTS_PRICING_PENDING: 'PRICING/FETCH_COLORANTS_PRICING_PENDING',
  FETCH_COLORANTS_PRICING_FULFILLED: 'PRCING/FETCH_COLORANTS_PRICING_FULFILLED',
  FETCH_COLORANTS_PRICING_REJECTED: 'PRICING/FETCH_COLORANTS_PRICING_REJECTED',

  SET_COMMON_PRICING: 'PRICING/SET_COMMON_PRICING',
  SET_COMMON_PRICING_PENDING: 'PRICING/SET_COMMON_PRICING_PENDING',
  SET_COMMON_PRICING_FULFILLED: 'PRCING/SET_COMMON_PRICING_FULFILLED',
  SET_COMMON_PRICING_REJECTED: 'PRICING/SET_COMMON_PRICING_REJECTED',

  SET_COLORANTS_PRICING: 'PRICING/SET_COLORANTS_PRICING',
  SET_COLORANTS_PRICING_PENDING: 'PRICING/SET_COLORANTS_PRICING_PENDING',
  SET_COLORANTS_PRICING_FULFILLED: 'PRCING/SET_COLORANTS_PRICING_FULFILLED',
  SET_COLORANTS_PRICING_REJECTED: 'PRICING/SET_COLORANTS_PRICING_REJECTED',

  SET_CANSIZES_PRICING: 'PRICING/SET_CANSIZES_PRICING',
  SET_CANSIZES_PRICING_PENDING: 'PRICING/SET_CANSIZES_PRICING_PENDING',
  SET_CANSIZES_PRICING_FULFILLED: 'PRCING/SET_CANSIZES_PRICING_FULFILLED',
  SET_CANSIZES_PRICING_REJECTED: 'PRICING/SET_CANSIZES_PRICING_REJECTED',

  SET_PRODUCT_PRICING: 'PRICING/SET_PRODUCT_PRICING',
  SET_PRODUCT_PRICING_PENDING: 'PRICING/SET_PRODUCT_PRICING_PENDING',
  SET_PRODUCT_PRICING_FULFILLED: 'PRCING/SET_PRODUCT_PRICING_FULFILLED',
  SET_PRODUCT_PRICING_REJECTED: 'PRICING/SET_PRODUCT_PRICING_REJECTED',
};

const actions = {
  fetchPricingBundle: () => ({ type: types.FETCH_PRICING_BUNDLE }),
  fetchProductsPricing: (id) => ({
    type: types.FETCH_PRODUCTS_PRICING,
    payload: id,
  }),
  fetchColorantsPricing: () => ({ type: types.FETCH_COLORANTS_PRICING }),
  setCommonPricing: (common) => ({
    type: types.SET_COMMON_PRICING,
    payload: common,
  }),
  setColorantsPricing: (colorants) => ({
    type: types.SET_COLORANTS_PRICING,
    payload: colorants,
  }),
  setCansizesPricing: (cansizes) => ({
    type: types.SET_CANSIZES_PRICING,
    payload: cansizes,
  }),
  setProductPricing: (product) => ({
    type: types.SET_PRODUCT_PRICING,
    payload: product,
  }),
};

const inital_state = {
  loading: false,
  bundle_loading: false,
  error: null,
  common: {},
  product: null,
  cansizes: [],
  colorants: [],
};

const reducer = (state = inital_state, action) => {
  switch (action.type) {
    case types.FETCH_PRODUCTS_PRICING_PENDING:
    case types.FETCH_COLORANTS_PRICING_PENDING:
    case types.SET_COMMON_PRICING_PENDING:
    case types.SET_COLORANTS_PRICING_PENDING:
    case types.SET_PRODUCT_PRICING_PENDING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };
    case types.FETCH_PRODUCTS_PRICING_REJECTED:
    case types.FETCH_COLORANTS_PRICING_REJECTED:
    case types.SET_COMMON_PRICING_REJECTED:
    case types.SET_COLORANTS_PRICING_REJECTED:
    case types.SET_PRODUCT_PRICING_REJECTED:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case types.FETCH_PRICING_BUNDLE_PENDING:
      return {
        ...state,
        bundle_loading: action.payload,
        error: null,
      };
    case types.FETCH_PRICING_BUNDLE_REJECTED:
      return {
        ...state,
        bundle_loading: false,
        error: action.payload,
      };
    case types.FETCH_PRICING_BUNDLE_FULFILLED:
      return {
        ...state,
        bundle_loading: false,
        ...action.payload,
      };
    case types.FETCH_PRODUCTS_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        product: action.payload,
      };
    case types.FETCH_COLORANTS_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        colorants: action.payload,
      };
    case types.SET_COMMON_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        common: action.payload,
      };
    case types.SET_COLORANTS_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        colorants: action.payload,
      };
    case types.SET_CANSIZES_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        cansizes: action.payload,
      };
    case types.SET_PRODUCT_PRICING_FULFILLED:
      return {
        ...state,
        loading: false,
        product: action.payload,
      };
    default:
      return state;
  }
};

function effectiveValue(obj, key) {
  const priceObject = _.get(obj, key, {});
  const { customValue, value } = priceObject;
  return customValue == null ? value || 0 : customValue;
}

const localSelectors = {
  commonPricing: (state) => state.common,
  productPricing: (state) => state.product,
  cansizesPricing: (state) => state.cansizes,
  colorantsPricing: (state) => state.colorants,
  loading: (state) => state.loading,
  error: (state) => state.error,

  colorantCost: (state, cntid) =>
    effectiveValue(
      _.find(state.colorants, (x) => x.cntid === cntid),
      'ccost'
    ),
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

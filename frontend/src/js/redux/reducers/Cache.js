import _ from 'lodash';
import { globalizeSelectors } from '../Utils';
import { equalsIgnoreCase, sortByKey } from '../../mylib/Utils';

const types = {
  FETCH_CARDS: 'CACHE/FETCH_CARDS',
  FETCH_CARDS_PENDING: 'CACHE/FETCH_CARDS_PENDING',
  FETCH_CARDS_FULFILLED: 'CACHE/FETCH_CARDS_FULFILLED',
  FETCH_CARDS_REJECTED: 'CACHE/FETCH_CARDS_REJECTED',

  FETCH_PRODUCTS: 'CACHE/FETCH_PRODUCTS',
  FETCH_PRODUCTS_PENDING: 'CACHE/FETCH_PRODUCTS_PENDING',
  FETCH_PRODUCTS_FULFILLED: 'CACHE/FETCH_PRODUCTS_FULFILLED',
  FETCH_PRODUCTS_REJECTED: 'CACHE/FETCH_PRODUCTS_REJECTED',
  SET_PRODUCTS_CANSIZES: 'CACHE/SET_PRODUCTS_CANSIZES',

  FETCH_PRODUCT_GROUPS: 'CACHE/FETCH_PRODUCT_GROUPS',
  FETCH_PRODUCT_GROUPS_PENDING: 'CACHE/FETCH_PRODUCT_GROUPS_PENDING',
  FETCH_PRODUCT_GROUPS_FULFILLED: 'CACHE/FETCH_PRODUCT_GROUPS_FULFILLED',
  FETCH_PRODUCT_GROUPS_REJECTED: 'CACHE/FETCH_PRODUCT_GROUPS_REJECTED',

  FETCH_CANSIZES_FULFILLED: 'CACHE/FETCH_CANSIZES_FULFILLED',

  FETCH_UNITS: 'CACHE/FETCH_UNITS',
  FETCH_UNITS_PENDING: 'CACHE/FETCH_UNITS_PENDING',
  FETCH_UNITS_FULFILLED: 'CACHE/FETCH_UNITS_FULFILLED',
  FETCH_UNITS_REJECTED: 'CACHE/FETCH_UNITS_REJECTED',

  FETCH_CNTS: 'CACHE/FETCH_CNTS',
  FETCH_CNTS_PENDING: 'CACHE/FETCH_CNTS_PENDING',
  FETCH_CNTS_FULFILLED: 'CACHE/FETCH_CNTS_FULFILLED',
  FETCH_CNTS_REJECTED: 'CACHE/FETCH_CNTS_REJECTED',

  FETCH_ZONES: 'CACHE/FETCH_ZONES',
  FETCH_ZONES_PENDING: 'CACHE/FETCH_ZONES_PENDING',
  FETCH_ZONES_FULFILLED: 'CACHE/FETCH_ZONES_FULFILLED',
  FETCH_ZONES_REJECTED: 'CACHE/FETCH_ZONES_REJECTED',

  FETCH_SITES: 'CACHE/FETCH_SITES',
  FETCH_SITES_PENDING: 'CACHE/FETCH_SITES_PENDING',
  FETCH_SITES_FULFILLED: 'CACHE/FETCH_SITES_FULFILLED',
  FETCH_SITES_REJECTED: 'CACHE/FETCH_SITES_REJECTED',

  FETCH_LANGUAGES: 'CACHE/FETCH_LANGUAGES',
  FETCH_LANGUAGES_PENDING: 'CACHE/FETCH_LANGUAGES_PENDING',
  FETCH_LANGUAGES_FULFILLED: 'CACHE/FETCH_LANGUAGES_FULFILLED',
  FETCH_LANGUAGES_REJECTED: 'CACHE/FETCH_LANGUAGES_REJECTED',

  FETCH_COMMENTS_LIST: 'CACHE/FETCH_COMMENTS_LIST',
  FETCH_COMMENTS_LIST_PENDING: 'CACHE/FETCH_COMMENTS_LIST_PENDING',
  FETCH_COMMENTS_LIST_FULFILLED: 'CACHE/FETCH_COMMENTS_LIST_FULFILLED',
  FETCH_COMMENTS_LIST_REJECTED: 'CACHE/FETCH_COMMENTS_LIST_REJECTED',

  TOGGLE_PRIORITY_INIT_PENDING: 'CACHE/TOGGLE_PRIORITY_INIT_PENDING',
};

const actions = {
  /**
   * Reading autohorisation token from local storage
   * @param search {string} to search
   * @returns action
   */

  loadProducts: (bundle = undefined) => ({
    type: types.FETCH_PRODUCTS,
    payload: { bundle },
  }),
  loadProductGroups: () => ({ type: types.FETCH_PRODUCT_GROUPS }),
  loadCards: (bundle = undefined) => ({
    type: types.FETCH_CARDS,
    payload: { bundle },
  }),
  loadZones: () => ({ type: types.FETCH_ZONES }),
  loadUnits: (bundle = undefined) => ({
    type: types.FETCH_UNITS,
    payload: { bundle },
  }),
  loadColorants: (bundle = undefined) => ({
    type: types.FETCH_CNTS,
    payload: { bundle },
  }),
  loadLanguages: () => ({ type: types.FETCH_LANGUAGES }),
  loadCommentsList: (zoneid) => ({
    type: types.FETCH_COMMENTS_LIST,
    payload: zoneid,
  }),

  setProductsCansizes: (products, cansizes, productgroups = undefined) => ({
    type: types.SET_PRODUCTS_CANSIZES,
    payload: { products, cansizes, productgroups },
  }),

  setCardsList: (cards) => ({
    type: types.FETCH_CARDS_FULFILLED,
    payload: { data: cards },
  }),
};

const initial_state = {
  // Order details
  cards: [],
  fetch_cards_error: null,
  fetch_cards_start: false,

  // Cached products
  products: [],
  fetch_products_error: null,
  fetch_products_start: false,

  // Cached product groups
  product_groups: [],
  fetch_product_groups_error: null,
  fetch_product_groups_start: false,

  cansizes: [],
  fetch_cansizes_error: null,
  fetch_cansizes_start: false,

  zones: [],
  fetch_zones_error: null,
  fetch_zones_start: false,

  sites: [],
  fetch_sites_error: null,
  fetch_sites_start: false,

  units: [],
  fetch_units_error: null,
  fetch_units_start: false,

  languages: [],
  fetch_languages_error: null,
  fetch_languages_start: false,

  commentTexts: {},
  commentImages: {},
  matchLimits: [],

  fetch_cnts_error: null,
  fetch_cnts_start: false,

  cnts: [],
  cntmap: new Map(),
  cntcodemap: new Map(),
  productmap: new Map(),
  sitemap: new Map(),
  cardmap: new Map(),

  priority_init_pending: true,
};

/**
 * reducer which updates the order state in data store
 * @param {*} state
 * @param {*} action
 */
function reducer(state = initial_state, action) {
  switch (action.type) {
    case types.FETCH_CNTS_PENDING: {
      return { ...state, fetch_cnts_start: true, fetch_cnts_error: null };
    }
    case types.FETCH_CNTS_REJECTED: {
      return {
        ...state,
        fetch_cnts_start: false,
        cntmap: new Map(),
        cntcodemap: new Map(),
        fetch_cnts_error: action.payload,
      };
    }
    case types.FETCH_CNTS_FULFILLED: {
      const cnts = action.payload.data;
      return {
        ...state,
        fetch_cnts_start: false,
        cnts,
        cntmap: new Map(cnts.map((x) => [x.cntid, x])),
        cntcodemap: new Map(cnts.map((x) => [x.cntcode, x])),
        fetch_cnts_error: null,
      };
    }
    case types.FETCH_ZONES_PENDING: {
      return { ...state, fetch_zones_start: true, fetch_zones_error: null };
    }
    case types.FETCH_ZONES_REJECTED: {
      return {
        ...state,
        fetch_zones_start: false,
        zones: [],
        fetch_zones_error: action.payload,
      };
    }
    case types.FETCH_ZONES_FULFILLED: {
      return {
        ...state,
        fetch_zones_start: false,
        zones: action.payload.data,
        fetch_zones_error: null,
      };
    }
    case types.FETCH_SITES_PENDING: {
      return { ...state, fetch_sites_start: true, fetch_sites_error: null };
    }
    case types.FETCH_SITES_REJECTED: {
      return {
        ...state,
        fetch_sites_start: false,
        sites: [],
        fetch_sites_error: action.payload,
      };
    }
    case types.FETCH_SITES_FULFILLED: {
      const sites = action.payload;
      return {
        ...state,
        fetch_sites_start: false,
        sites: sites,
        sitemap: new Map(sites.map((x) => [x.siteid, x])),
        fetch_sites_error: null,
      };
    }
    case types.FETCH_LANGUAGES_PENDING: {
      return {
        ...state,
        fetch_languages_start: true,
        fetch_languages_error: null,
      };
    }
    case types.FETCH_LANGUAGES_REJECTED: {
      return {
        ...state,
        fetch_languages_start: false,
        languages: [],
        fetch_languages_error: action.payload,
      };
    }
    case types.FETCH_LANGUAGES_FULFILLED: {
      return {
        ...state,
        fetch_languages_start: false,
        languages: sortByKey(action.payload.data, 'label'),
        fetch_languages_error: null,
      };
    }
    case types.FETCH_UNITS_PENDING: {
      return { ...state, fetch_units_start: true, fetch_units_error: null };
    }
    case types.FETCH_UNITS_REJECTED: {
      return {
        ...state,
        fetch_units_start: false,
        units: [],
        fetch_units_error: action.payload,
      };
    }
    case types.FETCH_UNITS_FULFILLED: {
      return {
        ...state,
        fetch_units_start: false,
        units: action.payload.data,
        fetch_units_error: null,
      };
    }
    case types.FETCH_CANSIZES_PENDING: {
      return {
        ...state,
        fetch_cansizes_start: true,
        fetch_cansizes_error: null,
      };
    }
    case types.FETCH_CANSIZES_REJECTED: {
      return {
        ...state,
        fetch_cansizes_start: false,
        colors: [],
        fetch_cansizes_error: action.payload,
      };
    }
    case types.FETCH_CANSIZES_FULFILLED: {
      return {
        ...state,
        fetch_cansizes_start: false,
        cansizes: action.payload.data,
        fetch_cansizes_error: null,
      };
    }

    case types.FETCH_PRODUCTS_PENDING: {
      return {
        ...state,
        fetch_products_start: true,
        fetch_products_error: null,
      };
    }
    case types.FETCH_PRODUCTS_REJECTED: {
      return {
        ...state,
        fetch_products_start: false,
        products: [],
        fetch_products_error: action.payload,
      };
    }
    case types.FETCH_PRODUCTS_FULFILLED: {
      const products = action.payload.data;
      return {
        ...state,
        fetch_products_start: false,
        products,
        productmap: new Map(products.map((x) => [x.productid, x])),
        fetch_products_error: null,
      };
    }

    case types.FETCH_PRODUCT_GROUPS_PENDING: {
      return {
        ...state,
        fetch_product_groups_start: true,
        fetch_product_groups_error: null,
      };
    }
    case types.FETCH_PRODUCT_GROUPS_REJECTED: {
      return {
        ...state,
        fetch_product_groups_start: false,
        product_groups: [],
        fetch_product_groups_error: action.payload,
      };
    }
    case types.FETCH_PRODUCT_GROUPS_FULFILLED: {
      return {
        ...state,
        fetch_product_groups_start: false,
        product_groups: action.payload.data,
        fetch_product_groups_error: null,
      };
    }

    case types.FETCH_CARDS_PENDING: {
      return { ...state, fetch_cards_start: true, fetch_cards_error: null };
    }
    case types.FETCH_CARDS_REJECTED: {
      return {
        ...state,
        fetch_cards_start: false,
        cards: [],
        fetch_cards_error: action.payload,
      };
    }
    case types.FETCH_CARDS_FULFILLED: {
      const cards = action.payload.data;
      return {
        ...state,
        fetch_cards_start: false,
        cards,
        fetch_cards_error: null,
        cardmap: new Map(cards.map((x) => [x.colourcardid, x])),
      };
    }
    case types.FETCH_COMMENTS_LIST_FULFILLED: {
      const list = action.payload;
      const matchLimits = list.filter((x) => x.matchlimit != null);
      matchLimits.sort((a, b) => a.matchlimit - b.matchlimit);
      return {
        ...state,
        commentTexts: _.fromPairs(
          list
            .filter((x) => x.commenttext != null)
            .map((x) => [x.commentcode.toLowerCase(), x.commenttext])
        ),
        commentImages: _.fromPairs(
          list
            .filter((x) => x.imageid != null)
            .map((x) => [
              x.commentcode.toLowerCase(),
              { id: x.imageid, hash: x.md5_hash },
            ])
        ),
        matchLimits,
      };
    }

    case types.TOGGLE_PRIORITY_INIT_PENDING: {
      return { ...state, priority_init_pending: action.payload };
    }
    default: {
      return state;
    }
  }
}

const mountPath = 'cache';

const localSelectors = {
  products: (state) => state.products,
  cards: (state) => state.cards,
  getCard: (state, colourcardid) => state.cardmap.get(colourcardid),
  cnts: (state) => state.cnts,
  cntmap: (state) => state.cntmap,
  cntcodemap: (state) => state.cntcodemap,
  productmap: (state) => state.productmap,
  getProduct: (state, productid) => state.productmap.get(productid),
  units: (state) => state.units,
  getUnit: (state, unitname) =>
    state.units.find((x) => equalsIgnoreCase(x.unitname, unitname)) ||
    state.units.find(
      (x) => x.mainunit === 1 && x.div1 === 1 && !x.gravimetric
    ) ||
    state.units[0],
  cansizes: (state) => state.cansizes,
  getCansize: (state, cansizeid) =>
    _.find(state.cansizes, (x) => x.cansizeid === cansizeid),
  product_groups: (state) => state.product_groups,
  commentTexts: (state) => state.commentTexts,
  commentImages: (state) => state.commentImages,
  matchLimits: (state) => state.matchLimits,
  priority_init_pending: (state) => state.priority_init_pending,
  zones: (state) => state.zones,
};

const selectors = globalizeSelectors(localSelectors, mountPath);

export { types as actionTypes, actions as default, selectors, reducer };

import _ from 'lodash';

import PropTypes from 'prop-types';

import { combineReducers } from 'redux';

import { globalizeSelectors } from '../Utils';

import { groupAndReduce } from 'polchem_base/common/ObjectUtils';

import {

  createArrayDataReducer,

  arrayDataType,

  createSingleDataReducer,

  clearResults,

} from '../factories/ApiCall';

import { statsDefaultDateRange } from '../../mylib/DateUtils';



/*

 * action types

 */



const types = {

  FETCH_PURGE: 'STATISTICS/FETCH_PURGE',

  FETCH_POS_STATS: 'STATISTICS/FETCH_POS_STATS',

  SET_PRODUCT_NAME: 'STATISTICS/SET_PRODUCT_NAME',

  SET_COLORANT_NAME: 'STATISTICS/SET_COLORANT_NAME',

  SET_COLORANT_NAME_FULFILLED: 'STATISTICS/SET_COLORANT_NAME_FULFILLED',

  SET_PRODUCT_NAME_FULFILLED: 'STATISTICS/SET_PRODUCT_NAME_FULFILLED',

};



const mountPath = 'statistics'; // mount point in global state, must match root reducer



/*

 * action creators

 */



const actions = {

  setProductName: (label, value) => ({

    type: types.SET_PRODUCT_NAME_FULFILLED,

    payload: { label, value },

  }),

  setColorantName: (label, value) => ({

    type: types.SET_COLORANT_NAME_FULFILLED,

    payload: { label, value },

  }),

  fetchPurge: (start_date, end_date, machineid) => {

    const def = statsDefaultDateRange();

    return {

      type: types.FETCH_PURGE,

      payload: {

        start_date: start_date || def.start_date,

        end_date: end_date || def.end_date,

        machineid,

      },

    };

  },

  fetchPosStats: (start_date, end_date) => ({

    type: types.FETCH_POS_STATS,

    payload: { start_date, end_date },

  }),

  clearPosStats: () => ({ type: clearResults(types.FETCH_POS_STATS) }),

};



/*

 * state shape

 */

const propType = PropTypes.shape({

  purge: arrayDataType,

  pos_stats: PropTypes.shape({

    data: PropTypes.shape({

      daterange: PropTypes.arrayOf(PropTypes.string), // ISO dates

      colorants: PropTypes.arrayOf(

        PropTypes.shape({

          cntcode: PropTypes.string,

          cntvolsum: PropTypes.number,

        })

      ),

      products: PropTypes.arrayOf(

        PropTypes.shape({

          productname: PropTypes.string,

          basecode: PropTypes.string,

          cansizecode: PropTypes.string,

          cancount: PropTypes.number,

          basevolsum: PropTypes.number,

          pricesum: PropTypes.number,

        })

      ),

      weekdays: PropTypes.arrayOf(

        PropTypes.shape({

          weekday: PropTypes.number, // ISO weekday number, 1 = Monday, 7 = Sunday

          cancount: PropTypes.number,

          basevolsum: PropTypes.number,

          pricesum: PropTypes.number,

        })

      ),

      colours: PropTypes.arrayOf(

        PropTypes.shape({

          colourcode: PropTypes.string,

          cancount: PropTypes.number,

          basevolsum: PropTypes.number,

          pricesum: PropTypes.number,

        })

      ),

    }),

    pending: PropTypes.bool,

    error: PropTypes.string,

    productName: PropTypes.string,

  }),

});



/*

 * reducer

 */

const reducer = combineReducers({

  purge: createArrayDataReducer(types.FETCH_PURGE),

  pos_stats: createSingleDataReducer(types.FETCH_POS_STATS),

  productName: createSingleDataReducer(types.SET_PRODUCT_NAME, true, {

    label: 'All',

    value: null,

  }),

  colorantName: createSingleDataReducer(types.SET_COLORANT_NAME, true, {

    label: 'All',

    value: null,

  }),

});



/*

 * helpers for selectors

 */



function productsStats(state, productname = null) {

  const all = _.get(state.pos_stats, 'data.products', []);

  return productname == null

    ? all

    : all.filter((x) => x.productname === productname);

}



function aggeregateProductsStats(

  acc = {

    basevolsum: 0,

    cancount: 0,

    pricesum: 0,

  },

  obj

) {

  acc.basevolsum += obj.basevolsum;

  acc.cancount += obj.cancount;

  acc.pricesum += obj.pricesum;

  return acc;

}



function groupSumProducts(statsArray, keyName) {

  return groupAndReduce(statsArray, keyName, aggeregateProductsStats);

}



function colorantsStats(state, source = null, cntcode = null) {

  let data = _.get(state.pos_stats, 'data.colorants', []);

  if (source != null) {

    data = data.filter((x) => x.source === source);

  }

  if (cntcode != null) {

    data = data.filter((x) => x.cntcode === cntcode);

  }

  return data;

}



function mapToDate(arr) {

  return arr.map((x) => ({ ...x, date: x.datetime.slice(0, 10) }));

}



/*

 * selectors

 */

const localSelectors = {

  purge: (state) => state.purge,

  purged_cntcodes: (state) => {

    const res = _.uniq(state.purge.data.map((x) => x.cntcode));

    res.sort();

    return res;

  },

  purged_by_date: (state) =>

    groupAndReduce(

      mapToDate(state.purge.data),

      'date',

      (acc = { volumes: {} }, obj) => {

        acc.volumes[obj.cntcode] = (acc.volumes[obj.cntcode] || 0) + obj.volume;

        return acc;

      }

    ),

  purged_totals: (state) =>

    state.purge.data.reduce((acc, obj) => {

      acc[obj.cntcode] = (acc[obj.cntcode] || 0) + obj.volume;

      return acc;

    }, {}),

  tinted_product_names: (state) =>

    _.uniq(

      productsStats(state)

        .map((x) => x.productname)

        .filter(Boolean)

    ),

  tinted_by_product: (state, productname = null) =>

    groupSumProducts(productsStats(state, productname), 'productname'),

  tinted_by_base: (state, productname = null) =>

    groupSumProducts(productsStats(state, productname), 'basecode'),

  tinted_by_cansize: (state, productname = null) =>

    groupSumProducts(productsStats(state, productname), 'cansizecode'),

  tinted_by_weekday: (state) =>

    _.get(state.pos_stats, 'data.weekdays', []).map((x) => ({

      ...x,

      basevolsum: x.basevolsum,

    })),

  tinted_by_color: (state) =>

    _.get(state.pos_stats, 'data.colours', []).map((x) => ({

      ...x,

      basevolsum: x.basevolsum,

    })),

  colorants_stats: colorantsStats, // see redux\selectors\PriceCalc.js

  currentProduct: (state) => state.productName.data,

  currentColorant: (state) => state.colorantName.data,

};



const selectors = globalizeSelectors(localSelectors, mountPath);



export {

  types as actionTypes,

  actions as default,

  propType,

  selectors,

  reducer,

};


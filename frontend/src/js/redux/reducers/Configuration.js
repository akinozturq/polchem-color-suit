import _ from 'lodash';

import { globalizeSelectors } from '../Utils';

import { PriceFormatter } from 'js/mylib/Utils';

import { ShotFormatter } from 'polchem_base/common/formatters/ShotFormatter';

import { fulfilled, rejected } from '../factories/ApiCall';

import { PRINT_TASK_DEFAULT } from '../../Constants';



const types = {

  INITIALIZE_APP: 'CONFIG/INITIALIZE_APP',



  FETCH_CONFIG: 'CONFIG/FETCH_CONFIG',

  FETCH_CONFIG_PENDING: 'CONFIG/FETCH_CONFIG_PENDING',

  FETCH_CONFIG_FULFILLED: 'CONFIG/FETCH_CONFIG_FULFILLED',

  FETCH_CONFIG_REJECTED: 'CONFIG/FETCH_CONFIG_REJECTED',

  SAVING_CONFIG: 'CONFIG/SAVING_CONFIG',



  SET_IS_STANDALONE: 'CONFIG/SET_IS_STANDALONE',

  SET_ZONE: 'CONFIG/SET_ZONE',

  SET_ZONE_FULLFILLED: 'CONFIG/SET_ZONE_FULLFILLED',

  SET_ZONE_REDUX: 'CONFIG/SET_ZONE_REDUX',

  SET_CONFIG_VALUE: 'CONFIG/SET_CONFIG_VALUE',

  SET_CONFIG_VALUE_REDUX: 'CONFIG/SET_CONFIG_VALUE_REDUX',

  UNSET_CONFIG_VALUE: 'CONFIG/UNSET_CONFIG_VALUE',

  SET_SHOTFORMATTER_UNIT: 'CONFIG/SET_SHOTFORMATTER_UNIT',

  UPDATE_SHOTFORMATTER: 'CONFIG/UPDATE_SHOTFORMATTER',

  SET_SITE: 'CONFIG/SET_SITE',

  SET_SELECTED_CURRENCY: 'CONFIG/SET_SELECTED_CURRENCY',

  SAVE_PRINT_LABELS: 'CONFIG/SAVE_PRINT_LABELS',

  SAVE_EMAIL_TEMPLATES: 'CONFIG/SAVE_EMAIL_TEMPLATES',

  SET_PRINT_LABELS: 'CONFIG/SET_PRINT_LABELS',

  SET_EMAIL_TEMPLATES: 'CONFIG/SET_EMAIL_TEMPLATES',

  FETCH_MATCHSETTING_NAMES: 'CONFIG/FETCH_MATCHSETTING_NAMES',

  FETCH_MATCHSETTING_NAMES_FULFILLED:

    'CONFIG/FETCH_MATCHSETTING_NAMES_FULFILLED',



  UPDATE_SITE: 'CONFIG/UPDATE_SITE',

  UPDATE_SITE_REJECTED: 'CONFIG/UPDATE_SITE_REJECTED',



  SEND_TEST_EMAIL: 'SERVER/SEND_TEST_EMAIL',

  SET_SYSTEMGROUPS: 'CONFIG/SET_SYSTEMGROUPS',

};



const actions = {

  // To be called first

  initializeApp: (first_init = false) => ({

    type: types.INITIALIZE_APP,

    payload: { first_init },

  }),

  loadConfig: (bundle = undefined) => ({

    type: types.FETCH_CONFIG,

    payload: { bundle },

  }),

  setIsStandalone: (bool) => ({

    type: types.SET_IS_STANDALONE,

    payload: bool,

  }),

  setZone: (zone) => ({ type: types.SET_ZONE, payload: zone }),

  setSite: (site) => ({ type: types.SET_SITE, payload: site }),

  setSelectedCurrency: (currency) => ({

    type: types.SET_SELECTED_CURRENCY,

    payload: currency,

  }),

  setConfig: (key, value) => ({

    type: types.SET_CONFIG_VALUE,

    payload: { key, value },

  }),

  unsetConfig: (key) => ({ type: types.UNSET_CONFIG_VALUE, payload: { key } }),

  savingConfig: (flag) => ({ type: types.SAVING_CONFIG, payload: flag }),

  savePrintLabels: (labels) => ({

    type: types.SAVE_PRINT_LABELS,

    payload: labels,

  }),

  saveEmailTemplates: (templates) => ({

    type: types.SAVE_EMAIL_TEMPLATES,

    payload: templates,

  }),

  setPrintLabels: (labels) => ({

    type: types.SET_PRINT_LABELS,

    payload: labels,

  }),

  setEmailTemplates: (templates) => ({

    type: types.SET_EMAIL_TEMPLATES,

    payload: templates,

  }),

  fetchMatchsettingNames: () => ({

    type: types.FETCH_MATCHSETTING_NAMES,

  }),

  setShotformatter: (unit) => ({

    type: types.SET_SHOTFORMATTER,

    payload: unit,

  }),

  updateSite: (site) => ({ type: types.UPDATE_SITE, payload: site }),

  sendTestEmail: (recievers) => ({

    type: types.SEND_TEST_EMAIL,

    payload: recievers,

  }),

  setSystemgroups: (systemgroups) => ({

    type: types.SET_SYSTEMGROUPS,

    payload: systemgroups,

  }),

};



const initialState = {

  config: {},

  config_values: {},

  config_start: false,

  config_saving: false,

  config_error: null,

  is_standalone: false,

  zone: null,

  site: null,

  site_update_error: null,

  // Init shotformatter

  shotFormatter: new ShotFormatter(),

  priceFormatter: new PriceFormatter(),

  send_test_email: {

    pending: false,

    error: null,

    data: null,

  },

  temporary: {

    selected_currency: null,

  },

  print_labels: [],

  email_templates: [],

  matchsetting_names: null, // null while not fetched, -> array

  systemgroups: [],

};



function reducer(state = initialState, action) {

  switch (action.type) {

    case types.SET_IS_STANDALONE: {

      return { ...state, is_standalone: action.payload };

    }

    case types.SAVING_CONFIG: {

      return { ...state, config_saving: action.payload };

    }

    case types.FETCH_CONFIG_PENDING: {

      return {

        ...state,

        config: {},

        config_values: {},

        config_start: true,

        config_error: null,

      };

    }

    case types.FETCH_CONFIG_REJECTED: {

      return {

        ...state,

        config: {},

        config_values: {},

        config_start: false,

        config_error: action.payload.message,

      };

    }

    case types.FETCH_CONFIG_FULFILLED: {

      return {

        ...state,

        config: action.payload,

        config_values: _.mapValues(action.payload, (val) => val.value),

        config_start: false,

        config_error: null,

        config_saving: false,

      };

    }

    case types.SET_CONFIG_VALUE_REDUX: {

      const { key, object } = action.payload;

      return {

        ...state,

        config: { ...state.config, [key]: object },

        config_values: { ...state.config_values, [key]: object.value },

      };

    }

    case types.UPDATE_SITE_REJECTED: {

      return { ...state, site_update_error: action.payload };

    }

    case types.SET_SHOTFORMATTER_UNIT: {

      return { ...state, shotFormatter: new ShotFormatter(action.payload) };

    }

    case types.SET_ZONE_REDUX: {

      // Setting also the selected currency to zone currency

      return {

        ...state,

        zone: action.payload,

        priceFormatter: new PriceFormatter(action.payload),

        temporary: {

          ...state.temporary,

          selected_currency: {

            symbol: action.payload.currencysymbol || '',

            rate: 1,

            decimals: action.payload.currencydecimals,

          },

        },

      };

    }

    case types.SET_SITE: {

      return { ...state, site: action.payload };

    }

    case types.SET_SELECTED_CURRENCY: {

      return {

        ...state,

        temporary: { ...state.temporary, selected_currency: action.payload },

      };

    }

    case types.SET_PRINT_LABELS: {

      return { ...state, print_labels: action.payload };

    }

    case types.SET_SYSTEMGROUPS: {

      return { ...state, systemgroups: action.payload };

    }

    case types.SET_EMAIL_TEMPLATES: {

      return { ...state, email_templates: action.payload };

    }

    case types.FETCH_MATCHSETTING_NAMES_FULFILLED: {

      return { ...state, matchsetting_names: action.payload };

    }

    case types.SEND_TEST_EMAIL: {

      return {

        ...state,

        send_test_email: { error: null, data: null, pending: true },

      };

    }

    case fulfilled(types.SEND_TEST_EMAIL): {

      return {

        ...state,

        send_test_email: { error: null, data: action.payload, pending: false },

      };

    }

    case rejected(types.SEND_TEST_EMAIL): {

      return {

        ...state,

        send_test_email: { error: action.payload, data: null, pending: false },

      };

    }



    default: {

      return state;

    }

  }

}



const mountPath = 'configurations';



/**

 * Merges print_tasks_printers and print_labels to print_tasks

 * and filters tasks that are enabled and have printer and layout set

 *

 * @param {Object} state Local redux state

 * @returns {Array}

 */

function localPrintTasks(state) {

  const { print_tasks, print_tasks_printer } = state.config_values;



  const { print_labels } = state;



  // Pick default printer from "Default" task

  const def_printer = _.find(

    print_tasks_printer,

    (x) => x.task === PRINT_TASK_DEFAULT

  )?.printer;



  return print_tasks

    ? print_tasks

        .map((task) => {

          const { printer, enabled = false } =

            _.find(print_tasks_printer, (x) => x.task === task.name) || {};



          const layout = _.find(print_labels, (x) => x.name === task.template);



          return { ...task, printer: printer || def_printer, enabled, layout };

        })

        .filter((x) => x.enabled && x.printer && x.layout)

    : [];

}



const localSelectors = {

  is_standalone: (state) => state.is_standalone,

  zone: (state) => state.zone,

  site: (state) => state.site,

  config: (state) => state.config,

  config_values: (state) => state.config_values,

  shotFormatter: (state) => state.shotFormatter,

  priceFormatter: (state) => state.priceFormatter,

  shotUnit: (state) => state.shotFormatter.unit.unitname,

  has_order_pool: (state) =>

    !!state?.site?.poolsiteid &&

    state?.site?.siteid !== state?.site?.poolsiteid,

  selected_currency: (state) => state.temporary.selected_currency,

  print_labels: (state) => state.print_labels,

  localclient: (state) => state.site?.localclient,

  email_templates: (state) => state.email_templates,

  localPrintTasks,

  base_dosing: (state) => state.config.enable_base_dosing?.value,

};



const selectors = globalizeSelectors(localSelectors, mountPath);



export { types as actionTypes, actions as default, selectors, reducer };


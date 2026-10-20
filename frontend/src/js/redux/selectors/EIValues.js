import i18n from 'js/localization/i18n';

import _ from 'lodash';

import {

  NumberFormatter,

  RangeFormatter,

  ArrayFormatter,

} from 'polchem_base/common/formatters/NumberFormatter';

import {

  EI_TYPE_CURRENCY,

  EI_TYPE_LARGE_VOLUME,

  EI_TYPE_LARGE_MASS,

  EI_TYPE_PERCENTAGE,

  EI_TYPE_SMALL_VOLUME,

  EI_TYPE_SMALL_MASS,

  EI_TYPE_AREA,

  EI_TYPE_STRING,

  EI_TYPE_NUMBER,

  EI_TYPE_ARRAY,

  EI_VARIABLES,

} from 'polchem_base/common/EIVariables';

import { RGBColorToHexOrNull } from 'js/mylib/Utils';

import { EXTRA_INFO_APPLY_DISCOUNT, EXTRA_INFO_DISCOUNT } from 'js/Constants';

import { clone } from 'chart.js/helpers';

import { EXTRA_INFO_PRICEGROUP } from '../../Constants.js';



/**

 * All extra info values as strings

 *

 * @param {Object} order Redux state.order

 * @param {Object} configurations Redux state.configurations

 * @param {Boolean} excIncTax If true, add _incTax and _excTax values.

 * @param [Boolean] forcePriceoptionLot Calculate price of all cans regardless

 *    of priceoption_lot setting

 * @returns {Object} {code: string value}

 */

export default function EIValues(

  order,

  configurations,

  excIncTax = false,

  forcePriceoptionLot = false

) {

  return _.fromPairs(

    EIDataset(order, configurations, excIncTax, forcePriceoptionLot).map(

      (x) => [x.code, x.selected_currency_formatted]

    )

  );

}



export function EIDataset(

  order,

  configurations,

  excIncTax = false,

  forcePriceoptionLot = false

) {

  const formatters = makeFormatters(configurations);



  if (!formatters) return {};



  const data = order.item.price;

  if (!data) return {};



  const { rgb, lab, xyz } = order.color || {};

  const additionalValues = {

    rgb,

    rgbHex: RGBColorToHexOrNull(rgb),

    lab,

    xyz,

    y: xyz ? xyz[1] : null,

    productDescription: order.product?.description,

    hardenerName: order.product?.hardener?.productzname,

    canCode: order.can?.cancode,

    bfsGrade: bfsGrade(order),

    formulaUFIs: formulaUFIs(order),

  };



  const ncansMultiplier =

    forcePriceoptionLot || configurations.config_values.priceoption_lot

      ? order.item.ncans

      : 1;



  /**

   * Apply colorant / base adjustments

   */



  const applyAdjustments = (input) => {

    const prices = clone(input);

    const base_factor = 1 + order.item.basepriceadjustment; // 30% discount for base read from oder.item.base_adjustment

    const cnt_factor = 1 + order.item.cntpriceadjustment; // 30% discount for base read from oder.item.base_adjustment



    if (base_factor !== 1) {

      let new_price = prices.basePrice * base_factor;

      prices.baseAdjusted = new_price - prices.basePrice;

      prices.basePrice += prices.baseAdjusted;

      prices.price += prices.baseAdjusted;



      new_price = prices.hardenerPrice * base_factor;

      prices.hardenerAdjusted = new_price - prices.hardenerPrice;

      prices.hardenerPrice += prices.hardenerAdjusted;

      prices.price += prices.hardenerAdjusted;

    }

    if (cnt_factor !== 1) {

      const new_price = prices.cntPrice * cnt_factor;

      prices.cntAdjusted = new_price - prices.cntPrice;

      prices.cntPrice += prices.cntAdjusted;

      prices.price += prices.cntAdjusted;

    }



    return prices;

  };



  const adjustedData = {

    ...data,

    excTaxCan: applyAdjustments(data.excTaxCan),

    incTaxCan: applyAdjustments(data.incTaxCan),

  };



  const defaultTax = configurations.config_values.priceoption_exctax

    ? adjustedData.excTaxCan

    : adjustedData.incTaxCan;



  const { priceoption_pricegroup_naming } = configurations.config_values;

  const price_group_rename = new Map();



  if (priceoption_pricegroup_naming) {

    priceoption_pricegroup_naming.forEach((v, i) =>

      price_group_rename.set(i, v)

    );

  }



  const defaultData = { ...defaultTax, ...additionalValues };

  const r = [];

  /**

   * Apply discount to adjustedData here

   */



  const dis_fac = 1 - order.item.discount;



  for (let { code, dataType, isTaxable, isScalable } of EI_VARIABLES()) {

    const discounted = (val) =>

      EXTRA_INFO_APPLY_DISCOUNT.includes(code) ? dis_fac * val : val;



    const scaled = (val) => {

      if (isScalable) {

        if (dataType === EI_TYPE_AREA) {

          if (val) {

            return val.map((x) => (x ? x * ncansMultiplier : x)); // preserve nulls

          }

        } else {

          return val * ncansMultiplier;

        }

      }

      return val;

    };



    const getValue = (obj) =>

      scaled(

        code === EXTRA_INFO_DISCOUNT

          ? obj.price * order.item.discount

          : discounted(obj[code])

      );



    let formatter = formatters[dataType];

    let selected_frmt = formatters[dataType];

    // Currency has default and selected formatters!

    if (dataType === EI_TYPE_CURRENCY) {

      formatter = formatters[dataType].default;

      selected_frmt = formatters[dataType].selected;

    }



    const value =

      code === EXTRA_INFO_PRICEGROUP

        ? price_group_rename.has(defaultData[code])

          ? price_group_rename.get(defaultData[code])

          : defaultData[code]

        : getValue(defaultData);

    r.push({

      code,

      dataType,

      value,

      formatted: formatter.format(value),

      selected_currency_formatted: selected_frmt.format(value),

    });



    if (excIncTax && isTaxable) {

      const exc = getValue(adjustedData.excTaxCan);

      r.push({

        code: code + '_excTax',

        dataType,

        value: exc,

        formatted: formatter.format(exc),

        selected_currency_formatted: selected_frmt.format(exc),

      });



      const inc = getValue(adjustedData.incTaxCan);

      r.push({

        code: code + '_incTax',

        dataType,

        value: inc,

        formatted: formatter.format(inc),

        selected_currency_formatted: selected_frmt.format(inc),

      });

    }

  }

  // Calculate discount values



  return r;

}



class StringFormatter {

  format(value) {

    return value != null ? String(value) : '';

  }

}



export function makeFormatters(configurations) {

  if (!configurations.zone) return null;



  const massUnits = {

    kg: { symbol: i18n.t('symbol.kg', 'kg'), scale: 0.001 },

    lb: { symbol: i18n.t('symbol.lb', 'lb'), scale: 1 / 453.59237 },

    g: { symbol: i18n.t('symbol.g', 'g'), scale: 1 },

  };



  const volumeUnits = {

    l: { symbol: i18n.t('symbol.l', 'l'), scale: 0.001 }, // ml -> L

    ml: { symbol: i18n.t('symbol.ml', 'ml'), scale: 1 }, // ml -> ml

    'U.S. gal': {

      symbol: i18n.t('symbol.us_gal', 'U.S. gal'),

      scale: 0.26417205236 * 0.001,

    },

    'U.S. quarts': {

      symbol: i18n.t('symbol.us_quarts', 'U.S. quarts'),

      scale: 1.0566882094 * 0.001,

    },

    'Imp. gal': {

      symbol: i18n.t('symbol.imp_gal', 'Imp. gal'),

      scale: 0.2199692483 * 0.001,

    },

    'U.S. fl. oz.': {

      symbol: i18n.t('symbol.us_fl_oz', 'U.S. fl. oz.'),

      scale: 33.8140227 * 0.001,

    },

    'Imp. fl. oz.': {

      symbol: i18n.t('symbol.imp_fl_oz', 'Imp. fl. oz.'),

      scale: 35.1950652 * 0.001,

    },

  };



  const massUnitKey = configurations.config_values.priceoption_mass_unit || 'g';

  const { symbol: massSymbol, scale: massScale } =

    massUnits[massUnitKey] || massUnits.g;



  const volumeUnitKey =

    configurations.config_values.priceoption_volume_unit || 'ml';

  const { symbol: volumeSymbol, scale: volumeScale } =

    volumeUnits[volumeUnitKey] || volumeUnits.ml;



  const mass_formatter = new NumberFormatter({

    decimals: configurations.config_values.priceoption_mass_decimals,

    symbol: massSymbol,

    scale: massScale,

  });



  const volume_formatter = new NumberFormatter({

    decimals: configurations.config_values.priceoption_volume_decimals,

    symbol: volumeSymbol,

    scale: volumeScale,

  });



  const fallback = i18n.t('symbol.na', 'n/a');

  const selected_currency = _.get(

    configurations.temporary,

    'selected_currency'

  );



  return {

    [EI_TYPE_CURRENCY]: {

      default: new NumberFormatter({

        decimals: configurations.zone.currencydecimals,

        allowTrailingZeros:

          configurations.config_values.priceoption_trailing_zeros,

        symbol: configurations.zone.currencysymbol || '',

        currencyFormat: configurations.zone.currencyformat,

        fallback,

      }),

      selected: new NumberFormatter({

        decimals: selected_currency.decimals,

        allowTrailingZeros:

          configurations.config_values.priceoption_trailing_zeros,

        symbol: selected_currency.symbol,

        scale: selected_currency.rate,

        currencyFormat: configurations.zone.currencyformat,

        fallback,

      }),

    },

    [EI_TYPE_SMALL_VOLUME]: volume_formatter,

    [EI_TYPE_LARGE_VOLUME]: volume_formatter,

    [EI_TYPE_SMALL_MASS]: mass_formatter,

    [EI_TYPE_LARGE_MASS]: mass_formatter,

    [EI_TYPE_PERCENTAGE]: new NumberFormatter({

      decimals: configurations.config_values.priceoption_percentage_decimals,

      symbol: '%',

      scale: 100,

      fallback,

    }),

    [EI_TYPE_AREA]: new RangeFormatter({ symbol: 'm²', decimals: 1 }),

    [EI_TYPE_ARRAY]: new ArrayFormatter(),

    [EI_TYPE_NUMBER]: new NumberFormatter(),

    [EI_TYPE_STRING]: new StringFormatter(),

  };

}



function bfsGrade(order) {

  const {

    base,

    item: { cnts },

  } = order;

  const baseGrade = base ? base.bfsgrade : '';

  const cntGrades = cnts ? cnts.map((x) => x.bfsgrade) : [];



  // require all components to have a grade

  if (baseGrade == null || cntGrades.includes(null)) {

    return null;

  }



  cntGrades.sort((a, b) => b - a);

  const cntGrade = cntGrades.length ? cntGrades[0] : '';

  return baseGrade + cntGrade;

}



const UFI_CONCENTRATION_THRESHOLD = 0.05;



function UFIstring(totalvolume, { volume, uficode }) {

  const conc = volume / totalvolume;

  const concString =

    conc > UFI_CONCENTRATION_THRESHOLD

      ? ' ' + (100 * conc).toFixed(0) + '\u00A0%'

      : '';

  return 'UFI:' + uficode + concString;

}



function formulaUFIs(order) {

  const {

    base,

    can,

    item: { cnts },

  } = order;

  if (!base || base.disableufi || !can || !cnts) {

    return null;

  }

  const components = [

    ...cnts,

    { volume: can.basevolume, uficode: base.uficode },

  ].sort((a, b) => b.volume - a.volume); // sort by descending volume

  // TODO: use cumulativevolume above



  const totalvolume = components.reduce((a, b) => a + b.volume, 0);

  const UFIstrings = components

    .filter((x) => x.uficode)

    .map((x) => UFIstring(totalvolume, x));

  return UFIstrings.join('\n');

}


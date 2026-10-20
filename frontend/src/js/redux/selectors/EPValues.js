import dateAdd from 'date-fns/add';

import COUNTRIES from 'js/localization/Countries';

import i18n from 'js/localization/i18n';

import {

  BARCODEPREFIXES,

  code39Encode,

  encodeEAN13,

  encodeGS1ColorCode,

  encodeGS1Price,

  encodeGS1ProductBarcode,

  limitGS1Length,

} from 'js/mylib/BarcodeUtils';

import {

  dateTimeToLocaleString,

  dateToLocaleString,

  timeToLocaleString,

} from 'js/mylib/DateUtils';

import {

  EI_TYPE_CURRENCY,

  EI_TYPE_SMALL_MASS,

  EI_TYPE_SMALL_VOLUME,

} from 'polchem_base/common/EIVariables';

import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';

import { ShotFormatter } from 'polchem_base/common/formatters/ShotFormatter';

import _ from 'lodash';

import { sortFormula, RGBColorToHex } from '../../mylib/Utils';

import { selectors as cacheSelectors } from '../reducers/Cache';

import { EIDataset, makeFormatters } from './EIValues';

import { createShotFormatter } from './Formatters';

import { commentnotes } from './FormulaComments';



// Inline formula format "cntcode1: amount1; cntcode2: amount2"

const INLINE_VALUE_SEPARATOR = ':\u00A0';

const INLINE_ITEM_SEPARATOR = '; ';



function coerceString(value) {

  return value == null ? '' : String(value);

}



function combineStrings(a, b) {

  return a != null && b != null ? a + b : '';

}



function arrayToLines(a) {

  return a.map(coerceString).filter(Boolean).join('\n');

}



function recodeURI(uri) {

  return uri ? encodeURI(decodeURI(uri)) : '';

}



function cardNames(state) {

  const { color } = state.order;

  const cardids = color && color.colourcardids;

  if (cardids) {

    return arrayToLines(

      cardids.map((x) => cacheSelectors.getCard(state, x)?.cardname)

    );

  }

  return '';

}



function cntsFormatting(state) {

  const { item, tinting_result, selected_unit } = state.order;

  // Sort colorants to order defined by configuration

  const cnts = sortFormula(state.configurations, item.cnts) || [];

  const tint_cnts = item.additionOnly

    ? cnts.map((x) => ({

        volume: x.additionvolume,

        specificgravity: x.specificgravity,

      }))

    : cnts;

  const original_cnts = cnts.map((x) => ({

    volume: x.originalvolume,

    specificgravity: x.specificgravity,

  }));

  const result_by_cntcode = tinting_result

    ? _.fromPairs(tinting_result.cnts.map((x) => [x.cntcode, x]))

    : {};

  const results = cnts.map((cnt) => result_by_cntcode[cnt.cntcode]);

  const scale_resolution = _.get(results[0], 'scale_resolution');



  const defaultShotFormatter = state.configurations.shotFormatter;

  const selectedShotFormatter = createShotFormatter(state)(selected_unit);

  const mlFormatter = new ShotFormatter({ decimals: 3 });

  const formatter = new NumberFormatter({

    decimals: scale_resolution,

    allowTrailingZeros: true,

  });



  return {

    codes: cnts.map((cnt) => cnt.cntcode),

    tint_cnts,

    original_cnts,

    cumulative_cnts: cnts,

    defaultShotFormatter,

    selectedShotFormatter,

    mlFormatter,

    expectedMass: results.map((x) =>

      x != null ? formatter.format(x.expected_mass) : ''

    ),

    actualMass: results.map((x) =>

      x != null ? formatter.format(x.actual_mass) : ''

    ),

    actualVolume: results.map((x) =>

      x != null ? formatter.format(x.actual_volume) : ''

    ),

    defaultUnitName: defaultShotFormatter.getUnitName(),

    selectedUnitName: selectedShotFormatter.getUnitName(),

  };

}



/**

 * Computes string values for all EasyPrint variables.

 *

 * @param {object} state Redux root state

 * @param {number} canNumber Sequential number of can

 * @returns {object} Object mapping variable codes to string values

 *  (empty strings for missing values)

 */

export default function EPValues(state, canNumber = 1) {

  let r = {

    ...orderValues(state, canNumber),

    ...formulaValues(state),

    ...dateValues(state),

    ...siteValues(state),

    ...extraInfoValues(state),

  };



  // convert values to string

  r = _.mapValues(r, coerceString);



  // Barcodes from values already computed

  r.bcdOrderID = r.orderBarcode;

  r.bcdItemID = r.itemBarcode;

  r.bcdCan = r.canBarcode;

  r.bcdPriceGroup = r['extraInfo.priceGroupBarcode'];

  r.bcdFormula = r.formulaBarcode;

  r.bcd2ProductInfo = recodeURI(r.productInfoLink);



  const GS1Product = encodeGS1ProductBarcode(r.canBarcode);

  const GS1Price = encodeGS1Price(encodeEAN13(r['priceBarcode.price']));

  const GS1PG = encodeGS1Price(r.bcdPriceGroup);

  const GS1Color = encodeGS1ColorCode(r.colourCode);

  r.bcdGS1Product = limitGS1Length(GS1Product);

  r.bcdGS1ProductPGroup = limitGS1Length(GS1Product + GS1PG);

  r.bcdGS1ProductColor = limitGS1Length(GS1Product + GS1Color);

  r.bcdGS1ProductPrice = limitGS1Length(GS1Product + GS1Price);

  r.bcdGS1ProductPriceColor = limitGS1Length(GS1Product + GS1Price + GS1Color);

  r.bcdGS1ProductPGroupColor = limitGS1Length(GS1Product + GS1PG + GS1Color);



  //TODO: rewrite data according to rules file (?)

  return r;

}



function orderValues(state, canNumber) {

  if (!state.configurations.zone) return null;

  const { order } = state;

  const { item, can = {} } = order;

  const formatters = makeFormatters(state.configurations);

  const tintExpiry = _.get(order, 'product.tintexpiry');

  const tintExpiryDate = tintExpiry

    ? dateToLocaleString(dateAdd(new Date(), { months: tintExpiry }))

    : '';

  const color_rgb = _.get(order, 'color.rgb');

  const color_rgbHex = color_rgb ? RGBColorToHex(color_rgb) : null;



  return {

    orderID: order.orderid,

    itemID: item.itemid,

    productName: item.productname,

    colourCode: item.colourcode,

    colourName: item.colourname,

    cardName: item.cardname,

    colourCards: cardNames(state),

    canName: item.cansizecode,

    baseCode: item.basecode,

    nominalQuantity: formatters[

      can.gravimetric ? EI_TYPE_SMALL_MASS : EI_TYPE_SMALL_VOLUME

    ].format(can.nominalamount),

    baseVolume: formatters[EI_TYPE_SMALL_VOLUME].format(can.basevolume),

    orderNote: order.notes,

    itemNote: item.notes,

    creationDate: dateTimeToLocaleString(order.orderdate),

    modificationDate: dateTimeToLocaleString(order.modificationdate),

    tintExpiryDate,

    customerCompany: _.get(order, 'customer.companyname'),

    customerName: _.get(order, 'customer.customername'),

    customerNote: _.get(order, 'customer.customernotes'),

    canTotal: item.ncans,

    canNumber,

    cansProgress: canNumber + '/' + item.ncans,

    errorMessage:

      order.tinting_error &&

      i18n.t('machine.msg.' + String(order.tinting_error.msgID), {

        ...order.tinting_error.msgParams,

        defaultValue: order.tinting_error.msgText,

      }),

    productInfoLink: _.get(order, 'product.infopage'),

    userName: state.user?.current_user.username,

    orderBarcode: combineStrings(

      BARCODEPREFIXES.prefixOrderLoad,

      order.orderid

    ),

    itemBarcode: combineStrings(

      BARCODEPREFIXES.prefixOrderLoadByItem,

      item.itemid

    ),

    canBarcode: can.defbarcode,

    formulaBarcode: _.get(item, 'price.incTaxCan.formulaBarcode'),



    bcdColor: code39Encode(item.colourcode),

    bcdColorFromDB: _.get(order, 'color.barcodes[0]'),

    'color.rgbHex': color_rgbHex,

  };

}



function inlineFormula(codes, values) {

  const items = codes.map(

    (code, i) => code + INLINE_VALUE_SEPARATOR + values[i]

  );

  return items.join(INLINE_ITEM_SEPARATOR);

}



function formulaValues(state) {

  const f = cntsFormatting(state);

  const format = (cnts, formatter) => cnts.map((x) => formatter.format(x));

  return {

    // Formula

    formulaColorants: f.codes.join('\n'),

    formulaDefaultVolumes: format(f.tint_cnts, f.defaultShotFormatter).join(

      '\n'

    ),

    formulaDefaultCumulativeVolumes: format(

      f.cumulative_cnts,

      f.defaultShotFormatter

    ).join('\n'),

    formulaDefaultOriginalVolumes: format(

      f.original_cnts,

      f.defaultShotFormatter

    ).join('\n'),

    formulaDefaultUnit: f.defaultUnitName,



    formulaSelectedVolumes: format(f.tint_cnts, f.selectedShotFormatter).join(

      '\n'

    ),

    formulaSelectedCumulativeVolumes: format(

      f.cumulative_cnts,

      f.selectedShotFormatter

    ).join('\n'),

    formulaSelectedOriginalVolumes: format(

      f.original_cnts,

      f.selectedShotFormatter

    ).join('\n'),

    formulaSelectedUnit: f.selectedUnitName,



    formulaMlVolumes: format(f.tint_cnts, f.mlFormatter).join('\n'),

    formulaMlCumulativeVolumes: format(f.cumulative_cnts, f.mlFormatter).join(

      '\n'

    ),

    formulaMlOriginalVolumes: format(f.original_cnts, f.mlFormatter).join('\n'),

    formulaMlUnit: i18n.t('symbol.ml'),



    formulaWeightsFromScale: f.actualMass.join('\n'),

    formulaWeightsFromDb: f.expectedMass.join('\n'),

    formulaCCsFromScale: f.actualVolume.join('\n'),

    formulaCCsFromDb: format(f.tint_cnts, f.mlFormatter).join('\n'), // =formulaMlVolumes



    formulaNote: commentnotes(state),



    // Formula inline

    formulaDefaultInline: inlineFormula(

      f.codes,

      format(f.tint_cnts, f.defaultShotFormatter)

    ),

    formulaDefaultCumulativeInline: inlineFormula(

      f.codes,

      format(f.cumulative_cnts, f.defaultShotFormatter)

    ),

    formulaDefaultOriginalInline: inlineFormula(

      f.codes,

      format(f.original_cnts, f.defaultShotFormatter)

    ),

    formulaSelectedInline: inlineFormula(

      f.codes,

      format(f.tint_cnts, f.selectedShotFormatter)

    ),

    formulaSelectedCumulativeInline: inlineFormula(

      f.codes,

      format(f.cumulative_cnts, f.selectedShotFormatter)

    ),

    formulaSelectedOriginalInline: inlineFormula(

      f.codes,

      format(f.original_cnts, f.selectedShotFormatter)

    ),

    formulaMlInline: inlineFormula(f.codes, format(f.tint_cnts, f.mlFormatter)),

    formulaMlCumulativeInline: inlineFormula(

      f.cumulative_cnts,

      format(f.tint_cnts, f.mlFormatter)

    ),

    formulaMlOriginalInline: inlineFormula(

      f.codes,

      format(f.original_cnts, f.mlFormatter)

    ),

  };

}



function dateValues() {

  const now = new Date();

  return {

    // Date and time

    currentDate: dateToLocaleString(now),

    currentTime: timeToLocaleString(now),

    currentDateTime: dateTimeToLocaleString(now),

  };

}



function siteValues(state) {

  let {

    sitename,

    sitedescription,

    companyname,

    address1,

    address2,

    phone,

    postcode,

    country,

    email,

    website,

    latitude,

    longitude,

  } = state.configurations.site || {};



  let siteName = sitename;

  let siteDescription = sitedescription;

  let postCode = postcode;



  country = COUNTRIES[country] || country;



  const vcard = [

    'BEGIN:VCARD',

    'VERSION:2.1',

    companyname ? 'FN:' + companyname : '',

    companyname ? 'N:;' + companyname : '',

    companyname ? 'ORG:' + companyname : '',

    phone ? 'TEL:' + phone : '',

    email ? 'EMAIL:' + email : '',

    website ? 'URL:' + website : '',

    address1 || address2 || postCode || country

      ? 'ADR:;;' + [address1, address2, '', postCode, country].join(';')

      : '',

    'END:VCARD',

  ]

    .filter(Boolean)

    .join('\n');



  const gps =

    latitude != null && longitude != null

      ? 'http://maps.google.com/maps?q=' + latitude + ',' + longitude

      : '';



  return {

    siteName,

    siteDescription,

    companyName: companyname,

    address1,

    address2,

    phone,

    postCode,

    country,

    email,

    website,

    latitude,

    longitude,

    bcd2Email: email ? 'MAILTO:' + email : '',

    bcd2Phone: phone ? 'TEL:' + phone : '',

    bcd2VCard: vcard,

    bcd2Website: recodeURI(website),

    bcd2GPS: gps,

  };

}



function extraInfoValues({ order, configurations }) {

  if (!configurations.zone) return {};

  const extraInfo = EIDataset(order, configurations);

  let { currencydecimals } = configurations.zone;

  if (currencydecimals == null) currencydecimals = 2;

  const priceBarcodeFormatter = new NumberFormatter({

    decimals: 0,

    scale: 10 ** currencydecimals,

    groupSeparator: '',

  });

  let r = {};

  for (let {

    code,

    dataType,

    value,

    formatted,

    selected_currency_formatted,

  } of extraInfo) {

    if (dataType === EI_TYPE_CURRENCY) {

      r['price.defaultCurrency.' + code] = formatted;

      r['price.selectedCurrency.' + code] = selected_currency_formatted; // currency formatted selection

      r['priceBarcode.' + code] = priceBarcodeFormatter.format(value);

    } else {

      r['extraInfo.' + code] = formatted;

    }

  }



  // bcdOrderIDEIPDPrice

  const decimalPointFormatter = new NumberFormatter({

    decimals: currencydecimals,

    decimalSeparator: '.',

    groupSeparator: '',

    allowTrailingZeros: true,

  });

  const price = _.find(extraInfo, (x) => x.code === 'price').value;

  r.bcdOrderIDEIPDPrice =

    order.orderid + '^' + decimalPointFormatter.format(price);



  // other extra info barcodes

  r.bcdOrderIDPriceGroup = order.orderid + '^' + r['extraInfo.priceGroup'];



  return r;

}


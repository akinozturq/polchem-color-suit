import _ from 'lodash';

import { NumberFormatter } from 'polchem_base/common/formatters/NumberFormatter';

import { RGBToBGR } from 'js/mylib/Utils';

import { toOADate } from 'js/mylib/DateUtils';

import {

  FLINK_TYPE_CC9,

  FLINK_TYPE_STANDARD,

  FLINK_TYPE_STANDARD_GRAVIMETRIC,

  FLINK_TYPE_TDF,

  FLINK_TYPE_TDF_GRAVIMETRIC,

} from 'js/Constants';

import { cnts_to_tint } from '../reducers/Order';



/**

 * F-Link file format can be used to send formula for tinting

 * on a machine not directly supported.

 *

 * Flink machine file format generator

 */



// Definition of default flink formats

const DEFAULT_FLINK = [

  ['@RUN'],

  ['@WGH', '0'],

  ['@UNT', '1', '1'],

  ['@CLR', '$COLOUR_CODE$'],

  ['@PRD', '$PRODUCT_NAME$'],

  ['@BAS', '$BASE_CODE$', '$BASE_VOLUME$'],

  ['@CAN', '$CAN_NAME$', '$NOMINAL_QUANTITY_NOT_EMPTY$'],

  ['@CNT', '$CNT_VOLUMES$'],

  ['@LQT', '$LOT_SIZE$'],

  ['@FRM', '$NOMINAL_QUANTITY$'],

  ['@END'],

];



const DEFAULT_FLINK_MASS = _.cloneDeep(DEFAULT_FLINK);

DEFAULT_FLINK_MASS[1][1] = '1';

DEFAULT_FLINK_MASS[7][1] = '$CNT_MASSES$';



const TDF_FLINK = _.cloneDeep(DEFAULT_FLINK);

TDF_FLINK[7].push('$PRODUCT_CNT_VOLUME$');



const TDF_FLINK_MASS = _.cloneDeep(TDF_FLINK);

TDF_FLINK_MASS[1][1] = '1';

TDF_FLINK_MASS[7][1] = '$CNT_MASSES$';

TDF_FLINK_MASS[7][2] = '$PRODUCT_CNT_MASS$';



const CC9_FLINK = [

  ['@RUN'],

  ['@WGH', '0'],

  ['@UNT', '1.0', '1.0'],

  ['@LQT', '$LOT_SIZE$'],

  ['@PRD', '$PRODUCT_CODE$', '$PRODUCT_NAME$'],

  ['@BAS', '$BASE_CODE$'],

  ['@CLR', '$COLOUR_CODE_NAME$'],

  ['@CAN', '$CAN_NAME$', '$BASE_VOLUME$'],

  ['@FRM', '$BASE_VOLUME$'],

  ['@CNT', '$CNT_VOLUMES$'],

  ['@LOG', '$DISPENSE_FORMAT_LOCALE$'],

  ['@END'],

];



const FLINK_FORMATS = {

  [FLINK_TYPE_STANDARD]: DEFAULT_FLINK,

  [FLINK_TYPE_STANDARD_GRAVIMETRIC]: DEFAULT_FLINK_MASS,

  [FLINK_TYPE_TDF]: TDF_FLINK,

  [FLINK_TYPE_TDF_GRAVIMETRIC]: TDF_FLINK_MASS,

  [FLINK_TYPE_CC9]: CC9_FLINK,

};



export function flinkFormat(state, flinkType) {

  const spec = FLINK_FORMATS[flinkType];

  if (!spec) return null;

  const vars = flinkVars(state);

  return formatLines(spec, vars);

}



function formatLines(spec, vars) {

  return spec

    .map((x) => formatLine(x, vars))

    .filter(Boolean)

    .join('\n');

}



function formatLine(specline, vars) {

  const values = specline.map((x) => substituteVariable(x, vars));

  const filtered = values.filter(Boolean);

  if (filtered.length >= 2 || filtered.length === values.length) {

    return filtered.join(' ');

  }

}



const VARIABLE_REGEX = /^\$(\w+)\$$/;



function substituteVariable(s, vars) {

  const match = s.match(VARIABLE_REGEX);

  return match ? vars[match[1]] : s;

}



function flinkVars(state) {

  const {

    order: { item },

    order,

    configurations,

  } = state;



  const { basevolume } = order.can;

  const basemass =

    basevolume != null ? basevolume * (order.base?.specificgravity || 1) : null;

  const cnts = cnts_to_tint(order);

  const product_base = [item.productname, item.basecode]

    .filter(Boolean)

    .join(' - ');

  const clientname = configurations.site?.localclient?.clientname;



  let r = {

    COLOUR_CODE: quotedOrNull(item.colourcode),

    COLOUR_CODE_NAME: quotedOrNull(

      [item.colourcode, item.colourname].filter(Boolean).join('|')

    ),

    PRODUCT_CODE: quotedOrNull(order.product?.productcode),

    PRODUCT_NAME: quotedOrNull(item.productname),

    BASE_CODE: quotedOrNull(item.basecode),

    CAN_NAME: quoted(item.cansizecode),

    NOMINAL_QUANTITY: formatNumber(order.can?.nominalquantity),

    NOMINAL_QUANTITY_NOT_EMPTY: formatNumber(

      order.can?.nominalquantity || 1000

    ),

    BASE_VOLUME: formatNumber(basevolume),

    LOT_SIZE: item.ncans || 1,

    CNT_VOLUMES: cnts

      .map((x) => `"${x.cntcode}" ${x.volume.toFixed(6)}`)

      .join(' '),

    CNT_MASSES: cnts

      .map((x) => `"${x.cntcode}" ${(x.volume * x.specificgravity).toFixed(6)}`)

      .join(' '),

    PRODUCT_CNT_VOLUME:

      product_base && basevolume != null

        ? `"${product_base}" ${basevolume.toFixed(6)}`

        : null,

    PRODUCT_CNT_MASS:

      product_base && basevolume != null

        ? `"${product_base}" ${basemass.toFixed(6)}`

        : null,

    DISPENSE_FORMAT_LOCALE: dispenseFormat(order, item, clientname),

  };

  return r;

}



function formatNumber(x) {

  return x == null ? null : x.toFixed(3);

}



function quoted(s) {

  return `"${s || ''}"`;

}



function quotedOrNull(s) {

  return s == null ? null : quoted(s);

}



function dispenseFormat(order, item, clientname) {

  // Uses locale-specific decimal separator.

  const nf = new NumberFormatter({ decimals: 6, groupSeparator: '' });

  const cnts = item.cnts

    .filter((x) => x.volume != null)

    .map((x) => [quoted(x.cntcode), nf.format(x.volume)])

    .flat();

  return [

    '"F"',

    quoted(order.product.systemname),

    quoted(order.product.productcode),

    quoted(item.colourcode),

    quoted(item.colourname),

    RGBToBGR(item.rgb),

    quoted(item.basecode),

    nf.format(order.can.basevolume),

    quoted(item.cansizecode),

    1,

    quoted(clientname),

    nf.format(toOADate(new Date())),

    ...cnts,

  ].join(';');

}


import moment from 'moment';

const TIMESTAMP_FORMAT = 'YYYYMMDDHHmmssSSS';

/**
 * Constructs output string for Tikkurila AX connection
 *
 * @param {Object} order Redux state.order
 * @param {Object} configurations Redux state.configurations
 * @returns {Object} {content: String, filename: String}
 */
export default function formatAXString(order, configurations, params) {
  const { facility, user, axProductName, includeColorName, numLabels } = params;
  const { item } = order;
  const { productcode, systemname } = order?.product || {};
  const colourcode = [item.colourcode, includeColorName && item.colourname]
    .filter(Boolean)
    .join(' - ');
  const axID = [facility, productcode, moment().format(TIMESTAMP_FORMAT)].join(
    '_'
  );
  const colorants = [];
  for (let i = 0; i < 7; i++) {
    const cnt = item.cnts[i] || {};
    const volume = cnt.cumulativevolume ?? cnt.volume;
    colorants.push(cnt.cntcode);
    colorants.push(volume != null ? volume.toFixed(3) : '');
  }

  //[FACI];[FPDT];[USER];[PROD];[SCDC];[PCOD];[PNAM];[COLR];[FBAS];[CANS];[BASM];[COD1];[AMO1];[COD2];[AMO2];[COD3];[AMO3];[COD4];[AMO4];[COD5];[AMO5];[COD6];[AMO6];[COD7];[AMO7];[PRGR];[MODA];[CPTR];[NLBL];[WACP];\r\n
  const a = [
    facility,
    axID,
    user,
    axProductName,
    systemname,
    productcode,
    item.productname,
    colourcode,
    item.basecode,
    item.cansizecode,
    Math.round(order.can?.basevolume),
    ...colorants,
    order.item.price?.incTaxCan.priceGroup,
    order.formula?.creationdate,
    configurations.site.localclient?.clientname,
    numLabels,
    65001,
    '\n', // becomes \r\n when written to text file
  ];
  return { content: a.join(';'), filename: axID }; // .txt extension added on API side
}

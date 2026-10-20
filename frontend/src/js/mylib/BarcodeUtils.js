import { computeGTINCheckDigit } from 'e-p';

export const BARCODEPREFIXES = {
  prefixOrderLoad: '$O',
  prefixOrderLoadByItem: '$I',
  prefixColourCode: '$K',
};

/**
 * Encode string to CODE39 character set using $ as Unicode escape character.
 * ASCII letters are uppercased, other non-39 characters and the $ are represented
 * by '$' + 4 hex digits.
 *
 * @param {string} str
 */
export function code39Encode(str) {
  if (!str) return null;
  const r = str.replace(
    /[^-./+%a-zA-Z\d]/g,
    (char) => '$' + char.charCodeAt(0).toString(16).padStart(4, '0')
  );
  return r.toUpperCase();
}

const EAN13_LENGTH = 13;

export function encodeEAN13(code) {
  if (!code) return null;
  const padded = code.padStart(EAN13_LENGTH - 1, '0');
  const check = computeGTINCheckDigit(padded);
  return check != null ? padded + check : '';
}

const DATABAR_PRODUCT_PREFIX = '(01)';
const DATABAR_PRODUCT_PREFIX_WITHOUT_BRACKETS = '01';
const DATABAR_PRODUCT_LENGTH = 14;
const DATABAR_PRICE_PREFIX = '(92)001';
const DATABAR_PRICE_LENGTH = 14;
const DATABAR_COLOR_CODE_PREFIX = '(240)';

const DATABAR_NUMERIC_MAX_LENGTH = 74;
const DATABAR_ALPHANUMERIC_MAX_LENGTH = 41;

const REGEXP_GS1_NUMERIC_BARCODE = /^[\d()]*$/;

export function filterGS1Chars(code) {
  // The GS1 subset of international standard ISO/IEC 646

  return code.replace(/[^!"%&'()*+,./0-9:;<=>?A-Z_a-z]/g, '');
}

export function encodeGS1ProductBarcode(productBarcode) {
  let code = String(productBarcode || '');

  // Validate if barcode is EAN13
  code = code.padStart(EAN13_LENGTH, '0');
  const checkDigit = computeGTINCheckDigit(code.substring(0, 12));
  const isEAN = code.charAt(12) === checkDigit;
  const prefix = isEAN
    ? DATABAR_PRODUCT_PREFIX
    : DATABAR_PRODUCT_PREFIX_WITHOUT_BRACKETS;
  return prefix + code.padStart(DATABAR_PRODUCT_LENGTH, '0');
}

export function encodeGS1Price(priceBarcodeValue) {
  return priceBarcodeValue
    ? DATABAR_PRICE_PREFIX +
        priceBarcodeValue.padStart(DATABAR_PRICE_LENGTH, '0')
    : '';
}

export function encodeGS1ColorCode(colorCode) {
  return colorCode ? DATABAR_COLOR_CODE_PREFIX + filterGS1Chars(colorCode) : '';
}

/**
 * Cut GS1 barcode to maximum length. The maximum depends on content.
 *
 * @param {string} barcode
 * @returns {string}
 */
export function limitGS1Length(barcode) {
  if (!barcode) return '';

  //Calculate max length
  let maxLength = REGEXP_GS1_NUMERIC_BARCODE.test(barcode)
    ? DATABAR_NUMERIC_MAX_LENGTH
    : DATABAR_ALPHANUMERIC_MAX_LENGTH;

  // Allow brackets
  const brackets = barcode.match(/[()]/g);
  maxLength += brackets ? brackets.length : 0;

  // Allow (01)
  if (barcode.startsWith(DATABAR_PRODUCT_PREFIX))
    // Brackets already handled, so using just length of "01" string
    maxLength += DATABAR_PRODUCT_PREFIX_WITHOUT_BRACKETS.length;

  return barcode.substring(0, maxLength);
}

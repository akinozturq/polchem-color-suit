import { ITEM_VARIABLE, ITEM_BARCODE, BARCODELENGTH } from './Constants';
import { computeGTINCheckDigit } from './BarcodeUtils';
import drawsvg from './svg';
import bwipjs from 'bwip-js';

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const FILL_COLOR_PLACEHOLDER_REGEX = /^\[([^\]]+)\]$/;

function normalizeColorValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    if (HEX_COLOR_REGEX.test(value)) {
      return value;
    }
    if (/^\d+$/.test(value)) {
      return `#${Number(value).toString(16).padStart(6, '0')}`;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `#${Math.floor(value).toString(16).padStart(6, '0')}`;
  }
  return null;
}

function assignFillColor(item, values) {
  if (!item || item.fillColor == null) {
    return item;
  }

  if (item.fillColor === 'transparent') {
    return { ...item, fillColor: 'transparent' };
  }

  const variableCode =
    item.fillColorVariable ||
    (typeof item.fillColor === 'string'
      ? FILL_COLOR_PLACEHOLDER_REGEX.exec(item.fillColor)?.[1]
      : null);

  if (variableCode) {
    const normalized = normalizeColorValue(values?.[variableCode]);
    if (normalized) {
      return { ...item, fillColor: normalized };
    }
    return { ...item, fillColor: 'transparent' };
  }

  const normalized = normalizeColorValue(item.fillColor);
  if (normalized) {
    return { ...item, fillColor: normalized };
  }

  return item;
}

export default function assignVariables(layout, values) {
  return {
    ...layout,
    items: Object.fromEntries(
      Object.entries(layout.items).map(([key, item]) => {
        let data = assignItem(item, values);
        data = assignFillColor(data, values);

        if (item.itemType === 'barcode') {
          try {
            const opts = {
              bcid: item.type, // Barcode type
              text: data.text, // Text to encode
              scale: 3, // 3x scaling factor
              height: 20, // Bar height, in millimeters
              includetext: false, // Show human-readable text
              textxalign: 'center', // Always good to set this
              dontlint: true,
            };
            let svg = bwipjs.render(opts, drawsvg(opts, bwipjs.FontLib));
            data.svg = svg;
          } catch (e) {
            console.log('SVG error:', e);
          }
        }

        return [key, data];
      })
    ),
  };
}

function assignItem(item, values) {
  switch (item.itemType) {
    case ITEM_VARIABLE:
      return { ...item, text: values[item.varCode] || '' };
    case ITEM_BARCODE:
      return assignBarcodeItem(item, values);
    default:
      return item;
  }
}

function assignBarcodeItem(item, values) {
  let { varCode, prefix, type } = item;
  prefix = prefix || '';
  let value = values[varCode] || '';
  let text = ''; // return empty text if error

  // padding and check digit calculation for fixed length types
  const fixedLength = BARCODELENGTH[type];
  if (fixedLength && value) {
    if (!prefix && value.length === fixedLength) {
      // Value should already have correct check digit, let's check
      const checkDigit = computeGTINCheckDigit(
        value.substring(0, fixedLength - 1)
      );
      if (value.charAt(fixedLength - 1) === checkDigit)
        // correct check digit
        text = value;
    } else {
      // Add prefix, padding and check digit
      const padLength = fixedLength - prefix.length - 1;
      if (padLength >= value.length) {
        // value is short enough
        value = prefix + value.padStart(padLength, '0');
        const checkDigit = computeGTINCheckDigit(value);
        if (checkDigit != null) {
          text = value + checkDigit;
        }
      }
    }
  } else {
    text = prefix + value;
  }
  return { ...item, text: text };
}

// Item types

export const ITEM_TEXT = 'text';
export const ITEM_VARIABLE = 'variable';
export const ITEM_BARCODE = 'barcode';
export const ITEM_RECTANGLE = 'rectangle';
export const ITEM_ELLIPSE = 'ellipse';
export const ITEM_LINE = 'line';
export const ITEM_IMAGE = 'image';

// Barcode types

export const BARCODE_EAN8 = 'ean8';
export const BARCODE_EAN13 = 'ean13';
export const BARCODE_CODE39 = 'code39';
export const BARCODE_CODE128 = 'code128';
export const BARCODE_UPCA = 'upca';
export const BARCODE_GS_128 = 'gs1-128';
export const BARCODE_QRCODE = 'qrcode';
export const BARCODE_DATABAR_STACKED = 'databarexpandedstacked';

// Length of fixed length barcode types.
// Also enables check digit computation for these types.
export const BARCODELENGTH = {
  [BARCODE_EAN8]: 8,
  [BARCODE_UPCA]: 12,
  [BARCODE_EAN13]: 13,
};

export const FILL_COLOR_VARIABLE_CODE = 'color.rgbHex';
export const FILL_COLOR_VARIABLE_PLACEHOLDER = `[${FILL_COLOR_VARIABLE_CODE}]`;

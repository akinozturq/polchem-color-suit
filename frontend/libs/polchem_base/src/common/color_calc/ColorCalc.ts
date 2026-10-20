import { isNumber } from 'innovatint_base/common/ObjectUtils';

export type RGB = {
  r: number | null;
  g: number | null;
  b: number | null;
};

export type ValidRGB = {
  r: number;
  g: number;
  b: number;
};

const isValidRGB = (rgb: RGB): rgb is ValidRGB => {
  const { r, g, b } = rgb;
  return [r, g, b].every(isNumber);
};

export const RGBint2rgb = (num: number): RGB => {
  num >>>= 0;
  const b = num & 0xff,
    g = (num & 0xff00) >>> 8,
    r = (num & 0xff0000) >>> 16;

  return {
    r,
    g,
    b,
  };
};

export const RGB2RGBint = (rgb: RGB): number | null => {
  if (isValidRGB(rgb)) {
    const { r, g, b } = rgb;
    return Math.round(r) * 256 * 256 + Math.round(g) * 256 + Math.round(b);
  }
  return null;
};

export const toHex = (n: number | undefined, minWidth = 0): string => {
  if (n === undefined) {
    return '0f0f0f00';
  }
  const s = n.toString(16);
  if (s.length < minWidth) return '0'.repeat(minWidth - s.length) + s;
  return s;
};

export const RGBColorToHex = (rgb: number | null | undefined): string => {
  if (!rgb) {
    return '#000000'; // black
  }
  return '#' + toHex(rgb, 6);
};

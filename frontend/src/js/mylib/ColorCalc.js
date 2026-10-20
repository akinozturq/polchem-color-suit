import * as color_conv from 'polchem_base/common/color_calc/color_conv';
import { RGB2RGBint } from 'polchem_base/common/color_calc/ColorCalc';

/**Computes XYZ values from reflectance.
 *
 * @param {array} refl 16 or 31 reflectance values [0..100.0]
 * @param {number} illumIdx illuminant index [0..2]
 * @returns {array | null} 3 numbers
 **/
export function refl_to_xyz(refl, illumIdx = 0) {
  try {
    const { x, y, z } = color_conv.refl_to_xyz(refl, illumIdx);
    return [x, y, z];
  } catch (e) {
    return null;
  }
}

/** Computes CIELAB values from XYZ values.
 *
 * @param {array} xyz
 * @param {number} illumIdx illuminant index [0..2]
 * @returns {array} 3 numbers
 */
export function xyz_to_lab(xyz, illumIdx = 0) {
  const [x, y, z] = xyz;
  const { l, a, b } = color_conv.xyz_to_lab({ x, y, z }, illumIdx);
  return [l, a, b];
}

/** Convert from XYZ to RGB
 *
 * @param {array} xyz X,Y,Z for D65/10°
 * @returns {number} rgb as an int
 */
export function xyz_to_rgb(xyz) {
  const [x, y, z] = xyz;
  return RGB2RGBint(color_conv.xyz_to_rgb({ x, y, z }));
}

export function isDarkColor(rgb) {
  const [r, g, b] = rgb;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

  return luma < 80;
}

import { LAB_Type } from './color_diff';
import {
  ILLUMINANTS10,
  ILLUMINANTS20,
  ILLUNAMES,
  WHITEPOINTS,
  WHITEPOINTS1931,
} from './illum';
import { SplineRegular } from './interpolation';
import { downsample } from './resampling';

export type Refl_Type = number[]; // type definition for reflectance values
export type XYZ_Type = { x: number; y: number; z: number };
export type RGB_Type = { r: number; g: number; b: number };

export type ReflectanceType = {
  rb?: Refl_Type;
  rinf?: Refl_Type;
  rw?: Refl_Type;
  wl0: number;
  wlstep: number;
};

export type Reflectance_400_10nm = ReflectanceType & { wl0: 400; wlstep: 10 };

/** Converts an array of 3 numbers to LAB_Type */
export function array_to_lab(lab: number[]): LAB_Type {
  const [l, a, b] = lab;
  return { l, a, b };
}

export function refl_to_10nm(refl: Refl_Type): Refl_Type {
  const l = refl.length;
  if (l === 31) {
    return refl;
  }
  const step = (l - 1) / 30.0;
  const spline = new SplineRegular(refl);
  const result = [];
  for (let i = 0; i < 31; i++) {
    result.push(spline.get(i * step));
  }
  return result;
}

export function reflectance_to_array_400_10nm(
  reflectance?: ReflectanceType | null,
  key: 'rw' | 'rb' | 'rinf' = 'rinf'
): Refl_Type | null {
  if (!reflectance) {
    return null;
  }
  const { wl0, wlstep, [key]: refl } = reflectance;
  if (refl?.length) {
    let r = refl_resample_10nm(refl, wlstep);
    if (wl0 < 400) {
      r = r.slice((400 - wl0) / 10);
    }
    if (r.length > 31) {
      r = r.slice(0, 31);
    }
    return r;
  }
  return null;
}

export function reflectance_to_400_10nm(
  refl: ReflectanceType
): Reflectance_400_10nm {
  const { wl0, wlstep } = refl;
  if (wl0 === 400 && wlstep === 10) {
    return refl as Reflectance_400_10nm;
  }
  const result = { wl0: 400, wlstep: 10 } as Reflectance_400_10nm;
  for (const key of ['rw', 'rb', 'rinf'] as const) {
    if (refl[key]) {
      result[key] = reflectance_to_array_400_10nm(refl, key) as Refl_Type;
    }
  }
  return result;
}

export function refl_resample_10nm(refl: Refl_Type, wlstep: number): Refl_Type {
  if (wlstep === 10) {
    return refl;
  }

  if (wlstep > 10) {
    const [stride, rem] = [Math.floor(wlstep / 10), wlstep % 10];
    if (rem) {
      throw new Error('Nonintegral upsampling not supported');
    }
    const spline = new SplineRegular(refl);
    const step = 1.0 / stride;
    const stop = (refl.length - 1) * stride + 1;
    return Array.from({ length: stop }, (_, i) => spline.get(i * step));
  }

  const [stride, rem] = [Math.floor(10 / wlstep), 10 % wlstep];
  if (rem) {
    throw new Error('Nonintegral downsampling not supported');
  }
  return downsample(refl, stride);
}

export function refl_to_xyz(refl: Refl_Type, illumIdx = 0): XYZ_Type {
  /*
  Computes XYZ values from reflectance.

  refl is a sequence of 16 or 31 reflectance values [0..100.0]
  illumIdx is illuminant index [0..2]

  returns an array of 3 numbers
  */
  let ill: Array<Array<number>>;

  if (refl.length === 16) {
    ill = ILLUMINANTS20[illumIdx];
  } else if (refl.length === 31) {
    ill = ILLUMINANTS10[illumIdx];
  } else {
    throw new Error('Invalid refl length');
  }

  return {
    x:
      ill[0].map((illVal, i) => illVal * refl[i]).reduce((a, b) => a + b) / 100,
    y:
      ill[1].map((illVal, i) => illVal * refl[i]).reduce((a, b) => a + b) / 100,
    z:
      ill[2].map((illVal, i) => illVal * refl[i]).reduce((a, b) => a + b) / 100,
  };
}

export function refl_to_xyz_all(refl: Refl_Type): XYZ_Type[] {
  /*Computes XYZ values from reflectance for all illuminants.

    refl is a sequence of 16 or 31 reflectance values [0..100.0]

    returns a list of 3 lists of 3 floats
    */

  return ILLUNAMES.map((x, i) => refl_to_xyz(refl, i));
}

/**
 * Computes Whiteness Index according to ASTM E 313-05.
 * @param xyz xyzType in D65 (object with properties x, y, z)
 * @returns Whiteness Index (number)
 */
export function xyz_to_wi(xyz: XYZ_Type): number {
  const { x: X, y: Y, z: Z } = xyz;
  const sum_xyz = X + Y + Z;
  const x = X / sum_xyz;
  const y = Y / sum_xyz;

  const WI_x = 800;
  const WI_y = 1700;
  const xn = 0.3138;
  const yn = 0.331;

  const WI = Y + WI_x * (xn - x) + WI_y * (yn - y);
  return WI;
}

/** Computes Yellowness Index according to ASTM E 313-05.
 * xyz is XYZ in D65 (3 floats)
 * returns float
 */
export function xyz_to_yi(xyz: XYZ_Type): number {
  const { x: X, y: Y, z: Z } = xyz;
  const CX = 1.3013;
  const CZ = 1.1498;

  const YI = (100.0 * (CX * X - CZ * Z)) / Y;
  return YI;
}

function _f(x: number): number {
  if (x > 0.008856) {
    return Math.pow(x, 0.333333);
  } else {
    return 7.787 * x + 16 / 116;
  }
}

function _invf(x: number): number {
  if (x > 0.2069) {
    return Math.pow(x, 3);
  } else {
    return (x - 16 / 116) / 7.787;
  }
}

/**
 * Computes CIELAB values from XYZ values.
 * @param xyz A sequence of 3 numbers representing X, Y, and Z.
 * @param illumIdx An illuminant index between 0 and 2. Defaults to 0.
 * @returns An object containing the L*, a*, and b* values.
 */
export function xyz_to_lab(xyz: XYZ_Type, illumIdx = 0): LAB_Type {
  const { x, y, z } = xyz;
  const [x0, y0, z0] = WHITEPOINTS[illumIdx];

  const yr = _f(y / y0);

  return {
    l: 116 * yr - 16,
    a: 500 * (_f(x / x0) - yr),
    b: 200 * (yr - _f(z / z0)),
  };
}

export function xyz_to_lab_all(xyz: XYZ_Type[]): LAB_Type[] {
  /**
   * Computes CIELAB values from XYZ values for all illuminants.
   * xyz is a sequence of 3 sequences of 3 floats
   * returns a list of 3 lists of 3 floats
   */

  return ILLUNAMES.map((x, i) => xyz_to_lab(xyz[i], i));
}

export function lab_to_xyz(lab: LAB_Type, illumIdx = 0): XYZ_Type {
  const { l, a, b } = lab;
  const [x0, y0, z0] = WHITEPOINTS[illumIdx];

  const yr = (l + 16) / 116;
  return {
    x: _invf(a / 500 + yr) * x0,
    y: _invf(yr) * y0,
    z: _invf(-b / 200 + yr) * z0,
  };
}

export function refl_to_lab(refl: Refl_Type, illumIdx = 0): LAB_Type {
  /** Computes CIELAB values from reflectance.

    refl is a sequence of 16 or 31 reflectance values [0..100.0]
    illumIdx is illuminant index [0..2]

    */
  return xyz_to_lab(refl_to_xyz(refl, illumIdx), illumIdx);
}

export function refl_to_lab_all(refl: Refl_Type): LAB_Type[] {
  /** Computes CIELAB values from reflectance for all illuminants.

   refl is a sequence of 16 or 31 reflectance values [0..100.0]

   */
  return xyz_to_lab_all(refl_to_xyz_all(refl));
}

export function refl_to_10nm_lab_all(refl: Refl_Type): LAB_Type[] {
  /** Computes CIELAB values from reflectance for all illuminants.
    Interpolates refl to 10 nm intervals first.

    refl is a sequence of reflectance values [0..100.0]

    """
     */
  return refl_to_lab_all(refl_to_10nm(refl));
}

type refKey = 'rw' | 'rb' | 'rinf';
export function refl400700_to_10nm_lab_all(
  refl?: ReflectanceType | null,
  key: refKey = 'rinf'
): LAB_Type[] {
  /** Computes CIELAB values from reflectance for all illuminants.
   * Interpolates refl to 10 nm intervals first.
   *
   * refl is a {'wl0': wl0,
   *         'wlstep': wlstep,
   *         'wlcount': len(wls),
   *         'r': refl}
   *
   * picking only 400-700nm range
   *
   * returns a list of 3 lists of 3 floats
   */

  if (!refl) {
    const empty = {} as LAB_Type;
    return [empty, empty, empty];
  }
  if (!refl[key]) {
    throw new Error('No reflectance');
  }
  const r = reflectance_to_array_400_10nm(refl, key);
  if (refl.wl0 > 400 || r?.length !== 31) {
    throw new Error('Invalid reflectance range');
  }

  return refl_to_lab_all(r);
}

function _xyz_to_cat02_rgb([x, y, z]: number[]) {
  const r = 0.7328 * x + 0.4296 * y - 0.1624 * z;
  const g = -0.7036 * x + 1.6975 * y + 0.0061 * z;
  const b = 0.003 * x + 0.0136 * y + 0.9834 * z;

  return [r, g, b];
}

function _cat02_rgb_to_xyz([r, g, b]: number[]): XYZ_Type {
  const x = 1.096124 * r - 0.278869 * g + 0.182745 * b;
  const y = 0.454369 * r + 0.473533 * g + 0.072098 * b;
  const z = -0.009628 * r - 0.005698 * g + 1.015326 * b;
  return { x, y, z };
}

function divide_elements(array1: number[], array2: number[]): number[] {
  return array1.map((val, i) => val / array2[i]);
}

function multiply_elements(array1: number[], array2: number[]): number[] {
  return array1.map((val, i) => val * array2[i]);
}

const _CAT02_SCALING = WHITEPOINTS.map((wp1964) =>
  divide_elements(
    _xyz_to_cat02_rgb(WHITEPOINTS1931[0]),
    _xyz_to_cat02_rgb(wp1964)
  )
);

function cat02_transform({ x, y, z }: XYZ_Type, illumIdx = 0): XYZ_Type {
  const rgb = _xyz_to_cat02_rgb([x, y, z]);
  const adjusted = multiply_elements(rgb, _CAT02_SCALING[illumIdx]);
  return _cat02_rgb_to_xyz(adjusted);
}

/**
 * @param lab LAB_Type
 */

export const lab_to_rgb = (lab: LAB_Type, illumIdx = 0): RGB_Type => {
  return xyz_to_rgb(lab_to_xyz(lab, illumIdx), illumIdx);
};

export const xyz_to_rgb = (xyz: XYZ_Type, illumIdx = 0): RGB_Type => {
  let { x, y, z } = cat02_transform(xyz, illumIdx);

  x /= 100;
  y /= 100;
  z /= 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  r = srgb_gamma(r);
  g = srgb_gamma(g);
  b = srgb_gamma(b);

  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255),
  };
};

export const refl_to_rgb = (refl: ReflectanceType, key: refKey): RGB_Type => {
  return lab_to_rgb(refl400700_to_10nm_lab_all(refl, key)[0]);
};

function srgb_gamma(r: number): number {
  return r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
}

export function lab_to_rgb_int(
  lab: LAB_Type | undefined,
  illumIdx = 0
): number | undefined {
  if (lab === undefined) {
    return undefined;
  }

  const { r, g, b } = lab_to_rgb(lab, illumIdx);
  return (r << 16) | (g << 8) | b;
}

/*

def _srgb_inv_gamma(x):
    if x > 0.04045:
        return ( ( x + 0.055 ) / 1.055 ) ** 2.4
    return x / 12.92


def rgb_to_xyz(rgbtuple):
    '''
    Convert from RGB to XYZ.
    '''
    return cat02_inv_transform(rgb_to_xyz1931(rgbtuple), 0)


def rgb_to_xyz1931(rgbtuple):
    '''
    Convert from RGB to XYZ (2 degree observer, CIE 1931).
    '''
    R,G,B = rgbtuple

    var_R = 100. * _srgb_inv_gamma( R / 255.)
    var_G = 100. * _srgb_inv_gamma( G / 255.)
    var_B = 100. * _srgb_inv_gamma( B / 255.)

    #Observer. = 2 deg, Illuminant = D65
    X = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805
    Y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722
    Z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505

    return X,Y,Z


def _srgb_gamma(x):
    """sRGB gamma transformation
    """
    if x > 0.0031308:
        return 1.055 * ( x ** ( 1. / 2.4 ) ) - 0.055
    return x * 12.92


def lab_to_lch(lab):
    '''
    Converts lab to LCH implementation is from:
    http://brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
    '''
    l,a,b = lab
    c = math.sqrt(a*a+b*b)
    h = math.degrees(math.atan2(b, a))
    if h < 0.:
        h += 360.
    return [l,c,h]

def lab_to_rgb(lab,illuminant = 0):
    '''
    Convert from LAB to RGB.

    returns float scaled and limited to  range [0..255.] and is in RGB gamut
    '''
    if None in lab:
        return None
    R, G ,B = xyz_to_rgb(lab_to_xyz(lab,illuminant))
    return _clip_and_round(R),_clip_and_round(G),_clip_and_round(B), is_rgb_in_gamut((R,G,B))


def xyz_to_rgb(xyz):
    return xyz1931_to_rgb(cat02_transform(xyz, 0))


def xyz1931_to_rgb(xyz):
    '''
    Convert from XYZ to RGB.

    returns a tuple of float scaled to *BUT NOT LIMITED TO* range [0..255.]
    '''
    if None in xyz:
        return None,None,None
    X,Y,Z = xyz

    var_X = X / 100.
    var_Y = Y / 100.
    var_Z = Z / 100.

    var_R = _srgb_gamma( var_X *  3.2406 + var_Y * -1.5372 + var_Z * -0.4986)
    var_G = _srgb_gamma( var_X * -0.9689 + var_Y *  1.8758 + var_Z *  0.0415)
    var_B = _srgb_gamma( var_X *  0.0557 + var_Y * -0.2040 + var_Z *  1.0570)

    R = var_R * 255.
    G = var_G * 255.
    B = var_B * 255.

    return R, G, B


def xyz_to_rgb_all(xyz3):
    '''Converts XYZ triplets of all illuminants to D65 RGB triplets.

    RGB values are not clipped to [0..255], use rgb_to_int or clip_rgb
    '''
    return [xyz1931_to_rgb(cat02_transform(v,i)) for i, v in enumerate(xyz3)]


def _xyz_to_cat02_rgb(xyz):
    X,Y,Z = xyz

    R =  0.7328*X + 0.4296*Y - 0.1624*Z
    G = -0.7036*X + 1.6975*Y + 0.0061*Z
    B =  0.0030*X + 0.0136*Y + 0.9834*Z

    return R,G,B


def _cat02_rgb_to_xyz(rgb):
    R,G,B = rgb

    X =  1.096124*R - 0.278869*G + 0.182745*B
    Y =  0.454369*R + 0.473533*G + 0.072098*B
    Z = -0.009628*R - 0.005698*G + 1.015326*B

    return X,Y,Z


_CAT02_SCALING = [[a/b for a, b in zip(
                        _xyz_to_cat02_rgb(illum.WHITEPOINTS1931[0]),
                        _xyz_to_cat02_rgb(illum.WHITEPOINTS[i]))]
                  for i in range(3)]

def cat02_transform(xyz, illumIdx):
    '''CAT02 transform from CIECAM02
    Converts XYZ values from other illuminant, 10 degree (1964) observer
    to corresponding XYZ in D65, 2 degree (1931) observer
    '''
    rgb = _xyz_to_cat02_rgb(xyz)
    adjusted = map(operator.mul, rgb, _CAT02_SCALING[illumIdx])
    return _cat02_rgb_to_xyz(adjusted)


_CAT02_INV_SCALING = [[a/b for a, b in zip(
                        _xyz_to_cat02_rgb(illum.WHITEPOINTS[0]),
                        _xyz_to_cat02_rgb(illum.WHITEPOINTS1931[i]))]
                  for i in range(3)]

def cat02_inv_transform(xyz, illumIdx):
    '''CAT02 transform from CIECAM02
    Converts XYZ values from other illuminant, 2 degree (1931) observer
    to corresponding XYZ in D65, 10 degree (1964) observer
    '''
    rgb = _xyz_to_cat02_rgb(xyz)
    adjusted = map(operator.mul, rgb, _CAT02_INV_SCALING[illumIdx])
    return _cat02_rgb_to_xyz(adjusted)


def _xyz_to_bfd_rgb(xyz):
    '''Forward matrix for Bradford transform'''
    X,Y,Z = xyz

    R =  0.8951000*X + 0.2664000*Y - 0.1614000*Z
    G = -0.7502000*X + 1.7135000*Y + 0.0367000*Z
    B =  0.0389000*X - 0.0685000*Y + 1.0296000*Z

    return R,G,B


def _bfd_rgb_to_xyz(rgb):
    '''Inverse matrix for Bradford transform'''
    R,G,B = rgb

    X =  0.9869929*R - 0.1470543*G + 0.1599627*B
    Y =  0.4323053*R + 0.5183603*G + 0.0492912*B
    Z = -0.0085287*R + 0.0400428*G + 0.9684867*B

    return X,Y,Z


def bradford_transform(xyz, scaling):
    '''Linear Bradford chromatic adaptation transform
    Converts XYZ values using scaling vector in cone response space
    '''
    rgb = _xyz_to_bfd_rgb(xyz)
    adjusted = map(operator.mul, rgb, scaling)
    return _bfd_rgb_to_xyz(adjusted)


_D50_D65_1931_SCALING = [a/b for a, b in zip(
                _xyz_to_bfd_rgb(illum.WHITEPOINTS1931[0]),
                _xyz_to_bfd_rgb(illum.WHITEPOINT_D50_1931),
                )]

def xyz_d50_1931_to_d65_1964(xyz):
    '''Converts XYZ values from D50/2 degree observer to D65/10 degree observer
    '''
    return cat02_inv_transform(bradford_transform(xyz, _D50_D65_1931_SCALING), 0)


def is_rgb_in_gamut(rgbtuple):
    """Check if r,g and b are in range [0..255]
    returns bool
    """
    r,g,b=rgbtuple

    return 0.<=r<=255. and 0.<=g<=255. and 0.<=b<=255.


def _clip_and_round(x):
    r = int(round(x))
    if r < 0:
        return 0
    if r > 255:
        return 255
    return r


def clip_rgb(rgbtuple):
    """Convert float rgb tuple to int rgb tuple.
    Clips r,g and b to [0..255]
    returns tuple of int
    """
    r,g,b = rgbtuple
    return _clip_and_round(r), _clip_and_round(g), _clip_and_round(b)


def rgb_to_int(rgbtuple):
    """Convert float rgb tuple to single int.
    Clips r,g and b to [0..255]

    returns int (0xRRGGBB)
    """
    r,g,b=rgbtuple

    return _clip_and_round(r) << 16 | _clip_and_round(g) << 8 | _clip_and_round(b)


def int_to_rgb(rgbint):
    r = rgbint >> 16 & 255
    g = rgbint >> 8 & 255
    b = rgbint & 255

    return r,g,b


def refl_045_to_sci(refl, gloss):
    '''Convert reflectance from 0/45 geometry to SCI

    param refl: list of float, reflectance in range [0..100]
    param gloss: float, gloss factor

    returns: list of float, reflectance
    '''
    offset = 0.73*math.log(gloss) + 1.17
    return [0.963*r + offset for r in refl]

def refl_almost_equal(refl1, refl2, delta=0.01):
    if len(refl1) != len(refl2):
        return False

    try:
        for r1, r2 in zip(refl1, refl2):
            if r1 is None and r2 is None:
                continue
            if abs(r1-r2) > delta:
                return False
    except TypeError: # when one of r1 and r2 is None
        return False
    return True

*/

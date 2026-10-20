import {
  lab_to_xyz,
  Refl_Type,
  refl_to_lab_all,
  refl_to_xyz,
  xyz_to_lab,
  XYZ_Type,
} from './color_conv';

const DEGS = 180 / Math.PI;
const RADS = Math.PI / 180;

export type LAB_Type = { l: number; a: number; b: number };
export type LCH_Type = { l: number; c: number; h: number };

// Standard Delta E metric options
export const MATCHING_DE_CMC_2_1 = 0;
export const MATCHING_DE_CMC_1_1 = 1;
export const MATCHING_DE_CIEDE2000 = 2;
export const MATCHING_DE_CIE76 = 3;

export function color_diff(
  lab1: LAB_Type,
  lab2: LAB_Type,
  deoption: number | null | undefined = MATCHING_DE_CIEDE2000
): number {
  switch (deoption) {
    case MATCHING_DE_CMC_2_1:
      return cmc_de(lab1, lab2, 2.0, 1.0);
    case MATCHING_DE_CMC_1_1:
      return cmc_de(lab1, lab2, 1.0, 1.0);
    case MATCHING_DE_CIE76:
      return cie_de_1976(lab1, lab2);
    case MATCHING_DE_CIEDE2000:
    default:
      return cie_de_2000(lab1, lab2);
  }
}

export function cmc_de_many(
  lab1: LAB_Type,
  labs2: LAB_Type[],
  l = 2.0,
  c = 1.0
): number[] {
  const { l: L1, a: a1, b: b1 } = lab1;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);

  let Sl: number;
  if (L1 < 16) {
    Sl = 0.511;
  } else {
    Sl = (0.040975 * L1) / (1.0 + 0.01765 * L1);
  }

  const Sc = (0.0638 * C1) / (1.0 + 0.0131 * C1) + 0.638;

  let H1 = Math.atan2(b1, a1) * DEGS;
  if (H1 < 0) {
    H1 += 360;
  }

  let T: number;
  if (164 <= H1 && H1 <= 345) {
    T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * RADS));
  } else {
    T = 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * RADS));
  }

  const C1_4 = Math.pow(C1, 4);
  const F = Math.sqrt(C1_4 / (C1_4 + 1900));

  const Sh = Sc * (F * T + 1.0 - F);

  const res: number[] = [];
  for (const { l: L2, a: a2, b: b2 } of labs2) {
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const dC = C1 - C2;
    const tmp = C1 * C2 - a1 * a2 - b1 * b2;
    const dH = Math.sqrt(2.0 * tmp) > 0.0 ? Math.sqrt(2.0 * tmp) : 0.0;
    const dL = L1 - L2;

    res.push(
      Math.sqrt((dL / (l * Sl)) ** 2 + (dC / (c * Sc)) ** 2 + (dH / Sh) ** 2)
    );
  }

  return res;
}

export function cmc_de(
  lab1: LAB_Type,
  lab2: LAB_Type,
  l = 2.0,
  c = 1.0
): number {
  return cmc_de_many(lab1, [lab2], l, c)[0];
}

export function cie_de_1976(lab1: LAB_Type, lab2: LAB_Type): number {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;
  return Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function cie_de_1994(lab1: LAB_Type, lab2: LAB_Type): number {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;
  const dL = L1 - L2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const dC = C1 - C2;
  const tmp = C1 * C2 - a1 * a2 - b1 * b2;
  const dH = Math.sqrt(2.0 * tmp) > 0.0 ? Math.sqrt(2.0 * tmp) : 0.0;
  const Sl = 1.0;
  const Sc = 1 + 0.045 * C1;
  const Sh = 1 + 0.015 * C1;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2);
}

/**
 * Calculates CIEDE2000
 * @param lab1 - sequence of 3 floats (CIELAB coordinates)
 * @param lab2 - sequence of 3 floats (CIELAB coordinates)
 * @returns CIEDE2000 color difference
 */
export function cie_de_2000(lab1: LAB_Type, lab2: LAB_Type): number {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;

  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab = (C1ab + C2ab) / 2;

  const Cab7 = Cab ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 25 ** 7)));

  const a_p1 = (1 + G) * a1;
  const a_p2 = (1 + G) * a2;

  const C_p1 = Math.sqrt(a_p1 * a_p1 + b1 * b1);
  const C_p2 = Math.sqrt(a_p2 * a_p2 + b2 * b2);

  let h_p1 = 0;
  if (C_p1 !== 0) {
    h_p1 = Math.atan2(b1, a_p1) * DEGS;
    if (h_p1 < 0) {
      h_p1 += 360;
    }
  }

  let h_p2 = 0;
  if (C_p2 !== 0) {
    h_p2 = Math.atan2(b2, a_p2) * DEGS;
    if (h_p2 < 0) {
      h_p2 += 360;
    }
  }

  const dL_p = L2 - L1;
  const dC_p = C_p2 - C_p1;

  let dh_p = 0;
  if (C_p1 * C_p2 !== 0) {
    dh_p = h_p2 - h_p1;
    if (dh_p > 180) {
      dh_p -= 360;
    } else if (dh_p < -180) {
      dh_p += 360;
    }
  }

  const dH_p = 2 * Math.sqrt(C_p1 * C_p2) * Math.sin((dh_p / 2) * RADS);

  const L_p = (L2 + L1) / 2;

  const C_p = (C_p2 + C_p1) / 2;

  let h_p = 0;
  if (C_p1 * C_p2 !== 0) {
    h_p = (h_p2 + h_p1) / 2;
    if (Math.abs(h_p1 - h_p2) > 180) {
      if (h_p < 180) {
        h_p += 180;
      } else {
        h_p -= 180;
      }
    }
  }

  const T =
    1 -
    0.17 * Math.cos((h_p - 30) * RADS) +
    0.24 * Math.cos(2 * h_p * RADS) +
    0.32 * Math.cos((3 * h_p + 6) * RADS) -
    0.2 * Math.cos((4 * h_p - 63) * RADS);

  const dKulma = 30 * Math.exp(-(((h_p - 275) / 25) ** 2));

  const C_p7 = C_p ** 7;
  const Rc = 2 * Math.sqrt(C_p7 / (C_p7 + 25 ** 7));

  const Sl = 1 + (0.015 * (L_p - 50) ** 2) / Math.sqrt(20 + (L_p - 50) ** 2);

  const Sc = 1 + 0.045 * C_p; // OK

  const Sh = 1 + 0.015 * C_p * T;

  const Rt = -Math.sin(2 * dKulma * RADS) * Rc; // OK

  return Math.sqrt(
    (dL_p / Sl) ** 2 +
      (dC_p / Sc) ** 2 +
      (dH_p / Sh) ** 2 +
      Rt * (dC_p / Sc) * (dH_p / Sh)
  );
}

/**
 * Compute dL*, dC* and dH* from two L*a*b* values.
 * @param lab1 - standard
 * @param lab2 - batch
 * @returns array of 3 values containing dL*, dC* and dH*
 */
export function delta_lch(lab1: LAB_Type, lab2: LAB_Type): LCH_Type {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);

  const s = a2 * b1 < a1 * b2 ? 1 : -1;
  const tmp = C1 * C2 - a1 * a2 - b1 * b2;
  const dH = tmp > 0.0 ? s * Math.sqrt(2.0 * tmp) : 0.0;

  return { l: L2 - L1, c: C2 - C1, h: dH };
}

export function contrast_ratio(lab1: LAB_Type, lab2: LAB_Type): number {
  /** Compute contrast ratio between two L*a*b* values.
   *
   * Divides the smaller Y by the larger Y, so exchanging lab1 and lab2
   * does not change result.
   */

  const Y1: number = lab_to_xyz(lab1).y;
  const Y2: number = lab_to_xyz(lab2).y;

  return (100.0 * Math.min(Y1 ?? 0, Y2 ?? 0)) / Math.max(Y1 ?? 0, Y2 ?? 0);
}

export function din_6172_metamerism_lab(
  lab1_d65: LAB_Type,
  lab2_d65: LAB_Type,
  lab1: LAB_Type,
  lab2: LAB_Type
): number {
  /** Compute DIN 6172 index of metamerism between two pairs of L*a*b* values.
   * The first pair is assumed to be under illuminant D65. The second pair is
   * under another illuminant.
   *
   * Returns a float: the index of metamerism between D65 and second illuminant.
   */
  const delta_d65 = {
    l: lab2_d65.l - lab1_d65.l,
    a: lab2_d65.a - lab1_d65.a,
    b: lab2_d65.b - lab1_d65.b,
  };
  const delta_other = {
    l: lab2.l - lab1.l,
    a: lab2.a - lab1.a,
    b: lab2.b - lab1.b,
  };
  return cie_de_1976(delta_d65, delta_other);
}

export function din_6172_metamerism(
  refl1: Refl_Type,
  refl2: Refl_Type
): number[] {
  /** Compute DIN 6172 index of metamerism between two reflectances.

    Returns a list of two floats: the index of metamerism between
    first and second illuminant, and between first and third illuminant.
    */
  const labs1 = refl_to_lab_all(refl1);
  const labs2 = refl_to_lab_all(refl2);
  const deltas: LAB_Type[] = labs1.map((lab1, index) => {
    const lab2 = labs2[index];
    return { l: lab2.l - lab1.l, a: lab2.a - lab1.a, b: lab2.b - lab1.b };
  });

  return [cie_de_1976(deltas[0], deltas[1]), cie_de_1976(deltas[0], deltas[2])];
}

// Conversions between contrast ratio and opacity DE, assuming neutral color of 80 % reflectance
const REFL80XYZ: XYZ_Type = refl_to_xyz(Array(16).fill(80));
const REFL80LAB: LAB_Type = xyz_to_lab(REFL80XYZ);

export function opacity_de_to_cr(de: number): number {
  const lab: LAB_Type = { ...REFL80LAB };
  lab.l -= de;
  const xyz: XYZ_Type = lab_to_xyz(lab);
  return (100.0 * xyz.y) / REFL80XYZ.y;
}

export function cr_to_opacity_de(cr: number): number {
  cr /= 100.0;
  const xyz: XYZ_Type = {
    x: REFL80XYZ.x * cr,
    y: REFL80XYZ.y * cr,
    z: REFL80XYZ.z * cr,
  };
  const lab: LAB_Type = xyz_to_lab(xyz);
  return cie_de_1976(REFL80LAB, lab);
}
export type FMC = {
  DL: number;
  DC: number;
  DCrg: number;
  DCyb: number;
  DE: number;
};

function _fmc_pqs(xyz: XYZ_Type): [number, number, number] {
  const { x, y, z } = xyz;
  const p = 0.724 * x + 0.382 * y - 0.098 * z;
  const q = -0.48 * x + 1.37 * y + 0.1276 * z;
  const s = 0.686 * z;
  return [p, q, s];
}

export function fmc2_deltas(xyz1: XYZ_Type, xyz2: XYZ_Type): FMC {
  /** Compute FMC II colour difference and its components,
   * according to ASTM D2244-02 (which is the last version that describes FMC)
   *
   * @param xyz1 - XYZ tristimulus values of standard
   * @param xyz2 - XYZ tristimulus values of batch
   */
  const y = xyz1.y;

  const [p, q, s] = _fmc_pqs(xyz1);
  const [p2, q2, s2] = _fmc_pqs(xyz2);
  const dp = p2 - p;
  const dq = q2 - q;
  const ds = s2 - s;
  const sqp = p ** 2;
  const sqq = q ** 2;
  const sqs = s ** 2;

  const a =
    ((17.3e-6 * (sqp + sqq)) / (1 + (2.73 * sqp * sqq) / (p ** 4 + q ** 4))) **
    0.5;
  const b = (3.098e-4 * (sqs + 0.2015 * y ** 2)) ** 0.5;
  const d = (sqp + sqq) ** 0.5;
  const k1 =
    0.55669 +
    y * (0.049434 + y * (-0.82575e-3 + y * (0.79172e-5 - 0.30087e-7 * y)));
  const k2 =
    0.17548 +
    y * (0.027556 + y * (-0.57262e-3 + y * (0.63893e-5 - 0.26731e-7 * y)));

  const dl = (0.279 * k2 * (p * dp + q * dq)) / (a * d);
  const dc1 = (k1 * s * (p * dp + q * dq)) / (b * d ** 2) - (k1 * ds) / b;
  const dc3 = (k1 * (q * dp - p * dq)) / (a * d);

  const dc = (dc1 ** 2 + dc3 ** 2) ** 0.5;
  const de = (dl ** 2 + dc ** 2) ** 0.5;

  return { DL: dl, DC: dc, DCrg: dc3, DCyb: dc1, DE: de };
}

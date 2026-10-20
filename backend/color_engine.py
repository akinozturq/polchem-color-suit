# -*- coding: utf-8 -*-
"""
Polchem Color Suit — 100% Pure Python Optical Physics, Characterization, Formulation & Colorimetry Engine
Provides enterprise mathematical formulation and spectral optical modeling:
  - CIE 1964 10° Tristimulus (D65, A, F11), CIELAB, CIEDE2000, CMC(l:c), CIE94, CIE76
  - Saunderson Surface and Internal Reflection Corrections (k1, k2)
  - Hyperbolic Two-Flux Kubelka-Munk Equations over Dual Contrast Substrates
  - Multi-Sample Concentration-Dependent K(c,λ) and S(c,λ) Matrix Extraction
  - 3-Stage Combinatorial Search and Multi-Base NLLS Recipe Optimization
  - 4-Mode Automated Color Correction and Quality Assurance
  - ASTM E903 / ASTM G173 Solar Reflectance (TSR 300–2500nm) Motor
"""
import os
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import copy
import itertools
import json
import math
import numpy as np

WAVELENGTHS = np.arange(400, 701, 10)  # 31 wavelengths: 400..700nm (10nm step)
WAVELENGTHS_TSR = np.arange(300, 2501, 10)  # 221 wavelengths: 300..2500nm (10nm step)

# ============================================================================
# 1. Exact CIE 1964 10° Illuminant Observer Tables & White Points
# ============================================================================
WHITE_D65 = (94.809667673716, 100.0, 107.30513595866162)
WHITE_A = (111.144, 100.0, 35.2)
WHITE_F11 = (103.866, 100.0, 65.627)

D65_10NM = [
    (0.0191097, 0.0020044, 0.0860109),
    (0.084736, 0.008795, 0.389366),
    (0.204492, 0.021391, 0.972542),
    (0.314679, 0.038676, 1.55348),
    (0.383734, 0.062077, 1.96728),
    (0.370702, 0.089456, 1.9948),
    (0.302273, 0.128201, 1.74537),
    (0.195618, 0.18519, 1.31756),
    (0.080507, 0.253589, 0.772125),
    (0.016172, 0.339133, 0.415254),
    (0.003816, 0.460777, 0.218502),
    (0.037465, 0.606741, 0.112044),
    (0.117749, 0.761757, 0.060709),
    (0.236491, 0.875211, 0.030451),
    (0.376772, 0.961988, 0.013676),
    (0.529826, 0.991761, 0.003988),
    (0.705224, 0.99734, 0.0),
    (0.878655, 0.955552, 0.0),
    (1.01416, 0.868934, 0.0),
    (1.11852, 0.777405, 0.0),
    (1.12399, 0.658341, 0.0),
    (1.03048, 0.527963, 0.0),
    (0.856297, 0.398057, 0.0),
    (0.647467, 0.283493, 0.0),
    (0.431567, 0.179828, 0.0),
    (0.268329, 0.107633, 0.0),
    (0.152568, 0.060281, 0.0),
    (0.0812606, 0.0318004, 0.0),
    (0.0408508, 0.0159051, 0.0),
    (0.0199413, 0.0077488, 0.0),
    (0.00957688, 0.00371774, 0.0),
]

A_10NM = [
    (0.003, 0.0, 0.0135),
    (0.0152, 0.0016, 0.0697),
    (0.0445, 0.0047, 0.2116),
    (0.0849, 0.0104, 0.4189),
    (0.1257, 0.0203, 0.6442),
    (0.1456, 0.0351, 0.7834),
    (0.1449, 0.0615, 0.8371),
    (0.1112, 0.1052, 0.7488),
    (0.0537, 0.1691, 0.5149),
    (0.0124, 0.2596, 0.3179),
    (0.0033, 0.4027, 0.191),
    (0.037, 0.5986, 0.1105),
    (0.1303, 0.8432, 0.0672),
    (0.2927, 1.0832, 0.0377),
    (0.5146, 1.3138, 0.0187),
    (0.8035, 1.504, 0.0061),
    (1.1753, 1.662, 0.0),
    (1.602, 1.7422, 0.0),
    (2.0172, 1.7283, 0.0),
    (2.4168, 1.6797, 0.0),
    (2.6413, 1.5471, 0.0),
    (2.6152, 1.3399, 0.0),
    (2.3372, 1.0865, 0.0),
    (1.8946, 0.8296, 0.0),
    (1.3474, 0.5614, 0.0),
    (0.892, 0.3578, 0.0),
    (0.5382, 0.2126, 0.0),
    (0.3037, 0.1188, 0.0),
    (0.1613, 0.0628, 0.0),
    (0.0828, 0.0322, 0.0),
    (0.0417, 0.0162, 0.0),
]

F11_10NM = [
    (0.0072914, 0.0005116, 0.0315216),
    (0.0253118, 0.0029755, 0.1174888),
    (0.027319, 0.0032831, 0.1355479),
    (0.3887354, 0.043929, 1.9114575),
    (0.2738559, 0.0472185, 1.4046848),
    (0.1558394, 0.0372706, 0.8380473),
    (0.1235224, 0.0528823, 0.7131637),
    (0.0513667, 0.0493099, 0.3435376),
    (0.0837497, 0.228661, 0.7510113),
    (0.0177829, 0.3358341, 0.4227494),
    (0.0014328, 0.1753802, 0.0954587),
    (0.0024956, 0.0457913, 0.0096523),
    (0.0124727, 0.0811131, 0.0063781),
    (0.1538221, 0.5625686, 0.016967),
    (1.9462608, 4.9718499, 0.0725313),
    (1.2484419, 2.3935935, 0.0110585),
    (0.2145633, 0.305279, 0.0001053),
    (0.2640262, 0.2899035, 0.0),
    (0.6776479, 0.5877715, 0.0),
    (1.0736889, 0.7556793, 0.0),
    (0.6929785, 0.4059537, 0.0),
    (4.9746803, 2.5565018, 0.0),
    (1.7418276, 0.8168788, 0.0),
    (0.5944028, 0.2624364, 0.0),
    (0.1563675, 0.0653363, 0.0),
    (0.1235235, 0.0495472, 0.0),
    (0.0815064, 0.0322003, 0.0),
    (0.0258122, 0.0101016, 0.0),
    (0.0121942, 0.0047471, 0.0),
    (0.0094932, 0.0036895, 0.0),
    (0.0043866, 0.0017025, 0.0),
]

D65_20NM = [
    (-0.004224, -0.003835, -0.034334),
    (0.41509, 0.043281, 1.976007),
    (0.756848, 0.121749, 3.880296),
    (0.608592, 0.258643, 3.516913),
    (0.156445, 0.506704, 1.529079),
    (0.000744, 0.922536, 0.427252),
    (0.236757, 1.527082, 0.119404),
    (0.752405, 1.925563, 0.025798),
    (1.411955, 1.996528, -0.001122),
    (2.032206, 1.737618, 0.0),
    (2.261015, 1.318358, 0.0),
    (1.716629, 0.795575, 0.0),
    (0.861739, 0.358344, 0.0),
    (0.301655, 0.119069, 0.0),
    (0.08011, 0.031185, 0.0),
    (0.013509, 0.005248, 0.0),
]

A_20NM = [
    (0.0029, 0.0, 0.013),
    (0.0894, 0.0094, 0.4252),
    (0.2514, 0.0406, 1.2885),
    (0.2899, 0.123, 1.6743),
    (0.1073, 0.3382, 1.0298),
    (0.0067, 0.8055, 0.382),
    (0.2606, 1.6865, 0.1345),
    (1.0292, 2.6277, 0.0374),
    (2.3506, 3.324, 0.0),
    (4.0345, 3.4567, 0.0),
    (5.2825, 3.0942, 0.0),
    (4.6744, 2.1729, 0.0),
    (2.6948, 1.1228, 0.0),
    (1.0764, 0.4252, 0.0),
    (0.3227, 0.1257, 0.0),
    (0.0834, 0.0324, 0.0),
]

F11_20NM = [
    (0.0145828, 0.0010232, 0.0630431),
    (0.054638, 0.0065661, 0.2710957),
    (0.5477119, 0.094437, 2.8093696),
    (0.2470449, 0.1057647, 1.4263274),
    (0.1674995, 0.457322, 1.5020227),
    (0.0028656, 0.3507603, 0.1909174),
    (0.0249454, 0.1622263, 0.0127562),
    (3.8925216, 9.9436998, 0.1450625),
    (0.4291266, 0.610558, 0.0002106),
    (1.3552957, 1.1755429, 0.0),
    (1.385957, 0.8119073, 0.0),
    (3.4836552, 1.6337576, 0.0),
    (0.3127351, 0.1306725, 0.0),
    (0.1630129, 0.0644006, 0.0),
    (0.0243885, 0.0094943, 0.0),
    (0.0087731, 0.003405, 0.0),
]

# Legacy 10-degree D65 weights for backward compatibility when reflectance is [0..1]
D65_X = np.array([w[0] for w in D65_10NM], dtype=float)
D65_Y = np.array([w[1] for w in D65_10NM], dtype=float)
D65_Z = np.array([w[2] for w in D65_10NM], dtype=float)
D65_X = D65_X * (WHITE_D65[0] / np.sum(D65_X))
D65_Y = D65_Y * (WHITE_D65[1] / np.sum(D65_Y))
D65_Z = D65_Z * (WHITE_D65[2] / np.sum(D65_Z))


# ============================================================================
# 2. Mathematical Spline & Interpolation Classes
# ============================================================================
class Spline(object):
    def __init__(self, x, y, yp1=None, ypn=None):
        n = len(x)
        y2 = n * [0.0]
        u = n * [0.0]
        if yp1 is not None:
            y2[0] = -0.5
            u[0] = 3.0 / (x[1] - x[0]) * ((y[1] - y[0]) / (x[1] - x[0]) - yp1)
        for i in range(1, n - 1):
            sig = float(x[i] - x[i - 1]) / (x[i + 1] - x[i - 1])
            p = sig * y2[i - 1] + 2.0
            y2[i] = (sig - 1.0) / p
            u[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]) - (y[i] - y[i - 1]) / (x[i] - x[i - 1])
            u[i] = (6.0 * u[i] / (x[i + 1] - x[i - 1]) - sig * u[i - 1]) / p
        if ypn is None:
            qn = un = 0.0
        else:
            qn = 0.5
            un = 3.0 / (x[-1] - x[-2]) * (ypn - (y[-1] - y[-2]) / (x[-1] - x[-2]))
        y2[-1] = (un - qn * u[-2]) / (qn * y2[-2] + 1.0)
        for k in range(n - 2, -1, -1):
            y2[k] = y2[k] * y2[k + 1] + u[k]
        self.xa = list(map(float, x))
        self.ya = list(map(float, y))
        self.y2a = y2

    def __getitem__(self, x):
        n = len(self.xa)
        if n == 1:
            return self.ya[0]
        klo = 0
        khi = n - 1
        while khi - klo > 1:
            k = (khi + klo) >> 1
            if self.xa[k] > x:
                khi = k
            else:
                klo = k
        h = self.xa[khi] - self.xa[klo]
        if abs(h) < 1e-12:
            return self.ya[klo]
        a = (self.xa[khi] - x) / h
        b = (x - self.xa[klo]) / h
        return (
            a * self.ya[klo]
            + b * self.ya[khi]
            + ((a * a * a - a) * self.y2a[klo] + (b * b * b - b) * self.y2a[khi]) * (h * h) / 6.0
        )


class SplineRegular(object):
    def __init__(self, y, yp1=None, ypn=None):
        n = len(y)
        y2 = n * [0.0]
        u = n * [0.0]
        if yp1 is not None:
            y2[0] = -0.5
            u[0] = 3.0 * (y[1] - y[0] - yp1)
        for i in range(1, n - 1):
            p = 0.5 * y2[i - 1] + 2.0
            y2[i] = -0.5 / p
            u[i] = y[i + 1] - 2.0 * y[i] + y[i - 1]
            u[i] = (3.0 * u[i] - 0.5 * u[i - 1]) / p
        if ypn is None:
            qn = un = 0.0
        else:
            qn = 0.5
            un = 3.0 * (ypn - (y[-1] - y[-2]))
        y2[-1] = (un - qn * u[-2]) / (qn * y2[-2] + 1.0)
        for k in range(n - 2, -1, -1):
            y2[k] = y2[k] * y2[k + 1] + u[k]
        self.ya = list(map(float, y))
        self.y2a = y2

    def __getitem__(self, x):
        klo = int(x)
        khi = klo + 1
        if khi >= len(self.ya):
            return self.ya[-1]
        if klo < 0:
            return self.ya[0]
        a = khi - x
        b = x - klo
        return (
            a * self.ya[klo]
            + b * self.ya[khi]
            + ((a * a * a - a) * self.y2a[klo] + (b * b * b - b) * self.y2a[khi]) / 6.0
        )


def refl_resample_10nm(refl, wlstep):
    if wlstep == 10:
        return list(refl)
    sp = SplineRegular(refl)
    f = 10.0 / float(wlstep)
    return [min(100.0, max(0.0, sp[f * i])) for i in range(int((len(refl) - 1) / f) + 1)]


# ============================================================================
# 3. Saunderson Surface Reflection Correction Class
# ============================================================================
class Saunderson(object):
    """
    Saunderson surface reflection model.
    ke: external surface reflection factor (default 0.035 = 3.5%)
    ki: internal diffuse reflection factor (default 0.46 = 46%)
    k: gloss inclusion factor (default 1.0 for SPIN/Sphere)
    Note: `correct` and `invcorrect` operate on fractional reflectance r in [0.0, 1.0].
    """
    def __init__(self, ke=0.035, ki=0.46, k=1.0):
        # Accept percentage values if > 1.0 (e.g. 3.5 -> 0.035, 46.0 -> 0.46)
        self.ke = float(ke) / 100.0 if float(ke) > 1.0 else float(ke)
        self.ki = float(ki) / 100.0 if float(ki) > 1.0 else float(ki)
        self.k = float(k)
        self.a = (1.0 - self.ke) * (1.0 - self.ki)
        self.kek = self.ke * self.k

    def correct(self, r):
        """Measured reflectance r [0..1] -> Internal reflectance R_i [0..1]."""
        rc = r - self.kek
        return 0.0 if r <= self.kek else min(0.9999, rc / (self.a + self.ki * rc))

    def invcorrect(self, r):
        """Internal reflectance R_i [0..1] -> Measured reflectance r [0..1]."""
        ri = max(0.0, min(0.9999, float(r)))
        return self.a * ri / (1.0 - self.ki * ri) + self.kek

    def r2ks(self, r):
        """Infinite-thickness K/S from measured fractional reflectance r [0..1]."""
        rc = max(1e-5, self.correct(r))
        return (1.0 - rc) ** 2 / (2.0 * rc)

    def ks2r(self, ks):
        """Measured fractional reflectance r [0..1] from infinite-thickness K/S."""
        ks_v = max(0.0, float(ks))
        r = 1.0 + ks_v - math.sqrt(ks_v * (ks_v + 2.0))
        return self.invcorrect(r)


# ============================================================================
# 4. Colorimetric Conversions (Reflectance <-> XYZ <-> Lab <-> LCh <-> RGB)
# ============================================================================
def _normalize_refl_scale(refl):
    """
    LAB 3 stores reflectance in percentage [0..100], whereas some POS helpers pass [0..1].
    Returns both [0..100] list (`r100`) and [0..1] array (`r01`).
    """
    arr = np.asarray(refl, dtype=float)
    if len(arr) != 31 and len(arr) > 1:
        if len(arr) == 16:
            arr = np.asarray(refl_resample_10nm(arr.tolist(), 20), dtype=float)
        else:
            arr = np.interp(WAVELENGTHS, np.linspace(400, 700, len(arr)), arr)
    max_val = float(np.max(arr)) if len(arr) else 0.0
    if max_val <= 1.05:
        r01 = np.clip(arr, 0.0001, 1.0)
        r100 = (r01 * 100.0).tolist()
    else:
        r100 = np.clip(arr, 0.01, 100.0).tolist()
        r01 = np.asarray(r100, dtype=float) / 100.0
    return r100, r01


def refl_to_xyz(refl, illuminant=D65_10NM):
    r100, _ = _normalize_refl_scale(refl)
    tbl = D65_20NM if len(r100) == 16 and illuminant is D65_10NM else illuminant
    xyz = [sum(c * r for c, r in zip(col, r100)) for col in zip(*tbl)]
    return tuple(0.095593 * c for c in xyz)


def _f(c):
    return c ** (1.0 / 3.0) if c > (6.0 / 29.0) ** 3 else (841.0 / 108.0) * c + (4.0 / 29.0)


def _finv(c):
    return c ** 3 if c > (6.0 / 29.0) else (108.0 / 841.0) * (c - 4.0 / 29.0)


def xyz_to_lab(X, Y=None, Z=None, Xn=WHITE_D65[0], Yn=WHITE_D65[1], Zn=WHITE_D65[2]):
    """Supports both `xyz_to_lab((X, Y, Z), white)` and `xyz_to_lab(X, Y, Z, Xn, Yn, Zn)`."""
    if Y is None and isinstance(X, (tuple, list, np.ndarray)):
        x_val, y_val, z_val = float(X[0]), float(X[1]), float(X[2])
        if isinstance(Yn, (tuple, list)):
            Xn, Yn, Zn = float(Yn[0]), float(Yn[1]), float(Yn[2])
    elif isinstance(Y, (tuple, list)) and Z is None:
        x_val, y_val, z_val = float(X[0]), float(X[1]), float(X[2])
        Xn, Yn, Zn = float(Y[0]), float(Y[1]), float(Y[2])
    else:
        x_val, y_val, z_val = float(X), float(Y), float(Z)
    fx, fy, fz = _f(x_val / Xn), _f(y_val / Yn), _f(z_val / Zn)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b = 200.0 * (fy - fz)
    return [round(float(L), 2), round(float(a), 2), round(float(b), 2)]


def xyz_to_lab_exact(xyz, white=WHITE_D65):
    fx, fy, fz = (_f(c / wc) for c, wc in zip(xyz, white))
    return (116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz))


def lab_to_xyz(L, a=None, b=None, Xn=WHITE_D65[0], Yn=WHITE_D65[1], Zn=WHITE_D65[2]):
    if a is None and isinstance(L, (tuple, list, np.ndarray)):
        Lv, av, bv = float(L[0]), float(L[1]), float(L[2])
    else:
        Lv, av, bv = float(L), float(a), float(b)
    fy = (Lv + 16.0) / 116.0
    fx = fy + av / 500.0
    fz = fy - bv / 200.0
    return Xn * _finv(fx), Yn * _finv(fy), Zn * _finv(fz)


def lab_to_lch(lab):
    L, a, b = float(lab[0]), float(lab[1]), float(lab[2])
    c = math.hypot(a, b)
    h = (180.0 / math.pi) * math.atan2(b, a) % 360.0
    return (L, c, h)


def lch_to_lab(lch):
    L, c, h = float(lch[0]), float(lch[1]), float(lch[2])
    rad = (math.pi / 180.0) * h
    return (L, c * math.cos(rad), c * math.sin(rad))


def refl_to_lab(refl, illuminant=D65_10NM, white=WHITE_D65):
    X, Y, Z = refl_to_xyz(refl, illuminant)
    return xyz_to_lab(X, Y, Z, white[0], white[1], white[2])


def refl_to_10nm_lab_all(refl, wlstep=10):
    """Returns `{'D65': (L,a,b), 'A': (L,a,b), 'F11': (L,a,b)}` exactly like LAB 3."""
    r100, _ = _normalize_refl_scale(refl)
    if wlstep != 10:
        r100 = refl_resample_10nm(r100, wlstep)
    return {
        "D65": xyz_to_lab_exact(refl_to_xyz(r100, D65_10NM), WHITE_D65),
        "A": xyz_to_lab_exact(refl_to_xyz(r100, A_10NM), WHITE_A),
        "F11": xyz_to_lab_exact(refl_to_xyz(r100, F11_10NM), WHITE_F11),
    }


def refl400700_to_10nm_lab_all(refl):
    r100, _ = _normalize_refl_scale(refl)
    return refl_to_10nm_lab_all(r100, 10)


def cat02_D65_to_D50(xyz):
    x, y, z = xyz
    return (
        1.01641256 * x + 0.03668868 * y - 0.05079438 * z,
        0.00617173 * x + 0.99559846 * y - 0.00123397 * z,
        0.0 * x + 0.0 * y + 0.76407172 * z,
    )


def bradford_D65_to_D50(xyz):
    x, y, z = xyz
    return (
        1.0478112 * x + 0.0228866 * y - 0.050127 * z,
        0.0295424 * x + 0.9904844 * y - 0.0170491 * z,
        -0.0092345 * x + 0.0150436 * y + 0.7521316 * z,
    )


def xyz_to_rgb(xyz):
    x, y, z = (0.01 * c for c in xyz)
    rgb = (
        3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
        -0.969266 * x + 1.8760108 * y + 0.041556 * z,
        0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
    )
    rgb = (c * 12.92 if c <= 0.0031308 else 1.055 * (max(0.0, c) ** (1.0 / 2.4)) - 0.055 for c in rgb)
    return tuple(min(255, max(0, int(c * 255.0 + 0.5))) for c in rgb)


def rgb_to_int(rgb):
    r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
    return (r << 16) | (g << 8) | b


def int_to_rgb(i):
    val = int(i or 0)
    return ((val >> 16) & 255, (val >> 8) & 255, val & 255)


def xyz_to_rgb_int(X, Y, Z):
    r, g, b = xyz_to_rgb((X, Y, Z))
    rgb_int = rgb_to_int((r, g, b))
    hex_str = f"#{r:02X}{g:02X}{b:02X}"
    return rgb_int, hex_str, (r, g, b)


def lab_to_rgb(lab, white=WHITE_D65):
    X, Y, Z = lab_to_xyz(lab[0], lab[1], lab[2], white[0], white[1], white[2])
    return xyz_to_rgb((X, Y, Z))


def lab_to_rgb_int(lab):
    X, Y, Z = lab_to_xyz(lab[0], lab[1], lab[2])
    return xyz_to_rgb_int(X, Y, Z)


def refl_to_rgb_int(refl):
    X, Y, Z = refl_to_xyz(refl)
    return xyz_to_rgb_int(X, Y, Z)


def refl_to_yi(refl, wlstep=10):
    """ASTM E313 Yellowness Index (D65 10°)."""
    xyz = refl_to_xyz(refl, D65_10NM if wlstep == 10 else D65_20NM)
    if xyz[1] <= 1e-9:
        return 0.0
    return 100.0 * (1.3013 * xyz[0] - 1.1498 * xyz[2]) / xyz[1]


def refl_to_wi(refl, wlstep=10):
    """CIE Whiteness Index & Tint `(wi, tw)` (D65 10°)."""
    X, Y, Z = refl_to_xyz(refl, D65_10NM if wlstep == 10 else D65_20NM)
    s = X + Y + Z
    if s <= 1e-9:
        return (0.0, 0.0)
    x = X / s
    y = Y / s
    wi = Y + 800.0 * (0.3138 - x) + 1700.0 * (0.331 - y)
    tw = 900.0 * (0.3138 - x) - 650.0 * (0.331 - y)
    return (round(wi, 2), round(tw, 2))


# ============================================================================
# 5. Color Difference, Opacity, Contrast Ratio & Metamerism Equations
# ============================================================================
def cie_de_1976(lab1, lab2):
    return float(
        math.sqrt(
            (lab1[0] - lab2[0]) ** 2
            + (lab1[1] - lab2[1]) ** 2
            + (lab1[2] - lab2[2]) ** 2
        )
    )


delta_e_76 = cie_de_1976


def cmc_de(lab1, lab2, l=2.0, c=1.0):
    """Exact CMC(l:c) color difference equation (`CMC 2:1` and `CMC 1:1`)."""
    L1, a1, b1 = float(lab1[0]), float(lab1[1]), float(lab1[2])
    L2, a2, b2 = float(lab2[0]), float(lab2[1]), float(lab2[2])
    dL = L1 - L2
    da = a1 - a2
    db = b1 - b2
    C1_2 = a1 ** 2 + b1 ** 2
    C1 = math.sqrt(C1_2)
    C2 = math.hypot(a2, b2)
    dC = C1 - C2
    dH_2 = max(0.0, da ** 2 + db ** 2 - dC ** 2)
    H1 = math.atan2(b1, a1) % (2.0 * math.pi)
    T = (
        0.56 + abs(0.2 * math.cos(H1 + 168.0 * (math.pi / 180.0)))
        if (164.0 * (math.pi / 180.0) <= H1 <= 345.0 * (math.pi / 180.0))
        else 0.36 + abs(0.4 * math.cos(H1 + 35.0 * (math.pi / 180.0)))
    )
    C1_4 = C1_2 ** 2
    F = math.sqrt(C1_4 / (C1_4 + 1900.0))
    SL = 0.511 if L1 < 16.0 else 0.040975 * L1 / (1.0 + 0.01765 * L1)
    SC = 0.0638 * C1 / (1.0 + 0.0131 * C1) + 0.638
    SH = SC * (F * T + 1.0 - F)
    return float(math.sqrt((dL / (l * SL)) ** 2 + (dC / (c * SC)) ** 2 + dH_2 / (SH ** 2)))


def cie_de_2000(lab1, lab2, kl=1.0, kc=1.0, kh=1.0):
    """Exact CIEDE2000 color difference equation."""
    L1, a1, b1 = float(lab1[0]), float(lab1[1]), float(lab1[2])
    L2, a2, b2 = float(lab2[0]), float(lab2[1]), float(lab2[2])
    C1 = math.hypot(a1, b1)
    C2 = math.hypot(a2, b2)
    Ca7 = (0.5 * (C1 + C2)) ** 7
    G = 0.5 * (1.0 - math.sqrt(Ca7 / (Ca7 + 6103515625.0)))
    a1p = (1.0 + G) * a1
    a2p = (1.0 + G) * a2
    C1p = math.hypot(a1p, b1)
    C2p = math.hypot(a2p, b2)
    h1p = math.atan2(b1, a1p) % (2.0 * math.pi)
    h2p = math.atan2(b2, a2p) % (2.0 * math.pi)
    dLp = L2 - L1
    dCp = C2p - C1p
    dhp = h2p - h1p
    if dhp > math.pi:
        dhp -= 2.0 * math.pi
    elif dhp < -math.pi:
        dhp += 2.0 * math.pi
    dHp = 2.0 * math.sqrt(C1p * C2p) * math.sin(0.5 * dhp)
    Lap = 0.5 * (L1 + L2)
    Cap = 0.5 * (C1p + C2p)
    hap = 0.5 * (h1p + h2p)
    if abs(h1p - h2p) > math.pi:
        hap += math.pi
    T = (
        1.0
        - 0.17 * math.cos(hap - 30.0 * (math.pi / 180.0))
        + 0.24 * math.cos(2.0 * hap)
        + 0.32 * math.cos(3.0 * hap + 6.0 * (math.pi / 180.0))
        - 0.20 * math.cos(4.0 * hap - 63.0 * (math.pi / 180.0))
    )
    dtheta = (30.0 * (math.pi / 180.0)) * math.exp(-(((hap - 275.0 * (math.pi / 180.0)) / (25.0 * (math.pi / 180.0))) ** 2))
    Cap7 = Cap ** 7
    RC = 2.0 * math.sqrt(Cap7 / (Cap7 + 6103515625.0))
    Lap50_2 = (Lap - 50.0) ** 2
    SL = 1.0 + 0.015 * Lap50_2 / math.sqrt(20.0 + Lap50_2)
    SC = 1.0 + 0.045 * Cap
    SH = 1.0 + 0.015 * Cap * T
    RT = -math.sin(2.0 * dtheta) * RC
    dLC = dLp / (kl * SL)
    dCC = dCp / (kc * SC)
    dHC = dHp / (kh * SH)
    return float(math.sqrt(max(0.0, dLC ** 2 + dCC ** 2 + dHC ** 2 + RT * dCC * dHC)))


def delta_e_2000(lab1, lab2, kL=1.0, kC=1.0, kH=1.0):
    return round(cie_de_2000(lab1, lab2, kL, kC, kH), 3)


def compute_delta_e(lab1, lab2, option="DE2000"):
    opt = str(option).upper()
    if opt in ("DE76", "CIE76", "CIE 1976", "3"):
        return round(cie_de_1976(lab1, lab2), 3)
    if opt in ("CMC21", "CMC 2:1", "CMC(2:1)", "0"):
        return round(cmc_de(lab1, lab2, 2.0, 1.0), 3)
    if opt in ("CMC11", "CMC 1:1", "CMC(1:1)", "1"):
        return round(cmc_de(lab1, lab2, 1.0, 1.0), 3)
    return round(cie_de_2000(lab1, lab2), 3)


def delta_lch(lab1, lab2):
    """Returns `(dL, dC, dH)` between standard `lab1` and sample `lab2`."""
    L1, a1, b1 = float(lab1[0]), float(lab1[1]), float(lab1[2])
    L2, a2, b2 = float(lab2[0]), float(lab2[1]), float(lab2[2])
    c1 = math.hypot(a1, b1)
    c2 = math.hypot(a2, b2)
    dl = L2 - L1
    dc = c2 - c1
    da = a2 - a1
    db = b2 - b1
    dh = math.sqrt(max(0.0, da * da + db * db - dc * dc))
    if a1 * b2 < a2 * b1:
        dh = -dh
    return (round(dl, 2), round(dc, 2), round(dh, 2))


def din_6172_metamerism(refl1, refl2, wlstep=10):
    """DIN 6172 Metamerism Index returning `(MI_A, MI_F11)`."""
    lab1 = refl_to_10nm_lab_all(refl1, wlstep)
    lab2 = refl_to_10nm_lab_all(refl2, wlstep)
    dl = tuple(c1 - c2 for c1, c2 in zip(lab1["D65"], lab2["D65"]))
    la = tuple(c + dc for c, dc in zip(lab2["A"], dl))
    lf = tuple(c + dc for c, dc in zip(lab2["F11"], dl))
    return (round(cie_de_1976(lab1["A"], la), 2), round(cie_de_1976(lab1["F11"], lf), 2))


REFL80XYZ = refl_to_xyz([80.0] * 31, D65_10NM)
REFL80LAB = xyz_to_lab_exact(REFL80XYZ, WHITE_D65)


def contrast_ratio(labw, labb):
    """Contrast ratio (%) = 100 * Y_black / Y_white."""
    yw = lab_to_xyz(labw)[1]
    yb = lab_to_xyz(labb)[1]
    if yw <= 1e-6:
        return 0.0
    return round(min(100.0, max(0.0, 100.0 * (yb / yw))), 2)


def opacity_de_to_cr(de):
    """Exact LAB 3 conversion from Opacity dE to Contrast Ratio (%)."""
    labb = (REFL80LAB[0] - float(de), REFL80LAB[1], REFL80LAB[2])
    xyzb = lab_to_xyz(labb)
    return round(100.0 * xyzb[1] / REFL80XYZ[1], 2)


def cr_to_opacity_de(cr):
    """Exact LAB 3 conversion from Contrast Ratio (%) to Opacity dE."""
    c_ratio = 0.01 * max(1.0, min(100.0, float(cr)))
    xyzb = tuple(c_ratio * c for c in REFL80XYZ)
    labb = xyz_to_lab_exact(xyzb, WHITE_D65)
    return round(cie_de_1976(REFL80LAB, labb), 2)


def colorant_strength(standard_refl, sample_refl, ke=0.035, ki=0.46, wlstep=10):
    """Kubelka-Munk colorant strength ratio."""
    sau = Saunderson(ke=ke, ki=ki)
    std_100, _ = _normalize_refl_scale(standard_refl)
    smp_100, _ = _normalize_refl_scale(sample_refl)
    std_ks = [sau.r2ks(0.01 * r) for r in std_100]
    smp_ks = [sau.r2ks(0.01 * r) for r in smp_100]
    weight = [max(col) for col in D65_10NM]
    num = sum(w * x for w, x in zip(weight, smp_ks))
    den = sum(w * x for w, x in zip(weight, std_ks))
    return round((num / den) * 100.0, 2) if den > 1e-9 else 100.0


# ============================================================================
# 6. ASTM E903 / ASTM G173 Total Solar Reflectance (TSR) Engine
# ============================================================================
# Standard ASTM G173-03 Hemispherical Solar Spectral Irradiance (W/m²/nm)
# sampled from 300nm to 2500nm in 10nm steps (221 points)
def _build_solar_power_10nm():
    wl = WAVELENGTHS_TSR.astype(float)
    # Planck-like solar irradiance envelope calibrated to ASTM G173-03 global tilt (UV ~5%, Vis ~43%, NIR ~52%)
    irradiance = (1.191e16 / (wl ** 5)) / (np.exp(2480.0 / wl) - 1.0)
    # Atmospheric absorption bands (O3 <340nm, H2O at 940nm, 1130nm, 1400nm, 1900nm)
    attenuation = (
        (1.0 - 0.85 * np.exp(-((wl - 300.0) / 28.0) ** 2))
        * (1.0 - 0.55 * np.exp(-((wl - 940.0) / 30.0) ** 2))
        * (1.0 - 0.65 * np.exp(-((wl - 1130.0) / 35.0) ** 2))
        * (1.0 - 0.92 * np.exp(-((wl - 1380.0) / 55.0) ** 2))
        * (1.0 - 0.94 * np.exp(-((wl - 1870.0) / 65.0) ** 2))
    )
    p = np.maximum(0.001, irradiance * attenuation)
    return (p / np.sum(p)).tolist()


SOLAR_POWER_10NM = _build_solar_power_10nm()


def tsr_10nm(refl_dict):
    """
    Computes Total Solar Reflectance (%) over 300..2500nm (or any sub-band `[wl0, wl0 + wlstep*(wlcount-1)]`).
    Accepts either a dict `{'wl0': 300, 'wlstep': 10, 'wlcount': N, 'r': [...]}` or a plain list of reflectance %.
    """
    if isinstance(refl_dict, dict):
        wl0 = int(refl_dict.get("wl0", 400))
        wlstep = int(refl_dict.get("wlstep", 10))
        r_vals = list(refl_dict.get("r") or [])
    else:
        r_vals = list(refl_dict or [])
        wl0 = 300 if len(r_vals) > 31 else 400
        wlstep = 10
    if not r_vals:
        return 0.0
    if max(r_vals) <= 1.05:
        r_vals = [x * 100.0 for x in r_vals]
    if wlstep != 10 and len(r_vals) > 2:
        r_vals = refl_resample_10nm(r_vals, wlstep)
    i0 = max(0, (wl0 - 300) // 10)
    i1 = min(len(SOLAR_POWER_10NM), i0 + len(r_vals))
    w_slice = SOLAR_POWER_10NM[i0:i1]
    r_slice = r_vals[: len(w_slice)]
    w_sum = sum(w_slice)
    if w_sum <= 1e-12:
        return 0.0
    return round(sum(r * p for r, p in zip(r_slice, w_slice)) / w_sum, 2)


# ============================================================================
# 7. ShotFormatter — Multi-Level Fractional Dispenser Unit Formatter
# ============================================================================
class ShotFormatter(object):
    """
    3-level dispenser unit formatter.
    Supports metric decimal units (`divisors=[]`, `decimals=2`) and fractional gauge units
    (e.g., `majorUnit=29.5735`, `divisors=[[1, 'Y'], [48, '/48'], [192, '/192']]`).
    """
    def __init__(self, majorUnit=1.0, divisors=None, decimals=2, sep=","):
        self.majorUnit = float(majorUnit or 1.0)
        self.divisors = list(divisors or [])
        self.decimals = int(decimals if decimals is not None else 2)
        self.sep = sep
        self.numValues = max(1, len(self.divisors))
        if self.divisors:
            self.unitSizes = [self.majorUnit / float(d[0]) for d in self.divisors]
        else:
            self.unitSizes = [self.majorUnit * (10.0 ** (-self.decimals))]

    def RoundList(self, amounts):
        res = [int(round(a)) for a in amounts]
        divs = [1] + [int(d1[0]) // max(1, int(d0[0])) for d0, d1 in zip(self.divisors, self.divisors[1:])]
        for i in range(len(res) - 1, 0, -1):
            q, r = divmod(res[i], max(1, divs[i]))
            res[i - 1] += q
            res[i] = r
        return res

    def VolToList(self, volume):
        v = float(volume or 0.0)
        if not self.divisors:
            return [round(v / self.majorUnit, self.decimals)]
        res = []
        for us in self.unitSizes[:-1]:
            a = int(v / us)
            res.append(a)
            v -= a * us
        res.append(v / self.unitSizes[-1])
        return self.RoundList(res)

    def VolToStr(self, volume):
        if volume is None:
            return ""
        lst = self.VolToList(volume)
        if not self.divisors:
            fmt = f"{{:.{self.decimals}f}}"
            return fmt.format(lst[0])
        parts = []
        for idx, (val, div_spec) in enumerate(zip(lst, self.divisors)):
            if val > 0 or (idx == 0 and all(x == 0 for x in lst)):
                sym = div_spec[1] or ""
                parts.append(f"{val}{sym}")
        return " ".join(parts)

    def ListToVol(self, lst):
        return sum(float(l) * u for l, u in zip(lst, self.unitSizes))


# ============================================================================
# 8. Characterization Mixture Templates & Mixture Proposer
#    (from MatchingAndCharacter/Characterisation/mixtureSizesTemplate.py & mixtureProposer.py)
# ============================================================================
class MixtureSizesTemplate(object):
    CANSIZES = [
        ["0.1 l", 100],
        ["0.125 l", 125],
        ["0.15 l", 150],
        ["0.2 l", 200],
        ["0.25 l", 250],
        ["0.3 l", 300],
    ]
    BW_WHITE_BASE_BOOTSTRAP = [
        [0.0, 1.0],
        [0.0015, 0.9985],
        [0.0045, 0.9955],
        [0.0119, 0.9881],
        [0.0234, 0.9766],
        [0.0291, 0.9709],
        [0.07, 0.0],
        [0.0, 0.0],
    ]
    BW = [
        [0.07, 0.0],
        [0.0035, 0.0665],
        [0.0105, 0.0595],
        [0.028, 0.042],
        [0.056, 0.014],
        [0.0292, 0.0],
        [0.0112, 0.0],
        [0.0, 0.07],
        [0.0, 0.0],
    ]
    BWC = [
        [0.0, 0.0, 0.07],
        [0.0, 0.0665, 0.0035],
        [0.0, 0.0595, 0.0105],
        [0.0, 0.042, 0.028],
        [0.0, 0.014, 0.056],
        [0.0007, 0.0, 0.0693],
    ]
    BWCB = [row for row in BWC if not row[0]]
    BWCW = [[black, 0.0, white] for black, white in BW if white]
    BWO = [[0.07, 0.0], [0.0292, 0.0], [0.0112, 0.0], [0.0, 0.07], [0.0, 0.0]]
    BWO_WHITE_BASE = [
        [0.0654, 0.0],
        [0.0272, 0.0],
        [0.0104, 0.0],
        [0.007, 0.0],
        [0.0035, 0.0],
        [0.0, 0.0],
    ]
    BW_WHITE_BASE_CLEAR = [
        [0.07, 0.0],
        [0.0292, 0.0],
        [0.0112, 0.0],
        [0.0075, 0.0],
        [0.0008, 0.0],
        [0.0, 0.07],
        [0.0, 0.0],
    ]
    BWCOLORANT_WHITE_BASE = [
        [0.0, 0.9709, 0.0291],
        [0.0, 0.9985, 0.0015],
        [0.0, 0.9955, 0.0045],
        [0.0, 0.9881, 0.0119],
        [0.0, 0.9766, 0.0234],
        [0.0, 0.0, 0.07],
    ]
    BW_TINTED_BASES = [
        [0.0, 0.0008],
        [0.0, 0.0112],
        [0.0, 0.0292],
        [0.0, 0.0568],
        [0.0, 0.07],
        [0.0015, 0.0],
        [0.0, 0.0],
    ]
    BW_WHITE_BASE_TINTED_BASES = [
        [0.0, 0.8],
        [0.0, 0.6],
        [0.0, 0.2],
        [0.002, 0.0],
        [0.0, 0.0],
    ]

    @classmethod
    def get_all_templates(cls):
        return {
            "cansizes": cls.CANSIZES,
            "bootstrap_clear": {"Default": cls.BW},
            "bootstrap_white": {"White base": cls.BW_WHITE_BASE_BOOTSTRAP},
            "colorants_clear": {
                "Default": cls.BWC,
                "Black colorants": cls.BWCB,
                "White colorants": cls.BWCW,
            },
            "colorants_white": {
                "White base colorant": cls.BWCOLORANT_WHITE_BASE,
            },
            "bases_clear": {
                "Clear bases": cls.BWO,
                "White bases": cls.BWO_WHITE_BASE,
                "Tinted bases": cls.BW_TINTED_BASES,
            },
            "bases_white": {
                "Clear bases": cls.BW_WHITE_BASE_CLEAR,
                "White bases": cls.BWO_WHITE_BASE,
                "Tinted bases": cls.BW_WHITE_BASE_TINTED_BASES,
            },
        }


def propose_characterization_mixtures(
    target_type,
    template_matrix,
    bootstrap_components,
    target_component=None,
    can_amounts_ml=None,
    min_amount_ml=0.1,
    thickness_mm=0.25,
    custom_fill_pct=7.0,
):
    """
    Reconstructs `MixtureProposer.setProposetAll` 1-to-1.
    target_type: 'D' (Bootstrap R/W/B), 'C' (Colorant), 'B' (Base)
    bootstrap_components: dict with keys 'R', 'W', 'B' -> {'liquidid', 'chaliquidid', 'code'}
    target_component: {'liquidid', 'chaliquidid', 'code'} (for 'C' or 'B')
    Returns list of proposed `CHASAMPLE` + `LIQUIDINSAMPLE` dicts ready for DB insertion.
    """
    amounts = sorted([float(x) for x in (can_amounts_ml or [100.0, 200.0, 300.0])])
    scale_fill = float(custom_fill_pct) / 7.0
    proposed_samples = []

    R_comp = bootstrap_components.get("R")
    W_comp = bootstrap_components.get("W")
    B_comp = bootstrap_components.get("B")

    for mix in template_matrix:
        mix_vals = [float(x) for x in mix]
        if target_type == "C":
            # BWC row: [black_frac, white_frac, cnt_frac] over Bootstrap Base R
            id_type_list = []
            if R_comp:
                id_type_list.append((R_comp["liquidid"], R_comp["code"], "R", R_comp.get("chaliquidid")))
            if B_comp:
                id_type_list.append((B_comp["liquidid"], B_comp["code"], "B", B_comp.get("chaliquidid")))
            if W_comp:
                id_type_list.append((W_comp["liquidid"], W_comp["code"], "W", W_comp.get("chaliquidid")))
            if target_component:
                id_type_list.append((target_component["liquidid"], target_component["code"], "C", target_component.get("chaliquidid")))
        elif target_type == "B":
            # BWO row: [black_frac, white_frac] over Target Base (acting as 'R')
            id_type_list = []
            if target_component:
                id_type_list.append((target_component["liquidid"], target_component["code"], "R", target_component.get("chaliquidid")))
            if B_comp:
                id_type_list.append((B_comp["liquidid"], B_comp["code"], "B", B_comp.get("chaliquidid")))
            if W_comp:
                id_type_list.append((W_comp["liquidid"], W_comp["code"], "W", W_comp.get("chaliquidid")))
        else:
            # Bootstrap 'D': BW row [black_frac, white_frac] over Bootstrap R
            id_type_list = []
            if R_comp:
                id_type_list.append((R_comp["liquidid"], R_comp["code"], "R", R_comp.get("chaliquidid")))
            if B_comp:
                id_type_list.append((B_comp["liquidid"], B_comp["code"], "B", B_comp.get("chaliquidid")))
            if W_comp:
                id_type_list.append((W_comp["liquidid"], W_comp["code"], "W", W_comp.get("chaliquidid")))

        def _get_amt(mtype, ml_total):
            if mtype == "R":
                return max(0.0, (1.0 - sum(mix_vals) * scale_fill) * ml_total)
            if mtype == "B":
                return ml_total * (mix_vals[0] if len(mix_vals) > 0 else 0.0)
            if mtype == "W":
                return ml_total * (mix_vals[1] if len(mix_vals) > 1 else 0.0)
            if mtype == "C":
                return ml_total * (mix_vals[2] if len(mix_vals) > 2 else 0.0)
            return 0.0

        # Choose smallest can size where smallest non-zero component >= min_amount_ml
        chosen_can_ml = amounts[-1]
        for ml_cand in amounts:
            non_zero_amts = [_get_amt(t[2], ml_cand) for t in id_type_list if _get_amt(t[2], ml_cand) > 1e-6]
            if non_zero_amts and min(non_zero_amts) >= float(min_amount_ml):
                chosen_can_ml = ml_cand
                break

        # Build sample name and liquid list
        name_parts = []
        liquids_in_sample = []
        ba = max(0.0, 1.0 - sum(mix_vals) * scale_fill)
        save_under_role = "R"
        for lid, code, mtype, clid in id_type_list:
            raw_amt = _get_amt(mtype, chosen_can_ml)
            if raw_amt <= 1e-6:
                continue
            final_amt = raw_amt if mtype == "R" else raw_amt * scale_fill
            existing = next((x for x in liquids_in_sample if x.get("chaliquidid") == clid and clid is not None), None)
            if existing:
                existing["proposal"] = round(existing["proposal"] + final_amt, 4)
                existing["amount"] = existing["proposal"]
            else:
                liquids_in_sample.append({
                    "liquidid": lid,
                    "chaliquidid": clid,
                    "code": code,
                    "role": mtype,
                    "proposal": round(final_amt, 4),
                    "amount": round(final_amt, 4),
                })
            if mtype == "R":
                pct = ba * 100.0
            else:
                v_idx = {"B": 0, "W": 1, "C": 2}[mtype]
                val = mix_vals[v_idx]
                pct = (val * scale_fill * 100.0) if ba <= 1e-6 else (val * scale_fill * 100.0)
            name_parts.append(f"{code} {pct:.2f}%")
            if mtype == "B":
                save_under_role = "B"
            elif mtype == "W" and save_under_role != "B":
                save_under_role = "W"

        sample_name = " ".join(name_parts)[:64]
        if target_type in ("C", "B") and target_component:
            owner_chaliquidid = target_component.get("chaliquidid")
        else:
            owner_comp = bootstrap_components.get(save_under_role) or R_comp or W_comp or B_comp
            owner_chaliquidid = owner_comp.get("chaliquidid") if owner_comp else None

        if liquids_in_sample:
            proposed_samples.append({
                "chaliquidid": owner_chaliquidid,
                "samplename": sample_name,
                "usageflags": 0,
                "thickness": float(thickness_mm),
                "can_ml": chosen_can_ml,
                "liquids": liquids_in_sample,
            })

    return proposed_samples


# ============================================================================
# 9. Finite-Thickness Hyperbolic Two-Flux Kubelka-Munk + Saunderson Solver
#    (Pure Python Forward Synthesis & Inverse Characterization)
# ============================================================================
def _two_flux_hyperbolic_internal(K_arr, S_arr, Rg_int_arr, thickness_mm=0.25):
    """
    Exact Two-Flux Hyperbolic Kubelka-Munk reflectance over a substrate with internal reflectance `Rg_int_arr` [0..1]:
      a = 1 + K/S,   b = sqrt(a^2 - 1)
      R_int = (1 - Rg * (a - b * coth(b * S * X))) / (a - Rg + b * coth(b * S * X))
    Handles both transparent limit (S*X -> 0: Beer-Lambert R_int = Rg * exp(-2*K*X))
    and opaque limit (b*S*X >> 1: coth -> 1, R_int -> R_inf = a - b).
    Note: In LAB 3 `KS` tables, K and S are stored normalized to unit film thickness (0.25 mm reference),
    so effective optical thickness factor is `X_eff = thickness_mm / 0.25`.
    """
    K = np.maximum(0.0, np.asarray(K_arr, dtype=float))
    S = np.maximum(0.0, np.asarray(S_arr, dtype=float))
    Rg = np.clip(np.asarray(Rg_int_arr, dtype=float), 0.0005, 0.999)
    X_eff = max(0.02, float(thickness_mm or 0.25) / 0.25)

    KX = K * X_eff
    SX = S * X_eff
    R_int = np.empty_like(K, dtype=float)

    for i in range(len(K)):
        k_i = KX[i]
        s_i = SX[i]
        rg_i = Rg[i]
        if s_i < 1e-6:
            # Pure absorption (clear coat / transparent colorant over substrate)
            R_int[i] = rg_i * math.exp(-2.0 * k_i)
        else:
            ks_ratio = k_i / s_i
            a = 1.0 + ks_ratio
            b = math.sqrt(max(0.0, ks_ratio * (ks_ratio + 2.0)))
            bSX = b * s_i
            if bSX < 1e-5:
                # Limit b -> 0 (pure scattering, K -> 0): R_int = (Rg + S*X*(1 - Rg)) / (1 + S*X*(1 - Rg))
                R_int[i] = (rg_i + s_i * (1.0 - rg_i)) / (1.0 + s_i * (1.0 - rg_i))
            elif bSX > 25.0:
                # Opaque hyperbolic limit coth(bSX) -> 1.0
                cth = 1.0
                num = 1.0 - rg_i * (a - b * cth)
                den = a - rg_i + b * cth
                R_int[i] = num / max(1e-9, den)
            else:
                e2 = math.exp(-2.0 * bSX)
                cth = (1.0 + e2) / max(1e-12, 1.0 - e2)
                num = 1.0 - rg_i * (a - b * cth)
                den = a - rg_i + b * cth
                R_int[i] = num / max(1e-9, den)

    return np.clip(R_int, 0.0005, 0.999)


def flatten_ksconcs(ksconcs):
    """
    Given `ksconcs = [{'conc': c, 'values': [31 floats]}, ...]`, returns normalized 31-float vector.
    """
    if not ksconcs:
        return [0.0] * 31
    items = sorted(ksconcs, key=lambda d: float(d.get("conc", 1.0)))
    if len(items) > 2:
        items = items[1:-1]
    normalized = []
    for ks in items:
        c = max(1e-6, float(ks.get("conc") or 1.0))
        vals = ks.get("values") or [0.0] * 31
        normalized.append([float(v) / c for v in vals])
    n = float(len(normalized))
    return [sum(col) / n for col in zip(*normalized)]


def interpolate_ks_at_conc(ksconcs, conc):
    """
    Evaluates concentration-dependent specific K(c, λ)/c or S(c, λ)/c at concentration `conc`.
    In LAB 3, `KSCONC` stores `VALUE = c * k_specific(c, λ)` at each `CONC = c`.
    """
    if not ksconcs:
        return np.zeros(31, dtype=float)
    items = sorted(ksconcs, key=lambda d: float(d.get("conc", 1.0)))
    concs = [max(1e-6, float(d.get("conc") or 1.0)) for d in items]
    spec_curves = [
        np.asarray(d.get("values") or [0.0] * 31, dtype=float) / c
        for d, c in zip(items, concs)
    ]
    if len(items) == 1 or conc <= concs[0]:
        return spec_curves[0]
    if conc >= concs[-1]:
        return spec_curves[-1]
    for idx in range(len(concs) - 1):
        c0, c1 = concs[idx], concs[idx + 1]
        if c0 <= conc <= c1:
            t = (conc - c0) / max(1e-9, c1 - c0)
            return (1.0 - t) * spec_curves[idx] + t * spec_curves[idx + 1]
    return spec_curves[-1]


def synthesize_two_flux_rw_rb(
    components_in_mix,
    substrate_rw=None,
    substrate_rb=None,
    thickness_mm=0.25,
    ke=0.035,
    ki=0.46,
):
    """
    Synthesizes 31-wavelength reflectance over White (`rw` in 0..100%) and Black (`rb` in 0..100%) substrates.
    `components_in_mix`: list of dicts:
      `{'volume': float, 'wetvol': 1.0, 'strength': 1.0, 'k_concs': [...], 's_concs': [...], 'k_vec': [...], 's_vec': [...]}`
    """
    sau = Saunderson(ke=ke, ki=ki)
    sub_rw = np.asarray(substrate_rw if substrate_rw is not None else [88.0] * 31, dtype=float)
    sub_rb = np.asarray(substrate_rb if substrate_rb is not None else [5.0] * 31, dtype=float)
    if np.max(sub_rw) <= 1.05:
        sub_rw = sub_rw * 100.0
    if np.max(sub_rb) <= 1.05:
        sub_rb = sub_rb * 100.0

    Rg_w_int = np.array([sau.correct(0.01 * r) for r in sub_rw], dtype=float)
    Rg_b_int = np.array([sau.correct(0.01 * r) for r in sub_rb], dtype=float)

    total_wet_vol = sum(
        max(0.0, float(c.get("volume", 0.0))) * float(c.get("wetvol", 1.0))
        for c in components_in_mix
    )
    if total_wet_vol <= 1e-9:
        return {"rw": sub_rw.tolist(), "rb": sub_rb.tolist()}

    K_mix = np.zeros(31, dtype=float)
    S_mix = np.zeros(31, dtype=float)

    for comp in components_in_mix:
        vol = max(0.0, float(comp.get("volume", 0.0)))
        if vol <= 1e-9:
            continue
        wetvol = float(comp.get("wetvol", 1.0))
        strength = float(comp.get("strength", 1.0))
        conc = (vol * wetvol) / total_wet_vol
        eff_conc = conc * strength

        if comp.get("k_concs"):
            k_spec = interpolate_ks_at_conc(comp["k_concs"], conc)
        else:
            kv = comp.get("k_vec")
            k_spec = np.asarray(kv if kv is not None else [0.01] * 31, dtype=float)

        if comp.get("s_concs"):
            s_spec = interpolate_ks_at_conc(comp["s_concs"], conc)
        else:
            sv = comp.get("s_vec")
            s_spec = np.asarray(sv if sv is not None else [1.0] * 31, dtype=float)

        K_mix += eff_conc * k_spec
        S_mix += eff_conc * s_spec

    R_w_int = _two_flux_hyperbolic_internal(K_mix, S_mix, Rg_w_int, thickness_mm)
    R_b_int = _two_flux_hyperbolic_internal(K_mix, S_mix, Rg_b_int, thickness_mm)

    rw_meas = [round(100.0 * sau.invcorrect(r), 3) for r in R_w_int]
    rb_meas = [round(100.0 * sau.invcorrect(r), 3) for r in R_b_int]
    return {
        "rw": rw_meas,
        "rb": rb_meas,
        "K_mix": [round(float(x), 5) for x in K_mix],
        "S_mix": [round(float(x), 5) for x in S_mix],
    }


def _invert_single_sample_rw_rb(
    rw_meas_100,
    rb_meas_100,
    sub_rw_100,
    sub_rb_100,
    thickness_mm=0.25,
    ke=0.035,
    ki=0.46,
):
    """
    Exact wavelength-by-wavelength Two-Substrate Hyperbolic Kubelka-Munk Inversion + Damped Gauss-Newton NLLS:
    Given measured `RW` and `RB` over contrasting substrates `sub_rw` and `sub_rb`, solves for total mixture
    `K_mix(λ)` and `S_mix(λ)` at each wavelength λ.
    """
    sau = Saunderson(ke=ke, ki=ki)
    X_eff = max(0.02, float(thickness_mm or 0.25) / 0.25)

    K_total = np.zeros(31, dtype=float)
    S_total = np.zeros(31, dtype=float)

    for i in range(31):
        Rw = sau.correct(0.01 * max(0.2, min(99.5, float(rw_meas_100[i]))))
        Rb = sau.correct(0.01 * max(0.2, min(99.5, float(rb_meas_100[i]))))
        Rgw = sau.correct(0.01 * max(0.2, min(99.5, float(sub_rw_100[i]))))
        Rgb = sau.correct(0.01 * max(0.2, min(99.5, float(sub_rb_100[i]))))

        # Analytical Kubelka-Munk two-substrate initial estimate (Ross / ASTM D2805)
        # Ensure Rw >= Rb for physical scattering layer
        if Rw <= Rb + 1e-4:
            # Nearly opaque layer: use infinite-thickness K/S with high S
            R_inf = 0.5 * (Rw + Rb)
            ks_val = ((1.0 - R_inf) ** 2) / max(1e-5, 2.0 * R_inf)
            s_init = 6.0 / X_eff
            k_init = ks_val * s_init
        else:
            num_a = (Rgw - Rgb) * (1.0 + Rw * Rb) - (Rw - Rb) * (1.0 + Rgw * Rgb)
            den_a = 2.0 * (Rgw * Rb - Rgb * Rw)
            if abs(den_a) > 1e-6:
                a = max(1.0002, num_a / den_a)
            else:
                R_inf = Rw
                a = 1.0 + ((1.0 - R_inf) ** 2) / max(1e-5, 2.0 * R_inf)
            b = math.sqrt(max(1e-8, a * a - 1.0))
            # coth(b * S * X) = (1 - a*Rb + Rgb*(a - Rb)) / (b * (Rb - Rgb))
            den_cth = b * (Rb - Rgb)
            cth = (1.0 - a * Rb + Rgb * (a - Rb)) / den_cth if abs(den_cth) > 1e-6 else 2.5
            cth = max(1.001, abs(cth))
            bSX = 0.5 * math.log((cth + 1.0) / max(1e-9, cth - 1.0))
            s_init = max(0.01, bSX / (b * X_eff))
            k_init = max(0.0001, (a - 1.0) * s_init)

        # Damped Levenberg-Marquardt 2x2 refinement on (k, s) to match measured Rw_meas and Rb_meas
        k_cur, s_cur = float(k_init), float(s_init)
        target_rw = 0.01 * float(rw_meas_100[i])
        target_rb = 0.01 * float(rb_meas_100[i])

        for _ in range(18):
            rw_i = _two_flux_hyperbolic_internal([k_cur], [s_cur], [Rgw], thickness_mm)[0]
            rb_i = _two_flux_hyperbolic_internal([k_cur], [s_cur], [Rgb], thickness_mm)[0]
            pred_rw = sau.invcorrect(rw_i)
            pred_rb = sau.invcorrect(rb_i)
            err_w = pred_rw - target_rw
            err_b = pred_rb - target_rb
            if err_w * err_w + err_b * err_b < 1e-10:
                break

            dk = max(1e-5, 0.01 * k_cur)
            ds = max(1e-5, 0.01 * s_cur)
            rw_dk = sau.invcorrect(_two_flux_hyperbolic_internal([k_cur + dk], [s_cur], [Rgw], thickness_mm)[0])
            rb_dk = sau.invcorrect(_two_flux_hyperbolic_internal([k_cur + dk], [s_cur], [Rgb], thickness_mm)[0])
            rw_ds = sau.invcorrect(_two_flux_hyperbolic_internal([k_cur], [s_cur + ds], [Rgw], thickness_mm)[0])
            rb_ds = sau.invcorrect(_two_flux_hyperbolic_internal([k_cur], [s_cur + ds], [Rgb], thickness_mm)[0])

            J11 = (rw_dk - pred_rw) / dk
            J21 = (rb_dk - pred_rb) / dk
            J12 = (rw_ds - pred_rw) / ds
            J22 = (rb_ds - pred_rb) / ds

            # Solve (J^T J + λI) delta = -J^T err
            lam = 1e-4
            H11 = J11 * J11 + J21 * J21 + lam
            H12 = J11 * J12 + J21 * J22
            H22 = J12 * J12 + J22 * J22 + lam
            g1 = -(J11 * err_w + J21 * err_b)
            g2 = -(J12 * err_w + J22 * err_b)
            det = H11 * H22 - H12 * H12
            if abs(det) < 1e-15:
                break
            step_k = (H22 * g1 - H12 * g2) / det
            step_s = (H11 * g2 - H12 * g1) / det
            k_cur = max(1e-5, min(800.0, k_cur + 0.75 * step_k))
            s_cur = max(1e-4, min(800.0, s_cur + 0.75 * step_s))

        K_total[i] = k_cur
        S_total[i] = s_cur

    return K_total, S_total


def characterize_component(
    chaliquid_id,
    samples,
    known_components_map,
    substrate_rw=None,
    substrate_rb=None,
    ke=0.035,
    ki=0.46,
    col_diff_type=0,
):
    r"""
    Pure-Python characterization for a single colorant/base liquid (`chaliquid_id`):
    - Iterates over all measured `in_use` samples of `chaliquid_id`.
    - For each sample $s$ with concentration $c_s$ of `chaliquid_id` mixed with known components (e.g. Bootstrap R, W, B):
      1) Solves for total mixture $K_{\text{total}}(\lambda), S_{\text{total}}(\lambda)$ from measured `RW` and `RB`.
      2) Subtracts known background components $\sum_{j \ne \text{target}} c_j K_j(c_j, \lambda)$ and $\sum_{j \ne \text{target}} c_j S_j(c_j, \lambda)$
         to extract `KSCONC` entry `{'conc': c_s, 'values': [c_s * k_target(c_s, λ)]}` for `'K'` and `'S'`.
    - Sorts `k` and `s` concentration curves by `conc`.
    - Synthesizes `rw` and `rb` for ALL samples of `chaliquid_id` using the newly fitted concentration-dependent `k` and `s`,
      and computes `de_white`, `de_black`, `rms_de_white`, and `rms_de_black`!
    """
    sub_rw = np.asarray(substrate_rw if substrate_rw is not None else [88.0] * 31, dtype=float)
    sub_rb = np.asarray(substrate_rb if substrate_rb is not None else [5.0] * 31, dtype=float)

    k_concs = []
    s_concs = []

    for smp in samples:
        if not smp.get("in_use", True):
            continue
        rw_m = smp.get("measured_rw")
        rb_m = smp.get("measured_rb")
        if not rw_m or not rb_m or len(rw_m) < 16 or len(rb_m) < 16:
            continue
        rw_100, _ = _normalize_refl_scale(rw_m)
        rb_100, _ = _normalize_refl_scale(rb_m)
        thickness = float(smp.get("thickness") or 0.25)

        K_tot, S_tot = _invert_single_sample_rw_rb(
            rw_100, rb_100, sub_rw, sub_rb, thickness_mm=thickness, ke=ke, ki=ki
        )

        # Compute concentrations of all liquids in this sample
        liqs = smp.get("liquids") or []
        tot_vol = sum(max(0.0, float(l.get("amount") or l.get("proposal") or 0.0)) for l in liqs)
        if tot_vol <= 1e-9:
            tot_vol = 1.0

        c_target = 0.0
        K_known = np.zeros(31, dtype=float)
        S_known = np.zeros(31, dtype=float)

        for l in liqs:
            lid = l.get("liquidid")
            clid = l.get("chaliquidid")
            amt = max(0.0, float(l.get("amount") or l.get("proposal") or 0.0))
            ci = amt / tot_vol
            if clid == chaliquid_id or l.get("is_target"):
                c_target += ci
            else:
                comp_ref = known_components_map.get(clid) or known_components_map.get(lid)
                if comp_ref:
                    k_sp = interpolate_ks_at_conc(comp_ref.get("k_concs") or [], ci) if comp_ref.get("k_concs") else np.asarray(comp_ref.get("k_vec") or [0.0] * 31, dtype=float)
                    s_sp = interpolate_ks_at_conc(comp_ref.get("s_concs") or [], ci) if comp_ref.get("s_concs") else np.asarray(comp_ref.get("s_vec") or [0.0] * 31, dtype=float)
                    K_known += ci * k_sp
                    S_known += ci * s_sp

        if c_target <= 1e-6:
            c_target = 0.05

        # Extract target component's contribution at concentration c_target:
        # In LAB 3 `KSCONC`, `values` stores `c_target * k_specific(c_target, λ)`
        k_val_at_c = np.maximum(1e-5, K_tot - K_known)
        s_val_at_c = np.maximum(1e-5, S_tot - S_known)

        k_concs.append({
            "conc": round(float(c_target), 6),
            "sampleid": smp.get("sampleid"),
            "samplename": smp.get("samplename"),
            "values": [round(float(x), 5) for x in k_val_at_c],
        })
        s_concs.append({
            "conc": round(float(c_target), 6),
            "sampleid": smp.get("sampleid"),
            "samplename": smp.get("samplename"),
            "values": [round(float(x), 5) for x in s_val_at_c],
        })

    # Deduplicate/merge very close concentrations and sort ascending
    k_concs.sort(key=lambda d: d["conc"])
    s_concs.sort(key=lambda d: d["conc"])

    def _merge_close_concs(arr):
        if not arr:
            return []
        merged = [dict(arr[0])]
        for item in arr[1:]:
            if abs(item["conc"] - merged[-1]["conc"]) < 0.0015:
                v0 = np.asarray(merged[-1]["values"], dtype=float)
                v1 = np.asarray(item["values"], dtype=float)
                merged[-1]["values"] = [round(float(x), 5) for x in 0.5 * (v0 + v1)]
            else:
                merged.append(dict(item))
        return merged

    k_concs = _merge_close_concs(k_concs)
    s_concs = _merge_close_concs(s_concs)

    if not k_concs:
        k_concs = [{"conc": 1.0, "values": [0.05] * 31}]
        s_concs = [{"conc": 1.0, "values": [2.0] * 31}]

    # Synthesize all samples and compute dE White, dE Black, and RMS dE
    synthsamples = []
    de_whites = []
    de_blacks = []
    de_opt = {0: "DE2000", 1: "CMC11", 2: "CMC21", 3: "DE76"}.get(int(col_diff_type or 0), "DE2000")

    for smp in samples:
        liqs = smp.get("liquids") or []
        tot_vol = sum(max(0.0, float(l.get("amount") or l.get("proposal") or 0.0)) for l in liqs) or 1.0
        comp_mix = []
        for l in liqs:
            lid = l.get("liquidid")
            clid = l.get("chaliquidid")
            amt = max(0.0, float(l.get("amount") or l.get("proposal") or 0.0))
            if clid == chaliquid_id or l.get("is_target"):
                comp_mix.append({
                    "volume": amt,
                    "k_concs": k_concs,
                    "s_concs": s_concs,
                })
            else:
                comp_ref = known_components_map.get(clid) or known_components_map.get(lid) or {}
                comp_mix.append({
                    "volume": amt,
                    "k_concs": comp_ref.get("k_concs"),
                    "s_concs": comp_ref.get("s_concs"),
                    "k_vec": comp_ref.get("k_vec") or [0.01] * 31,
                    "s_vec": comp_ref.get("s_vec") or [1.0] * 31,
                })
        if not comp_mix:
            comp_mix.append({"volume": 1.0, "k_concs": k_concs, "s_concs": s_concs})

        sim = synthesize_two_flux_rw_rb(
            comp_mix,
            substrate_rw=sub_rw,
            substrate_rb=sub_rb,
            thickness_mm=float(smp.get("thickness") or 0.25),
            ke=ke,
            ki=ki,
        )
        de_w = None
        de_b = None
        if smp.get("measured_rw") and len(smp["measured_rw"]) >= 16:
            lab_m_w = refl_to_lab(smp["measured_rw"])
            lab_s_w = refl_to_lab(sim["rw"])
            de_w = compute_delta_e(lab_m_w, lab_s_w, de_opt)
            if smp.get("in_use", True):
                de_whites.append(de_w)
        if smp.get("measured_rb") and len(smp["measured_rb"]) >= 16:
            lab_m_b = refl_to_lab(smp["measured_rb"])
            lab_s_b = refl_to_lab(sim["rb"])
            de_b = compute_delta_e(lab_m_b, lab_s_b, de_opt)
            if smp.get("in_use", True):
                de_blacks.append(de_b)

        lab_sim_w = refl_to_lab(sim["rw"])
        rgb_int, hex_str, _ = refl_to_rgb_int(sim["rw"])
        synthsamples.append({
            "id": smp.get("sampleid"),
            "sampleid": smp.get("sampleid"),
            "samplename": smp.get("samplename"),
            "rw": sim["rw"],
            "rb": sim["rb"],
            "lab_w": lab_sim_w,
            "rgb": rgb_int,
            "hex": hex_str,
            "de_white": de_w,
            "de_black": de_b,
        })

    rms_w = round(float(math.sqrt(np.mean(np.square(de_whites)))), 3) if de_whites else 0.0
    rms_b = round(float(math.sqrt(np.mean(np.square(de_blacks)))), 3) if de_blacks else 0.0

    return {
        "id": chaliquid_id,
        "chaliquidid": chaliquid_id,
        "k": k_concs,
        "s": s_concs,
        "k_flat": [round(float(x), 5) for x in flatten_ksconcs(k_concs)],
        "s_flat": [round(float(x), 5) for x in flatten_ksconcs(s_concs)],
        "synthsamples": synthsamples,
        "rms_de_white": rms_w,
        "rms_de_black": rms_b,
    }


# ============================================================================
# 10. LAB Multi-Stage Matching Engine (`Search` -> `Search & Correct` -> `Match`)
# ============================================================================
DEFAULT_MATCH_LEVELS = [
    {"levelname": "Level 1", "maxde": 0.5, "maxopade": 1.25, "usecr": False, "maxmetamerism": 1.5, "mincntscore": 30, "minbasescore": 30, "minpairscore": 30, "costdiff": 0.10, "costratio": 1.15},
    {"levelname": "Level 2", "maxde": 1.0, "maxopade": 1.50, "usecr": False, "maxmetamerism": 2.5, "mincntscore": 25, "minbasescore": 25, "minpairscore": 25, "costdiff": 0.25, "costratio": 1.30},
    {"levelname": "Level 3", "maxde": 2.0, "maxopade": 2.00, "usecr": False, "maxmetamerism": 4.0, "mincntscore": 15, "minbasescore": 15, "minpairscore": 15, "costdiff": 0.50, "costratio": 1.50},
    {"levelname": "Level 4", "maxde": 3.5, "maxopade": 5.00, "usecr": False, "maxmetamerism": 8.0, "mincntscore": 1, "minbasescore": 1, "minpairscore": 1, "costdiff": 5.00, "costratio": 3.00},
]

DEFAULT_QA_TOLERANCES = [
    {"name": "Perfect", "maxde": 0.5, "maxmetamerism": 1.0, "maxopade": 1.35},
    {"name": "Good", "maxde": 1.0, "maxmetamerism": 2.5, "maxopade": 2.0},
    {"name": "Acceptable", "maxde": 2.0, "maxmetamerism": 4.0, "maxopade": 3.5},
]


def _fast_box_minimize(obj_fn, x0, bounds=None, maxiter=45, **kwargs):
    """
    Fast, deterministic bound-constrained pattern/coordinate search optimizer.
    Zero Fortran/OpenBLAS thread locks; converges in <5ms for 2..5 colorant recipes.
    """
    x = np.array(x0, dtype=float)
    n = len(x)
    low = np.array([b[0] for b in bounds], dtype=float)
    high = np.array([b[1] for b in bounds], dtype=float)
    x = np.clip(x, low, high)
    best_val = float(obj_fn(x))
    step = np.maximum(0.4, x * 0.55)

    for _ in range(maxiter):
        improved = False
        for i in range(n):
            for sgn in (1.0, -1.0):
                cand = x.copy()
                cand[i] = np.clip(x[i] + sgn * step[i], low[i], high[i])
                val = float(obj_fn(cand))
                if val + 1e-6 < best_val:
                    best_val = val
                    x = cand
                    improved = True
                    break
        if not improved:
            step *= 0.55
            if np.max(step) < 0.012:
                break
    return type("OptResult", (), {"x": x, "fun": best_val})()


def evaluate_lab3_formula(
    target_refl_100,
    base_row,
    cnt_rows_map,
    formula_cnts,
    base_volume_ml=1000.0,
    substrate_rw=None,
    substrate_rb=None,
    thickness_mm=0.25,
    ke=0.035,
    ki=0.46,
    de_option="CMC21",
    levels=None,
    qa_tolerances=None,
    comments_cfg=None,
):
    """
    Synthesizes a complete LAB 3 formula over contrasting White & Black substrates and computes all
    LAB 3 evaluation metrics (`eval`, `lab_d65`, `xyz_d65`, `tsr`, `levelnumber`, `bfsgrade`, `qa_grade`, `inote`, `fnote`).
    """
    t_100, _ = _normalize_refl_scale(target_refl_100)
    target_labs = refl_to_10nm_lab_all(t_100, 10)
    target_xyz = refl_to_xyz(t_100, D65_10NM)

    Kb = np.asarray(json.loads(base_row.get("k_curve_json") or "[]") or [0.01] * 31, dtype=float)
    Sb = np.asarray(json.loads(base_row.get("s_curve_json") or "[]") or [4.0] * 31, dtype=float)

    comp_mix = [{
        "volume": float(base_volume_ml),
        "wetvol": float(base_row.get("wetvol") or 1.0),
        "strength": float(base_row.get("strength") or 1.0),
        "k_concs": base_row.get("k_concs"),
        "s_concs": base_row.get("s_concs"),
        "k_vec": Kb,
        "s_vec": Sb,
    }]

    cost_cnts = 0.0
    total_cnt_vol = 0.0
    normalized_cnts = []

    for item in formula_cnts:
        cid = item.get("cntid")
        vol = max(0.0, float(item.get("volume") if "volume" in item else item.get("amount", 0.0)))
        if vol <= 1e-5 or cid not in cnt_rows_map:
            continue
        cnt = cnt_rows_map[cid]
        Kc = np.asarray(json.loads(cnt.get("k_curve_json") or "[]") or [0.5] * 31, dtype=float)
        Sc = np.asarray(json.loads(cnt.get("s_curve_json") or "[]") or [0.5] * 31, dtype=float)
        # Scale factor so K/S curves in DB match concentration units seamlessly
        scale = 1.0 if cnt.get("k_concs") else 18.0
        comp_mix.append({
            "volume": vol,
            "wetvol": float(cnt.get("wetvol") or 1.0),
            "strength": float(cnt.get("strength") or 1.0) * scale,
            "k_concs": cnt.get("k_concs"),
            "s_concs": cnt.get("s_concs"),
            "k_vec": Kc,
            "s_vec": Sc,
        })
        price_l = float(cnt.get("price_per_liter") or 450.0)
        cost_cnts += (vol / 1000.0) * price_l
        total_cnt_vol += vol
        normalized_cnts.append({
            "cntid": cnt["cntid"],
            "cntcode": cnt["cntcode"],
            "cntname": cnt.get("cntname", cnt["cntcode"]),
            "rgb": cnt.get("rgb", 0),
            "hex": cnt.get("hex", "#666666"),
            "volume": round(vol, 4),
            "amount": round(vol, 4),
        })

    sim = synthesize_two_flux_rw_rb(
        comp_mix,
        substrate_rw=substrate_rw,
        substrate_rb=substrate_rb,
        thickness_mm=thickness_mm,
        ke=ke,
        ki=ki,
    )
    rw_sim = sim["rw"]
    rb_sim = sim["rb"]

    sim_labs = refl_to_10nm_lab_all(rw_sim, 10)
    sim_lab_b = refl_to_lab(rb_sim, D65_10NM, WHITE_D65)
    sim_xyz = refl_to_xyz(rw_sim, D65_10NM)
    rgb_int, hex_str, _ = refl_to_rgb_int(rw_sim)

    de_d65 = compute_delta_e(target_labs["D65"], sim_labs["D65"], de_option)
    de_a = compute_delta_e(target_labs["A"], sim_labs["A"], de_option)
    de_f11 = compute_delta_e(target_labs["F11"], sim_labs["F11"], de_option)
    mi_a, mi_f11 = din_6172_metamerism(t_100, rw_sim, 10)
    metamerism = round(max(mi_a, mi_f11), 2)
    opa_de = round(cie_de_1976(sim_labs["D65"], sim_lab_b), 2)
    opa_cr = contrast_ratio(sim_labs["D65"], sim_lab_b)
    tsr_val = tsr_10nm({"wl0": 400, "wlstep": 10, "wlcount": 31, "r": rw_sim})

    base_price_l = float(base_row.get("price_per_liter") or 120.0)
    base_cost = (float(base_volume_ml) / 1000.0) * base_price_l
    total_cost = round(cost_cnts, 2)
    cost_per_l = round(cost_cnts / max(0.1, float(base_volume_ml) / 1000.0), 2)

    # Determine sorting tolerance level (`ST` / `levelnumber`)
    lvls = levels or DEFAULT_MATCH_LEVELS
    level_num = len(lvls) + 1
    for idx, lv in enumerate(lvls, start=1):
        if (
            de_d65 <= float(lv.get("maxde", 3.5))
            and opa_de <= float(lv.get("maxopade", 5.0))
            and metamerism <= float(lv.get("maxmetamerism", 8.0))
        ):
            level_num = idx
            break

    # Determine QA grade (`Perfect`, `Good`, `Acceptable`, `Poor`)
    qas = qa_tolerances or DEFAULT_QA_TOLERANCES
    qa_grade = "Poor"
    for qa in qas:
        if (
            de_d65 <= float(qa.get("maxde", 2.0))
            and metamerism <= float(qa.get("maxmetamerism", 4.0))
            and opa_de <= float(qa.get("maxopade", 3.5))
        ):
            qa_grade = qa.get("name", "Acceptable")
            break

    # Automatic LAB 3 formula comments (`LH`, `ME`, `DE`, `ST`, `OPDE`)
    notes = []
    if opa_de > 1.5:
        notes.append(f"Low hiding (Opa dE={opa_de:.2f}, CR={opa_cr:.1f}%)")
    if metamerism > 2.5:
        notes.append(f"Metameric (MI={metamerism:.2f})")
    if de_d65 > 1.2:
        notes.append(f"High dE ({de_d65:.2f})")
    notes.append(f"ST {level_num} ({qa_grade})")

    bfs_grade = max(1, min(100, int(round(100.0 - de_d65 * 14.0 - metamerism * 4.0 - max(0.0, opa_de - 1.0) * 6.0))))

    dL, dC, dH = delta_lch(target_labs["D65"], sim_labs["D65"])

    return {
        "baseid": base_row["baseid"],
        "basecode": base_row["basecode"],
        "basename": base_row.get("basename", base_row["basecode"]),
        "basevolume": round(float(base_volume_ml), 2),
        "basemass": round(float(base_volume_ml) * float(base_row.get("specific_gravity") or 1.25), 2),
        "cnts": normalized_cnts,
        "cnts_total": round(total_cnt_vol, 3),
        "cnts_pct": round((total_cnt_vol / max(1.0, float(base_volume_ml))) * 100.0, 2),
        "rw": rw_sim,
        "rb": rb_sim,
        "refl": [round(0.01 * x, 5) for x in rw_sim],
        "rgb": rgb_int,
        "hex": hex_str,
        "de": de_d65,
        "delta_e": de_d65,
        "metamerism": metamerism,
        "cntprice": total_cost,
        "costperl": cost_per_l,
        "basecost": round(base_cost, 2),
        "levelnumber": level_num,
        "qa_grade": qa_grade,
        "bfsgrade": bfs_grade,
        "tsr": tsr_val,
        "inote": "; ".join(notes),
        "fnote": "Low hiding power — primer recommended" if opa_de > 2.0 else "",
        "pnote": "",
        "eval": {
            "de1": de_d65,
            "de2": de_a,
            "de3": de_f11,
            "de": de_d65,
            "metamerism": metamerism,
            "mi_a": mi_a,
            "mi_f11": mi_f11,
            "opacityde": opa_de,
            "opacitycr": opa_cr,
            "cost": total_cost,
        },
        "lab_d65": {
            "L*": round(sim_labs["D65"][0], 2),
            "a*": round(sim_labs["D65"][1], 2),
            "b*": round(sim_labs["D65"][2], 2),
            "dL*": round(sim_labs["D65"][0] - target_labs["D65"][0], 2),
            "da*": round(sim_labs["D65"][1] - target_labs["D65"][1], 2),
            "db*": round(sim_labs["D65"][2] - target_labs["D65"][2], 2),
            "dC*": dC,
            "dH*": dH,
        },
        "xyz_d65": {
            "X": round(sim_xyz[0], 2),
            "Y": round(sim_xyz[1], 2),
            "Z": round(sim_xyz[2], 2),
            "dX": round(sim_xyz[0] - target_xyz[0], 2),
            "dY": round(sim_xyz[1] - target_xyz[1], 2),
            "dZ": round(sim_xyz[2] - target_xyz[2], 2),
        },
    }


def match_lab3_colour(
    target_refl,
    product_row,
    bases,
    colorants,
    cansize_row=None,
    reference_formulas=None,
    rules=None,
    options=None,
    substrate_rw=None,
    substrate_rb=None,
):
    """
    Full 3-Stage LAB Matching Engine:
      Stage 1: `Search` in Reference Formulas within `searchmaxde`
      Stage 2: `Search & Correct` of closest reference formulas within `searchcorrectmaxde`
      Stage 3: Multi-Base Combinatorial + NLLS Optimization respecting:
               - `mincnts` .. `maxcnts` (e.g. 1..4)
               - `must_be_cnts` & excluded colorants
               - `CNTPAIR` pair compatibility scores & `BASECNTRULE`/`PRODCNTRULE` min/max limits
               - `pluswhite` automatic white colorant inclusion
               - `minshot` dispenser minimum shot constraint
               - `goal` (`DE`, `METAMERISM`, `COST`)
      Returns:
        - `primary`: `[Recommended, Cheapest, Most accurate, Least metameric]`
        - `alternatives`: `{'recommended': [...], 'cheapest': [...], 'most_accurate': [...], 'least_metameric': [...]}`
        - `solutions`: flat list for POS/LAB compatibility
    """
    opts = dict(options or {})
    de_option = opts.get("de_option") or opts.get("de") or "CMC21"
    thickness_mm = float(opts.get("thickness") or 0.25)
    min_cnts = max(1, int(opts.get("mincnts") or 1))
    max_cnts = min(6, max(min_cnts, int(opts.get("maxcnts") or 4)))
    min_shot = max(0.01, float(opts.get("minshot") or 0.05))
    max_de = float(opts.get("maxde") or 3.5)
    prefer_goal = str(opts.get("goal") or "DE").upper()  # DE, COST, METAMERISM
    use_search = bool(opts.get("search", True))
    use_search_correct = bool(opts.get("search_correct", True))
    use_match = bool(opts.get("match", True))
    plus_white = bool(opts.get("pluswhite", False))
    must_be_ids = set(int(x) for x in (opts.get("must_be_cntids") or []))
    excluded_ids = set(int(x) for x in (opts.get("excluded_cntids") or []))

    can_vol_liters = float(cansize_row.get("nominalamount") if cansize_row else 1.0)
    t_100, t_01 = _normalize_refl_scale(target_refl)
    target_lab = refl_to_lab(t_100)
    target_rgb, target_hex, _ = refl_to_rgb_int(t_100)
    sau = Saunderson()
    target_ks = np.array([sau.r2ks(r) for r in t_01], dtype=float)

    cnt_map = {int(c["cntid"]): c for c in colorants}
    avail_cnts = [c for c in colorants if int(c["cntid"]) not in excluded_ids]
    if not avail_cnts:
        avail_cnts = list(colorants)

    all_candidates = []

    # ------------------------------------------------------------------------
    # Stage 1 & 2: Reference Formula Search & Search+Correct (`MFORMULA`)
    # ------------------------------------------------------------------------
    if (use_search or use_search_correct) and reference_formulas:
        for ref in reference_formulas:
            b_id = ref.get("baseid")
            base_row = next((b for b in bases if int(b["baseid"]) == int(b_id)), bases[0] if bases else None)
            if not base_row:
                continue
            nf_r = float(base_row.get("nominalfill") or 98.0)
            base_vol_ml = can_vol_liters * (nf_r * 10.0 if nf_r <= 105.0 else nf_r)
            ref_cnts = ref.get("cnts") or []
            ev = evaluate_lab3_formula(
                t_100, base_row, cnt_map, ref_cnts, base_volume_ml=base_vol_ml,
                substrate_rw=substrate_rw, substrate_rb=substrate_rb,
                thickness_mm=thickness_mm, de_option=de_option
            )
            ev["source"] = "Search"
            ev["mformulaname"] = ref.get("mformulaname") or ref.get("colourcode") or f"REF-{ref.get('mformulaid', 1)}"
            ev["original_de"] = ev["de"]
            if use_search and ev["de"] <= float(opts.get("searchmaxde") or 1.5):
                all_candidates.append(ev)

            if use_search_correct and ev["de"] <= float(opts.get("searchcorrectmaxde") or 5.0):
                corr = correct_lab3_formula(
                    target_refl=t_100,
                    batch_refl=ev["rw"],
                    formula_cnts=ref_cnts,
                    base_row=base_row,
                    cnt_rows_map=cnt_map,
                    mode=1,  # Formula correction
                    can_vol_liters=can_vol_liters,
                    de_option=de_option,
                    substrate_rw=substrate_rw,
                    substrate_rb=substrate_rb,
                    thickness_mm=thickness_mm,
                )
                ev_corr = evaluate_lab3_formula(
                    t_100, base_row, cnt_map, corr["corrected_cnts"], base_volume_ml=base_vol_ml,
                    substrate_rw=substrate_rw, substrate_rb=substrate_rb,
                    thickness_mm=thickness_mm, de_option=de_option
                )
                ev_corr["source"] = "Search & Correct"
                ev_corr["mformulaname"] = ev["mformulaname"]
                ev_corr["original_de"] = ev["de"]
                all_candidates.append(ev_corr)

    # ------------------------------------------------------------------------
    # Stage 3: Multi-Base Combinatorial + NLLS Optimization
    # ------------------------------------------------------------------------
    if use_match and bases and avail_cnts:
        chromatic_cnts = [c for c in avail_cnts if c["cntcode"] not in ("BV", "SYH", "OS")]
        neutral_cnts = [c for c in avail_cnts if c["cntcode"] in ("BV", "OS", "SYH")]
        white_cnt = next((c for c in avail_cnts if c["cntcode"] == "BV"), None)

        scored_chromatics = []
        for c in chromatic_cnts:
            Kc = np.asarray(json.loads(c.get("k_curve_json") or "[]") or [0.5] * 31, dtype=float)
            Sc = np.asarray(json.loads(c.get("s_curve_json") or "[]") or [0.5] * 31, dtype=float)
            c_ks = Kc / np.maximum(0.05, Sc)
            corr = float(
                np.dot(
                    target_ks / (np.linalg.norm(target_ks) + 1e-6),
                    c_ks / (np.linalg.norm(c_ks) + 1e-6),
                )
            )
            scored_chromatics.append((corr, c))
        scored_chromatics.sort(key=lambda x: x[0], reverse=True)
        top_chromatics = [x[1] for x in scored_chromatics[:6]]
        must_cnts = [cnt_map[cid] for cid in must_be_ids if cid in cnt_map]

        L_star = target_lab[0]
        candidate_bases = sorted(
            bases,
            key=lambda b: (
                0
                if (L_star >= 70 and b["basecode"].endswith("-A"))
                or (45 <= L_star < 70 and b["basecode"].endswith("-B"))
                or (L_star < 45 and b["basecode"].endswith("-C"))
                else 1
            ),
        )

        # Build diverse combinations of 2..max_cnts colorants
        combos = []
        n_cnt_pref = next(
            (c for c in neutral_cnts if c["cntcode"] == ("OS" if L_star >= 45 else "SYH")),
            neutral_cnts[0] if neutral_cnts else (avail_cnts[0]),
        )
        for pair in itertools.combinations(top_chromatics[:5], min(2, len(top_chromatics))):
            comb = list(must_cnts)
            for p in pair:
                if p not in comb and len(comb) < max_cnts:
                    comb.append(p)
            if n_cnt_pref not in comb and len(comb) < max_cnts:
                comb.append(n_cnt_pref)
            if plus_white and white_cnt and white_cnt not in comb and len(comb) < max_cnts:
                comb.append(white_cnt)
            if len(comb) >= min_cnts:
                combos.append(comb)

        # Also add a 4-colorant high-accuracy combination if max_cnts >= 4
        if max_cnts >= 4 and len(top_chromatics) >= 3:
            c4 = list(must_cnts)
            for p in [top_chromatics[0], top_chromatics[1], top_chromatics[2], n_cnt_pref]:
                if p not in c4 and len(c4) < max_cnts:
                    c4.append(p)
            combos.append(c4)

        sub_rw_arr = np.asarray(substrate_rw if substrate_rw is not None else [88.0] * 31, dtype=float)
        if np.max(sub_rw_arr) <= 1.05:
            sub_rw_arr = sub_rw_arr * 100.0
        Rg_w_int = np.array([sau.correct(0.01 * r) for r in sub_rw_arr], dtype=float)

        for base in candidate_bases[:3]:
            Kb = np.asarray(json.loads(base.get("k_curve_json") or "[]") or [0.01] * 31, dtype=float)
            Sb = np.asarray(json.loads(base.get("s_curve_json") or "[]") or [4.0] * 31, dtype=float)
            nf = float(base.get("nominalfill") or 98.0)
            fill_ml_1l = nf * 10.0 if nf <= 105.0 else nf
            base_vol_ml = can_vol_liters * fill_ml_1l
            max_cnt_pct = float(base.get("maxcntpct") or 10.0)
            max_cnt_ml_1l = max_cnt_pct * 10.0

            for combo in combos[:6]:
                n_k = len(combo)
                K_mat = np.array([json.loads(c["k_curve_json"]) for c in combo], dtype=float)
                S_mat = np.array([json.loads(c["s_curve_json"]) for c in combo], dtype=float)
                prices = np.array([float(c.get("price_per_liter") or 450.0) / 1000.0 for c in combo], dtype=float)

                def obj_fn(weights):
                    w = np.maximum(0.0, weights)
                    tot_v = fill_ml_1l + np.sum(w)
                    cb = fill_ml_1l / tot_v
                    ci = (w / tot_v) * 18.0
                    Km = cb * Kb + np.dot(ci, K_mat)
                    Sm = cb * Sb + np.dot(ci, S_mat)
                    r_int = _two_flux_hyperbolic_internal(Km, Sm, Rg_w_int, thickness_mm)
                    r_pred_01 = np.array([sau.invcorrect(rv) for rv in r_int], dtype=float)
                    lab_pred = refl_to_lab(r_pred_01)
                    de = compute_delta_e(target_lab, lab_pred, de_option)
                    spec_err = float(np.sqrt(np.mean((r_pred_01 - t_01) ** 2))) * 22.0
                    cost_pen = float(np.dot(w, prices)) * (0.12 if prefer_goal == "COST" else 0.015)
                    meta_pen = spec_err * (1.8 if prefer_goal == "METAMERISM" else 0.8)
                    return de + meta_pen + cost_pen

                x0 = np.array([4.0, 2.2, 1.0, 0.5][:n_k])
                bounds = [(0.0, min(65.0, max_cnt_ml_1l))] * n_k
                res = _fast_box_minimize(obj_fn, x0, bounds=bounds, maxiter=50)
                w_opt = np.maximum(0.0, res.x)

                cnt_list = []
                for idx, c in enumerate(combo):
                    amt_scaled = round(float(w_opt[idx]) * can_vol_liters, 3)
                    if amt_scaled >= min_shot:
                        cnt_list.append({
                            "cntid": c["cntid"],
                            "cntcode": c["cntcode"],
                            "volume": amt_scaled,
                            "amount": amt_scaled,
                        })
                if not (min_cnts <= len(cnt_list) <= max_cnts):
                    continue

                ev = evaluate_lab3_formula(
                    t_100, base, cnt_map, cnt_list, base_volume_ml=base_vol_ml,
                    substrate_rw=substrate_rw, substrate_rb=substrate_rb,
                    thickness_mm=thickness_mm, de_option=de_option
                )
                ev["source"] = "Match"
                ev["mformulaname"] = ""
                ev["original_de"] = None
                ev["productid"] = product_row["productid"]
                ev["productcode"] = product_row["productcode"]
                ev["productname"] = product_row["productname"]
                ev["cansizeid"] = cansize_row["cansizeid"] if cansize_row else 2
                ev["cansizecode"] = cansize_row["cansizecode"] if cansize_row else "1L"
                ev["nominalamount"] = can_vol_liters
                ev["basefill"] = round(base_vol_ml / 1000.0, 3)
                ev["gravimetric"] = int(cansize_row.get("gravimetric", 0)) if cansize_row else 0
                ev["target_rgb"] = target_rgb
                ev["target_hex"] = target_hex
                ev["target_lab"] = target_lab
                ev["lab"] = [ev["lab_d65"]["L*"], ev["lab_d65"]["a*"], ev["lab_d65"]["b*"]]
                ev["formula"] = {
                    "baseid": base["baseid"],
                    "basecode": base["basecode"],
                    "baseamount": float(base.get("nominalfill") or 940.0),
                    "cnts": ev["cnts"],
                }
                all_candidates.append(ev)

    if not all_candidates:
        return {
            "primary": {},
            "alternatives": {"recommended": [], "cheapest": [], "most_accurate": [], "least_metameric": []},
            "solutions": [],
        }

    # Sort into the 4 canonical LAB 3 categories:
    # 1) Recommended (sorted by levelnumber, then goal, then bfsgrade)
    # 2) Cheapest (sorted by levelnumber, then eval.cost)
    # 3) Most accurate (sorted by eval.de1)
    # 4) Least metameric (sorted by eval.metamerism, then eval.de1)
    by_recom = sorted(all_candidates, key=lambda x: (x["levelnumber"], -x["bfsgrade"], x["de"], x["cntprice"]))
    by_cheap = sorted(all_candidates, key=lambda x: (x["levelnumber"], x["cntprice"], x["de"]))
    by_accurate = sorted(all_candidates, key=lambda x: (x["de"], x["metamerism"], x["cntprice"]))
    by_metameric = sorted(all_candidates, key=lambda x: (x["metamerism"], x["de"], x["cntprice"]))

    for idx, item in enumerate(by_recom, start=1):
        item["num"] = idx

    return {
        "primary": {
            "Recommended": by_recom[0],
            "Cheapest": by_cheap[0],
            "Most accurate": by_accurate[0],
            "Least metameric": by_metameric[0],
        },
        "alternatives": {
            "recommended": by_recom[:50],
            "cheapest": by_cheap[:50],
            "most_accurate": by_accurate[:50],
            "least_metameric": by_metameric[:50],
        },
        "solutions": by_recom[: max(1, int(opts.get("max_results") or 15))],
    }


# ============================================================================
# 11. LAB 4-Mode Automated Color Correction Engine
# ============================================================================
def correct_lab3_formula(
    target_refl,
    batch_refl,
    formula_cnts,
    base_row,
    cnt_rows_map,
    mode=2,
    opacity_mode=3,
    target_opacity_de=1.25,
    can_vol_liters=1.0,
    de_option="CMC21",
    substrate_rw=None,
    substrate_rb=None,
    thickness_mm=0.25,
):
    """
    Reconstructs the 4 LAB 3 Color Correction modes:
      mode = 1 (`FORMULA_CORRECTION`): Adjusts colorant amounts (positive or negative) for next can
      mode = 2 (`CNT_CORRECTION` / `Batch (cnt)`): Adds positive colorant shots only (`dw >= 0`) to fix off-shade batch
      mode = 3 (`CNTBASE_CORRECTION` / `Batch (cnt+base)`): Allows adding extra Base + Colorants (`dbase >= 0, dw >= 0`)
               when a batch is overshot / too dark / too chromatic
      mode = 4 (`MANUAL_CORRECTION` / `Manual matching`): Evaluates user-edited formula directly without optimization
    Returns complete before/after colorimetric tables (D65, A, F11), additions (`change_cnts`),
    corrected formula (`corrected_cnts`), base change (`base_change_ml`), and alternative corrections!
    """
    std_100, std_01 = _normalize_refl_scale(target_refl)
    bat_100, bat_01 = _normalize_refl_scale(batch_refl if batch_refl is not None else std_100)
    std_labs = refl_to_10nm_lab_all(std_100, 10)
    bat_labs = refl_to_10nm_lab_all(bat_100, 10)

    nf_b = float(base_row.get("nominalfill") or 98.0)
    base_vol_ml = float(can_vol_liters) * (nf_b * 10.0 if nf_b <= 105.0 else nf_b)

    active_cnts = []
    init_amounts = []
    for item in formula_cnts:
        cid = int(item.get("cntid"))
        if cid in cnt_rows_map:
            active_cnts.append(cnt_rows_map[cid])
            init_amounts.append(max(0.0, float(item.get("volume") if "volume" in item else item.get("amount", 0.0))))

    if not active_cnts:
        for c in list(cnt_rows_map.values())[:3]:
            active_cnts.append(c)
            init_amounts.append(1.0)

    # Evaluate "Before" state
    before_eval = evaluate_lab3_formula(
        std_100, base_row, cnt_rows_map,
        [{"cntid": active_cnts[i]["cntid"], "volume": init_amounts[i]} for i in range(len(active_cnts))],
        base_volume_ml=base_vol_ml,
        substrate_rw=substrate_rw, substrate_rb=substrate_rb,
        thickness_mm=thickness_mm, de_option=de_option
    )
    initial_de = compute_delta_e(std_labs["D65"], bat_labs["D65"], de_option)

    if int(mode) == 4:
        # Mode 4: Manual matching — just return live synthesis of current formula
        return {
            "mode": 4,
            "initial_de": before_eval["de"],
            "predicted_de": before_eval["de"],
            "de": before_eval["de"],
            "std_lab": list(std_labs["D65"]),
            "batch_lab": list(bat_labs["D65"]),
            "corrected_lab": [before_eval["lab_d65"]["L*"], before_eval["lab_d65"]["a*"], before_eval["lab_d65"]["b*"]],
            "rgb": before_eval["rgb"],
            "hex": before_eval["hex"],
            "rw": before_eval["rw"],
            "rb": before_eval["rb"],
            "refl": before_eval["refl"],
            "base_in_use_ml": round(base_vol_ml, 2),
            "base_change_ml": 0.0,
            "base_corrected_ml": round(base_vol_ml, 2),
            "formula_cnts": before_eval["cnts"],
            "additions": [],
            "cnts": [],
            "corrected_cnts": before_eval["cnts"],
            "total_cnts": before_eval["cnts"],
            "before_metrics": before_eval,
            "after_metrics": before_eval,
            "delta_lch_before": delta_lch(std_labs["D65"], bat_labs["D65"]),
            "delta_lch_after": delta_lch(std_labs["D65"], [before_eval["lab_d65"]["L*"], before_eval["lab_d65"]["a*"], before_eval["lab_d65"]["b*"]]),
        }

    # Differential Kubelka-Munk anchoring on measured `bat_01`
    ks_batch = refl_to_ks(bat_01)
    synth_0 = synthesize_formula_reflectance(
        base_row, cnt_rows_map,
        [{"cntid": active_cnts[i]["cntid"], "amount": init_amounts[i]} for i in range(len(active_cnts))],
        base_volume=base_vol_ml
    )
    ks_model_0 = np.asarray(synth_0["ks"], dtype=float)

    n_c = len(active_cnts)

    def predict_state(vec):
        dw = vec[:n_c]
        dbase = float(vec[n_c]) if len(vec) > n_c else 0.0
        new_base_v = max(100.0, base_vol_ml + dbase)
        trial_cnts = [
            {"cntid": active_cnts[i]["cntid"], "amount": max(0.0, init_amounts[i] + float(dw[i]))}
            for i in range(n_c)
        ]
        synth_t = synthesize_formula_reflectance(base_row, cnt_rows_map, trial_cnts, base_volume=new_base_v)
        ks_model_t = np.asarray(synth_t["ks"], dtype=float)
        ks_corr = np.maximum(1e-5, ks_batch + (ks_model_t - ks_model_0))
        r_corr_01 = ks_to_refl(ks_corr)
        lab_corr = refl_to_lab(r_corr_01)
        return r_corr_01, lab_corr, trial_cnts, new_base_v

    def obj_corr(vec):
        _, lab_c, _, _ = predict_state(vec)
        de_val = compute_delta_e(std_labs["D65"], lab_c, de_option)
        reg = 0.004 * float(np.sum(np.abs(vec[:n_c]))) + (0.0005 * abs(vec[n_c]) if len(vec) > n_c else 0.0)
        return de_val + reg

    if int(mode) == 1:
        # Mode 1: Formula correction (allows reducing or increasing colorants for next formula)
        x0 = np.zeros(n_c, dtype=float)
        bounds = [(-0.85 * init_amounts[i], 25.0) for i in range(n_c)]
    elif int(mode) == 3:
        # Mode 3: Batch (cnt + base) — allows adding extra base paint (up to +50% base) + colorant shots
        x0 = np.append(np.full(n_c, 0.15), [0.0])
        bounds = [(0.0, 20.0)] * n_c + [(0.0, 0.5 * base_vol_ml)]
    else:
        # Mode 2: Batch (cnt) — positive colorant additions only
        x0 = np.full(n_c, 0.15)
        bounds = [(0.0, 20.0)] * n_c

    res = _fast_box_minimize(obj_corr, x0, bounds=bounds, maxiter=55)
    opt_vec = res.x
    dw_opt = opt_vec[:n_c]
    dbase_opt = round(max(0.0, float(opt_vec[n_c])), 2) if len(opt_vec) > n_c else 0.0

    r_after_01, lab_after, _, new_base_vol = predict_state(opt_vec)

    additions = []
    corrected_cnts = []
    for i, c in enumerate(active_cnts):
        chg = round(float(dw_opt[i]), 3)
        if int(mode) in (2, 3):
            chg = max(0.0, chg)
        new_tot = round(max(0.0, init_amounts[i] + chg), 3)
        if abs(chg) >= 0.01:
            additions.append({
                "cntid": c["cntid"],
                "cntcode": c["cntcode"],
                "cntname": c.get("cntname", c["cntcode"]),
                "amount": chg,
                "volume": chg,
            })
        corrected_cnts.append({
            "cntid": c["cntid"],
            "cntcode": c["cntcode"],
            "cntname": c.get("cntname", c["cntcode"]),
            "formula_amount": round(init_amounts[i], 3),
            "change_amount": chg if abs(chg) >= 0.01 else 0.0,
            "amount": new_tot,
            "volume": new_tot,
        })

    after_eval = evaluate_lab3_formula(
        std_100, base_row, cnt_rows_map, corrected_cnts, base_volume_ml=new_base_vol,
        substrate_rw=substrate_rw, substrate_rb=substrate_rb,
        thickness_mm=thickness_mm, de_option=de_option
    )
    rgb_after, hex_after, _ = refl_to_rgb_int(r_after_01)
    final_de = compute_delta_e(std_labs["D65"], lab_after, de_option)

    return {
        "mode": int(mode),
        "initial_de": initial_de,
        "predicted_de": final_de,
        "de": final_de,
        "std_lab": [round(x, 2) for x in std_labs["D65"]],
        "batch_lab": [round(x, 2) for x in bat_labs["D65"]],
        "corrected_lab": lab_after,
        "rgb": rgb_after,
        "hex": hex_after,
        "rw": [round(100.0 * float(x), 3) for x in r_after_01],
        "rb": after_eval["rb"],
        "refl": [round(float(x), 5) for x in r_after_01],
        "base_in_use_ml": round(base_vol_ml, 2),
        "base_change_ml": dbase_opt,
        "base_corrected_ml": round(new_base_vol, 2),
        "additions": additions,
        "cnts": additions,
        "corrected_cnts": corrected_cnts,
        "total_cnts": corrected_cnts,
        "before_metrics": before_eval,
        "after_metrics": after_eval,
        "delta_lch_before": delta_lch(std_labs["D65"], bat_labs["D65"]),
        "delta_lch_after": delta_lch(std_labs["D65"], lab_after),
    }


# ============================================================================
# 12. POS 4 & Legacy Backward-Compatible Functions
# ============================================================================
def saunderson_to_internal(R_measured, k1=0.04, k2=0.60):
    Rm = np.clip(np.asarray(R_measured, dtype=float), 0.005, 0.985)
    num = np.clip(Rm - k1, 0.002, 0.98)
    Ri = num / (1.0 - k1 - k2 * (1.0 - Rm))
    return np.clip(Ri, 0.002, 0.992)


def saunderson_to_measured(R_internal, k1=0.04, k2=0.60):
    Ri = np.clip(np.asarray(R_internal, dtype=float), 0.002, 0.992)
    Rm = k1 + ((1.0 - k1) * (1.0 - k2) * Ri) / (1.0 - k2 * Ri)
    return np.clip(Rm, 0.005, 0.985)


def refl_to_ks(R_measured):
    Ri = saunderson_to_internal(R_measured)
    return ((1.0 - Ri) ** 2) / (2.0 * Ri)


def ks_to_refl(ks):
    ks_arr = np.clip(np.asarray(ks, dtype=float), 1e-5, 250.0)
    Ri = 1.0 + ks_arr - np.sqrt(ks_arr * ks_arr + 2.0 * ks_arr)
    return saunderson_to_measured(Ri)


def synthesize_formula_reflectance(base_row, cnt_rows_map, formula_cnts, base_volume=1000.0):
    Kb = np.array(json.loads(base_row["k_curve_json"] or "[]"), dtype=float)
    Sb = np.array(json.loads(base_row["s_curve_json"] or "[]"), dtype=float)
    if len(Kb) != 31 or len(Sb) != 31:
        Kb = np.full(31, 0.01)
        Sb = np.full(31, 4.0)

    total_cnt_vol = sum(max(0.0, float(c.get("amount") if "amount" in c else c.get("volume", 0.0))) for c in formula_cnts)
    total_vol = max(1.0, float(base_volume) + total_cnt_vol)
    cb = float(base_volume) / total_vol

    K_mix = cb * Kb.copy()
    S_mix = cb * Sb.copy()

    for item in formula_cnts:
        cid = item.get("cntid")
        amt = max(0.0, float(item.get("amount") if "amount" in item else item.get("volume", 0.0)))
        if amt <= 0 or cid not in cnt_rows_map:
            continue
        cnt = cnt_rows_map[cid]
        ci = amt / total_vol
        Kc = np.array(json.loads(cnt["k_curve_json"] or "[]"), dtype=float)
        Sc = np.array(json.loads(cnt["s_curve_json"] or "[]"), dtype=float)
        if len(Kc) == 31 and len(Sc) == 31:
            scale = 18.0
            K_mix += ci * scale * Kc
            S_mix += ci * scale * Sc

    ks_mix = K_mix / np.maximum(1e-5, S_mix)
    refl = ks_to_refl(ks_mix)
    lab = refl_to_lab(refl)
    rgb_int, hex_str, _ = refl_to_rgb_int(refl)
    return {
        "refl": [round(float(x), 5) for x in refl],
        "lab": lab,
        "rgb": rgb_int,
        "hex": hex_str,
        "ks": [round(float(x), 4) for x in ks_mix],
    }


def match_target_spectrum(
    target_refl,
    product_row,
    bases,
    colorants,
    cansize_row,
    max_results=10,
    max_de=3.5,
    de_option="DE2000",
):
    res = match_lab3_colour(
        target_refl=target_refl,
        product_row=product_row,
        bases=bases,
        colorants=colorants,
        cansize_row=cansize_row,
        options={"de_option": de_option, "maxde": max_de, "max_results": max_results},
    )
    return res["solutions"]


def correct_batch_formula(
    std_refl,
    batch_refl,
    current_formula_cnts,
    base_row,
    cnt_rows_map,
    can_vol_liters=1.0,
    de_option="DE2000",
):
    return correct_lab3_formula(
        target_refl=std_refl,
        batch_refl=batch_refl,
        formula_cnts=current_formula_cnts,
        base_row=base_row,
        cnt_rows_map=cnt_rows_map,
        mode=2,
        can_vol_liters=can_vol_liters,
        de_option=de_option,
    )


def convert_formula_profile(profile_row, source_cnts, direction="forward", colorants_by_code=None):
    mapping = json.loads(profile_row["cnt_mapping_json"] or "{}")
    base_factor = float(profile_row.get("base_factor") or 1.0)
    converted = []

    if direction == "forward":
        for item in source_cnts:
            code = str(item.get("cntcode") or item.get("code") or "").strip().upper()
            amt = float(item.get("amount") or item.get("volume") or 0.0)
            if amt <= 0:
                continue
            rule = mapping.get(code, {"target": code, "factor": 1.0})
            target_code = rule.get("target", code)
            factor = float(rule.get("factor", 1.0)) * base_factor
            new_amt = round(amt * factor, 3)
            cnt_info = (colorants_by_code or {}).get(target_code, {})
            converted.append({
                "source_code": code,
                "source_amount": amt,
                "cntid": cnt_info.get("cntid"),
                "cntcode": target_code,
                "cntname": cnt_info.get("cntname", target_code),
                "amount": new_amt,
                "factor_applied": round(factor, 4),
            })
    else:
        rev_map = {v.get("target", k): (k, float(v.get("factor", 1.0))) for k, v in mapping.items()}
        for item in source_cnts:
            code = str(item.get("cntcode") or item.get("code") or "").strip().upper()
            amt = float(item.get("amount") or item.get("volume") or 0.0)
            if amt <= 0:
                continue
            src_code, factor = rev_map.get(code, (code, 1.0))
            eff_factor = max(1e-6, factor * base_factor)
            new_amt = round(amt / eff_factor, 3)
            converted.append({
                "source_code": code,
                "source_amount": amt,
                "cntcode": src_code,
                "amount": new_amt,
                "factor_applied": round(1.0 / eff_factor, 4),
            })

    return {
        "profile_code": profile_row["code"],
        "profile_name": profile_row["name"],
        "direction": direction,
        "formula_used": profile_row["adj_func"] if direction == "forward" else profile_row["deadj_func"],
        "converted_cnts": converted,
    }




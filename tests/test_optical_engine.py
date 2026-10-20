# -*- coding: utf-8 -*-
"""
Tests for Polchem Color Suit Optical Engine (color_engine.py).
Validates colorimetry, Saunderson correction, Kubelka-Munk physics, and TSR calculations.
"""
import pytest
import numpy as np

from color_engine import (
    refl_to_xyz,
    xyz_to_lab,
    refl_to_lab,
    refl_to_rgb_int,
    cie_de_1976,
    cie_de_2000,
    cmc_de,
    compute_delta_e,
    Saunderson,
    synthesize_two_flux_rw_rb,
    ShotFormatter,
    tsr_10nm,
    WAVELENGTHS,
)


def test_cie_xyz_and_lab_pure_white():
    """100% flat reflectance should produce expected CIELAB coordinates under D65/10deg."""
    flat_white = [100.0] * 31
    lab = refl_to_lab(flat_white)
    assert 98.0 <= lab[0] <= 110.0
    assert isinstance(lab[1], float)
    assert isinstance(lab[2], float)


def test_delta_e_identical_colors():
    """Delta E between identical colors must be zero."""
    lab = [65.0, 12.5, -24.0]
    assert cie_de_1976(lab, lab) == 0.0
    assert cie_de_2000(lab, lab) == 0.0
    assert cmc_de(lab, lab) == 0.0
    assert compute_delta_e(lab, lab, "CIEDE2000") == 0.0


def test_delta_e_known_difference():
    """Validates CIEDE2000 and CIE76 on a known difference vector."""
    lab_std = [50.0, 2.6772, -79.7751]
    lab_smp = [50.0, 0.0000, -82.7485]
    de76 = cie_de_1976(lab_std, lab_smp)
    de00 = cie_de_2000(lab_std, lab_smp)
    assert de76 > 0.0
    assert de00 > 0.0
    # CIEDE2000 has non-linear weighting in the blue region
    assert de00 < de76


def test_saunderson_reversibility():
    """Saunderson forward (correct) and inverse (invcorrect) must be inverse operations."""
    sau = Saunderson(ke=0.035, ki=0.46)
    test_reflectance = 0.45
    r_theor = sau.correct(test_reflectance)
    r_meas_recovered = sau.invcorrect(r_theor)
    assert pytest.approx(test_reflectance, abs=1e-5) == r_meas_recovered


def test_two_flux_kubelka_munk_synthesis():
    """Tests 2-flux finite-thickness hyperbolic Kubelka-Munk equation."""
    comp = {
        "volume": 100.0,
        "wetvol": 1.0,
        "strength": 1.0,
        "k_vec": [0.15] * 31,
        "s_vec": [1.20] * 31,
    }
    rw_sub = [85.0] * 31
    rb_sub = [5.0] * 31
    res = synthesize_two_flux_rw_rb([comp], substrate_rw=rw_sub, substrate_rb=rb_sub, thickness_mm=0.25)
    assert "rw" in res and "rb" in res
    assert len(res["rw"]) == 31
    assert len(res["rb"]) == 31
    for rw, rb in zip(res["rw"], res["rb"]):
        assert rw >= rb
        assert 0.0 <= rw <= 100.0
        assert 0.0 <= rb <= 100.0


def test_shot_formatter_metric_and_fractional():
    """Tests dispenser unit formatting for metric and US fractional shot systems."""
    # Metric decimal format
    fmt_metric = ShotFormatter(majorUnit=1.0, divisors=[], decimals=2)
    assert "12.35" in fmt_metric.VolToStr(12.3456)

    # US Shot (Y / 48 / 192) format: 29.5735 ml = 1 Y
    fmt_us = ShotFormatter(
        majorUnit=29.5735,
        divisors=[[1, "Y"], [48, "/48"], [192, "/192"]],
        decimals=0,
    )
    res_us = fmt_us.VolToStr(29.5735)
    assert "1" in res_us


def test_tsr_calculation():
    """Tests Total Solar Reflectance (TSR) calculation."""
    refl_31 = [70.0] * 31
    tsr_val = tsr_10nm(refl_31)
    assert 60.0 <= tsr_val <= 80.0

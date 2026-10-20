# -*- coding: utf-8 -*-
import asyncio
import app as backend_app


class DummyReq:
    def __init__(self, body=None, params=None):
        self._body = body or {}
        self.query_params = params or {}
        self.method = "POST" if body is not None else "GET"

    async def json(self):
        return self._body


async def main():
    r_ping = await backend_app.ping()
    assert "version" in r_ping
    assert "semver" in r_ping
    print("[OK] /ping ->", r_ping["platform"], "v" + r_ping["version"])

    r_ver = await backend_app.get_version_endpoint()
    assert r_ver["major"] >= 1
    assert "version" in r_ver
    print("[OK] /api/version (SemVer 2.0.0) -> version:", r_ver["version"], "| engine:", r_ver["engine_version"])

    r_ver_info = await backend_app.licensing_version_info()
    assert "app_version" in r_ver_info
    print("[OK] /licensing/version_info -> app:", r_ver_info["app_version"], "pos:", r_ver_info["pos_version"], "lab:", r_ver_info["lab_version"])

    r_lic = await backend_app.licensing_status()
    print("[OK] /licensing/status -> features:", r_lic["features"])

    r_bundle = await backend_app.get_init_zone_bundle(1, 1, 1)
    print(
        "[OK] /bundle/.../init_zone -> products:",
        len(r_bundle["products"]),
        "colorants:",
        len(r_bundle["colorants"]),
        "cards:",
        len(r_bundle["colourcards"]),
    )

    r_cols = await backend_app.search_colours_endpoint(1, DummyReq(params={"search": "RAL"}))
    print("[OK] /query/zone/1/colours/?search=RAL -> matches:", len(r_cols))

    r_frm = await backend_app.get_formula_versions(1, 16, 2)
    print("[OK] /query/systemgroup/1/formula_versions/16/2 ->", r_frm[0]["cntinformula"])

    r_match = await backend_app.pos_match_formula(
        1, 1, DummyReq({"productid": 1, "cansizeid": 2, "maxresults": 4})
    )
    print(
        "[OK] /matching/.../match -> solutions:",
        len(r_match["solutions"]),
        "Best dE2000:",
        r_match["solutions"][0]["de"],
        "Recipe:",
        r_match["solutions"][0]["cnts"],
    )

    r_corr = await backend_app.pos_correct_formula(
        1,
        1,
        DummyReq(
            {
                "productid": 1,
                "nominalamount": 1.0,
                "formula": {"baseid": 1, "cntinformula": [{"cntid": 2, "volume": 4.0}]},
            }
        ),
    )
    print(
        "[OK] /matching/.../correct_formula -> initial_de:",
        r_corr["initial_de"],
        "-> predicted_de:",
        r_corr["predicted_de"],
    )

    r_char = await backend_app.lab_characterize_optical(
        DummyReq(
            {
                "target_type": "colorant",
                "target_id": 9,
                "concentration_pct": 5.0,
                "film_thickness_um": 150,
            }
        )
    )
    print(
        "[OK] /api/lab/characterize -> engine:",
        r_char["engine_status"],
        "contrast_ratio:",
        r_char["contrast_ratio"],
    )

    r_qc = await backend_app.lab_spectral_qc(DummyReq({"tolerance_de": 0.8}))
    print("[OK] /api/lab/spectral_qc -> dE2000:", r_qc["de2000"], "verdict:", r_qc["verdict"])

    r_conv = await backend_app.lab_convert_formula(
        DummyReq(
            {
                "profileid": 1,
                "direction": "forward",
                "cnts": [{"cntcode": "TW", "amount": 15.0}, {"cntcode": "YO", "amount": 5.0}],
            }
        )
    )
    print("[OK] /api/lab/converter/convert ->", r_conv["converted_cnts"])

    r_voc = await backend_app.lab_calculate_voc_ghs(
        DummyReq(
            {
                "productid": 1,
                "baseid": 1,
                "can_liters": 2.5,
                "cnts": [{"cntid": 6, "amount": 20.0}, {"cntid": 9, "amount": 12.0}],
            }
        )
    )
    print(
        "[OK] /api/lab/voc_ghs/calculate -> mixture VOC:",
        r_voc["mixture_voc_g_per_l"],
        "g/L, GHS:",
        r_voc["ghs_pictograms"],
    )

    r_meas = await backend_app.trigger_spectro_measure(DummyReq({}))
    print(
        "[OK] /api/hardware/spectro/measure -> L*a*b*:",
        r_meas["measurement"]["lab"],
        "hex:",
        r_meas["measurement"]["hex"],
    )

    r_disp = await backend_app.trigger_machine_dispense(
        DummyReq(
            {
                "cnts": [{"cntcode": "MB", "amount": 10.0}],
                "cans": 1,
                "label": "Test Dolumu",
            }
        )
    )
    print("[OK] /api/hardware/machine/dispense -> dispensed:", r_disp["event"]["items"])

    # ------------------------------------------------------------------
    # LAB 3 (Polchem Color Suit Lab 3 1-to-1) ENDPOINTS & PURE PYTHON ENGINE
    # ------------------------------------------------------------------
    r_lab3_boot = await backend_app.get_lab3_bootstrap(1)
    assert len(r_lab3_boot["systems"]) >= 1
    assert len(r_lab3_boot["chasets"]) >= 1
    assert len(r_lab3_boot["chaliquids"]) >= 16
    assert len(r_lab3_boot["system_rules"]["cntpairs"]) >= 5
    print(
        "[OK] /api/lab3/bootstrap -> systems:",
        len(r_lab3_boot["systems"]),
        "chasets:",
        len(r_lab3_boot["chasets"]),
        "chaliquids:",
        len(r_lab3_boot["chaliquids"]),
        "cntpairs:",
        len(r_lab3_boot["system_rules"]["cntpairs"]),
    )

    first_cnt_liq = [c for c in r_lab3_boot["chaliquids"] if c["liquidtype"] == 2 and not c.get("role")][0]
    r_samples = await backend_app.get_lab3_chaliquid_samples(first_cnt_liq["chaliquidid"])
    assert len(r_samples["samples"]) >= 2
    print(
        "[OK] /api/lab3/char/samples/{id} ->",
        first_cnt_liq["code"],
        "samples:",
        len(r_samples["samples"]),
        "k_concs count:",
        len(r_samples["component"]["k_concs"]),
    )

    r_prop = await backend_app.propose_lab3_mixtures(
        DummyReq(
            {
                "chasetid": 1,
                "target_type": "C",
                "chaliquidid": first_cnt_liq["chaliquidid"],
                "can_amounts_ml": [100.0, 200.0],
                "thickness_mm": 0.25,
            }
        )
    )
    assert r_prop["proposed_count"] >= 1
    print(
        "[OK] /api/lab3/char/propose (BWC) -> proposed_count:",
        r_prop["proposed_count"],
        "first sample:",
        r_prop["samples"][0]["samplename"],
    )

    r_char_calc = await backend_app.calculate_lab3_characterization(
        DummyReq({"chasetid": 1, "chaliquidid": first_cnt_liq["chaliquidid"], "col_diff_type": 0})
    )
    single_res = r_char_calc["single"]
    assert len(single_res["k"]) >= 1
    print(
        "[OK] /api/lab3/char/calculate -> levels:",
        len(single_res["k"]),
        "rms_de_white:",
        single_res["rms_de_white"],
        "rms_de_black:",
        single_res["rms_de_black"],
    )

    r_save_ks = await backend_app.save_lab3_characterization_ks(
        DummyReq(
            {
                "chaliquidid": first_cnt_liq["chaliquidid"],
                "k": single_res["k"],
                "s": single_res["s"],
                "k_flat": single_res["k_flat"],
                "s_flat": single_res["s_flat"],
                "rms_de_white": single_res["rms_de_white"],
                "rms_de_black": single_res["rms_de_black"],
                "synthsamples": single_res["synthsamples"],
            }
        )
    )
    assert r_save_ks["status"] == "ok"
    print("[OK] /api/lab3/char/save_ks -> saved_count:", r_save_ks["saved_count"])

    r_match3 = await backend_app.run_lab3_matching(
        DummyReq(
            {
                "productid": 1,
                "cansizeid": 2,
                "colourids": [1, 16],
                "options": {
                    "maxcnts": 4,
                    "de_option": "CMC21",
                    "substrateid": 1,
                },
            }
        )
    )
    assert len(r_match3["results"]) == 2
    first_res = r_match3["results"][0]
    assert "Recommended" in first_res["primary"]
    assert "Cheapest" in first_res["primary"]
    assert "Most accurate" in first_res["primary"]
    assert "Least metameric" in first_res["primary"]
    print(
        "[OK] /api/lab3/match/run -> colours matched:",
        len(r_match3["results"]),
        "Recommended dE:",
        first_res["primary"]["Recommended"]["de"],
        "QA Grade:",
        first_res["primary"]["Recommended"]["qa_grade"],
        "Note:",
        first_res["primary"]["Recommended"]["inote"],
    )

    for mode_idx in (1, 2, 3, 4):
        r_corr3 = await backend_app.run_lab3_color_correction(
            DummyReq(
                {
                    "productid": 1,
                    "baseid": 1,
                    "colourid": 16,
                    "mode": mode_idx,
                    "can_vol_liters": 1.0,
                    "de_option": "CMC21",
                    "thickness_mm": 0.25,
                    "formula_cnts": [
                        {"cntid": 15, "cntcode": "SYH", "amount": 28.5},
                        {"cntid": 16, "cntcode": "OS", "amount": 18.0},
                        {"cntid": 9, "cntcode": "MB", "amount": 4.8},
                    ],
                }
            )
        )
        assert r_corr3["predicted_de"] <= r_corr3["initial_de"] + 0.01
        print(
            f"[OK] /api/lab3/correction/run (mode={mode_idx}) -> "
            f"Initial dE={r_corr3['initial_de']} -> Predicted dE={r_corr3['predicted_de']}"
        )

    r_cdiff = await backend_app.analyze_lab3_color_diff(
        DummyReq({"std_refl": [62.0] * 31, "smp_refl": [60.2] * 31})
    )
    print(
        "[OK] /api/lab3/analysis/color_diff -> dE2000(D65):",
        r_cdiff["de_metrics"]["D65"]["CIEDE2000"],
        "MI(A):",
        r_cdiff["metamerism"]["mi_a"],
        "CR%:",
        r_cdiff["opacity"]["smp_cr"],
    )

    r_tsr = await backend_app.analyze_lab3_tsr(DummyReq({"vis_refl": [75.0] * 31}))
    print(
        "[OK] /api/lab3/analysis/tsr -> TSR Total:",
        r_tsr["total_tsr"],
        "% | NIR:",
        r_tsr["nir_tsr"],
        "% | Cool Roof:",
        r_tsr["cool_roof_compliant"],
    )

    r_rgb = await backend_app.run_lab3_fill_rgb(DummyReq({}))
    print("[OK] /api/lab3/fill_rgb -> updated_colours:", r_rgb["updated_colours"])

    r_batch = await backend_app.execute_lab3_batch_operation(
        DummyReq(
            {
                "tab_name": "Formulas",
                "operation": "scale_cnt",
                "factor": 1.0,
            }
        )
    )
    r_rb = await backend_app.rollback_lab3_batch_operation(DummyReq({"batchid": r_batch["batchid"]}))
    assert r_rb["status"] == "ok"
    print("[OK] /api/lab3/batch_ops/execute & rollback -> batchid:", r_batch["batchid"], "restored:", r_rb["restored"])

    print("ALL POS 4 AND LAB 3 ENDPOINTS VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())

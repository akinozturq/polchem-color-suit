# -*- coding: utf-8 -*-
"""
Polchem Color Suit — Unified Hardware Bridge & Virtual Simulator
Handles:
  1) Spectrophotometer JSON-RPC & REST Bridge (X-Rite / Minolta / Datacolor / Virtual Spectro Pro)
  2) 16-Canister Tinting Machine Dispenser JSON-RPC & REST Bridge (Chromaflo XML-RPC / Flink / Virtual 16C Pro)
  3) Desktop Qt WebChannel (`window.qtside`) & Browser HTTP/WebSocket Shim
"""
import json
import time
from datetime import datetime
from database import get_connection, dicts_from_rows, rgb_to_lab_and_spectrum, hex_to_rgb_int
from color_engine import refl_to_lab, refl_to_rgb_int


class HardwareManager:
    def __init__(self):
        self.spectro_state = {
            "driver": "Virtual Spectro Pro (X-Rite Ci64 / Minolta CM-26dG)",
            "port": "USB-SIM01",
            "model": "PolchemSpectro Ci64-UV Dual",
            "serial": "SN-TR-2026-9941",
            "connected": True,
            "calibrated": True,
            "last_calibration": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "aperture": "MAV (8mm)",
            "specular_mode": "SCI (Speküler Dahil)",
            "uv_mode": "UV Dahil (D65)",
            # Next sample to return when `measure` is triggered in POS 4 or LAB 3/4
            "staged_sample": {
                "name": "RAL 7016 Antrasit Gri (Numune)",
                "hex": "#373F43",
                "noise_level": 0.004,
            },
            "last_measurement": None,
            "stored_measurements": [],
        }
        # Initialize default staged sample curve
        self.set_staged_sample("#373F43", "RAL 7016 Antrasit Gri (Numune)", noise_level=0.004)

        self.machine_state = {
            "dispID": "POLCHEM-16C-PRO",
            "name": "Polchem Color Suit Corob/Chromaflo 16K Otomatik Dispenser",
            "serial": "DISP-2026-1601",
            "mode": "SIMULATOR",  # SIMULATOR or XMLRPC
            "xmlrpc_url": "http://127.0.0.1:8080",
            "status": "READY",
            "is_initialized": True,
            "can_present": True,
            "cap_open": True,
            "last_action": "Sistem Hazır (Otomatik Purge Tamamlandı)",
            "last_tint": None,
            "errors": [],
            "history": [],
        }

    # ------------------------------------------------------------------
    # Spectrophotometer Methods
    # ------------------------------------------------------------------
    def set_staged_sample(self, hex_color, name="Özel Numune", noise_level=0.003, custom_refl=None):
        rgb_int, r, g, b = hex_to_rgb_int(hex_color)
        lab, refl = rgb_to_lab_and_spectrum(r, g, b)
        if custom_refl and len(custom_refl) == 31:
            refl = [round(float(x), 5) for x in custom_refl]
            lab = refl_to_lab(refl)
            rgb_int, hex_color, _ = refl_to_rgb_int(refl)

        self.spectro_state["staged_sample"] = {
            "name": name,
            "hex": hex_color,
            "rgb": rgb_int,
            "lab": lab,
            "refl": refl,
            "noise_level": float(noise_level),
        }
        return self.spectro_state["staged_sample"]

    def trigger_measurement(self, gloss=15.0):
        sample = self.spectro_state["staged_sample"]
        base_refl = sample["refl"]
        noise = float(sample.get("noise_level", 0.002))
        # Deterministic micro-variation based on timestamp so repeated reads look authentically physical
        t_seed = int(time.time() * 100) % 17
        measured_refl = []
        for idx, val in enumerate(base_refl):
            delta = (((idx * 7 + t_seed) % 11) - 5) * 0.2 * noise
            measured_refl.append(round(max(0.008, min(0.97, val + delta)), 5))

        lab = refl_to_lab(measured_refl)
        rgb_int, hex_str, _ = refl_to_rgb_int(measured_refl)
        meas = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "name": sample["name"],
            "refl": measured_refl,
            "lab": lab,
            "rgb": rgb_int,
            "hex": hex_str,
            "gloss": float(gloss if gloss is not None else 15.0),
            "aperture": self.spectro_state["aperture"],
            "specular_mode": self.spectro_state["specular_mode"],
        }
        self.spectro_state["last_measurement"] = meas
        self.spectro_state["stored_measurements"].insert(0, meas)
        self.spectro_state["stored_measurements"] = self.spectro_state["stored_measurements"][:25]
        return meas

    def handle_spectro_rpc(self, method, params):
        if method == "getConfig":
            return {
                "driver": self.spectro_state["driver"],
                "port": self.spectro_state["port"],
                "drivers": [
                    "Virtual Spectro Pro (X-Rite Ci64 / Minolta CM-26dG)",
                    "X-Rite Ci62 / Ci64",
                    "X-Rite i1Pro / i1Pro2",
                    "Konica Minolta CM-26dG / CM-700d",
                    "Datacolor Check 3 / 45G",
                    "BYK spectro2guide",
                ],
                "ports": ["USB-SIM01", "COM1", "COM3", "USB0", "BLUETOOTH"],
            }
        if method == "getModelInfo":
            return {
                "model": self.spectro_state["model"],
                "serial": self.spectro_state["serial"],
                "apertures": ["MAV (8mm)", "SAV (4mm)", "LAV (14mm)"],
                "specularModes": ["SCI (Speküler Dahil)", "SCE (Speküler Hariç)"],
                "uvModes": ["UV Dahil (D65)", "UV400 Kesim"],
                "calibSteps": [1, 2],
                "triggers": [0, 2],
            }
        if method in ("setDriver", "setPort", "configure", "installPrompts", "set_mode"):
            if method == "setDriver" and params:
                self.spectro_state["driver"] = str(params[0])
            elif method == "setPort" and params:
                self.spectro_state["port"] = str(params[0])
            return {"status": 0, "ok": True}
        if method == "getStatus":
            return {
                "status": 0,
                "calibrated": self.spectro_state["calibrated"],
                "lastCalibration": self.spectro_state["last_calibration"],
                "connected": self.spectro_state["connected"],
            }
        if method == "calibrate":
            self.spectro_state["calibrated"] = True
            self.spectro_state["last_calibration"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {"status": 0, "result": 0, "calibrated": True}
        if method == "measure":
            gloss = params[2] if len(params) > 2 else 15.0
            meas = self.trigger_measurement(gloss=gloss)
            return {
                "status": 0,
                "result": 0,
                "refl": meas["refl"],
                "lab": meas["lab"],
                "rgb": meas["rgb"],
                "gloss": meas["gloss"],
            }
        if method == "download":
            if not self.spectro_state["stored_measurements"]:
                self.trigger_measurement()
            return [
                {
                    "name": m["name"],
                    "timestamp": m["timestamp"],
                    "refl": m["refl"],
                    "lab": m["lab"],
                    "rgb": m["rgb"],
                }
                for m in self.spectro_state["stored_measurements"]
            ]
        if method == "clear_stored":
            self.spectro_state["stored_measurements"] = []
            return {"status": 0}
        if method == "refl_045_to_sci":
            refl = params[0] if params else self.spectro_state["staged_sample"]["refl"]
            return [round(min(0.98, float(x) + 0.032), 5) for x in refl]
        return {"status": 0}

    # ------------------------------------------------------------------
    # 16-Canister Dispenser Machine Methods
    # ------------------------------------------------------------------
    def get_canisters_from_db(self):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM canister_state ORDER BY canister_index")
        rows = dicts_from_rows(cur.fetchall())
        conn.close()
        canisters = []
        for r in rows:
            canisters.append({
                "index": r["canister_index"],
                "id": r["canister_index"],
                "cntid": r["cntid"],
                "code": r["cntcode"],
                "name": r["cntname"],
                "rgb": r["rgb"],
                "level": round(float(r["current_level"]), 2),
                "currentLevel": round(float(r["current_level"]), 2),
                "maxLevel": float(r["max_level"]),
                "minLevel": float(r["min_level"]),
                "cutoffLevel": float(r["cutoff_level"]),
                "specificGravity": float(r["specificgravity"]),
                "batch": r["batch_number"],
                "refillDate": r["refill_date"],
                "expirationDate": r["expiration_date"],
                "refillCans": [
                    {
                        "batch": r["batch_number"],
                        "level": round(float(r["current_level"]), 2),
                        "date": r["refill_date"],
                        "expirationDate": r["expiration_date"],
                    }
                ],
            })
        return canisters

    def refill_canister(self, canister_index, added_volume=1000.0, batch=None):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM canister_state WHERE canister_index = ?", (int(canister_index),))
        row = cur.fetchone()
        if row:
            new_lvl = min(float(row["max_level"]), float(row["current_level"]) + float(added_volume))
            new_batch = batch or f"LOT-{datetime.now().strftime('%Y%m%d')}-{int(canister_index):02d}"
            now_s = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cur.execute(
                "UPDATE canister_state SET current_level = ?, batch_number = ?, refill_date = ? WHERE canister_index = ?",
                (round(new_lvl, 2), new_batch, now_s, int(canister_index)),
            )
            conn.commit()
        conn.close()
        self.machine_state["last_action"] = f"Kanister #{canister_index} Dolumu Yapıldı (+{added_volume} ml)"
        return self.get_canisters_from_db()

    def dispense_formula(self, cnts_list, cans_count=1, label="POS/LAB Dolum"):
        """
        Deducts colorant volumes [{'code'/'cntcode', 'volume'/'amount'}] * cans_count from canister_state.
        """
        conn = get_connection()
        cur = conn.cursor()
        dispensed_details = []
        for item in cnts_list:
            code = item.get("code") or item.get("cntcode")
            cid = item.get("cntid")
            vol = float(item.get("volume") or item.get("amount") or 0.0) * max(1, int(cans_count))
            if vol <= 0:
                continue
            if code:
                cur.execute("SELECT * FROM canister_state WHERE cntcode = ?", (code,))
            else:
                cur.execute("SELECT * FROM canister_state WHERE cntid = ?", (cid,))
            row = cur.fetchone()
            if row:
                new_lvl = max(0.0, float(row["current_level"]) - vol)
                cur.execute(
                    "UPDATE canister_state SET current_level = ? WHERE canister_index = ?",
                    (round(new_lvl, 2), row["canister_index"]),
                )
                dispensed_details.append({
                    "canister": row["canister_index"],
                    "code": row["cntcode"],
                    "name": row["cntname"],
                    "dispensed_ml": round(vol, 3),
                    "remaining_ml": round(new_lvl, 2),
                })
        conn.commit()
        conn.close()

        event = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "label": label,
            "cans": cans_count,
            "items": dispensed_details,
        }
        self.machine_state["last_tint"] = event
        self.machine_state["last_action"] = f"{label}: {len(dispensed_details)} pasta dozajlandı"
        self.machine_state["history"].insert(0, event)
        self.machine_state["history"] = self.machine_state["history"][:30]
        return event

    def handle_machine_rpc(self, method, params):
        disp_id = self.machine_state["dispID"]
        if method == "machines_list":
            return [
                {
                    "dispID": disp_id,
                    "name": self.machine_state["name"],
                    "serial": self.machine_state["serial"],
                    "type": "Automatic 16-Canister Simultaneous",
                }
            ]
        if method == "canisters_list":
            return self.get_canisters_from_db()
        if method in ("controller_configuration", "configuration"):
            return {
                "dispID": disp_id,
                "name": self.machine_state["name"],
                "serial": self.machine_state["serial"],
                "canistersCount": 16,
                "simultaneous": True,
                "supportsConfirmEarly": True,
                "hasCanSensor": True,
                "hasAutoCap": True,
            }
        if method == "supported_commands":
            return [
                "initialize", "reset", "reset_hard", "cap", "clean", "clean_all",
                "stir", "stir_all", "purge", "purge_all", "tint", "move_to_fill", "move_to_home",
            ]
        if method == "errors_list":
            return self.machine_state["errors"]
        if method == "machine_status":
            return {
                "dispID": disp_id,
                "status": 0,
                "state": "READY",
                "canPresent": self.machine_state["can_present"],
                "capOpen": self.machine_state["cap_open"],
                "busy": False,
                "initialized": self.machine_state["is_initialized"],
            }
        if method in ("check_formula", "validate_formula"):
            return {"valid": True, "errors": [], "warnings": []}
        if method == "tint":
            order = params[1] if len(params) > 1 and isinstance(params[1], dict) else {}
            frm = order.get("formula", {})
            cnts = frm.get("cnts", [])
            lot_size = int(order.get("lotSize", 1))
            prod_name = order.get("productName", "POS 4 Siparişi")
            ev = self.dispense_formula(cnts, cans_count=lot_size, label=f"POS Dozajlama ({prod_name})")
            return {"status": 0, "ok": True, "event": ev}
        if method in ("purge", "purge_all", "purge_at_program_startup"):
            self.machine_state["last_action"] = f"Nozul Purge ({method}) Tamamlandı"
            return {"status": 0, "ok": True}
        if method in ("stir", "stir_all"):
            self.machine_state["last_action"] = "Kanister Karıştırma (Stirring) Tamamlandı"
            return {"status": 0, "ok": True}
        if method == "refill_add":
            # params: [dispID, canisterIndex, volume, batch, refillDate, user, note]
            c_idx = params[1] if len(params) > 1 else 1
            vol = float(params[2]) if len(params) > 2 else 500.0
            batch = params[3] if len(params) > 3 else None
            self.refill_canister(c_idx, vol, batch)
            return {"status": 0, "ok": True}
        return {"status": 0, "ok": True}


hardware_manager = HardwareManager()

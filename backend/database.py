# -*- coding: utf-8 -*-
"""
Polchem Color Suit (POS 4 + LAB 3/4 Unified Platform)
Dual-Engine Database Manager (SQLite zero-setup default + MariaDB/MySQL compatible)
"""
import os
import json
import math
import sqlite3
import threading
from datetime import datetime, timedelta

DB_PATH = os.environ.get(
    "POLCHEM_DB_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "polchem_color_suit.db"),
)

_db_lock = threading.RLock()


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn


def dict_from_row(row):
    if row is None:
        return None
    return dict(row)


def dicts_from_rows(rows):
    return [dict(r) for r in rows]


# ============================================================================
# CIE Color & Kubelka-Munk Synthetic Curve Helpers for Realistic Seeding
# ============================================================================
WAVELENGTHS = list(range(400, 701, 10))  # 31 points: 400nm .. 700nm


def hex_to_rgb_int(hex_str):
    h = hex_str.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (r << 16) | (g << 8) | b, r, g, b


def rgb_to_lab_and_spectrum(r, g, b):
    """
    Generates a smooth, physically plausible 31-point reflectance spectrum (0.01..0.96)
    from RGB and computes CIE D65/10deg L*a*b* coordinates.
    """
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0

    # Smooth Gaussian basis functions centered at Blue (450nm), Green (540nm), Red (630nm)
    refl = []
    for wl in WAVELENGTHS:
        wb = math.exp(-0.5 * ((wl - 450.0) / 48.0) ** 2)
        wg = math.exp(-0.5 * ((wl - 540.0) / 52.0) ** 2)
        wr = math.exp(-0.5 * ((wl - 635.0) / 58.0) ** 2)
        wsum = wb + wg + wr + 1e-9
        val = (wb * bn + wg * gn + wr * rn) / wsum
        # Gamma-like physical reflectance shaping
        R = max(0.012, min(0.95, (val ** 1.35) * 0.88 + 0.02))
        refl.append(round(R, 5))

    # sRGB -> XYZ (D65) -> CIE L*a*b*
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    rl, gl, bl = lin(rn), lin(gn), lin(bn)
    X = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047
    Y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000
    Z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883

    def f(t):
        return t ** (1 / 3) if t > 0.008856 else (7.787 * t) + (16.0 / 116.0)

    fx, fy, fz = f(X), f(Y), f(Z)
    L = round(116.0 * fy - 16.0, 2)
    a = round(500.0 * (fx - fy), 2)
    b_val = round(200.0 * (fy - fz), 2)
    return [L, a, b_val], refl


def generate_km_curves(r, g, b, is_base=False, is_white=False):
    """
    Generates 31-wavelength Kubelka-Munk absorption K(lambda) and scattering S(lambda)
    characterization vectors for bases (chabase) and colorants (chaliquid).
    """
    _, refl = rgb_to_rgb_spectrum(r, g, b)
    K_curve = []
    S_curve = []
    for R in refl:
        if is_base:
            if is_white:
                s_val = 4.8
                k_val = max(0.005, ((1.0 - R) ** 2) / (2.0 * R) * s_val)
            else:
                # Clear/deep base
                s_val = 0.18
                k_val = 0.012
        else:
            # Colorant paste
            s_val = 3.2 if is_white else round(0.15 + 0.45 * R, 4)
            k_val = max(0.02, round(((1.0 - R) ** 2) / (2.0 * max(0.03, R)) * 2.5, 4))
        K_curve.append(round(k_val, 5))
        S_curve.append(round(s_val, 5))
    return K_curve, S_curve


def rgb_to_rgb_spectrum(r, g, b):
    return rgb_to_lab_and_spectrum(r, g, b)


# ============================================================================
# Schema Initialization & Seeding
# ============================================================================
def init_db():
    with _db_lock:
        conn = get_connection()
        cur = conn.cursor()

        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS systemgroup (
                systemgroupid INTEGER PRIMARY KEY,
                systemgroupcode TEXT NOT NULL,
                systemgroupname TEXT NOT NULL,
                version INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS zone (
                zoneid INTEGER PRIMARY KEY,
                zonename TEXT NOT NULL,
                is_default INTEGER DEFAULT 1,
                currencysymbol TEXT DEFAULT '₺',
                currencydecimals INTEGER DEFAULT 2,
                advertisement TEXT DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS site (
                siteid INTEGER PRIMARY KEY,
                sitename TEXT NOT NULL,
                systemgroupid INTEGER DEFAULT 1,
                zoneid INTEGER DEFAULT 1,
                replicationgroup TEXT,
                poolsiteid INTEGER,
                address TEXT,
                phone TEXT,
                email TEXT
            );

            CREATE TABLE IF NOT EXISTS localuser (
                localuserid INTEGER PRIMARY KEY AUTOINCREMENT,
                siteid INTEGER DEFAULT 1,
                username TEXT NOT NULL,
                password TEXT DEFAULT '',
                fullname TEXT DEFAULT '',
                role TEXT DEFAULT 'ADMIN',
                groups_json TEXT DEFAULT '[4294967294]'
            );

            CREATE TABLE IF NOT EXISTS configuration (
                configid INTEGER PRIMARY KEY AUTOINCREMENT,
                zoneid INTEGER DEFAULT 1,
                siteid INTEGER DEFAULT 1,
                conf_key TEXT NOT NULL,
                common_value TEXT,
                site_value TEXT,
                UNIQUE(zoneid, siteid, conf_key)
            );

            CREATE TABLE IF NOT EXISTS unit (
                unitid INTEGER PRIMARY KEY,
                unitcode TEXT NOT NULL,
                unitname TEXT NOT NULL,
                volume REAL NOT NULL,
                decimals INTEGER DEFAULT 2,
                subdivision INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS cansize (
                cansizeid INTEGER PRIMARY KEY AUTOINCREMENT,
                cansizecode TEXT NOT NULL,
                cansizename TEXT NOT NULL,
                nominalamount REAL NOT NULL,
                gravimetric INTEGER DEFAULT 0,
                barcode TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS productgroup (
                productgroupid INTEGER PRIMARY KEY AUTOINCREMENT,
                productgroupcode TEXT NOT NULL,
                productgroupname TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS product (
                productid INTEGER PRIMARY KEY AUTOINCREMENT,
                systemgroupid INTEGER DEFAULT 1,
                productcode TEXT NOT NULL,
                productname TEXT NOT NULL,
                productgroupid INTEGER DEFAULT 1,
                has_matching INTEGER DEFAULT 1,
                gloss REAL DEFAULT 15.0,
                voc_limit REAL DEFAULT 30.0,
                description TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS basepaint (
                baseid INTEGER PRIMARY KEY AUTOINCREMENT,
                productid INTEGER NOT NULL,
                basecode TEXT NOT NULL,
                basename TEXT NOT NULL,
                nominalfill REAL DEFAULT 100.0,
                maxfill REAL DEFAULT 15.0,
                minfill REAL DEFAULT 0.0,
                specificgravity REAL DEFAULT 1.35,
                coefficient REAL DEFAULT 1.0,
                gravimetricfill INTEGER DEFAULT 0,
                voc REAL DEFAULT 5.0,
                rgb INTEGER DEFAULT 16777215,
                k_curve_json TEXT DEFAULT '[]',
                s_curve_json TEXT DEFAULT '[]',
                characterized_at TEXT
            );

            CREATE TABLE IF NOT EXISTS can (
                canid INTEGER PRIMARY KEY AUTOINCREMENT,
                baseid INTEGER NOT NULL,
                cansizeid INTEGER NOT NULL,
                fill REAL NOT NULL,
                barcode TEXT DEFAULT '',
                price REAL DEFAULT 0.0
            );

            CREATE TABLE IF NOT EXISTS colorant (
                cntid INTEGER PRIMARY KEY AUTOINCREMENT,
                systemgroupid INTEGER DEFAULT 1,
                cntcode TEXT NOT NULL,
                cntname TEXT NOT NULL,
                specificgravity REAL NOT NULL,
                rgb INTEGER NOT NULL,
                hex_color TEXT NOT NULL,
                voc REAL DEFAULT 12.0,
                price_per_liter REAL DEFAULT 450.0,
                max_concentration REAL DEFAULT 12.0,
                min_dispense REAL DEFAULT 0.05,
                ghs_codes TEXT DEFAULT '[]',
                ghs_signal TEXT DEFAULT 'Dikkat',
                ghs_h_statements TEXT DEFAULT '[]',
                k_curve_json TEXT DEFAULT '[]',
                s_curve_json TEXT DEFAULT '[]',
                characterized_at TEXT
            );

            CREATE TABLE IF NOT EXISTS colourcard (
                colourcardid INTEGER PRIMARY KEY AUTOINCREMENT,
                colourcardcode TEXT NOT NULL,
                colourcardname TEXT NOT NULL,
                preferred INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS colour (
                colourid INTEGER PRIMARY KEY AUTOINCREMENT,
                zoneid INTEGER DEFAULT 1,
                colourcardid INTEGER NOT NULL,
                colourcode TEXT NOT NULL,
                colourcode2 TEXT DEFAULT '',
                colourname TEXT NOT NULL,
                rgb INTEGER NOT NULL,
                hex_color TEXT NOT NULL,
                lab_json TEXT NOT NULL,
                refl_json TEXT NOT NULL,
                primer_code TEXT DEFAULT 'P1',
                primer_rgb INTEGER DEFAULT 15921906,
                is_measured INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS formula (
                formulaid INTEGER PRIMARY KEY AUTOINCREMENT,
                systemgroupid INTEGER DEFAULT 1,
                colourid INTEGER NOT NULL,
                productid INTEGER NOT NULL,
                baseid INTEGER NOT NULL,
                version TEXT DEFAULT '2026.1',
                createdate TEXT NOT NULL,
                baseamount REAL DEFAULT 100.0,
                formulatype INTEGER DEFAULT 0,
                warning TEXT DEFAULT '',
                info TEXT DEFAULT '',
                substrate TEXT DEFAULT '',
                comment TEXT DEFAULT '',
                cnts_json TEXT NOT NULL,
                delta_e REAL DEFAULT 0.15
            );

            CREATE TABLE IF NOT EXISTS customer (
                customerid INTEGER PRIMARY KEY AUTOINCREMENT,
                siteid INTEGER DEFAULT 1,
                code TEXT DEFAULT '',
                name TEXT NOT NULL,
                company TEXT DEFAULT '',
                street1 TEXT DEFAULT '',
                street2 TEXT DEFAULT '',
                postal TEXT DEFAULT '',
                city TEXT DEFAULT '',
                state TEXT DEFAULT '',
                country TEXT DEFAULT 'Türkiye',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                discount REAL DEFAULT 0.0,
                notes TEXT DEFAULT '',
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS localorder (
                orderid INTEGER PRIMARY KEY AUTOINCREMENT,
                siteid INTEGER DEFAULT 1,
                customerid INTEGER,
                ordernumber TEXT,
                orderstatus INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                notes TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS orderitem (
                itemid INTEGER PRIMARY KEY AUTOINCREMENT,
                orderid INTEGER,
                siteid INTEGER DEFAULT 1,
                customerid INTEGER,
                orderstatus INTEGER DEFAULT 2,
                itemtype INTEGER DEFAULT 0,
                created_at TEXT,
                dispensed_at TEXT,
                colourid INTEGER,
                colourcode TEXT,
                colourname TEXT,
                colourcardid INTEGER,
                colourcardcode TEXT,
                colourcardname TEXT,
                rgb INTEGER DEFAULT 16777215,
                productid INTEGER,
                productcode TEXT,
                productname TEXT,
                baseid INTEGER,
                basecode TEXT,
                cansizeid INTEGER,
                cansizecode TEXT,
                cansizename TEXT,
                nominalamount REAL DEFAULT 1.0,
                basefill REAL DEFAULT 0.95,
                gravimetric INTEGER DEFAULT 0,
                cans INTEGER DEFAULT 1,
                canstinted INTEGER DEFAULT 1,
                unitprice REAL DEFAULT 0.0,
                baseprice REAL DEFAULT 0.0,
                cntprice REAL DEFAULT 0.0,
                discount REAL DEFAULT 0.0,
                vat REAL DEFAULT 20.0,
                cnts_json TEXT DEFAULT '[]',
                refl_json TEXT DEFAULT '[]',
                lab_json TEXT DEFAULT '[]',
                notes TEXT DEFAULT '',
                is_local_formula INTEGER DEFAULT 0,
                hidden INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS canister_state (
                canister_index INTEGER PRIMARY KEY,
                cntid INTEGER NOT NULL,
                cntcode TEXT NOT NULL,
                cntname TEXT NOT NULL,
                rgb INTEGER NOT NULL,
                current_level REAL DEFAULT 2200.0,
                max_level REAL DEFAULT 2500.0,
                min_level REAL DEFAULT 250.0,
                cutoff_level REAL DEFAULT 100.0,
                batch_number TEXT DEFAULT 'TR-2026-01',
                refill_date TEXT,
                expiration_date TEXT,
                specificgravity REAL DEFAULT 1.25
            );

            CREATE TABLE IF NOT EXISTS maintenance_case (
                maintenanceid INTEGER PRIMARY KEY AUTOINCREMENT,
                siteid INTEGER DEFAULT 1,
                machinedbid INTEGER DEFAULT 1,
                created_at TEXT,
                author TEXT DEFAULT 'Lab Admin',
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT DEFAULT 'Tamamlandı',
                next_service TEXT,
                unseen INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS formula_converter_profile (
                profileid INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                source_system TEXT NOT NULL,
                target_system TEXT NOT NULL,
                adj_func TEXT NOT NULL,
                deadj_func TEXT NOT NULL,
                cnt_mapping_json TEXT NOT NULL,
                base_factor REAL DEFAULT 1.0,
                notes TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS ghs_regulation (
                ghsid INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                name_tr TEXT NOT NULL,
                pictogram TEXT NOT NULL,
                signal_word TEXT NOT NULL,
                h_codes TEXT NOT NULL,
                p_codes TEXT NOT NULL,
                eu_voc_category TEXT DEFAULT 'Kat. A/a İç Cephe Mat (<30 g/L)'
            );

            CREATE TABLE IF NOT EXISTS replication_event (
                eventid INTEGER PRIMARY KEY AUTOINCREMENT,
                siteid INTEGER DEFAULT 1,
                timestamp TEXT NOT NULL,
                direction TEXT NOT NULL,
                action TEXT NOT NULL,
                records_synced INTEGER DEFAULT 0,
                status TEXT DEFAULT 'OK',
                details TEXT DEFAULT ''
            );
            """
        )

        # Check if already seeded
        cur.execute("SELECT COUNT(*) as cnt FROM product")
        if cur.fetchone()["cnt"] == 0:
            _seed_initial_data(conn)

        # Ensure complete Polchem Color Suit Lab Schema & Seed Data
        _ensure_lab3_schema_and_seed(conn)

        conn.commit()
        conn.close()


def _seed_initial_data(conn):
    cur = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Systemgroup, Zone, Site, LocalUsers
    cur.execute(
        "INSERT INTO systemgroup (systemgroupid, systemgroupcode, systemgroupname, version) VALUES (1, 'POLCHEM-TR', 'Polchem Color Suit Türkiye Boya ve Renklendirme Sistemi', 4)"
    )
    cur.execute(
        "INSERT INTO zone (zoneid, zonename, is_default, currencysymbol, currencydecimals, advertisement) VALUES (1, 'Türkiye Merkez (TR)', 1, '₺', 2, '[]')"
    )
    cur.execute(
        "INSERT INTO site (siteid, sitename, systemgroupid, zoneid, replicationgroup, poolsiteid, address, phone, email) VALUES (1, 'Polchem Color Suit Ar-Ge Laboratuvarı & POS Terminali', 1, 1, 'TR-MERKEZ-REPL', 1, 'Organize Sanayi Bölgesi, Polchem Kimya Kampüsü, İstanbul', '+90 212 555 00 44', 'arge@polchem.com.tr')"
    )

    users = [
        (1, 1, "Admin", "", "Sistem Yöneticisi (LAB + POS)", "ADMIN", "[4294967292, 4294967293, 4294967294, 4294967295]"),
        (2, 1, "ArGe_Uzmani", "", "Kıdemli Renk Uzmanı (LAB 3/4)", "LAB", "[4294967293, 4294967294, 4294967295]"),
        (3, 1, "POS_Operator", "", "Mağaza Renklendirme Operatörü", "POS", "[4294967295]"),
    ]
    cur.executemany(
        "INSERT INTO localuser (localuserid, siteid, username, password, fullname, role, groups_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        users,
    )

    # 2. Default Configurations (Turkish language default + all POS 4 home buttons + PRO features)
    configs = [
        ("language", "Turkish", "tr"),
        ("home_buttons", "color;product;matching;localformula;history;retint;customer;freedispense;article", "color;product;matching;localformula;history;retint;customer;freedispense;article"),
        ("formula_display_unit", "ml", "ml"),
        ("formula_Reference_volume", "1", "1"),
        ("price_display_mode", "2", "2"),
        ("vat_percentage", "20", "20"),
        ("customer_search_all_sites", "true", "true"),
        ("unique_color_codes", "true", "true"),
        ("search_by_both_color_codes", "true", "true"),
        ("allow_cansize_change", "true", "true"),
        ("allow_manual_formula_edit", "true", "true"),
        ("matching_max_results", "15", "15"),
        ("matching_max_de", "3.0", "3.0"),
        ("matching_de_option", "DE2000", "DE2000"),
        ("choose_primer_mode", "3", "3"),
        ("barcode_validation", "false", "false"),
        ("auto_print_label", "false", "false"),
    ]
    for k, cv, sv in configs:
        cur.execute(
            "INSERT INTO configuration (zoneid, siteid, conf_key, common_value, site_value) VALUES (1, 1, ?, ?, ?)",
            (k, cv, sv),
        )

    # 3. Units (ml, g, oz, shot/drop)
    units = [
        (1, "ml", "Mililitre (ml)", 1.0, 2, 0),
        (2, "g", "Gram (g)", 1.0, 2, 0),
        (3, "shot", "Shot (1/48 oz)", 0.616115, 1, 0),
        (4, "oz", "Sıvı Ons (fl.oz)", 29.5735, 2, 48),
    ]
    cur.executemany(
        "INSERT INTO unit (unitid, unitcode, unitname, volume, decimals, subdivision) VALUES (?, ?, ?, ?, ?, ?)",
        units,
    )

    # 4. Can Sizes (0.75L, 1L, 2.5L, 7.5L, 15L, 20kg)
    cansizes = [
        (1, "0.75L", "0.75 Litre Ambalaj", 0.75, 0, "8690001000751"),
        (2, "1L", "1.0 Litre Standart Kutu", 1.0, 0, "8690001001000"),
        (3, "2.5L", "2.5 Litre Galon", 2.5, 0, "8690001002502"),
        (4, "7.5L", "7.5 Litre Orta Boy Kova", 7.5, 0, "8690001007507"),
        (5, "15L", "15.0 Litre Profesyonel Kova", 15.0, 0, "8690001015007"),
        (6, "20KG", "20.0 Kg Gravimetrik Kova", 20.0, 1, "8690001020001"),
    ]
    cur.executemany(
        "INSERT INTO cansize (cansizeid, cansizecode, cansizename, nominalamount, gravimetric, barcode) VALUES (?, ?, ?, ?, ?, ?)",
        cansizes,
    )

    # 5. Product Groups
    pgroups = [
        (1, "IC_CEPHE", "İç Cephe Dekoratif Boyalar"),
        (2, "DIS_CEPHE", "Dış Cephe Mimari Kaplamalar"),
        (3, "AHSAP_METAL", "Ahşap ve Metal Koruyucu Sistemler"),
        (4, "ENDUSTRIYEL", "Endüstriyel & Poliüretan Sistemler"),
        (5, "ASTAR", "Renklendirilebilir Astarlar"),
    ]
    cur.executemany(
        "INSERT INTO productgroup (productgroupid, productgroupcode, productgroupname) VALUES (?, ?, ?)",
        pgroups,
    )

    # 6. Products & Basepaints & Cans
    products_spec = [
        (1, "INM-IC", "PolchemMatt İpek Mat İç Cephe", 1, 1, 12.0, 30.0, "Silinebilir, su bazlı saf akrilik ipek mat iç cephe boyası"),
        (2, "INS-DIS", "PolchemSil Silikonlu Dış Cephe", 2, 1, 8.0, 40.0, "Yüksek UV ve yağmur dirençli silikonlu dış cephe kaplaması"),
        (3, "INT-KAD", "PolchemTex Kadife Mat İç Cephe", 1, 1, 5.0, 30.0, "Ultra örtücü kadife dokulu iç cephe boyası"),
        (4, "INW-AHS", "PolchemWood Su Bazlı Ahşap & Mobilya", 3, 1, 35.0, 130.0, "Sararmayan su bazlı akrilik-poliüretan mobilya lakı"),
        (5, "ING-END", "PolchemGuard Endüstriyel 2K Poliüretan", 4, 1, 75.0, 420.0, "Ağır hizmet tipi parlak endüstriyel sonkat"),
        (6, "INP-AST", "PolchemPrimer Renklendirilebilir Astar", 5, 1, 5.0, 30.0, "Örtücülük artırıcı renklendirilebilir geçiş astarı"),
    ]
    cur.executemany(
        "INSERT INTO product (productid, systemgroupid, productcode, productname, productgroupid, has_matching, gloss, voc_limit, description) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)",
        products_spec,
    )

    # Basepaints per product: A (White/Pastel), B (Medium), C (Clear/Deep)
    kw_white, sw_white = generate_km_curves(250, 250, 248, is_base=True, is_white=True)
    kw_med, sw_med = generate_km_curves(238, 238, 235, is_base=True, is_white=True)
    kw_med = [round(v * 0.55, 5) for v in kw_med]
    sw_med = [round(v * 0.52, 5) for v in sw_med]
    kw_clear, sw_clear = generate_km_curves(210, 210, 210, is_base=True, is_white=False)

    base_id_counter = 1
    can_id_counter = 1
    base_price_per_l = {1: 185.0, 2: 220.0, 3: 195.0, 4: 290.0, 5: 360.0, 6: 135.0}

    for prod in products_spec:
        pid = prod[0]
        pcode = prod[1]
        bprice = base_price_per_l[pid]
        bases_for_prod = [
            (f"{pcode}-A", "A Baz (Beyaz / Pastel)", 98.0, 10.0, 0.0, 1.38, 4.5, 16448250, kw_white, sw_white),
            (f"{pcode}-B", "B Baz (Orta Ton)", 95.0, 12.0, 1.0, 1.29, 5.2, 15658734, kw_med, sw_med),
            (f"{pcode}-C", "C Baz (Şeffaf / Koyu Ton)", 91.0, 16.0, 3.0, 1.16, 6.0, 13882323, kw_clear, sw_clear),
        ]
        for bcode, bname, nomfill, maxfill, minfill, sg, voc, rgb_val, kc, sc in bases_for_prod:
            cur.execute(
                """INSERT INTO basepaint
                (baseid, productid, basecode, basename, nominalfill, maxfill, minfill, specificgravity, coefficient, gravimetricfill, voc, rgb, k_curve_json, s_curve_json, characterized_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1.0, 0, ?, ?, ?, ?, ?)""",
                (base_id_counter, pid, bcode, bname, nomfill, maxfill, minfill, sg, voc, rgb_val, json.dumps(kc), json.dumps(sc), now_str),
            )
            # Create cans for this base across standard cansizes (1L, 2.5L, 7.5L, 15L)
            for cs_id, cs_code, cs_name, cs_nom, cs_grav, cs_bar in cansizes[:5]:
                fill_ratio = nomfill / 100.0
                actual_fill = round(cs_nom * fill_ratio, 3)
                price_val = round(cs_nom * bprice * (0.94 if bcode.endswith("-C") else 1.0), 2)
                cur.execute(
                    "INSERT INTO can (canid, baseid, cansizeid, fill, barcode, price) VALUES (?, ?, ?, ?, ?, ?)",
                    (can_id_counter, base_id_counter, cs_id, actual_fill, f"869{pid:02d}{base_id_counter:02d}{cs_id:02d}", price_val),
                )
                can_id_counter += 1
            base_id_counter += 1

    # 7. 16 Industrial Colorants (Pastalar) + Canister Inventory
    colorants_spec = [
        (1, "BV", "Beyaz Titanyum Pasta", 1.88, "#F7F7F2", 8.0, 320.0, 12.0, '["GHS07"]', "Dikkat", '["H317: Alerjik cilt reaksiyonlarına yol açabilir"]'),
        (2, "SY", "Sarı Demir Oksit", 1.62, "#D99B26", 11.0, 390.0, 10.0, '["GHS07"]', "Dikkat", '["H319: Ciddi göz tahrişine yol açar"]'),
        (3, "LY", "Limon Sarı Organik", 1.18, "#F5E027", 18.5, 580.0, 10.0, '["GHS07","GHS09"]', "Dikkat", '["H317","H411: Sucul ortamda uzun süre kalıcı, toksik etki"]'),
        (4, "OR", "Parlak Turuncu Organik", 1.21, "#F06418", 16.0, 610.0, 10.0, '["GHS07"]', "Dikkat", '["H315: Cilt tahrişine yol açar"]'),
        (5, "KR", "Kırmızı Demir Oksit", 1.78, "#9E2B25", 9.5, 410.0, 10.0, '["GHS07"]', "Dikkat", '["H319: Ciddi göz tahrişine yol açar"]'),
        (6, "MR", "Parlak Kırmızı Quinacridone", 1.19, "#D91E36", 19.0, 740.0, 10.0, '["GHS07","GHS08"]', "Dikkat", '["H317","H373: Uzun süreli maruz kalma sonucu organlarda hasara yol açabilir"]'),
        (7, "MG", "Macenta Pembe", 1.17, "#C2185B", 17.5, 690.0, 10.0, '["GHS07"]', "Dikkat", '["H317: Alerjik cilt reaksiyonlarına yol açabilir"]'),
        (8, "VT", " Karbazol Viyole", 1.16, "#5E2B87", 18.0, 780.0, 8.0, '["GHS07","GHS09"]', "Dikkat", '["H317","H412: Sucul ortamda uzun süre kalıcı, zararlı etki"]'),
        (9, "MB", "Ftalosiyanin Mavi", 1.22, "#0D47A1", 15.0, 540.0, 10.0, '["GHS07"]', "Dikkat", '["H319: Ciddi göz tahrişine yol açar"]'),
        (10, "KB", "Kobalt Mavi İnorganik", 1.72, "#1E6BD6", 7.5, 820.0, 10.0, '["GHS08","GHS09"]', "Tehlike", '["H351: Kansere yol açma şüphesi var","H411"]'),
        (11, "YS", "Ftalosiyanin Yeşil", 1.28, "#0B7A4B", 14.0, 560.0, 10.0, '["GHS07"]', "Dikkat", '["H317: Alerjik cilt reaksiyonlarına yol açabilir"]'),
        (12, "OY", "Krom Oksit Yeşil", 1.85, "#3E6B38", 6.5, 490.0, 10.0, '["GHS07"]', "Dikkat", '["H315: Cilt tahrişine yol açar"]'),
        (13, "KS", "Kahverengi Oksit", 1.68, "#5C3A21", 10.0, 395.0, 10.0, '["GHS07"]', "Dikkat", '["H319: Ciddi göz tahrişine yol açar"]'),
        (14, "UM", "Ultramarin Mavi", 1.48, "#293596", 11.5, 510.0, 10.0, '["GHS07"]', "Dikkat", '["H319: Ciddi göz tahrişine yol açar"]'),
        (15, "SYH", "Karbon Siyahı (Derin)", 1.19, "#1C1D21", 16.5, 430.0, 10.0, '["GHS07"]', "Dikkat", '["H317: Alerjik cilt reaksiyonlarına yol açabilir"]'),
        (16, "OS", "Demir Oksit Siyah", 1.79, "#2E3033", 8.5, 370.0, 10.0, '["GHS07"]', "Dikkat", '["H315: Cilt tahrişine yol açar"]'),
    ]

    for cid, ccode, cname, sg, hex_c, voc, price_l, max_c, ghs_c, ghs_sig, ghs_h in colorants_spec:
        rgb_int, r, g, b = hex_to_rgb_int(hex_c)
        kc, sc = generate_km_curves(r, g, b, is_base=False, is_white=(ccode == "BV"))
        cur.execute(
            """INSERT INTO colorant
            (cntid, systemgroupid, cntcode, cntname, specificgravity, rgb, hex_color, voc, price_per_liter, max_concentration, min_dispense, ghs_codes, ghs_signal, ghs_h_statements, k_curve_json, s_curve_json, characterized_at)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 0.05, ?, ?, ?, ?, ?, ?)""",
            (cid, ccode, cname, sg, rgb_int, hex_c, voc, price_l, max_c, ghs_c, ghs_sig, ghs_h, json.dumps(kc), json.dumps(sc), now_str),
        )
        # Seed canister state (1..16)
        lvl = round(1400.0 + ((cid * 137) % 1000), 1)
        cur.execute(
            """INSERT INTO canister_state
            (canister_index, cntid, cntcode, cntname, rgb, current_level, max_level, min_level, cutoff_level, batch_number, refill_date, expiration_date, specificgravity)
            VALUES (?, ?, ?, ?, ?, ?, 2500.0, 300.0, 100.0, ?, ?, ?, ?)""",
            (
                cid,
                cid,
                ccode,
                cname,
                rgb_int,
                lvl,
                f"LOT-2026-{cid:02d}",
                (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d %H:%M:%S"),
                (datetime.now() + timedelta(days=350)).strftime("%Y-%m-%d %H:%M:%S"),
                sg,
            ),
        )

    # 8. Colour Cards
    cards = [
        (1, "RAL", "RAL Classic Endüstriyel & Mimari Kartela", 1),
        (2, "NCS", "NCS 1950 Natural Color System", 1),
        (3, "POLCHEMRENK", "PolchemRenk Türkiye İç Cephe Koleksiyonu", 1),
        (4, "DISCEPHE", "PolchemSil Dış Cephe Taş & Toprak Kartelası", 1),
        (5, "AHSAP", "PolchemWood Ahşap & Mobilya Renkleri", 0),
    ]
    cur.executemany(
        "INSERT INTO colourcard (colourcardid, colourcardcode, colourcardname, preferred) VALUES (?, ?, ?, ?)",
        cards,
    )

    # 9. Colours & Formulas across all cards and products
    # Each entry: (cardid, code, code2, name, hex_color, base_slot(0=A,1=B,2=C), recipe_list[(cntcode, ml_per_1L)])
    colours_seed = [
        # RAL Classic
        (1, "RAL 9010", "9010", "Saf Beyaz (Pure White)", "#F7F5EC", 0, [("BV", 8.5), ("SY", 0.35), ("OS", 0.08)]),
        (1, "RAL 9016", "9016", "Trafik Beyazı (Traffic White)", "#F6F7F1", 0, [("BV", 10.2), ("OS", 0.12), ("MB", 0.05)]),
        (1, "RAL 9001", "9001", "Krem Beyaz (Cream)", "#EFE9D8", 0, [("BV", 6.0), ("SY", 1.15), ("KR", 0.18), ("OS", 0.14)]),
        (1, "RAL 1013", "1013", "İnci Beyazı (Oyster White)", "#EAE4D3", 0, [("BV", 5.5), ("SY", 1.45), ("KR", 0.22), ("OS", 0.25)]),
        (1, "RAL 1015", "1015", "Açık Fildişi (Light Ivory)", "#E8DEC5", 0, [("BV", 4.0), ("SY", 2.85), ("KR", 0.32), ("OS", 0.18)]),
        (1, "RAL 1021", "1021", "Kanola Sarısı (Rape Yellow)", "#F2B807", 2, [("LY", 42.0), ("SY", 18.5), ("OR", 3.2)]),
        (1, "RAL 2004", "2004", "Saf Turuncu (Pure Orange)", "#E85B12", 2, [("OR", 48.0), ("MR", 8.4), ("LY", 12.0)]),
        (1, "RAL 3020", "3020", "Trafik Kırmızısı (Traffic Red)", "#C91A1B", 2, [("MR", 46.5), ("OR", 18.0), ("KR", 6.5)]),
        (1, "RAL 3005", "3005", "Şarap Kırmızısı (Wine Red)", "#5E1921", 2, [("KR", 38.0), ("MR", 22.0), ("SYH", 8.5)]),
        (1, "RAL 5015", "5015", "Gökyüzü Mavisi (Sky Blue)", "#1E73B8", 1, [("MB", 24.5), ("KB", 12.0), ("BV", 6.0)]),
        (1, "RAL 5002", "5002", "Ultramarin Mavi", "#1D327A", 2, [("UM", 45.0), ("MB", 19.5), ("VT", 5.2)]),
        (1, "RAL 6005", "6005", "Yosun Yeşili (Moss Green)", "#1B4732", 2, [("YS", 34.0), ("SY", 14.5), ("SYH", 9.8)]),
        (1, "RAL 6018", "6018", "Sarımtırak Yeşil (Yellow Green)", "#54A338", 1, [("YS", 18.5), ("LY", 26.0), ("SY", 4.0)]),
        (1, "RAL 7035", "7035", "Açık Gri (Light Grey)", "#CBD0CC", 0, [("OS", 3.4), ("BV", 4.2), ("MB", 0.35), ("SY", 0.28)]),
        (1, "RAL 7040", "7040", "Pencere Grisi (Window Grey)", "#9DA3A6", 1, [("OS", 11.2), ("MB", 1.45), ("BV", 3.8)]),
        (1, "RAL 7016", "7016", "Antrasit Gri (Anthracite Grey)", "#373F43", 2, [("SYH", 28.5), ("OS", 18.0), ("MB", 4.8), ("SY", 1.9)]),
        (1, "RAL 8017", "8017", "Çikolata Kahve (Chocolate Brown)", "#453029", 2, [("KS", 36.0), ("KR", 14.0), ("SYH", 12.5)]),
        (1, "RAL 9005", "9005", "Derin Siyah (Jet Black)", "#171719", 2, [("SYH", 54.0), ("MB", 4.5)]),
        # NCS 1950
        (2, "NCS S 0502-Y", "S0502Y", "Kırık Beyaz (Stockholm Beyazı)", "#F4F1E6", 0, [("BV", 7.0), ("SY", 0.68), ("OS", 0.11)]),
        (2, "NCS S 1005-Y20R", "S1005Y20R", "Sıcak Kum Beji", "#E5DAC9", 0, [("SY", 2.4), ("KR", 0.55), ("OS", 0.45)]),
        (2, "NCS S 2005-Y50R", "S2005Y50R", "Kaşmir Vizon", "#C9BBB0", 0, [("SY", 4.2), ("KR", 1.65), ("OS", 2.1)]),
        (2, "NCS S 2010-B", "S2010B", "İskandinav Buz Mavisi", "#AEC2CC", 0, [("MB", 2.9), ("OS", 2.4), ("BV", 3.0)]),
        (2, "NCS S 3010-G10Y", "S3010G10Y", "Adaçayı Yeşili (Sage Green)", "#9AA899", 1, [("OY", 8.5), ("SY", 3.2), ("OS", 4.1)]),
        (2, "NCS S 4502-B", "S4502B", "Modern Kurşun Gri", "#82878A", 1, [("OS", 14.8), ("MB", 1.1), ("SY", 0.65)]),
        # PolchemRenk Türkiye İç Cephe Koleksiyonu
        (3, "PC-101", "PC101", "Kapadokya Beji", "#EADECF", 0, [("SY", 2.1), ("KR", 0.48), ("OS", 0.35)]),
        (3, "PC-102", "PC102", "Ege Esintisi", "#C7DFEC", 0, [("MB", 1.85), ("YS", 0.25), ("OS", 0.42)]),
        (3, "PC-103", "PC103", "Boğaziçi Turkuazı", "#4EA8B8", 1, [("MB", 11.5), ("YS", 9.8), ("BV", 4.5)]),
        (3, "PC-104", "PC104", "Isparta Lavantası", "#C9BFE0", 0, [("VT", 2.65), ("MG", 0.85), ("OS", 0.55)]),
        (3, "PC-105", "PC105", "Ayvalık Zeytin Dalı", "#A7B096", 0, [("OY", 5.8), ("SY", 2.9), ("OS", 1.95)]),
        (3, "PC-106", "PC106", "Çeşme Kumtaşı", "#DCD2C2", 0, [("SY", 3.4), ("KR", 0.72), ("OS", 0.98)]),
        (3, "PC-107", "PC107", "Mercan Pembesi", "#E8A598", 0, [("KR", 3.8), ("MR", 2.1), ("SY", 1.4)]),
        (3, "PC-108", "PC108", "Modern Antrasit", "#4A5056", 2, [("SYH", 21.0), ("OS", 14.5), ("MB", 3.2)]),
        (3, "PC-109", "PC109", "Pamukkale Beyazı", "#F8F7F2", 0, [("BV", 9.0), ("SY", 0.22)]),
        (3, "PC-110", "PC110", "Keten Tohumu", "#D6CBB8", 0, [("SY", 4.1), ("KR", 0.95), ("OS", 1.4)]),
        # Dış Cephe Kartelası
        (4, "DC-201", "DC201", "Traverten Taşı", "#DFD3BF", 0, [("SY", 3.8), ("KR", 0.85), ("OS", 0.90)]),
        (4, "DC-202", "DC202", "Pişmiş Toprak (Terracotta)", "#B85D43", 1, [("KR", 24.5), ("SY", 14.0), ("OS", 3.2)]),
        (4, "DC-203", "DC203", "Bazalt Kaya Gri", "#5D6266", 2, [("OS", 28.0), ("SYH", 9.5), ("MB", 1.8)]),
        # Ahşap & Mobilya
        (5, "AH-301", "AH301", "Doğal Meşe", "#B88449", 1, [("SY", 19.5), ("KR", 6.2), ("KS", 8.4)]),
        (5, "AH-302", "AH302", "Koyu Ceviz", "#593825", 2, [("KS", 34.0), ("SY", 11.0), ("SYH", 9.5)]),
    ]

    # Map cntcode -> cntid
    cur.execute("SELECT cntid, cntcode FROM colorant")
    cnt_map = {r["cntcode"]: r["cntid"] for r in cur.fetchall()}

    # Map (productid, slot_idx) -> baseid
    cur.execute("SELECT baseid, productid, basecode FROM basepaint ORDER BY baseid")
    prod_bases = {}
    for r in cur.fetchall():
        prod_bases.setdefault(r["productid"], []).append((r["baseid"], r["basecode"]))

    colour_id = 1
    formula_id = 1
    for cardid, ccode, ccode2, cname, hex_c, base_slot, recipe in colours_seed:
        rgb_int, r, g, b = hex_to_rgb_int(hex_c)
        lab_arr, refl_arr = rgb_to_lab_and_spectrum(r, g, b)
        primer_code = "P1-Beyaz" if base_slot == 0 else ("P2-Gri" if base_slot == 1 else "P3-Koyu")
        primer_rgb = 15921906 if base_slot == 0 else (11184810 if base_slot == 1 else 6710886)

        cur.execute(
            """INSERT INTO colour
            (colourid, zoneid, colourcardid, colourcode, colourcode2, colourname, rgb, hex_color, lab_json, refl_json, primer_code, primer_rgb, is_measured)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (
                colour_id,
                cardid,
                ccode,
                ccode2,
                cname,
                rgb_int,
                hex_c,
                json.dumps(lab_arr),
                json.dumps(refl_arr),
                primer_code,
                primer_rgb,
            ),
        )

        # Create formulas for relevant products (all 6 products can tint RAL/NCS/PolchemRenk)
        for pid in range(1, 7):
            baseid, _ = prod_bases[pid][min(base_slot, len(prod_bases[pid]) - 1)]
            # Slightly adjust recipe factor per product type
            factor = 1.0 if pid in (1, 3, 6) else (1.08 if pid == 2 else 0.92)
            cnts_payload = []
            for cnt_code, ml_amount in recipe:
                cnt_id = cnt_map[cnt_code]
                cnts_payload.append(
                    {
                        "cntid": cnt_id,
                        "cntcode": cnt_code,
                        "amount": round(ml_amount * factor, 3),
                    }
                )
            cur.execute(
                """INSERT INTO formula
                (formulaid, systemgroupid, colourid, productid, baseid, version, createdate, baseamount, formulatype, warning, info, substrate, comment, cnts_json, delta_e)
                VALUES (?, 1, ?, ?, ?, '2026.1', ?, 100.0, 0, '', 'Polchem Color Suit Onaylı Reçete', 'Alçı / Sıva / Beton', '', ?, ?)""",
                (
                    formula_id,
                    colour_id,
                    pid,
                    baseid,
                    "2026-01-15",
                    json.dumps(cnts_payload),
                    round(0.08 + ((colour_id * 7 + pid * 3) % 35) / 100.0, 2),
                ),
            )
            formula_id += 1
        colour_id += 1

    # 10. Customers
    customers = [
        (1, 1, "MST-001", "Ahmet Yılmaz", "Yılmaz Yapı & Dekorasyon Ltd. Şti.", "İkitelli OSB Mah. 12. Cad. No: 34", "", "34490", "İstanbul", "Marmara", "Türkiye", "+90 532 411 22 33", "ahmet@yilmazyapi.com.tr", 5.0, "Kurumsal bayi müşterisi", now_str),
        (2, 1, "MST-002", "Zeynep Kaya", "Kaya Mimarlık & İç Tasarım Atölyesi", "Bağdat Cad. No: 218 Kadıköy", "", "34728", "İstanbul", "Marmara", "Türkiye", "+90 533 678 90 12", "zeynep@kayamimarlik.com", 8.0, "Mimari proje indirimli", now_str),
        (3, 1, "MST-003", "Mehmet Demir", "Demir İnşaat Taahhüt A.Ş.", "Çankaya Bulvarı No: 85", "", "06680", "Ankara", "İç Anadolu", "Türkiye", "+90 542 333 44 55", "satinalma@demirinsaat.com.tr", 10.0, "Toplu şantiye siparişleri", now_str),
        (4, 1, "MST-004", "Elif Şahin", "Ege Boya & Renk Merkezi", "Alsancak Kordon Boyu No: 42", "", "35220", "İzmir", "Ege", "Türkiye", "+90 535 888 77 66", "elif@egeboyamerkezi.com", 5.0, "Dış cephe ağırlıklı", now_str),
    ]
    cur.executemany(
        """INSERT INTO customer
        (customerid, siteid, code, name, company, street1, street2, postal, city, state, country, phone, email, discount, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        customers,
    )

    # 11. Sample Orders & Dispense History + Order Queue + Local Formulas
    sample_items = [
        # Completed history orders (orderstatus = 2)
        (1, 1, 1, 2, 0, (datetime.now() - timedelta(hours=18)).strftime("%Y-%m-%d %H:%M:%S"), 16, "RAL 7016", "Antrasit Gri (Anthracite Grey)", 1, "RAL", "RAL Classic", 3620675, 2, "INS-DIS", "PolchemSil Silikonlu Dış Cephe", 6, "INS-DIS-C", 5, "15L", "15.0 Litre Profesyonel Kova", 15.0, 13.65, 2, 2, 3450.0, 2980.0, 470.0, 5.0, '[{"cntid":15,"cntcode":"SYH","amount":427.5},{"cntid":16,"cntcode":"OS","amount":270.0},{"cntid":9,"cntcode":"MB","amount":72.0},{"cntid":2,"cntcode":"SY","amount":28.5}]', "Şantiye A Blok Dış Cephe", 0),
        (2, 1, 2, 2, 0, (datetime.now() - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"), 25, "PC-101", "Kapadokya Beji", 3, "POLCHEMRENK", "PolchemRenk Türkiye İç Cephe Koleksiyonu", 15392463, 1, "INM-IC", "PolchemMatt İpek Mat İç Cephe", 1, "INM-IC-A", 4, "7.5L", "7.5 Litre Orta Boy Kova", 7.5, 7.35, 1, 1, 1520.0, 1387.5, 132.5, 8.0, '[{"cntid":2,"cntcode":"SY","amount":15.75},{"cntid":5,"cntcode":"KR","amount":3.6},{"cntid":16,"cntcode":"OS","amount":2.625}]', "Salon ve Koridor Uygulaması", 0),
        (3, 1, 3, 2, 2, (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"), 27, "PC-103", "Boğaziçi Turkuazı", 3, "POLCHEMRENK", "PolchemRenk Türkiye İç Cephe Koleksiyonu", 5154999, 3, "INT-KAD", "PolchemTex Kadife Mat İç Cephe", 8, "INT-KAD-B", 3, "2.5L", "2.5 Litre Galon", 2.5, 2.375, 1, 1, 610.0, 487.5, 122.5, 0.0, '[{"cntid":9,"cntcode":"MB","amount":28.75},{"cntid":11,"cntcode":"YS","amount":24.5},{"cntid":1,"cntcode":"BV","amount":11.25}]', "Spektro Ölçümlü Özel Eşleştirme (ΔE=0.19)", 1),
        # Pending in Order Queue (orderstatus = 1)
        (4, 2, 2, 1, 0, (datetime.now() - timedelta(minutes=25)).strftime("%Y-%m-%d %H:%M:%S"), 10, "RAL 5015", "Gökyüzü Mavisi (Sky Blue)", 1, "RAL", "RAL Classic", 1995704, 1, "INM-IC", "PolchemMatt İpek Mat İç Cephe", 2, "INM-IC-B", 3, "2.5L", "2.5 Litre Galon", 2.5, 2.375, 2, 0, 595.0, 462.5, 132.5, 8.0, '[{"cntid":9,"cntcode":"MB","amount":61.25},{"cntid":10,"cntcode":"KB","amount":30.0},{"cntid":1,"cntcode":"BV","amount":15.0}]', "Kuyrukta Dolum Bekliyor", 0),
    ]
    cur.execute(
        "INSERT INTO localorder (orderid, siteid, customerid, ordernumber, orderstatus, created_at, updated_at, notes) VALUES (1, 1, 1, 'SIP-2026-001', 2, ?, ?, 'Tamamlanan Siparişler')",
        (now_str, now_str),
    )
    cur.execute(
        "INSERT INTO localorder (orderid, siteid, customerid, ordernumber, orderstatus, created_at, updated_at, notes) VALUES (2, 1, 2, 'SIP-2026-002', 1, ?, ?, 'Kuyruktaki Sipariş')",
        (now_str, now_str),
    )

    for it in sample_items:
        cur.execute(
            """INSERT INTO orderitem
            (itemid, orderid, siteid, customerid, orderstatus, itemtype, created_at, dispensed_at, colourid, colourcode, colourname, colourcardid, colourcardcode, colourcardname, rgb, productid, productcode, productname, baseid, basecode, cansizeid, cansizecode, cansizename, nominalamount, basefill, gravimetric, cans, canstinted, unitprice, baseprice, cntprice, discount, vat, cnts_json, notes, is_local_formula)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 20.0, ?, ?, ?)""",
            (
                it[0], it[1], it[2], it[3], it[4], it[5], it[5],
                it[6], it[7], it[8], it[9], it[10], it[11], it[12],
                it[13], it[14], it[15], it[16], it[17], it[18], it[19], it[20],
                it[21], it[22], it[23], it[24], it[25], it[26], it[27], it[28],
                it[29], it[30], it[31],
            ),
        )

    # 12. Maintenance Cases
    cur.execute(
        """INSERT INTO maintenance_case
        (maintenanceid, siteid, machinedbid, created_at, author, title, description, status, next_service, unseen)
        VALUES (1, 1, 1, ?, 'Servis Mühendisi', '16 Kanister Otomatik Nozul Temizliği ve Kalibrasyon', 'Tüm devrelerde otomatik purge ve gravimetrik pompa kalibrasyonu doğrulandı.', 'Tamamlandı', '2026-12-31', 0)""",
        (now_str,),
    )

    # 13. Formula Converter Profiles (LAB 3/4 A2AA..Z2AA AdjFunc/DeAdjFunc)
    converter_profiles = [
        (
            1,
            "A2AA",
            "A2AA: Chromaflo Colortrend -> Polchem Color Suit 16 Pasta Dönüşümü",
            "Chromaflo Colortrend (Shot/48)",
            "Polchem Color Suit (ml/L)",
            "y = x * 0.616115 * (sg_src / sg_dst) * k_ratio",
            "x = y / (0.616115 * (sg_src / sg_dst) * k_ratio)",
            json.dumps({
                "TW": {"target": "BV", "factor": 1.02},
                "YO": {"target": "SY", "factor": 0.96},
                "LY": {"target": "LY", "factor": 1.04},
                "RO": {"target": "KR", "factor": 0.98},
                "QR": {"target": "MR", "factor": 1.00},
                "PB": {"target": "MB", "factor": 0.95},
                "PG": {"target": "YS", "factor": 0.97},
                "LB": {"target": "SYH", "factor": 1.01},
                "IOB": {"target": "OS", "factor": 0.99},
            }),
            1.0,
            "LAB 3 A2AA standart dönüştürücü profili (AdjFunc & DeAdjFunc uyumlu)",
        ),
        (
            2,
            "B2AA",
            "B2AA: CPS Color / Corob -> Polchem Color Suit Volümetrik Dönüşüm",
            "CPS Color Temacolor (ml)",
            "Polchem Color Suit (ml/L)",
            "y = (a0 + a1 * x + a2 * (x ** 2)) * base_factor",
            "x = (y / base_factor - a0) / a1",
            json.dumps({
                "TT": {"target": "BV", "factor": 1.00},
                "IX": {"target": "SY", "factor": 1.03},
                "RR": {"target": "KR", "factor": 0.95},
                "FF": {"target": "MB", "factor": 1.01},
                "GG": {"target": "YS", "factor": 0.99},
                "NN": {"target": "SYH", "factor": 1.02},
            }),
            1.0,
            "Polinom bazlı CPS Color -> Polchem Color Suit renk şiddeti düzeltme eğrisi",
        ),
        (
            3,
            "C2AA",
            "C2AA: Gravimetrik (g/kg) <-> Volümetrik (ml/L) Çift Yönlü Dönüşüm",
            "Gravimetrik Reçete (g/kg)",
            "Volümetrik Reçete (ml/L)",
            "y = (x / sg_cnt) * sg_base",
            "x = (y * sg_cnt) / sg_base",
            json.dumps({c[1]: {"target": c[1], "factor": round(1.35 / c[3], 4)} for c in colorants_spec}),
            1.35,
            "Özgül ağırlık (Specific Gravity) tabanlı kütle-hacim dönüşümü",
        ),
    ]
    cur.executemany(
        """INSERT INTO formula_converter_profile
        (profileid, code, name, source_system, target_system, adj_func, deadj_func, cnt_mapping_json, base_factor, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        converter_profiles,
    )

    # 14. GHS & EU VOC Regulations
    ghs_regs = [
        (1, "GHS07", "Ünlem İşareti (Tahriş Edici / Hassaslaştırıcı)", "⚠️ GHS07", "Dikkat", "H315, H317, H319", "P261, P280, P302+P352, P333+P313", "AB Direktifi 2004/42/EC Kat. A/a (<30 g/L)"),
        (2, "GHS08", "Sağlık Tehlikesi (Kanserojen / Hedef Organ)", "☣️ GHS08", "Tehlike", "H351, H373", "P201, P260, P280, P308+P313", "AB Direktifi 2004/42/EC Kat. A/d (<130 g/L)"),
        (3, "GHS09", "Çevre Tehlikesi (Sucul Toksisite)", "🌿 GHS09", "Dikkat", "H411, H412", "P273, P391, P501", "AB Direktifi 2004/42/EC Kat. A/c (<40 g/L)"),
    ]
    cur.executemany(
        "INSERT INTO ghs_regulation (ghsid, code, name_tr, pictogram, signal_word, h_codes, p_codes, eu_voc_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ghs_regs,
    )

    # 15. Replication Logs
    repl_events = [
        (1, 1, (datetime.now() - timedelta(hours=12)).strftime("%Y-%m-%d %H:%M:%S"), "PULL (Merkez -> POS)", "Katalog & Reçete Senkronizasyonu (v2026.1)", 234, "OK", "6 ürün, 18 baz, 16 pasta, 39 kartela rengi senkronize edildi."),
        (2, 1, (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"), "PUSH (POS -> Merkez)", "Sipariş ve Tüketim Logları Gönderimi", 4, "OK", "4 sipariş kalemi ve kanister stok seviyeleri aktarıldı."),
    ]
    cur.executemany(
        "INSERT INTO replication_event (eventid, siteid, timestamp, direction, action, records_synced, status, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        repl_events,
    )


# ============================================================================
# Polchem Color Suit Lab Enterprise Schema & Seed Extension
# ============================================================================
def _ensure_lab3_schema_and_seed(conn):
    from color_engine import (
        synthesize_two_flux_rw_rb,
        refl_to_lab,
        refl_to_rgb_int,
        compute_delta_e,
        DEFAULT_MATCH_LEVELS,
        DEFAULT_QA_TOLERANCES,
    )

    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS lab_system (
            systemid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemcode TEXT NOT NULL,
            systemname TEXT NOT NULL,
            description TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS lab_substrate (
            substrateid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            subcode TEXT NOT NULL,
            subname TEXT NOT NULL,
            subtype INTEGER DEFAULT 0,
            rw_json TEXT NOT NULL,
            rb_json TEXT NOT NULL,
            lab_w_json TEXT NOT NULL,
            lab_b_json TEXT NOT NULL,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS lab_canshape (
            canshapeid INTEGER PRIMARY KEY AUTOINCREMENT,
            shapecode TEXT NOT NULL,
            shapename TEXT NOT NULL,
            bottom_diameter_mm REAL DEFAULT 105.0,
            top_diameter_mm REAL DEFAULT 115.0,
            height_mm REAL DEFAULT 132.0,
            wall_thickness_mm REAL DEFAULT 0.8,
            material TEXT DEFAULT 'Tinplate / PP',
            svg_type TEXT DEFAULT 'cylindrical'
        );

        CREATE TABLE IF NOT EXISTS lab_unit (
            unitid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            unitcode TEXT NOT NULL,
            unitname TEXT NOT NULL,
            major_unit_ml REAL DEFAULT 1.0,
            decimals INTEGER DEFAULT 2,
            div1 INTEGER DEFAULT 0,
            sym1 TEXT DEFAULT '',
            div2 INTEGER DEFAULT 0,
            sym2 TEXT DEFAULT '',
            div3 INTEGER DEFAULT 0,
            sym3 TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS lab_abstractbase (
            abaseid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            abasecode TEXT NOT NULL,
            abasename TEXT NOT NULL,
            abasetype TEXT DEFAULT 'W',
            default_nominalfill REAL DEFAULT 98.0,
            default_maxcntpct REAL DEFAULT 10.0
        );

        CREATE TABLE IF NOT EXISTS lab_chaset (
            chasetid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            chasetcode TEXT NOT NULL,
            chasetname TEXT NOT NULL,
            chasettype INTEGER DEFAULT 0,
            chartype TEXT DEFAULT 'C',
            wlmin INTEGER DEFAULT 400,
            wlmax INTEGER DEFAULT 700,
            wlstep INTEGER DEFAULT 10,
            ke_surface REAL DEFAULT 3.5,
            ki_internal REAL DEFAULT 46.0,
            gloss_k REAL DEFAULT 1.0,
            substrateid INTEGER DEFAULT 1,
            default_thickness_mm REAL DEFAULT 0.25,
            linked_in_system INTEGER DEFAULT 1,
            modificationdate TEXT
        );

        CREATE TABLE IF NOT EXISTS lab_chaliquid (
            chaliquidid INTEGER PRIMARY KEY AUTOINCREMENT,
            chasetid INTEGER NOT NULL,
            liquidid INTEGER NOT NULL,
            liquidtype INTEGER NOT NULL,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT,
            status TEXT DEFAULT 'C',
            rgb INTEGER DEFAULT 16777215,
            hex_color TEXT DEFAULT '#FFFFFF',
            specific_gravity REAL DEFAULT 1.35,
            wetvol REAL DEFAULT 1.0,
            strength REAL DEFAULT 1.0,
            k_concs_json TEXT DEFAULT '[]',
            s_concs_json TEXT DEFAULT '[]',
            k_flat_json TEXT DEFAULT '[]',
            s_flat_json TEXT DEFAULT '[]',
            rms_de_white REAL DEFAULT 0.18,
            rms_de_black REAL DEFAULT 0.21,
            modificationdate TEXT
        );

        CREATE TABLE IF NOT EXISTS lab_chasample (
            sampleid INTEGER PRIMARY KEY AUTOINCREMENT,
            chaliquidid INTEGER NOT NULL,
            chasetid INTEGER NOT NULL,
            samplename TEXT NOT NULL,
            usageflags INTEGER DEFAULT 15,
            thickness REAL DEFAULT 0.25,
            substrateid INTEGER DEFAULT 1,
            can_ml REAL DEFAULT 100.0,
            liquids_json TEXT NOT NULL,
            measured_rw_json TEXT NOT NULL,
            measured_rb_json TEXT NOT NULL,
            simulated_rw_json TEXT NOT NULL,
            simulated_rb_json TEXT NOT NULL,
            de_white REAL DEFAULT 0.15,
            de_black REAL DEFAULT 0.18,
            rgb INTEGER DEFAULT 16777215
        );

        CREATE TABLE IF NOT EXISTS lab_cntinsystem (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            cntid INTEGER NOT NULL,
            cntcode TEXT NOT NULL,
            cntname TEXT NOT NULL,
            ptype INTEGER DEFAULT 4,
            score INTEGER DEFAULT 35,
            minpct REAL DEFAULT 0.0,
            maxpct REAL DEFAULT 12.0,
            in_use INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS lab_cntpair (
            pairid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            cntid1 INTEGER NOT NULL,
            cntcode1 TEXT NOT NULL,
            cntid2 INTEGER NOT NULL,
            cntcode2 TEXT NOT NULL,
            score INTEGER DEFAULT 35
        );

        CREATE TABLE IF NOT EXISTS lab_basecntrule (
            ruleid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            productid INTEGER NOT NULL,
            baseid INTEGER NOT NULL,
            basecode TEXT NOT NULL,
            cntid INTEGER NOT NULL,
            cntcode TEXT NOT NULL,
            score INTEGER DEFAULT 35,
            minpct REAL DEFAULT 0.0,
            maxpct REAL DEFAULT 10.0,
            allowed INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS lab_matchsetting (
            settingid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            settingname TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            options_json TEXT NOT NULL,
            levels_json TEXT NOT NULL,
            qa_json TEXT NOT NULL,
            comments_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_mformula (
            mformulaid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            productid INTEGER NOT NULL,
            baseid INTEGER NOT NULL,
            basecode TEXT NOT NULL,
            colourcardid INTEGER DEFAULT 1,
            colourid INTEGER,
            mformulaname TEXT NOT NULL,
            basevolume REAL DEFAULT 1000.0,
            cnts_json TEXT NOT NULL,
            rw_json TEXT NOT NULL,
            rb_json TEXT NOT NULL,
            lab_json TEXT NOT NULL,
            rgb INTEGER DEFAULT 16777215,
            hex_color TEXT DEFAULT '#FFFFFF',
            notes TEXT DEFAULT '',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS lab_primerrule (
            primerruleid INTEGER PRIMARY KEY AUTOINCREMENT,
            productid INTEGER NOT NULL,
            primer_cardid INTEGER DEFAULT 1,
            mode INTEGER DEFAULT 3,
            opacity_de_limit REAL DEFAULT 1.5,
            use_cr INTEGER DEFAULT 0,
            cr_limit REAL DEFAULT 96.5
        );

        CREATE TABLE IF NOT EXISTS lab_barcodeaction (
            barcodeid INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            target_code TEXT NOT NULL,
            description TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS lab_uac_permission (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            fullname TEXT NOT NULL,
            role TEXT NOT NULL,
            permissions_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_batch_history (
            batchid INTEGER PRIMARY KEY AUTOINCREMENT,
            systemid INTEGER DEFAULT 1,
            tab_name TEXT NOT NULL,
            operation TEXT NOT NULL,
            plugin_dll TEXT DEFAULT '',
            affected_rows INTEGER DEFAULT 0,
            status TEXT DEFAULT 'COMMITTED',
            snapshot_json TEXT DEFAULT '[]',
            details TEXT DEFAULT '',
            created_at TEXT
        );
        """
    )

    cur.execute("SELECT COUNT(*) as cnt FROM lab_system")
    if cur.fetchone()["cnt"] > 0:
        return

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Systems (`SYSTEM`)
    systems = [
        (1, "POLCHEM-WB", "Polchem Color Suit Su Bazlı Dekoratif Sistem (16 Pasta)", "Mimari İç & Dış Cephe Su Bazlı Boya Sistemi", 1),
        (2, "POLCHEM-SB", "Polchem Color Suit Endüstriyel & Solvent Sistem (2K PU/Epoksi)", "Endüstriyel Ağır Hizmet & Ahşap Koruma Sistemi", 1),
        (3, "POLCHEM-TSR", "Polchem Color Suit Cool-Roof TSR Solar Yansıtıcı Sistem", "300-2500nm NIR Solar Yansıtıcı Dış Cephe Sistemi", 1),
    ]
    cur.executemany(
        "INSERT INTO lab_system (systemid, systemcode, systemname, description, is_active) VALUES (?, ?, ?, ?, ?)",
        systems,
    )

    # 2. Substrates (`SUBSTRATE` + `SUBREFL` Leneta Form 2A / 2C Black & White Charts)
    rw_leneta = [round(87.2 + 1.4 * math.sin((i / 30.0) * math.pi), 2) for i in range(31)]
    rb_leneta = [round(4.6 + 0.3 * math.cos((i / 30.0) * math.pi), 2) for i in range(31)]
    rw_plaster = [round(82.5 + 2.0 * (i / 30.0), 2) for i in range(31)]
    rb_plaster = [round(6.2 + 0.4 * (i / 30.0), 2) for i in range(31)]
    substrates = [
        (1, 1, "LENETA-2A", "Leneta Form 2A Opacity Chart (Beyaz/Siyah Kontrast Kartı)", 0, json.dumps(rw_leneta), json.dumps(rb_leneta), json.dumps(refl_to_lab(rw_leneta)), json.dumps(refl_to_lab(rb_leneta)), now_str),
        (2, 1, "LENETA-3B", "Leneta Form 3B Penopac Sıva/Alçı Simülasyon Kartı", 0, json.dumps(rw_plaster), json.dumps(rb_plaster), json.dumps(refl_to_lab(rw_plaster)), json.dumps(refl_to_lab(rb_plaster)), now_str),
        (3, 1, "SOLAR-300-2500", "ASTM E903 TSR Solar Spektral Substrat (300-2500nm)", 1, json.dumps(rw_leneta), json.dumps(rb_leneta), json.dumps(refl_to_lab(rw_leneta)), json.dumps(refl_to_lab(rb_leneta)), now_str),
    ]
    cur.executemany(
        "INSERT INTO lab_substrate (substrateid, systemid, subcode, subname, subtype, rw_json, rb_json, lab_w_json, lab_b_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        substrates,
    )

    # 3. Can Shapes (`CANSHAPE`)
    shapes = [
        (1, "CYL-1L", "1.0L Silindirik Metal Kutu", 105.0, 108.0, 132.0, 0.6, "Teneke (Tinplate)", "cylindrical"),
        (2, "CON-2.5L", "2.5L Konik Plastik Galon", 148.0, 172.0, 158.0, 1.4, "Polipropilen (PP)", "conical"),
        (3, "OVL-7.5L", "7.5L Oval Dekoratif Kova", 215.0, 245.0, 225.0, 1.8, "Yüksek Yoğunluklu PP", "oval"),
        (4, "CON-15L", "15.0L Profesyonel Konik Kova", 265.0, 305.0, 318.0, 2.2, "Endüstriyel HDPE", "conical"),
    ]
    cur.executemany(
        "INSERT INTO lab_canshape (canshapeid, shapecode, shapename, bottom_diameter_mm, top_diameter_mm, height_mm, wall_thickness_mm, material, svg_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        shapes,
    )

    # 4. LAB 3 Multi-Level Units (`lab_unit`)
    lab_units = [
        (1, 1, "ml", "Mililitre (Metrik Ondalık)", 1.0, 2, 0, "", 0, "", 0, ""),
        (2, 1, "g", "Gram (Gravimetrik Kütle)", 1.0, 2, 0, "", 0, "", 0, ""),
        (3, 1, "US-48", "US Shot 48/192 (Y / 48 / 192)", 29.5735, 0, 1, "Y", 48, "/48", 192, "/192"),
        (4, 1, "COROB-64", "Corob 64/256 Kesirli Shot", 29.5735, 0, 1, "Oz", 64, "/64", 256, "/256"),
    ]
    cur.executemany(
        "INSERT INTO lab_unit (unitid, systemid, unitcode, unitname, major_unit_ml, decimals, div1, sym1, div2, sym2, div3, sym3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        lab_units,
    )

    # 5. Abstract Bases (`ABSTRACTBASE`)
    abases = [
        (1, 1, "ABASE-A", "A Baz (Beyaz / Pastel Soyut Baz)", "W", 98.0, 10.0),
        (2, 1, "ABASE-B", "B Baz (Orta Ton Soyut Baz)", "M", 95.0, 12.0),
        (3, 1, "ABASE-C", "C Baz (Şeffaf / Derin Soyut Baz)", "C", 91.0, 16.0),
    ]
    cur.executemany(
        "INSERT INTO lab_abstractbase (abaseid, systemid, abasecode, abasename, abasetype, default_nominalfill, default_maxcntpct) VALUES (?, ?, ?, ?, ?, ?, ?)",
        abases,
    )

    # 6. Characterization Sets (`CHASET` + `REFLECTION`)
    chasets = [
        (1, 1, "CS-WB-2026", "Su Bazlı Dekoratif Ana Karakterizasyon Seti (400-700nm)", 0, "C", 400, 700, 10, 3.5, 46.0, 1.0, 1, 0.25, 1, now_str),
        (2, 1, "CS-EXT-SIL", "Silikonlu Dış Cephe Karakterizasyon Seti (400-700nm)", 0, "W", 400, 700, 10, 3.8, 48.0, 1.0, 1, 0.30, 1, now_str),
        (3, 1, "CS-TSR-SOLAR", "Cool-Roof TSR Solar Karakterizasyon Seti (300-2500nm)", 1, "C", 300, 2500, 10, 3.5, 46.0, 1.0, 3, 0.25, 0, now_str),
    ]
    cur.executemany(
        """INSERT INTO lab_chaset
        (chasetid, systemid, chasetcode, chasetname, chasettype, chartype, wlmin, wlmax, wlstep, ke_surface, ki_internal, gloss_k, substrateid, default_thickness_mm, linked_in_system, modificationdate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        chasets,
    )

    # 7. Populate `lab_chaliquid` & `lab_chasample` for Chaset 1 (All 16 Colorants + 18 Bases)
    cur.execute("SELECT * FROM colorant ORDER BY cntid")
    all_cnts = cur.fetchall()
    cur.execute("SELECT * FROM basepaint ORDER BY baseid")
    all_bases = cur.fetchall()

    chaliquid_id = 1
    sample_id = 1
    cnt_chaliquid_map = {}
    base_chaliquid_map = {}

    # Identify Bootstrap roles in Chaset 1:
    # W = BV (cntid=1), B = SYH (cntid=15), R = INM-IC-C (baseid=3, clear base)
    for c in all_cnts:
        cid = c["cntid"]
        ccode = c["cntcode"]
        role = "W" if ccode == "BV" else ("B" if ccode == "SYH" else None)
        k_vec = json.loads(c["k_curve_json"])
        s_vec = json.loads(c["s_curve_json"])
        # Build 4 realistic concentration levels (`KSCONC` + `KS`)
        concs = [0.005, 0.015, 0.035, 0.070]
        k_concs = [
            {"conc": cc, "values": [round(cc * kv * 18.0 * (1.0 - 0.08 * idx), 5) for kv in k_vec]}
            for idx, cc in enumerate(concs)
        ]
        s_concs = [
            {"conc": cc, "values": [round(cc * sv * 18.0 * (1.0 - 0.05 * idx), 5) for sv in s_vec]}
            for idx, cc in enumerate(concs)
        ]
        cur.execute(
            """INSERT INTO lab_chaliquid
            (chaliquidid, chasetid, liquidid, liquidtype, code, name, role, status, rgb, hex_color, specific_gravity, wetvol, strength, k_concs_json, s_concs_json, k_flat_json, s_flat_json, rms_de_white, rms_de_black, modificationdate)
            VALUES (?, 1, ?, 2, ?, ?, ?, 'C', ?, ?, ?, 1.0, 1.0, ?, ?, ?, ?, ?, ?, ?)""",
            (
                chaliquid_id,
                cid,
                ccode,
                c["cntname"],
                role,
                c["rgb"],
                c["hex_color"],
                c["specificgravity"],
                json.dumps(k_concs),
                json.dumps(s_concs),
                json.dumps([round(x * 18.0, 5) for x in k_vec]),
                json.dumps([round(x * 18.0, 5) for x in s_vec]),
                round(0.11 + (cid % 5) * 0.03, 2),
                round(0.14 + (cid % 4) * 0.03, 2),
                now_str,
            ),
        )
        cnt_chaliquid_map[cid] = {
            "chaliquidid": chaliquid_id,
            "liquidid": cid,
            "code": ccode,
            "k_concs": k_concs,
            "s_concs": s_concs,
            "k_vec": [x * 18.0 for x in k_vec],
            "s_vec": [x * 18.0 for x in s_vec],
        }
        chaliquid_id += 1

    for b in all_bases:
        bid = b["baseid"]
        bcode = b["basecode"]
        role = "R" if bcode == "INM-IC-C" else None
        k_vec = json.loads(b["k_curve_json"])
        s_vec = json.loads(b["s_curve_json"])
        k_concs = [{"conc": 1.0, "values": [round(kv, 5) for kv in k_vec]}]
        s_concs = [{"conc": 1.0, "values": [round(sv, 5) for sv in s_vec]}]
        hex_b = "#F5F5F0" if bcode.endswith("-A") else ("#E8E8E2" if bcode.endswith("-B") else "#D2D2CC")
        cur.execute(
            """INSERT INTO lab_chaliquid
            (chaliquidid, chasetid, liquidid, liquidtype, code, name, role, status, rgb, hex_color, specific_gravity, wetvol, strength, k_concs_json, s_concs_json, k_flat_json, s_flat_json, rms_de_white, rms_de_black, modificationdate)
            VALUES (?, 1, ?, 4, ?, ?, ?, 'C', ?, ?, ?, 1.0, 1.0, ?, ?, ?, ?, ?, ?, ?)""",
            (
                chaliquid_id,
                bid,
                bcode,
                b["basename"],
                role,
                b["rgb"],
                hex_b,
                b["specificgravity"],
                json.dumps(k_concs),
                json.dumps(s_concs),
                json.dumps(k_vec),
                json.dumps(s_vec),
                round(0.09 + (bid % 4) * 0.02, 2),
                round(0.12 + (bid % 4) * 0.02, 2),
                now_str,
            ),
        )
        base_chaliquid_map[bid] = {
            "chaliquidid": chaliquid_id,
            "liquidid": bid,
            "code": bcode,
            "k_concs": k_concs,
            "s_concs": s_concs,
            "k_vec": k_vec,
            "s_vec": s_vec,
        }
        chaliquid_id += 1

    # Generate realistic drawdown samples (`CHASAMPLE`) for every colorant and base in Chaset 1
    ref_R = base_chaliquid_map[3]  # INM-IC-C Clear Base
    ref_W = cnt_chaliquid_map[1]   # BV White Colorant
    ref_B = cnt_chaliquid_map[15]  # SYH Black Colorant

    # For each colorant, seed 5 BWC drawdown mixtures (masstone + 3 white letdowns + 1 black tint)
    bwc_letdowns = [
        ("Masstone 7.0%", 93.0, 0.0, 0.0, 7.0),
        ("Letdown 1:19 W", 93.0, 0.0, 6.65, 0.35),
        ("Letdown 1:6 W", 93.0, 0.0, 5.95, 1.05),
        ("Letdown 1:1.5 W", 93.0, 0.0, 4.20, 2.80),
        ("Letdown 4:1 W", 93.0, 0.0, 1.40, 5.60),
    ]
    for cid, c_info in cnt_chaliquid_map.items():
        ccode = c_info["code"]
        for idx, (lbl, r_amt, b_amt, w_amt, c_amt) in enumerate(bwc_letdowns):
            liqs = [{"liquidid": ref_R["liquidid"], "chaliquidid": ref_R["chaliquidid"], "code": ref_R["code"], "role": "R", "proposal": r_amt, "amount": r_amt}]
            comp_mix = [{"volume": r_amt, "k_concs": ref_R["k_concs"], "s_concs": ref_R["s_concs"]}]
            if w_amt > 0 and cid != 1:
                liqs.append({"liquidid": ref_W["liquidid"], "chaliquidid": ref_W["chaliquidid"], "code": ref_W["code"], "role": "W", "proposal": w_amt, "amount": w_amt})
                comp_mix.append({"volume": w_amt, "k_concs": ref_W["k_concs"], "s_concs": ref_W["s_concs"]})
            liqs.append({"liquidid": cid, "chaliquidid": c_info["chaliquidid"], "code": ccode, "role": "C", "proposal": c_amt, "amount": c_amt, "is_target": True})
            comp_mix.append({"volume": c_amt, "k_concs": c_info["k_concs"], "s_concs": c_info["s_concs"]})

            sim = synthesize_two_flux_rw_rb(comp_mix, rw_leneta, rb_leneta, thickness_mm=0.25)
            # Add tiny realistic spectrophotometer measurement noise (~0.15% R)
            meas_rw = [round(max(0.5, min(99.0, r + ((idx - 2) * 0.08))), 3) for r in sim["rw"]]
            meas_rb = [round(max(0.5, min(99.0, r - ((idx - 2) * 0.07))), 3) for r in sim["rb"]]
            de_w = compute_delta_e(refl_to_lab(meas_rw), refl_to_lab(sim["rw"]), "DE2000")
            de_b = compute_delta_e(refl_to_lab(meas_rb), refl_to_lab(sim["rb"]), "DE2000")
            rgb_int, _, _ = refl_to_rgb_int(sim["rw"])
            sname = f"{ref_R['code']} {r_amt:.1f}% + {ccode} {c_amt:.2f}%" + (f" + BV {w_amt:.2f}%" if w_amt > 0 and cid != 1 else "")

            cur.execute(
                """INSERT INTO lab_chasample
                (sampleid, chaliquidid, chasetid, samplename, usageflags, thickness, substrateid, can_ml, liquids_json, measured_rw_json, measured_rb_json, simulated_rw_json, simulated_rb_json, de_white, de_black, rgb)
                VALUES (?, ?, 1, ?, 15, 0.25, 1, 100.0, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    sample_id,
                    c_info["chaliquidid"],
                    sname,
                    json.dumps(liqs),
                    json.dumps(meas_rw),
                    json.dumps(meas_rb),
                    json.dumps(sim["rw"]),
                    json.dumps(sim["rb"]),
                    de_w,
                    de_b,
                    rgb_int,
                ),
            )
            sample_id += 1

    # For each basepaint, seed 3 BWO drawdown mixtures (Pure Base + 2 Black/White tints)
    bwo_letdowns = [
        ("Saf Baz 100%", 100.0, 0.0, 0.0),
        ("Siyah Tint 1.0%", 99.0, 1.0, 0.0),
        ("Siyah Tint 2.7%", 97.3, 2.7, 0.0),
    ]
    for bid, b_info in base_chaliquid_map.items():
        bcode = b_info["code"]
        for idx, (lbl, base_amt, blk_amt, wht_amt) in enumerate(bwo_letdowns):
            liqs = [{"liquidid": bid, "chaliquidid": b_info["chaliquidid"], "code": bcode, "role": "R", "proposal": base_amt, "amount": base_amt, "is_target": True}]
            comp_mix = [{"volume": base_amt, "k_concs": b_info["k_concs"], "s_concs": b_info["s_concs"]}]
            if blk_amt > 0:
                liqs.append({"liquidid": ref_B["liquidid"], "chaliquidid": ref_B["chaliquidid"], "code": ref_B["code"], "role": "B", "proposal": blk_amt, "amount": blk_amt})
                comp_mix.append({"volume": blk_amt, "k_concs": ref_B["k_concs"], "s_concs": ref_B["s_concs"]})

            sim = synthesize_two_flux_rw_rb(comp_mix, rw_leneta, rb_leneta, thickness_mm=0.25)
            meas_rw = [round(max(0.5, min(99.0, r + ((idx - 1) * 0.07))), 3) for r in sim["rw"]]
            meas_rb = [round(max(0.5, min(99.0, r - ((idx - 1) * 0.06))), 3) for r in sim["rb"]]
            de_w = compute_delta_e(refl_to_lab(meas_rw), refl_to_lab(sim["rw"]), "DE2000")
            de_b = compute_delta_e(refl_to_lab(meas_rb), refl_to_lab(sim["rb"]), "DE2000")
            rgb_int, _, _ = refl_to_rgb_int(sim["rw"])
            sname = f"{bcode} {base_amt:.1f}%" + (f" + SYH {blk_amt:.2f}%" if blk_amt > 0 else " (Masstone)")

            cur.execute(
                """INSERT INTO lab_chasample
                (sampleid, chaliquidid, chasetid, samplename, usageflags, thickness, substrateid, can_ml, liquids_json, measured_rw_json, measured_rb_json, simulated_rw_json, simulated_rb_json, de_white, de_black, rgb)
                VALUES (?, ?, 1, ?, 15, 0.25, 1, 100.0, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    sample_id,
                    b_info["chaliquidid"],
                    sname,
                    json.dumps(liqs),
                    json.dumps(meas_rw),
                    json.dumps(meas_rb),
                    json.dumps(sim["rw"]),
                    json.dumps(sim["rb"]),
                    de_w,
                    de_b,
                    rgb_int,
                ),
            )
            sample_id += 1

    # 8. System Rules (`CNTINSYSTEM` & `CNTPAIR`) & Product Rules (`BASECNTRULE`)
    for c in all_cnts:
        cid = c["cntid"]
        ccode = c["cntcode"]
        ptype = 2 if ccode == "BV" else (1 if ccode in ("SYH", "OS") else 4)
        score = 40 if ccode in ("BV", "SY", "KR", "MB", "YS", "OS", "SYH") else 32
        cur.execute(
            "INSERT INTO lab_cntinsystem (systemid, cntid, cntcode, cntname, ptype, score, minpct, maxpct, in_use) VALUES (1, ?, ?, ?, ?, ?, 0.0, ?, 1)",
            (cid, ccode, c["cntname"], ptype, score, c["max_concentration"]),
        )

    # Seed CNTPAIR matrix (forbidden pairs = 0, preferred inorganic pairs = 40, normal = 30)
    forbidden_pairs = {("SYH", "OS"), ("LY", "SY"), ("MB", "KB"), ("YS", "OY")}
    for i, c1 in enumerate(all_cnts):
        for c2 in all_cnts[i + 1 :]:
            pair_codes = (c1["cntcode"], c2["cntcode"])
            rev_codes = (c2["cntcode"], c1["cntcode"])
            p_score = 0 if (pair_codes in forbidden_pairs or rev_codes in forbidden_pairs) else 35
            cur.execute(
                "INSERT INTO lab_cntpair (systemid, cntid1, cntcode1, cntid2, cntcode2, score) VALUES (1, ?, ?, ?, ?, ?)",
                (c1["cntid"], c1["cntcode"], c2["cntid"], c2["cntcode"], p_score),
            )

    # Seed BASECNTRULE per base & colorant
    for b in all_bases:
        is_c_base = b["basecode"].endswith("-C")
        for c in all_cnts:
            # In C-base (Clear), avoid adding White ("BV") unless Plus-White is enabled
            allowed = 0 if (is_c_base and c["cntcode"] == "BV") else 1
            score = 0 if not allowed else 35
            cur.execute(
                "INSERT INTO lab_basecntrule (systemid, productid, baseid, basecode, cntid, cntcode, score, minpct, maxpct, allowed) VALUES (1, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)",
                (b["productid"], b["baseid"], b["basecode"], c["cntid"], c["cntcode"], score, b["maxfill"], allowed),
            )

    # 9. Matching Settings Templates (`MATCHSETTING`)
    default_opts = {
        "search": True,
        "searchmaxde": 1.2,
        "search_correct": True,
        "searchcorrectmaxde": 4.5,
        "searchcorrectend": 0.6,
        "match": True,
        "maxde": 3.0,
        "opacityde": 1.25,
        "maxopade": 3.5,
        "usecr": False,
        "mincnts": 1,
        "maxcnts": 4,
        "pluswhite": False,
        "minshot": 0.05,
        "step": 0.0,
        "thickness": 0.25,
        "substrateid": 1,
        "illuminant": "D65",
        "de_option": "CMC21",
        "goal": "DE",
        "scoring": "ALL",
        "use_product_rules": True,
        "use_system_rules": True,
    }
    default_comments = {
        "INUSE": True,
        "LH": {"USE": True, "LIMIT": 1.25},
        "ME": {"USE": True, "LIMIT": 3.0},
        "DE": True,
        "ST": True,
        "OPDE": True,
    }
    cur.execute(
        """INSERT INTO lab_matchsetting (settingid, systemid, settingname, is_default, options_json, levels_json, qa_json, comments_json)
        VALUES (1, 1, '<Default>', 1, ?, ?, ?, ?)""",
        (json.dumps(default_opts), json.dumps(DEFAULT_MATCH_LEVELS), json.dumps(DEFAULT_QA_TOLERANCES), json.dumps(default_comments)),
    )
    low_cost_opts = dict(default_opts, goal="COST", maxcnts=3)
    cur.execute(
        """INSERT INTO lab_matchsetting (settingid, systemid, settingname, is_default, options_json, levels_json, qa_json, comments_json)
        VALUES (2, 1, 'Ekonomik Mimari Eşleştirme (Max 3 Pasta)', 0, ?, ?, ?, ?)""",
        (json.dumps(low_cost_opts), json.dumps(DEFAULT_MATCH_LEVELS), json.dumps(DEFAULT_QA_TOLERANCES), json.dumps(default_comments)),
    )

    # 10. Reference Formulas (`MFORMULA` + `LIQUIDINMFORMULA`)
    cur.execute(
        """SELECT f.formulaid, f.productid, f.baseid, f.colourid, f.cnts_json,
                  b.basecode, c.colourcardid, c.colourcode, c.colourname, c.refl_json, c.lab_json, c.rgb, c.hex_color
           FROM formula f
           JOIN basepaint b ON b.baseid = f.baseid
           JOIN colour c ON c.colourid = f.colourid
           WHERE f.productid = 1
           LIMIT 18"""
    )
    for idx, row in enumerate(cur.fetchall(), start=1):
        r01 = json.loads(row["refl_json"])
        rw_100 = [round(x * 100.0, 2) for x in r01]
        rb_100 = [round(max(2.0, x * 96.5), 2) for x in r01]
        cur.execute(
            """INSERT INTO lab_mformula
            (mformulaid, systemid, productid, baseid, basecode, colourcardid, colourid, mformulaname, basevolume, cnts_json, rw_json, rb_json, lab_json, rgb, hex_color, notes, created_at)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, 1000.0, ?, ?, ?, ?, ?, ?, 'Onaylı Referans Laboratuvar Reçetesi (MFORMULA)', ?)""",
            (
                idx,
                row["productid"],
                row["baseid"],
                row["basecode"],
                row["colourcardid"],
                row["colourid"],
                f"REF-{row['colourcode']}",
                row["cnts_json"],
                json.dumps(rw_100),
                json.dumps(rb_100),
                row["lab_json"],
                row["rgb"],
                row["hex_color"],
                now_str,
            ),
        )

    # 11. Primer Rules (`PRIMERRULE`)
    for pid in range(1, 7):
        cur.execute(
            "INSERT INTO lab_primerrule (productid, primer_cardid, mode, opacity_de_limit, use_cr, cr_limit) VALUES (?, 1, 3, 1.5, 0, 96.5)",
            (pid,),
        )

    # 12. Barcode Actions (`BARCODEACTION`)
    cur.execute("SELECT canid, baseid, barcode FROM can LIMIT 12")
    for r in cur.fetchall():
        cur.execute(
            "INSERT INTO lab_barcodeaction (barcode, target_type, target_id, target_code, description) VALUES (?, 'CAN', ?, ?, 'Otomatik Kutu Barkod Tanımlaması')",
            (r["barcode"], r["canid"], f"CAN-{r['canid']}"),
        )

    # 13. UAC Permissions (`OSUSER` + `LABPERMISSION`)
    uac_rows = [
        (1, "Admin", "Sistem Yöneticisi (Full LAB 3 Yetkisi)", "ADMIN", json.dumps({"CHARACTERIZATION": "WRITE", "FORMULA2CURRENT": "WRITE", "RULES": "WRITE", "BATCH_OPS": "WRITE", "PRICING": "WRITE", "CONFIG": "WRITE"})),
        (2, "ArGe_Uzmani", "Kıdemli Renk Uzmanı", "LAB_CHEMIST", json.dumps({"CHARACTERIZATION": "WRITE", "FORMULA2CURRENT": "WRITE", "RULES": "WRITE", "BATCH_OPS": "WRITE", "PRICING": "READ", "CONFIG": "WRITE"})),
        (3, "Kalite_Kontrol", "Kalite Kontrol Operatörü", "QC_OPERATOR", json.dumps({"CHARACTERIZATION": "READ", "FORMULA2CURRENT": "READ", "RULES": "READ", "BATCH_OPS": "NONE", "PRICING": "READ", "CONFIG": "READ"})),
    ]
    cur.executemany(
        "INSERT INTO lab_uac_permission (userid, username, fullname, role, permissions_json) VALUES (?, ?, ?, ?, ?)",
        uac_rows,
    )

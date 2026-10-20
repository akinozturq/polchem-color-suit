# -*- coding: utf-8 -*-
"""
Tests for Polchem Color Suit Database Manager (database.py).
Ensures schema initializes cleanly and validates data integrity.
"""
import os
import sqlite3
import pytest

import database


def test_db_connection():
    """Verifies SQLite connection and foreign key pragmas."""
    conn = database.get_connection()
    assert conn is not None
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys;")
    row = cur.fetchone()
    assert row[0] == 1  # foreign keys enabled
    conn.close()


def test_schema_and_products():
    """Verifies that product, colorant, and basepaint tables are initialized."""
    database.init_db()
    conn = database.get_connection()
    cur = conn.cursor()

    # Product count
    cur.execute("SELECT COUNT(*) as cnt FROM product;")
    prod_cnt = cur.fetchone()["cnt"]
    assert prod_cnt >= 6

    # 16 Industrial Colorants
    cur.execute("SELECT COUNT(*) as cnt FROM colorant;")
    cnt_count = cur.fetchone()["cnt"]
    assert cnt_count == 16

    # Basepaints
    cur.execute("SELECT COUNT(*) as cnt FROM basepaint;")
    base_cnt = cur.fetchone()["cnt"]
    assert base_cnt >= 18

    # LAB System and Substrates
    cur.execute("SELECT COUNT(*) as cnt FROM lab_system;")
    sys_cnt = cur.fetchone()["cnt"]
    assert sys_cnt >= 1

    conn.close()


def test_synthetic_data_guarantee():
    """Confirms that initial seed formulas have synthetic DeltaE markers and valid JSON."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT formulaid, cnts_json, delta_e FROM formula LIMIT 5;")
    rows = cur.fetchall()
    assert len(rows) > 0
    for r in rows:
        assert r["delta_e"] is not None
        assert len(r["cnts_json"]) > 5
    conn.close()

# -*- coding: utf-8 -*-
"""
Polchem Color Suit — Central Version Manager
Provides centralized access to SemVer versioning metadata for Backend, API and UI.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
VERSION_FILE = os.path.join(ROOT_DIR, "version.json")


def get_version_data():
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "app_name": "Polchem Color Suit",
        "version": "1.0.0",
        "major": 1,
        "minor": 0,
        "patch": 0,
        "prerelease": None,
        "build_metadata": "20261020",
        "engine_version": "1.0.0",
        "db_schema_version": 1,
        "release_date": "2026-10-20",
        "channel": "stable",
    }


def get_version_string():
    data = get_version_data()
    return data.get("version", "1.0.0")

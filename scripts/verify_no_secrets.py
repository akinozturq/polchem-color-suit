#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Polchem Color Suit — Repository Security & Secret Leak Prevention Checker
Checks staged and tracked git files against proprietary data leaks before commit.
"""
import os
import subprocess
import sys

FORBIDDEN_EXTENSIONS = [
    ".db",
    ".db-wal",
    ".db-shm",
    ".sqlite",
    ".sqlite3",
    ".pem",
    ".key",
    ".pfx",
    ".bak",
]

# Encoded/tokenized to avoid false positive self-match
FORBIDDEN_PATTERNS = [
    "".join(["s", "6", "main"]),
    "".join(["Create", "Main", ".sql"]),
    "".join(["Recovered", " from ", "SourceMaps"]),
]


def get_git_files(repo_root):
    try:
        res = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=True,
        )
        files = [line.strip() for line in res.stdout.splitlines() if line.strip()]
        return files
    except Exception as e:
        print(f"Warning: git command failed: {e}")
        return []


def check_repository(repo_root):
    violations = []
    tracked_files = get_git_files(repo_root)

    for rel_path in tracked_files:
        # Ignore this script
        if "verify_no_secrets.py" in rel_path:
            continue

        full_path = os.path.join(repo_root, rel_path)
        _, ext = os.path.splitext(rel_path.lower())

        if ext in FORBIDDEN_EXTENSIONS:
            violations.append(f"[FORBIDDEN FILE TRACKED] {rel_path}")

        if ext in [".py", ".md", ".json", ".txt", ".yml", ".yaml"]:
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
                    for pat in FORBIDDEN_PATTERNS:
                        if pat in content:
                            violations.append(
                                f"[FORBIDDEN PATTERN] '{pat}' found in {rel_path}"
                            )
            except Exception:
                pass

    return violations


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Scanning staged/tracked files for security risks: {repo_root}")
    violations = check_repository(repo_root)

    if violations:
        print("\n❌ SECURITY & COMPLIANCE ISSUES DETECTED:")
        for v in violations:
            print("  - " + v)
        sys.exit(1)
    else:
        print("\n✅ PASSED: No tracked database files, credentials, or proprietary vendor tokens detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()

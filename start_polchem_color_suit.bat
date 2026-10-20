@echo off
chcp 65001 >nul
title Polchem Color Suit — POS & LAB Birleşik Renk Platformu
echo ============================================================================
echo   POLCHEM COLOR SUIT (POS & LAB Saf Python Optik ve Formülasyon Motoru)
echo   Sunucu Başlatılıyor: http://127.0.0.1:9720
echo ============================================================================
cd /d "%~dp0backend"
start "" "http://127.0.0.1:9720"
python app.py
pause

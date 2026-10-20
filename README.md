# Polchem Color Suit — POS & LAB Birleşik Renk Platformu

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/tests-passing-brightgreen.svg)](#test-ve-kalite-doğrulama)

**Polchem Color Suit**, mağaza içi **POS (Point of Sale)** renklendirme terminali ile Ar-Ge laboratuvarı **LAB** (Konfigürasyon, Karakterizasyon, Eşleştirme, Kalite Kontrol ve Donanım Yönetimi) süreçlerini tek çatı altında birleştiren yeni nesil endüstriyel renk platformudur.

Platform, **%100 saf Python tabanlı optik fizik ve karakterizasyon motoru** ile çalışır; harici ticari kapalı kutu DLL veya lisanslı 3. taraf kütüphane bağımlılığı olmaksızın tam bağımsız çalışabilir.

---

## 🔒 Güvenlik, Gizlilik ve Veri İzolasyonu Bildirisi

> [!IMPORTANT]
> **Ticari Veri Güvenliği ve Sentetik Veri Bildirimi:**
> - Depo içerisindeki [`backend/database.py`](backend/database.py) dosyasında tanımlı spektrofotometrik yansıma değerleri, $K/S$ soğurma-saçılma matrisleri, baz/pasta oranları ve kartela kayıtları **tamamen sentetik ve temsili matematiksel modellerle (Gauss-tabanlı simülasyon)** oluşturulmuştur.
> - Aypol / Polchem'e ait gerçek üretim formülleri, ticari müşteri kayıtları, reçete know-how'ı ve fabrika karakterizasyon verileri **kesinlikle bu depoda yer almaz ve git geçmişine commit edilmez**.
> - Üretim veritabanları (`*.db`, `*.sqlite`, `*.db-wal`) [`.gitignore`](.gitignore) kapsamında git takibinden hariç tutulmuştur.

---

## 🚀 Hızlı Başlatma

### Gereksinimler
- Python 3.10 veya üzeri
- Windows 10/11 x64 (veya Linux / macOS sunucu ortamı)
- Modern web tarayıcısı (Chrome, Edge, Firefox)

### 1. Uygulamayı Başlatma
Proje dizininde yer alan [`start_polchem_color_suit.bat`](start_polchem_color_suit.bat) betiğine çift tıklayabilir veya terminalden aşağıdaki komutları çalıştırabilirsiniz:

```powershell
cd backend
python app.py
```

### 2. Kullanıcı Arayüzüne Erişim
Tarayıcınızda aşağıdaki adresi açın:
```
http://127.0.0.1:9720
```

---

## 🏛️ Mimari ve Temel Bileşenler

```
polchem-color-suit/
├── backend/
│   ├── app.py                  # POS, LAB ve Donanım Köprüsü REST/WebSocket Sunucusu
│   ├── color_engine.py         # CIE 1964 10°, Kubelka-Munk, Saunderson & NLLS Optik Motoru
│   ├── database.py             # Hibrit SQLite/MySQL Veri Katmanı ve Şema Yöneticisi
│   ├── hardware_bridge.py      # Dispenser & Spektrofotometre Donanım Köprüsü (Sanal/Gerçek)
│   ├── version_manager.py      # SemVer ve sürüm kontrol modülü
│   └── verify_backend.py       # Hızlı arka uç duman testi
├── frontend/                   # POS & LAB Kullanıcı Arayüzü (React/Vite)
├── tests/                      # Kapsamlı Optik ve Veritabanı Test Süiti
├── .github/workflows/ci.yml    # Otomatik Sürekli Entegrasyon (CI) Pipeline
├── ARCHITECTURE.md             # Detaylı Matematiksel ve Mühendislik Mimarisi
└── LICENSE                     # Ticari ve Telif Hakları Lisansı
```

### Temel Modüller:
* **`backend/color_engine.py`**:
  - **Standart Gözlemci:** CIE 1964 10° (`D65`, `A`, `F11` aydınlatıcıları).
  - **Yüzey Düzeltmesi:** Saunderson çoklu yansıma denklemi ($k_1, k_2$).
  - **Karakterizasyon:** İki-Substratlı Hiperbolik Kubelka-Munk algoritması ($K$ ve $S$ spektral matrisleri).
  - **Formülasyon Optimizasyonu:** Levenberg-Marquardt / NLLS (Doğrusal Olmayan En Küçük Kareler) çoklu baz eşleştirme.
  - **Solar TSR:** 300–2500 nm aralığında ASTM E903 / G173 standartlarında Total Solar Reflectance hesaplaması.
* **`backend/database.py`**:
  - Şirket içi bağımsız veri modeli (Sistem, Ürün Grubu, Baz Boyalar, Pigment Pastaları, Teneke Boyutları, Kartelalar ve Reçeteler).
  - Yerel SQLite sıfır-kurulum çalışma modu ve kurumsal MariaDB/MySQL ölçekleme desteği.
* **`backend/hardware_bridge.py`**:
  - Endüstriyel renklendirme makineleri (16 kanister dispenser kontrol protokolleri) ve spektrofotometre cihaz haberleşmesi (sanal simülatör entegre).

---

## 🧪 Test ve Kalite Doğrulama

Optik formülasyon motoru ve veritabanı bütünlüğünü doğrulamak için `pytest` süitini çalıştırabilirsiniz:

```powershell
pip install pytest
pytest tests/ -v
```

---

## 📄 Lisans ve Fikri Mülkiyet

Bu yazılım ve ilgili tüm fikri mülkiyet hakları **Aypol Boya Kimya Sanayi A.Ş.**'ye aittir. Detaylar için [LICENSE](LICENSE) belgesini inceleyiniz.

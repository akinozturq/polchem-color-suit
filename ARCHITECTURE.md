# Polchem Color Suit — Sistem ve Optik Fizik Mimarisi

Bu belge, **Polchem Color Suit** platformunun mimari prensiplerini, optik renk fiziği modellerini, veri tabanı katmanını ve güvenlik ilkelerini açıklamaktadır.

---

## 1. Genel Sistem Mimarisi

Polchem Color Suit, iki ana çalışma modunu tek bir optik çekirdek üzerinde birleştirir:
1. **POS (Point of Sale):** Mağaza ve satış noktalarındaki operatörler için hızlı formül arama, teneke/ambalaj seçimi, fiyatlandırma, barkod okuma ve dispenser dozajlama kontrolü.
2. **LAB (Ar-Ge ve Renk Karakterizasyonu):** Boya üreticisi Ar-Ge laboratuvarları için baz boya ve pigment pastası karakterizasyonu ($K/S$), spektrofotometre ile renk ölçümü, otomatik eşleştirme (matching), renk düzeltme (correction) ve kalite kontrol ($\Delta E_{00}$).

```
[ Spektrofotometre ]       [ 16-Kanister Dispenser ]
         │                            │
         ▼                            ▼
┌────────────────────────────────────────────────────────┐
│               Hardware Bridge Layer                    │
│   (Serial COM / TCP Socket / Virtual Simulator)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│             Polchem Fast Server (Flask/WSGI)           │
│   - POS REST Endpoints    - LAB REST Endpoints         │
│   - Hardware Control WS   - System / Config APIs       │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
┌────────────▼──────────────┐ ┌────────────▼─────────────┐
│  Polchem Optical Engine   │ │  Enterprise Data Layer   │
│  - CIE 1964 10° XYZ/Lab   │ │  - Dual SQLite / MariaDB │
│  - 2-Flux Kubelka-Munk    │ │  - Systems, Products     │
│  - Saunderson Correction  │ │  - Bases, Colorants      │
│  - NLLS Formulation Match │ │  - Recipes & Canisters   │
│  - ASTM E903 Solar TSR    │ │  - Orders & Inventory    │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 2. Optik Fizik ve Karakterizasyon Motoru (`backend/color_engine.py`)

### 2.1. Standart Gözlemci ve Renk Uzayı (CIE 1964 10°)
Yansıma spektrumundan ($R(\lambda)$, 400–700 nm, 10 nm adımlarla 31 dalga boyu) CIE $XYZ$ tristimulus değerlerinin eldesi:

$$X = 100 \frac{\sum_{\lambda} R(\lambda) S(\lambda) \bar{x}_{10}(\lambda)}{\sum_{\lambda} S(\lambda) \bar{y}_{10}(\lambda)}$$
$$Y = 100 \frac{\sum_{\lambda} R(\lambda) S(\lambda) \bar{y}_{10}(\lambda)}{\sum_{\lambda} S(\lambda) \bar{y}_{10}(\lambda)}$$
$$Z = 100 \frac{\sum_{\lambda} R(\lambda) S(\lambda) \bar{z}_{10}(\lambda)}{\sum_{\lambda} S(\lambda) \bar{y}_{10}(\lambda)}$$

Standart aydınlatıcılar: **D65** (gün ışığı referansı), **A** (akkor lamba - metamerizm kontrolü), **F11** (mağaza flüoresan).

### 2.2. Saunderson Yüzey ve İç Yansıma Düzeltmesi
Hava ile boya filmi arasındaki kırma indisi farkından kaynaklanan Fresnel yansımalarını düzeltmek için Saunderson denklemi uygulanır:

$$R_{\text{theor}} = \frac{R_{\text{meas}} - k_1}{1 - k_1 - k_2 (1 - R_{\text{meas}})}$$

* $k_1 \approx 0.04$ (dış Fresnel yansıma katsayısı)
* $k_2 \approx 0.60$ (iç dağınık yansıma katsayısı)

### 2.3. İki Akılı Hiperbolik Kubelka-Munk Teorisi (2-Flux KM)
Opak olmayan veya iki farklı substrat üzerine (örneğin Leneta siyah ve beyaz zemin) uygulanan filmler için:

$$a = \frac{1}{2} \left( R_{\infty} + \frac{1}{R_{\infty}} \right) = 1 + \frac{K}{S}$$
$$b = \sqrt{a^2 - 1}$$
$$R(h) = \frac{1 - R_g (a - b \coth(b S h))}{a - R_g + b \coth(b S h)}$$

Bu model ile baz boyalar ve pigment pastaları için soğurma katsayısı $K(\lambda)$ ve saçılma katsayısı $S(\lambda)$ birbirinden bağımsız olarak çözülür.

### 2.4. Formülasyon Eşleştirme (NLLS Optimizasyonu)
Hedef renk spektrumu $R_{\text{target}}(\lambda)$ ile formüle edilen karışımın $R_{\text{mix}}(\lambda)$ spektrumu arasındaki hata, sınırlandırılmış doğrusal olmayan en küçük kareler (Bounded NLLS / Levenberg-Marquardt) yöntemiyle minimize edilir:

$$\min_{c_1, \dots, c_n} \sum_{\lambda=400}^{700} w(\lambda) \left( R_{\text{mix}}(\lambda, c_1, \dots, c_n) - R_{\text{target}}(\lambda) \right)^2 + \lambda_{\text{pen}} \cdot \text{Cost}(c)$$

---

## 3. Veri Güvenliği ve İzolasyon İlkeleri

1. **Sentetik Test Verisi İzolasyonu:**
   Geliştirme ve test ortamlarında `backend/database.py` dosyasında yer alan `_seed_initial_data()` fonksiyonu çalışır. Buradaki veriler tamamen matematiksel olarak üretilmiş sanal kartela ve katsayılardır.
2. **Üretim Veritabanı Ayrımı:**
   Müşteri/fabrika ortamlarında gerçek spektrofotometrik ölçümler ve reçeteler dışarıdan yüklenir ve `POLCHEM_DB_PATH` ortam değişkeni ile güvenli yerel depolama dizinine yönlendirilir.
3. **Versiyon Kontrol Güvenliği:**
   `.gitignore` dosyası hiçbir SQLite veya binary veritabanı dosyasının git ağacına girmesine izin vermez.

---

## 4. Donanım Köprüsü ve Simülatör (`backend/hardware_bridge.py`)

* **Dispenser Desteği:** 16 kanisterli endüstriyel renklendirme makineleri için seri port (RS-232 / USB COM) veya TCP/IP protokol desteği.
* **Sanal Simülatör:** Cihaz bağlı olmadığında otomatik olarak devreye giren sanal dispenser ve spektrofotometre motoru ile yazılımın tüm fonksiyonları donanımsız test edilebilir.

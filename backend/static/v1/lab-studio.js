/**
 * Polchem Color Suit — Unified POS & LAB Color Platform
 * & Virtual Hardware Console.
 *
 * Implements the exact LAB hierarchy:
 *   Top-Left System Selector (`comboBox_lab_system` + `System Summary`)
 *   1. Configuration (Colorants, Can sizes & shapes, Substrates, Units, Products/Bases/Cans/Abases, Color management, Zones/Pricing/UAC)
 *   2. Matching & Characterization
 *      - Characterization (7 tabs: Characterization sets, Components in set, Mixture proposer, Colorants, Bases, Chaset linking, All/Test)
 *      - Rules (Product rules, System rules & CNTPAIR matrix)
 *      - Matching (Components, Preferences, Live view / results [Recommended, Cheapest, Most accurate, Least metameric + 50 alts], Statistics)
 *      - Color Correction (4 modes: Formula correction, Batch (cnt), Batch (cnt+base), Manual matching + D65/A/F11 + Δa*b*)
 *      - Reference Formulas (MFORMULA)
 *      - Fill RGB
 *   3. Management & Analysis (Formula management, 8-tab Batch operations with Commit/Rollback, Color difference, TSR, Barcodes, Export/Import, Statistics, Site inventory, Dispense queue)
 *   4. Options (Spectrophotometer, Dispenser, Label Printer, Scale, Language)
 */
(function () {
  // Ensure POS 4 Qt WebChannel / JSON-RPC bridge is always present
  if (!window.qtside) {
    window.qtside = {
      call: async function (method, params) {
        try {
          const res = await fetch('/qtside', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: method,
              params: params || [],
            }),
          });
          const data = await res.json();
          return data.result;
        } catch (err) {
          console.warn('qtside bridge warning:', err);
          return null;
        }
      },
    };
  }

  const state = {
    activeView: 'POS4', // 'POS4' | 'LAB3' | 'HARDWARE'
    systemId: 1,
    mainSection: 'MATCH_CHAR', // 'SYSTEM' | 'CONFIG' | 'MATCH_CHAR' | 'MGMT' | 'OPTIONS'
    subScreen: 'CHAR', // Current sub-module
    charTab: 'COLORANTS', // 'CHASETS' | 'CMP_IN_SET' | 'PROPOSER' | 'COLORANTS' | 'BASES' | 'LINKING' | 'ALL_TEST'
    rulesTab: 'SYSTEM_RULES', // 'PRODUCT_RULES' | 'SYSTEM_RULES'
    matchTab: 'COMPONENTS', // 'COMPONENTS' | 'PREFERENCES' | 'RESULTS' | 'STATISTICS'
    batchTab: 'Formulas',
    lab3: null,
    dashboard: null,
    activeChasetId: 1,
    activeCntChaliquidId: null,
    activeBaseChaliquidId: null,
    charSampleBundle: null,
    charCalcResult: null,
    selectedMatchProductId: 1,
    selectedMatchCanSizeId: 2,
    selectedMatchColourIds: [1, 8, 10, 16],
    matchRunOutput: null,
    activeMatchColourIdx: 0,
    activeMatchCategory: 'Recommended',
    corrState: {
      mode: 2, // 1=Formula correction, 2=Batch (cnt), 3=Batch (cnt+base), 4=Manual matching
      productid: 1,
      baseid: 1,
      colourid: 16,
      can_vol_liters: 1.0,
      de_option: 'CMC21',
      thickness_mm: 0.25,
      formula_cnts: [
        { cntid: 15, cntcode: 'SYH', amount: 28.5 },
        { cntid: 16, cntcode: 'OS', amount: 18.0 },
        { cntid: 9, cntcode: 'MB', amount: 4.8 },
      ],
      result: null,
    },
    colorDiffResult: null,
    tsrResult: null,
  };

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :root {
      --inno-bg: #0f172a;
      --inno-panel: #1e293b;
      --inno-card: #243247;
      --inno-border: #334155;
      --inno-accent: #0284c7;
      --inno-accent-light: #38bdf8;
      --inno-success: #16a34a;
      --inno-warn: #f59e0b;
      --inno-danger: #ef4444;
      --inno-text: #f8fafc;
      --inno-muted: #94a3b8;
    }
    body { padding-top: 44px !important; box-sizing: border-box; }
    #inno-unified-topbar {
      position: fixed; top: 0; left: 0; right: 0; height: 44px;
      background: linear-gradient(90deg, #0b1120 0%, #1e293b 60%, #0b1120 100%);
      border-bottom: 1px solid #334155;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; z-index: 99999;
      font-family: "Segoe UI", Tahoma, sans-serif; color: #f8fafc;
      box-shadow: 0 2px 10px rgba(0,0,0,0.45); user-select: none;
    }
    .inno-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 13.5px; }
    .inno-badge {
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      color: #fff; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
    }
    .inno-mode-tabs { display: flex; gap: 6px; }
    .inno-mode-btn {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: #cbd5e1; padding: 5px 13px; border-radius: 5px; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; gap: 6px;
    }
    .inno-mode-btn:hover { background: rgba(56, 189, 248, 0.15); color: #fff; }
    .inno-mode-btn.active {
      background: linear-gradient(135deg, #0284c7, #2563eb); border-color: #38bdf8; color: #fff;
    }
    .inno-status-Cluster { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #94a3b8; }
    .inno-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 5px; }
    #inno-overlay-workspace {
      position: fixed; top: 44px; left: 0; right: 0; bottom: 0;
      background: #0f172a; color: #f8fafc; z-index: 99990;
      display: none; font-family: "Segoe UI", Tahoma, sans-serif;
    }
    #inno-overlay-workspace.visible { display: flex; flex-direction: column; }
    .lab3-shell { display: flex; flex: 1; height: calc(100vh - 44px); overflow: hidden; }
    .lab3-sidebar {
      width: 255px; min-width: 255px; background: #131c2e; border-right: 1px solid #293548;
      display: flex; flex-direction: column; overflow-y: auto; user-select: none;
    }
    .lab3-sys-box {
      padding: 12px; background: #0b1322; border-bottom: 1px solid #293548;
    }
    .lab3-sys-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px; color: #38bdf8; font-weight: 700; margin-bottom: 5px; }
    .lab3-nav-group { border-bottom: 1px solid #1e293b; }
    .lab3-nav-header {
      padding: 9px 12px; font-size: 12px; font-weight: 700; color: #e2e8f0;
      background: #19253a; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
    }
    .lab3-nav-header.active { background: #0284c7; color: #fff; }
    .lab3-nav-items { padding: 4px 0; background: #0f172a; }
    .lab3-nav-item {
      padding: 6px 14px 6px 24px; font-size: 12px; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      border-left: 3px solid transparent;
    }
    .lab3-nav-item:hover { background: rgba(56,189,248,0.08); color: #f8fafc; }
    .lab3-nav-item.active {
      background: rgba(2,132,199,0.2); color: #38bdf8; border-left-color: #38bdf8; font-weight: 600;
    }
    .lab3-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #0f172a; }
    .lab3-header-bar {
      padding: 10px 18px; background: #162032; border-bottom: 1px solid #293548;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    }
    .lab3-tabstrip { display: flex; gap: 5px; flex-wrap: wrap; }
    .lab3-tab {
      background: #1e293b; border: 1px solid #334155; color: #cbd5e1;
      padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .lab3-tab.active { background: #0284c7; border-color: #38bdf8; color: #fff; }
    .lab3-content { flex: 1; padding: 16px 18px; overflow-y: auto; }
    .inno-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 8px;
      padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .inno-card h3 {
      margin: 0 0 10px 0; font-size: 14px; color: #38bdf8;
      display: flex; align-items: center; justify-content: space-between;
    }
    .inno-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .inno-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
    .inno-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    @media (max-width: 1150px) { .inno-grid-2, .inno-grid-3 { grid-template-columns: 1fr; } }
    .inno-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .inno-table th, .inno-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #334155; }
    .inno-table th { color: #94a3b8; font-weight: 600; background: rgba(0,0,0,0.25); position: sticky; top: 0; }
    .inno-table tr:hover { background: rgba(56,189,248,0.08); }
    .inno-table tr.selected { background: rgba(2,132,199,0.28); }
    .inno-swatch {
      width: 18px; height: 18px; border-radius: 4px; display: inline-block;
      vertical-align: middle; border: 1px solid rgba(255,255,255,0.35); margin-right: 6px;
    }
    .inno-btn {
      background: #0284c7; color: #fff; border: 1px solid #38bdf8;
      padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .inno-btn:hover { background: #0369a1; }
    .inno-btn-secondary { background: #334155; border-color: #475569; color: #f8fafc; }
    .inno-btn-success { background: #16a34a; border-color: #22c55e; }
    .inno-btn-warn { background: #d97706; border-color: #f59e0b; }
    .inno-input, .inno-select {
      background: #0f172a; border: 1px solid #334155; color: #f8fafc;
      padding: 5px 8px; border-radius: 4px; font-size: 12px; width: 100%; box-sizing: border-box;
    }
    .inno-label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 3px; font-weight: 600; }
    .inno-stat-num { font-size: 22px; font-weight: 700; color: #fff; }
    .inno-stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .canister-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .canister-box { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 9px; }
    .canister-bar-bg { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; margin: 6px 0; }
  `;
  document.head.appendChild(styleEl);

  function createTopBar() {
    const bar = document.createElement('div');
    bar.id = 'inno-unified-topbar';
    bar.innerHTML = `
      <div class="inno-brand">
        <span>🎨 POLCHEM COLOR SUIT</span>
        <span class="inno-badge" id="polchem-version-badge">v1.0.0</span>
      </div>
      <div class="inno-mode-tabs">
        <button class="inno-mode-btn active" data-view="POS4">🛒 Polchem POS</button>
        <button class="inno-mode-btn" data-view="LAB3">🔬 Polchem LAB</button>
        <button class="inno-mode-btn" data-view="HARDWARE">🎛️ Donanım Simülatörü</button>
      </div>
      <div class="inno-status-Cluster">
        <span><i class="inno-dot"></i>Motor: Saf Python KM+Saunderson</span>
        <span id="inno-spectro-pill" style="color:#38bdf8;cursor:pointer;">📡 Spektro: Hazır</span>
      </div>
    `;
    document.body.prepend(bar);

    const workspace = document.createElement('div');
    workspace.id = 'inno-overlay-workspace';
    document.body.appendChild(workspace);

    bar.querySelectorAll('.inno-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
    });
    document.getElementById('inno-spectro-pill').addEventListener('click', () => switchView('HARDWARE'));
  }

  async function loadAllData() {
    try {
      const [rLab3, rDash] = await Promise.all([
        fetch(`/api/lab3/bootstrap?systemid=${state.systemId}`),
        fetch('/api/lab/dashboard'),
      ]);
      state.lab3 = await rLab3.json();
      state.dashboard = await rDash.json();
      if (!state.activeCntChaliquidId && state.lab3.chaliquids?.length) {
        const firstCnt = state.lab3.chaliquids.find((c) => c.liquidtype === 2);
        const firstBase = state.lab3.chaliquids.find((c) => c.liquidtype === 4);
        if (firstCnt) state.activeCntChaliquidId = firstCnt.chaliquidid;
        if (firstBase) state.activeBaseChaliquidId = firstBase.chaliquidid;
      }
      const pill = document.getElementById('inno-spectro-pill');
      if (pill && state.dashboard?.hardware?.spectro?.staged_sample) {
        pill.innerHTML = `📡 Numune: <b>${state.dashboard.hardware.spectro.staged_sample.name}</b>`;
      }
      fetch('/api/version')
        .then((r) => r.json())
        .then((v) => {
          const b = document.getElementById('polchem-version-badge');
          if (b && v.version) {
            b.textContent = `v${v.version}`;
            b.title = `Polchem Color Suit v${v.version} | Motor: v${v.engine_version} | DB: v${v.db_schema_version} | Kanal: ${v.channel}`;
          }
        })
        .catch(() => {});
    } catch (e) {
      console.error('Failed to load LAB 3 bootstrap:', e);
    }
  }

  async function switchView(viewName) {
    state.activeView = viewName;
    document.querySelectorAll('#inno-unified-topbar .inno-mode-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-view') === viewName);
    });
    const overlay = document.getElementById('inno-overlay-workspace');
    if (viewName === 'POS4') {
      overlay.classList.remove('visible');
      return;
    }
    overlay.classList.add('visible');
    await loadAllData();
    renderOverlay();
  }

  // SVG Spectral Chart Drawer (supports Measured RW/RB & Simulated RW/RB or K/S curves)
  function renderSpectralSvg(seriesList, height = 185, wlMin = 400, wlMax = 700) {
    const w = 540;
    const h = height;
    const padL = 36, padR = 14, padT = 14, padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    let maxVal = 100.0;
    seriesList.forEach((s) => {
      if (s.maxVal) maxVal = Math.max(maxVal, s.maxVal);
      (s.data || []).forEach((v) => { if (v > maxVal) maxVal = v * 1.05; });
    });
    if (maxVal <= 1.2) maxVal = 1.0;

    const paths = seriesList.map((s) => {
      const pts = (s.data || []).map((v, i, arr) => {
        const x = padL + (i / Math.max(1, arr.length - 1)) * plotW;
        const y = padT + plotH - (Math.min(maxVal, Math.max(0, Number(v || 0))) / maxVal) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      if (!pts.length) return '';
      return `<polyline fill="none" stroke="${s.color || '#38bdf8'}" stroke-width="${s.width || 2.2}" ${s.dashed ? 'stroke-dasharray="5,3"' : ''} points="${pts.join(' ')}" />`;
    }).join('');

    const legend = seriesList.filter((s) => s.label).map((s, idx) => `
      <g transform="translate(${padL + idx * 125}, ${padT + 10})">
        <line x1="0" y1="-4" x2="16" y2="-4" stroke="${s.color}" stroke-width="2.5" ${s.dashed ? 'stroke-dasharray="4,2"' : ''}/>
        <text x="20" y="0" fill="#cbd5e1" font-size="10">${s.label}</text>
      </g>
    `).join('');

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px;background:#0b1120;border:1px solid #334155;border-radius:6px;">
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#334155" />
        <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#334155" />
        <text x="4" y="${padT + 8}" fill="#64748b" font-size="9.5">${maxVal.toFixed(maxVal <= 1.5 ? 1 : 0)}</text>
        <text x="12" y="${padT + plotH}" fill="#64748b" font-size="9.5">0</text>
        <text x="${padL}" y="${h - 6}" fill="#94a3b8" font-size="9.5">${wlMin}nm</text>
        <text x="${padL + plotW / 2 - 15}" y="${h - 6}" fill="#94a3b8" font-size="9.5">${Math.round((wlMin + wlMax) / 2)}nm</text>
        <text x="${padL + plotW - 32}" y="${h - 6}" fill="#94a3b8" font-size="9.5">${wlMax}nm</text>
        ${paths}
        ${legend}
      </svg>
    `;
  }

  // CIE Δa* / Δb* + ΔL* Target Bullseye Graph (`myLibs/DeltaABgraph.py` 1-to-1)
  function renderDeltaABSvg(daBefore, dbBefore, dLBefore, daAfter, dbAfter, dLAfter) {
    const w = 260, h = 200;
    const cx = 105, cy = 100, rMax = 75;
    const scale = rMax / 3.0; // full radius = 3.0 units
    const clamp = (v) => Math.max(-3.0, Math.min(3.0, Number(v || 0)));
    const bx = cx + clamp(daBefore) * scale;
    const by = cy - clamp(dbBefore) * scale;
    const ax = cx + clamp(daAfter) * scale;
    const ay = cy - clamp(dbAfter) * scale;
    const lyBefore = cy - clamp(dLBefore) * scale;
    const lyAfter = cy - clamp(dLAfter) * scale;
    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px;background:#0b1120;border:1px solid #334155;border-radius:6px;">
        <circle cx="${cx}" cy="${cy}" r="${rMax}" fill="none" stroke="#1e293b" />
        <circle cx="${cx}" cy="${cy}" r="${rMax * 0.66}" fill="none" stroke="#334155" stroke-dasharray="3,3" />
        <circle cx="${cx}" cy="${cy}" r="${rMax * 0.33}" fill="none" stroke="#22c55e" stroke-dasharray="2,2" />
        <line x1="${cx - rMax}" y1="${cy}" x2="${cx + rMax}" y2="${cy}" stroke="#475569" />
        <line x1="${cx}" y1="${cy - rMax}" x2="${cx}" y2="${cy + rMax}" stroke="#475569" />
        <text x="${cx + rMax - 22}" y="${cy - 4}" fill="#ef4444" font-size="9.5">+a*</text>
        <text x="${cx - rMax + 2}" y="${cy - 4}" fill="#22c55e" font-size="9.5">-a*</text>
        <text x="${cx + 4}" y="${cy - rMax + 10}" fill="#eab308" font-size="9.5">+b*</text>
        <text x="${cx + 4}" y="${cy + rMax - 4}" fill="#38bdf8" font-size="9.5">-b*</text>
        <circle cx="${bx}" cy="${by}" r="5" fill="#f59e0b" />
        <circle cx="${ax}" cy="${ay}" r="5" fill="#22c55e" stroke="#fff" stroke-width="1" />
        <!-- dL* vertical bar -->
        <rect x="210" y="${cy - rMax}" width="18" height="${rMax * 2}" fill="#1e293b" stroke="#475569" />
        <line x1="208" y1="${cy}" x2="230" y2="${cy}" stroke="#94a3b8" />
        <circle cx="219" cy="${lyBefore}" r="4.5" fill="#f59e0b" />
        <circle cx="219" cy="${lyAfter}" r="4.5" fill="#22c55e" stroke="#fff" stroke-width="1" />
        <text x="208" y="16" fill="#cbd5e1" font-size="9.5">ΔL*</text>
        <text x="12" y="192" fill="#f59e0b" font-size="9.5">● Önce (Batch)</text>
        <text x="95" y="192" fill="#22c55e" font-size="9.5">● Sonra (Düzeltilmiş)</text>
      </svg>
    `;
  }

  const NAV_SECTIONS = [
    {
      id: 'SYSTEM',
      title: '1. Sistem Özeti (System)',
      items: [{ id: 'SYS_SUMMARY', label: 'Sistem Özeti (System Summary)' }],
    },
    {
      id: 'CONFIG',
      title: '2. Konfigürasyon (Configuration)',
      items: [
        { id: 'CFG_COLORANTS', label: 'Pastalar (Colorants)' },
        { id: 'CFG_CANSIZES', label: 'Ambalaj & Şekil (Can sizes)' },
        { id: 'CFG_SUBSTRATES', label: 'Substratlar (Substrates)' },
        { id: 'CFG_UNITS', label: 'Birimler (Units / ShotFormatter)' },
        { id: 'CFG_PRODUCTS', label: 'Ürün, Baz, Kutu & Astar' },
        { id: 'CFG_COLOURS', label: 'Kartela & Renk Yönetimi' },
        { id: 'CFG_ZONES_UAC', label: 'Bölge, Fiyat & Yetkiler (UAC)' },
      ],
    },
    {
      id: 'MATCH_CHAR',
      title: '3. Eşleştirme & Karakterizasyon',
      items: [
        { id: 'CHAR', label: 'Karakterizasyon (Characterization)' },
        { id: 'RULES', label: 'Kurallar (Product & System Rules)' },
        { id: 'MATCHING', label: 'Renk Eşleştirme (Matching)' },
        { id: 'CORRECTION', label: 'Renk Düzeltme (Color Correction)' },
        { id: 'REF_FORMULAS', label: 'Referans Reçeteler (MFORMULA)' },
        { id: 'FILL_RGB', label: 'RGB Doldur (Fill RGB)' },
      ],
    },
    {
      id: 'MGMT',
      title: '4. Yönetim & Analiz (Management)',
      items: [
        { id: 'FRM_MGMT', label: 'Reçete Yönetimi (Formulas)' },
        { id: 'BATCH_OPS', label: 'Toplu İşlemler (Batch Ops 8-Sekme)' },
        { id: 'COLOR_DIFF', label: 'Renk Farkı & Güç (Color Diff)' },
        { id: 'TSR_SOLAR', label: 'TSR Solar Yansıtma (300-2500nm)' },
        { id: 'BARCODES', label: 'Barkod Eylemleri (Barcodes)' },
        { id: 'QUEUE_INV', label: 'Envanter & Dolum Kuyruğu' },
      ],
    },
    {
      id: 'OPTIONS',
      title: '5. Seçenekler (Options)',
      items: [{ id: 'OPT_DEVICES', label: 'Cihazlar, Yazıcı & Dil Ayarları' }],
    },
  ];

  function renderOverlay() {
    const overlay = document.getElementById('inno-overlay-workspace');
    if (state.activeView === 'HARDWARE') {
      renderHardwareConsole(overlay);
      return;
    }
    if (!state.lab3) {
      overlay.innerHTML = `<div style="padding:30px;">Yükleniyor...</div>`;
      return;
    }

    const sysOptions = (state.lab3.systems || []).map((s) =>
      `<option value="${s.systemid}" ${s.systemid === state.systemId ? 'selected' : ''}>${s.systemcode} — ${s.systemname}</option>`
    ).join('');

    const navHtml = NAV_SECTIONS.map((sec) => {
      const isOpen = state.mainSection === sec.id;
      return `
        <div class="lab3-nav-group">
          <div class="lab3-nav-header ${isOpen ? 'active' : ''}" data-sec="${sec.id}">
            <span>${sec.title}</span>
            <span>${isOpen ? '▾' : '▸'}</span>
          </div>
          <div class="lab3-nav-items" style="display:${isOpen ? 'block' : 'none'};">
            ${sec.items.map((it) => `
              <div class="lab3-nav-item ${state.subScreen === it.id ? 'active' : ''}" data-sec="${sec.id}" data-sub="${it.id}">
                <span>${it.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div class="lab3-shell">
        <aside class="lab3-sidebar">
          <div class="lab3-sys-box">
            <div class="lab3-sys-label">TINTING SYSTEM (comboBox_lab_system)</div>
            <select id="lab3-system-select" class="inno-select">${sysOptions}</select>
          </div>
          ${navHtml}
        </aside>
        <main class="lab3-main" id="lab3-main-pane"></main>
      </div>
    `;

    document.getElementById('lab3-system-select').addEventListener('change', async (e) => {
      state.systemId = Number(e.target.value);
      await loadAllData();
      renderOverlay();
    });

    overlay.querySelectorAll('.lab3-nav-header').forEach((hdr) => {
      hdr.addEventListener('click', () => {
        const secId = hdr.getAttribute('data-sec');
        state.mainSection = secId;
        const secObj = NAV_SECTIONS.find((s) => s.id === secId);
        if (secObj && secObj.items.length) state.subScreen = secObj.items[0].id;
        renderOverlay();
      });
    });

    overlay.querySelectorAll('.lab3-nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        state.mainSection = item.getAttribute('data-sec');
        state.subScreen = item.getAttribute('data-sub');
        renderOverlay();
      });
    });

    const mainPane = document.getElementById('lab3-main-pane');
    renderSubScreen(mainPane);
  }

  function renderSubScreen(pane) {
    const sub = state.subScreen;
    if (sub === 'SYS_SUMMARY') return renderSystemSummary(pane);
    if (sub.startsWith('CFG_')) return renderConfigScreen(pane, sub);
    if (sub === 'CHAR') return renderCharacterizationScreen(pane);
    if (sub === 'RULES') return renderRulesScreen(pane);
    if (sub === 'MATCHING') return renderMatchingScreen(pane);
    if (sub === 'CORRECTION') return renderColorCorrectionScreen(pane);
    if (sub === 'REF_FORMULAS') return renderReferenceFormulasScreen(pane);
    if (sub === 'FILL_RGB') return renderFillRgbScreen(pane);
    if (sub === 'FRM_MGMT') return renderFormulaManagementScreen(pane);
    if (sub === 'BATCH_OPS') return renderBatchOperationsScreen(pane);
    if (sub === 'COLOR_DIFF') return renderColorDiffScreen(pane);
    if (sub === 'TSR_SOLAR') return renderTsrSolarScreen(pane);
    if (sub === 'BARCODES') return renderBarcodesScreen(pane);
    if (sub === 'QUEUE_INV') return renderQueueInventoryScreen(pane);
    if (sub === 'OPT_DEVICES') return renderOptionsScreen(pane);
    return renderSystemSummary(pane);
  }

  // ==========================================================================
  // 1. System Summary (`SystemSummary.py`)
  // ==========================================================================
  function renderSystemSummary(pane) {
    const s = state.lab3.system_summary;
    const sys = (state.lab3.systems || []).find((x) => x.systemid === state.systemId) || {};
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <div>
          <b style="font-size:15px;color:#38bdf8;">1. Sistem Özeti (System Summary) — ${sys.systemcode || ''}</b>
          <div style="font-size:11.5px;color:#94a3b8;">${sys.description || ''}</div>
        </div>
        <div class="lab3-tabstrip">
          <button class="inno-btn" id="btn-goto-char">🔬 Karakterizasyona Git</button>
          <button class="inno-btn inno-btn-success" id="btn-goto-match">🎯 Renk Eşleştirmeye Git</button>
        </div>
      </div>
      <div class="lab3-content">
        <div class="inno-grid-4">
          <div class="inno-card"><div class="inno-stat-num">${s.colorants_count}</div><div class="inno-stat-label">Sistem Pastaları (LIQUID type=2) • ${s.characterized_cnts} Karakterize ('C')</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.products_count} / ${s.bases_count}</div><div class="inno-stat-label">Ürünler / Baz Boyalar • ${s.characterized_bases} Karakterize ('C')</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.chasets_count}</div><div class="inno-stat-label">Karakterizasyon Setleri (CHASET)</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.colours_count} / ${s.formulas_count}</div><div class="inno-stat-label">Kartela Renkleri / Aktif Reçeteler</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.mformulas_count}</div><div class="inno-stat-label">Referans Reçeteler (MFORMULA)</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.substrates_count}</div><div class="inno-stat-label">Leneta & TSR Substratlar (SUBSTRATE)</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.units_count}</div><div class="inno-stat-label">Çok Kademeli Birimler (ShotFormatter)</div></div>
          <div class="inno-card"><div class="inno-stat-num">${s.cansizes_count} / ${s.canshapes_count}</div><div class="inno-stat-label">Ambalaj Boyları / 3B Kutu Şekilleri</div></div>
        </div>
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🧪 Sistemdeki Pastalar & Karakterizasyon Durumu (CHALIQUID)</h3>
            <div style="max-height:310px;overflow-y:auto;">
              <table class="inno-table">
                <thead><tr><th>Kod</th><th>Pasta Adı</th><th>Özgül Ağ.</th><th>Rol</th><th>Durum</th><th>RMS dE (W/B)</th></tr></thead>
                <tbody>
                  ${state.lab3.chaliquids.filter((c) => c.liquidtype === 2).map((c) => `
                    <tr>
                      <td><span class="inno-swatch" style="background:${c.hex_color}"></span><b>${c.code}</b></td>
                      <td>${c.name}</td>
                      <td>${c.specific_gravity}</td>
                      <td>${c.role ? `<span class="inno-badge">${c.role}</span>` : '-'}</td>
                      <td style="color:#22c55e;font-weight:700;">${c.status}</td>
                      <td>${c.rms_de_white} / ${c.rms_de_black}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="inno-card">
            <h3>🪣 Ürünler, Baz Boyalar & Dolum Oranları (PRODUCT / BASE)</h3>
            <div style="max-height:310px;overflow-y:auto;">
              <table class="inno-table">
                <thead><tr><th>Baz Kodu</th><th>Baz Adı</th><th>Nom. Dolum %</th><th>Max Pasta %</th><th>Özgül Ağ.</th><th>VOC (g/L)</th></tr></thead>
                <tbody>
                  ${state.lab3.bases.map((b) => `
                    <tr>
                      <td><b>${b.basecode}</b></td>
                      <td>${b.basename}</td>
                      <td>%${b.nominalfill}</td>
                      <td>%${b.maxfill}</td>
                      <td>${b.specificgravity}</td>
                      <td>${b.voc}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('btn-goto-char').addEventListener('click', () => {
      state.mainSection = 'MATCH_CHAR'; state.subScreen = 'CHAR'; renderOverlay();
    });
    document.getElementById('btn-goto-match').addEventListener('click', () => {
      state.mainSection = 'MATCH_CHAR'; state.subScreen = 'MATCHING'; renderOverlay();
    });
  }

  // ==========================================================================
  // 2. Configuration Screens (`Config/...`)
  // ==========================================================================
  function renderConfigScreen(pane, sub) {
    let bodyHtml = '';
    if (sub === 'CFG_COLORANTS') {
      bodyHtml = `
        <div class="inno-card">
          <h3>🎨 Sistem Pastaları (Config / Colorants — LIQUID type=2)</h3>
          <table class="inno-table">
            <thead><tr><th>ID</th><th>Kod</th><th>Pasta Adı</th><th>Özgül Ağırlık (g/cm³)</th><th>Max Kons. %</th><th>Min Doz (ml)</th><th>VOC (g/L)</th><th>Fiyat (₺/L)</th><th>Spektral K(λ)/S(λ)</th></tr></thead>
            <tbody>
              ${state.lab3.colorants.map((c) => `
                <tr>
                  <td>#${c.cntid}</td>
                  <td><span class="inno-swatch" style="background:${c.hex_color}"></span><b>${c.cntcode}</b></td>
                  <td>${c.cntname}</td>
                  <td>${c.specificgravity}</td>
                  <td>%${c.max_concentration}</td>
                  <td>${c.min_dispense}</td>
                  <td>${c.voc}</td>
                  <td>₺${c.price_per_liter}</td>
                  <td>31 Nokta (400-700nm)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (sub === 'CFG_CANSIZES') {
      bodyHtml = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🥫 Ambalaj Boyutları (CANSIZE)</h3>
            <table class="inno-table">
              <thead><tr><th>ID</th><th>Kod</th><th>Ambalaj Adı</th><th>Nominal Hacim</th><th>Tip</th><th>Barkod</th></tr></thead>
              <tbody>
                ${state.lab3.cansizes.map((cs) => `
                  <tr><td>#${cs.cansizeid}</td><td><b>${cs.cansizecode}</b></td><td>${cs.cansizename}</td><td>${cs.nominalamount} ${cs.gravimetric ? 'kg' : 'L'}</td><td>${cs.gravimetric ? 'Gravimetrik' : 'Volümetrik'}</td><td><code>${cs.barcode}</code></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="inno-card">
            <h3>📐 3B Kutu Geometrisi & Şekilleri (CANSHAPE)</h3>
            <table class="inno-table">
              <thead><tr><th>Şekil Kodu</th><th>Ad</th><th>Alt Çap (mm)</th><th>Üst Çap (mm)</th><th>Yükseklik (mm)</th><th>Malzeme</th></tr></thead>
              <tbody>
                ${state.lab3.canshapes.map((sh) => `
                  <tr><td><b>${sh.shapecode}</b></td><td>${sh.shapename}</td><td>${sh.bottom_diameter_mm}</td><td>${sh.top_diameter_mm}</td><td>${sh.height_mm}</td><td>${sh.material}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (sub === 'CFG_SUBSTRATES') {
      bodyHtml = `
        <div class="inno-grid-2">
          ${state.lab3.substrates.map((subItem) => `
            <div class="inno-card">
              <h3>📄 ${subItem.subcode} — ${subItem.subname}</h3>
              <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">
                Tip: <b>${subItem.subtype === 1 ? 'TSR Solar (300-2500nm)' : 'Normal Görünür Bölge (400-700nm)'}</b> •
                Beyaz Alan L*=${subItem.lab_w?.[0]} • Siyah Alan L*=${subItem.lab_b?.[0]}
              </div>
              ${renderSpectralSvg([
                { data: subItem.rw, color: '#f8fafc', label: 'Beyaz Substrat (RW %)' },
                { data: subItem.rb, color: '#38bdf8', label: 'Siyah Substrat (RB %)' },
              ], 155)}
            </div>
          `).join('')}
        </div>
      `;
    } else if (sub === 'CFG_UNITS') {
      bodyHtml = `
        <div class="inno-card">
          <h3>⚖️ Çok Kademeli Dispenser Birimleri (UNIT & ShotFormatter)</h3>
          <p style="font-size:12px;color:#94a3b8;margin-top:0;">
            LAB 3 <code>ShotFormatter</code> hem ondalık metrik birimleri (<code>ml</code>, <code>g</code>) hem de 3 seviyeli kesirli dozajlama birimlerini (<code>DIV1/SYM1</code>, <code>DIV2/SYM2</code>, <code>DIV3/SYM3</code> — örn. <code>Y / 48 / 192</code>) destekler.
          </p>
          <table class="inno-table">
            <thead><tr><th>Birim Kodu</th><th>Birim Adı</th><th>Ana Birim (ml)</th><th>Ondalık</th><th>Seviye 1 (DIV1/SYM1)</th><th>Seviye 2 (DIV2/SYM2)</th><th>Seviye 3 (DIV3/SYM3)</th></tr></thead>
            <tbody>
              ${state.lab3.lab_units.map((u) => `
                <tr>
                  <td><b>${u.unitcode}</b></td>
                  <td>${u.unitname}</td>
                  <td>${u.major_unit_ml} ml</td>
                  <td>${u.decimals}</td>
                  <td>${u.div1 ? `${u.div1} (${u.sym1})` : '-'}</td>
                  <td>${u.div2 ? `${u.div2} (${u.sym2})` : '-'}</td>
                  <td>${u.div3 ? `${u.div3} (${u.sym3})` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (sub === 'CFG_PRODUCTS') {
      bodyHtml = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🏷️ Ürünler & Astar Kuralları (PRODUCT & PRIMERRULE)</h3>
            <table class="inno-table">
              <thead><tr><th>Kod</th><th>Ürün Adı</th><th>Parlaklık (Gloss)</th><th>AB VOC Limiti</th><th>Astar Modu</th></tr></thead>
              <tbody>
                ${state.lab3.products.map((p) => {
                  const pr = state.lab3.primer_rules.find((r) => r.productid === p.productid) || {};
                  return `<tr><td><b>${p.productcode}</b></td><td>${p.productname}</td><td>${p.gloss} GU</td><td>${p.voc_limit} g/L</td><td>Opa dE &gt; ${pr.opacity_de_limit || 1.5} ise Astar Öner</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="inno-card">
            <h3>🧬 Soyut Bazlar (ABSTRACTBASE) & Kutu Dolumları (CAN)</h3>
            <table class="inno-table">
              <thead><tr><th>Soyut Baz</th><th>Ad</th><th>Tip</th><th>Varsayılan Dolum %</th><th>Max Pasta %</th></tr></thead>
              <tbody>
                ${state.lab3.abstractbases.map((ab) => `
                  <tr><td><b>${ab.abasecode}</b></td><td>${ab.abasename}</td><td>${ab.abasetype}</td><td>%${ab.default_nominalfill}</td><td>%${ab.default_maxcntpct}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (sub === 'CFG_COLOURS') {
      bodyHtml = `
        <div class="inno-card">
          <h3>🎨 Kartelalar & Ölçülmüş Spektral Renkler (COLOURCARD & COLOUR)</h3>
          <div style="max-height:430px;overflow-y:auto;">
            <table class="inno-table">
              <thead><tr><th>Kartela</th><th>Renk Kodu</th><th>Renk Adı</th><th>CIE L*a*b* (D65)</th><th>HEX</th><th>Önerilen Astar</th></tr></thead>
              <tbody>
                ${state.lab3.colours.map((c) => {
                  const card = state.lab3.colourcards.find((k) => k.colourcardid === c.colourcardid);
                  return `
                    <tr>
                      <td>${card ? card.colourcardcode : c.colourcardid}</td>
                      <td><span class="inno-swatch" style="background:${c.hex_color}"></span><b>${c.colourcode}</b></td>
                      <td>${c.colourname}</td>
                      <td style="font-family:monospace;">L*=${c.lab[0]} a*=${c.lab[1]} b*=${c.lab[2]}</td>
                      <td><code>${c.hex_color}</code></td>
                      <td>${c.primer_code}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🌍 Bölgeler & Fiyatlandırma (ZONE & PRICE_CNT / PRICE_CAN)</h3>
            <table class="inno-table">
              <thead><tr><th>Bölge ID</th><th>Bölge Adı</th><th>Para Birimi</th><th>Ondalık</th></tr></thead>
              <tbody>
                ${state.lab3.zones.map((z) => `
                  <tr><td>#${z.zoneid}</td><td><b>${z.zonename}</b></td><td>${z.currencysymbol}</td><td>${z.currencydecimals}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="inno-card">
            <h3>🔐 Kullanıcı Erişim Kontrolü (UAC — OSUSER & LABPERMISSION)</h3>
            <table class="inno-table">
              <thead><tr><th>Kullanıcı</th><th>Ad Soyad</th><th>Rol</th><th>Karakterizasyon</th><th>Reçete Onay</th><th>Kurallar</th><th>Toplu İşlem</th></tr></thead>
              <tbody>
                ${state.lab3.uac_permissions.map((u) => `
                  <tr>
                    <td><b>${u.username}</b></td>
                    <td>${u.fullname}</td>
                    <td><span class="inno-badge">${u.role}</span></td>
                    <td>${u.permissions.CHARACTERIZATION}</td>
                    <td>${u.permissions.FORMULA2CURRENT}</td>
                    <td>${u.permissions.RULES}</td>
                    <td>${u.permissions.BATCH_OPS}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>2. Konfigürasyon (Configuration) — ${sub}</b>
        <div class="lab3-tabstrip">
          ${NAV_SECTIONS[1].items.map((it) => `
            <button class="lab3-tab ${state.subScreen === it.id ? 'active' : ''}" data-cfg="${it.id}">${it.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="lab3-content">${bodyHtml}</div>
    `;
    pane.querySelectorAll('[data-cfg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.subScreen = btn.getAttribute('data-cfg');
        renderSubScreen(pane);
      });
    });
  }

  // ==========================================================================
  // 3.1 Characterization Module (7 Sub-Tabs matching `characterisation_ui.py`)
  // ==========================================================================
  async function renderCharacterizationScreen(pane) {
    const tabs = [
      { id: 'CHASETS', label: '1. Karakterizasyon Setleri (Chasets)' },
      { id: 'CMP_IN_SET', label: '2. Setteki Bileşenler & Roller (R/W/B)' },
      { id: 'PROPOSER', label: '3. Karışım Önerici (Mixture Proposer)' },
      { id: 'COLORANTS', label: '4. Pastalar (Colorants K/S & RW/RB)' },
      { id: 'BASES', label: '5. Bazlar (Bases K/S & RW/RB)' },
      { id: 'LINKING', label: '6. Set Bağlama (Chaset Linking)' },
      { id: 'ALL_TEST', label: '7. Tümünü Hesapla & Gamut Test (All/Test)' },
    ];

    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.1 Karakterizasyon (Kubelka-Munk + Saunderson İki-Akılı NLLS Karakterizasyon Motoru)</b>
        <div class="lab3-tabstrip">
          ${tabs.map((t) => `<button class="lab3-tab ${state.charTab === t.id ? 'active' : ''}" data-ctab="${t.id}">${t.label}</button>`).join('')}
        </div>
      </div>
      <div class="lab3-content" id="char-tab-body">Yükleniyor...</div>
    `;

    pane.querySelectorAll('[data-ctab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.charTab = btn.getAttribute('data-ctab');
        renderCharacterizationScreen(pane);
      });
    });

    const body = document.getElementById('char-tab-body');
    const ctab = state.charTab;

    if (ctab === 'CHASETS') {
      body.innerHTML = `
        <div class="inno-card">
          <h3>🗂️ Karakterizasyon Setleri (CHASET + REFLECTION Saunderson ke/ki Parametreleri)</h3>
          <table class="inno-table">
            <thead><tr><th>ID</th><th>Set Kodu</th><th>Set Adı</th><th>Tip</th><th>Bootstrap</th><th>Dalga Boyu</th><th>Saunderson ke (%)</th><th>Saunderson ki (%)</th><th>Kalınlık (mm)</th><th>Sistemde Bağlı</th></tr></thead>
            <tbody>
              ${state.lab3.chasets.map((cs) => `
                <tr class="${cs.chasetid === state.activeChasetId ? 'selected' : ''}">
                  <td>#${cs.chasetid}</td>
                  <td><b>${cs.chasetcode}</b></td>
                  <td>${cs.chasetname}</td>
                  <td>${cs.chasettype === 1 ? 'TSR (300-2500nm)' : 'Normal (400-700nm)'}</td>
                  <td>${cs.chartype === 'C' ? 'Şeffaf Baz (Clear)' : 'Beyaz Baz (White)'}</td>
                  <td>${cs.wlmin}..${cs.wlmax}nm (${cs.wlstep}nm)</td>
                  <td>%${cs.ke_surface}</td>
                  <td>%${cs.ki_internal}</td>
                  <td>${cs.default_thickness_mm} mm</td>
                  <td>${cs.linked_in_system ? '✅ Aktif' : 'Pasif'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (ctab === 'CMP_IN_SET') {
      body.innerHTML = `
        <div class="inno-card">
          <h3>🧩 Setteki Bileşenler & Bootstrap Referans Rolleri (ROLE: R=Şeffaf Baz, W=Beyaz, B=Siyah)</h3>
          <p style="font-size:12px;color:#94a3b8;margin-top:0;">
            LAB 3'te karakterizasyon önce Bootstrap üçlüsünün (<b>R</b>=Referans Şeffaf Baz, <b>W</b>=Referans Beyaz, <b>B</b>=Referans Siyah) simültane çözümüyle başlar; ardından tüm pastalar ve bazlar bu referanslar üzerinden letdown/masstone çekimleriyle karakterize edilir.
          </p>
          <table class="inno-table">
            <thead><tr><th>CHALIQUIDID</th><th>Tip</th><th>Kod</th><th>Ad</th><th>Bootstrap Rolü</th><th>Durum</th><th>Numune Sayısı</th><th>RMS dE (Beyaz / Siyah)</th></tr></thead>
            <tbody>
              ${state.lab3.chaliquids.map((c) => `
                <tr>
                  <td>#${c.chaliquidid}</td>
                  <td>${c.liquidtype === 2 ? 'Pasta (CNT)' : 'Baz (BASE)'}</td>
                  <td><span class="inno-swatch" style="background:${c.hex_color}"></span><b>${c.code}</b></td>
                  <td>${c.name}</td>
                  <td>
                    <select class="inno-select role-sel" data-clid="${c.chaliquidid}" style="width:130px;">
                      <option value="" ${!c.role ? 'selected' : ''}>Normal Bileşen</option>
                      <option value="R" ${c.role === 'R' ? 'selected' : ''}>R (Ref. Şeffaf Baz)</option>
                      <option value="W" ${c.role === 'W' ? 'selected' : ''}>W (Ref. Beyaz)</option>
                      <option value="B" ${c.role === 'B' ? 'selected' : ''}>B (Ref. Siyah)</option>
                    </select>
                  </td>
                  <td style="color:#22c55e;font-weight:700;">${c.status}</td>
                  <td>${c.sample_count} Numune</td>
                  <td>${c.rms_de_white} / ${c.rms_de_black}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      body.querySelectorAll('.role-sel').forEach((sel) => {
        sel.addEventListener('change', async () => {
          await fetch('/api/lab3/char/component', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set_role', chaliquidid: Number(sel.dataset.clid), role: sel.value, chasetid: state.activeChasetId }),
          });
          await loadAllData();
          renderCharacterizationScreen(pane);
        });
      });
    } else if (ctab === 'PROPOSER') {
      const tmpl = state.lab3.proposer_templates;
      const cntOpts = state.lab3.chaliquids.filter((c) => c.liquidtype === 2).map((c) => `<option value="${c.chaliquidid}">${c.code} — ${c.name}</option>`).join('');
      body.innerHTML = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🧪 Otomatik Karışım Önerici (MixtureProposer / MixtureSizesTemplate)</h3>
            <p style="font-size:12px;color:#94a3b8;margin-top:0;">
              Seçilen bileşen için LAB 3 standart <code>BW</code> (Bootstrap), <code>BWC</code> (Pasta Letdown/Masstone) veya <code>BWO</code> (Baz Opaklık) oran matrisine göre <code>CHASAMPLE</code> ve <code>LIQUIDINSAMPLE</code> reçetelerini otomatik oluşturur.
            </p>
            <div class="inno-grid-2">
              <div>
                <label class="inno-label">Hedef Bileşen (Pasta / Baz)</label>
                <select id="prop-clid" class="inno-select">${cntOpts}</select>
              </div>
              <div>
                <label class="inno-label">Şablon Matrisi (MixtureSizesTemplate)</label>
                <select id="prop-type" class="inno-select">
                  <option value="C">BWC — Pasta Letdown + Masstone (6 Numune)</option>
                  <option value="D">BW — Bootstrap Siyah/Beyaz/Şeffaf (9 Numune)</option>
                  <option value="B">BWO — Baz Karışımları (5 Numune)</option>
                </select>
              </div>
              <div>
                <label class="inno-label">Film Kalınlığı (mm)</label>
                <input id="prop-thick" type="number" step="0.05" value="0.25" class="inno-input" />
              </div>
              <div>
                <label class="inno-label">Toplam Pasta Dolum Oranı (%)</label>
                <input id="prop-fill" type="number" step="0.5" value="7.0" class="inno-input" />
              </div>
            </div>
            <button class="inno-btn inno-btn-success" id="btn-run-proposer">➕ Seçili Bileşen İçin Karışım Numuneleri (CHASAMPLE) Oluştur</button>
            <div id="proposer-msg" style="margin-top:10px;font-size:12px;color:#22c55e;"></div>
          </div>
          <div class="inno-card">
            <h3>📋 Standart BWC Matrisi ([Siyah, Beyaz, Pasta] Oranları)</h3>
            <table class="inno-table">
              <thead><tr><th>#</th><th>Siyah (B) Oranı</th><th>Beyaz (W) Oranı</th><th>Hedef Pasta (C) Oranı</th><th>Referans Baz (R)</th></tr></thead>
              <tbody>
                ${tmpl.colorants_clear.Default.map((row, idx) => `
                  <tr>
                    <td>#${idx + 1}</td>
                    <td>%${(row[0] * 100).toFixed(2)}</td>
                    <td>%${(row[1] * 100).toFixed(2)}</td>
                    <td><b>%${(row[2] * 100).toFixed(2)}</b></td>
                    <td>%${((1 - (row[0] + row[1] + row[2])) * 100).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      document.getElementById('btn-run-proposer').addEventListener('click', async () => {
        const clid = Number(document.getElementById('prop-clid').value);
        const ttype = document.getElementById('prop-type').value;
        const thick = Number(document.getElementById('prop-thick').value);
        const fill = Number(document.getElementById('prop-fill').value);
        const mat = ttype === 'D' ? tmpl.bootstrap_clear.Default : (ttype === 'B' ? tmpl.bases_clear['Clear bases'] : tmpl.colorants_clear.Default);
        const resp = await fetch('/api/lab3/char/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chasetid: state.activeChasetId, target_type: ttype, chaliquidid: clid, template_matrix: mat, thickness_mm: thick, custom_fill_pct: fill }),
        });
        const res = await resp.json();
        document.getElementById('proposer-msg').textContent = `✅ ${res.proposed_count} yeni CHASAMPLE çekim numunesi veritabanına eklendi ve RW/RB eğrileri sentezlendi!`;
        await loadAllData();
      });
    } else if (ctab === 'COLORANTS' || ctab === 'BASES') {
      const isCnt = ctab === 'COLORANTS';
      const compList = state.lab3.chaliquids.filter((c) => c.liquidtype === (isCnt ? 2 : 4));
      const activeId = isCnt ? state.activeCntChaliquidId : state.activeBaseChaliquidId;
      const resp = await fetch(`/api/lab3/char/samples/${activeId}`);
      const bundle = await resp.json();
      state.charSampleBundle = bundle;
      const comp = bundle.component;
      const samples = bundle.samples || [];
      const firstSmp = samples[0] || {};
      const kConcs = comp.k_concs || [];
      const sConcs = comp.s_concs || [];

      body.innerHTML = `
        <div class="inno-card" style="padding:10px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <label style="font-size:12px;font-weight:700;color:#38bdf8;">${isCnt ? 'Pasta Seç (comboBox_OC_RS_cnt):' : 'Baz Seç (comboBox_OB_RS_BASE):'}</label>
              <select id="char-comp-sel" class="inno-select" style="width:280px;">
                ${compList.map((c) => `<option value="${c.chaliquidid}" ${c.chaliquidid === activeId ? 'selected' : ''}>${c.code} — ${c.name} [${c.status}]</option>`).join('')}
              </select>
              <span class="inno-badge">RMS dE Beyaz: ${comp.rms_de_white}</span>
              <span class="inno-badge">RMS dE Siyah: ${comp.rms_de_black}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="inno-btn" id="btn-char-recalc">⚡ K/S Hesapla (reCalc_${isCnt ? 'OC' : 'OB'})</button>
              <button class="inno-btn inno-btn-success" id="btn-char-save">💾 K/S Veritabanına Kaydet (save_${isCnt ? 'OC' : 'OB'})</button>
            </div>
          </div>
        </div>
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>📋 Çekim Numuneleri (CHASAMPLE + SAMPLEREFL — Beyaz & Siyah Substrat)</h3>
            <table class="inno-table">
              <thead><tr><th>Kullan</th><th>Numune Adı (SAMPLENAME)</th><th>Kalınlık</th><th>dE Beyaz (RW)</th><th>dE Siyah (RB)</th></tr></thead>
              <tbody>
                ${samples.map((s) => `
                  <tr>
                    <td><input type="checkbox" class="smp-use-chk" data-sid="${s.sampleid}" ${s.in_use ? 'checked' : ''} /></td>
                    <td><span class="inno-swatch" style="background:#${Number(s.rgb).toString(16).padStart(6, '0')}"></span><b>${s.samplename}</b></td>
                    <td>${s.thickness} mm</td>
                    <td style="color:#22c55e;font-weight:700;">${s.de_white}</td>
                    <td style="color:#38bdf8;font-weight:700;">${s.de_black}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <h3 style="margin-top:14px;">📈 Ölçülen vs Sentezlenen RW / RB Yansıtma Eğrileri (${firstSmp.samplename || ''})</h3>
            ${renderSpectralSvg([
              { data: firstSmp.measured_rw || [], color: '#f59e0b', label: 'Ölçülen RW (Beyaz)' },
              { data: firstSmp.simulated_rw || [], color: '#ef4444', dashed: true, label: 'Simüle RW (Beyaz)' },
              { data: firstSmp.measured_rb || [], color: '#22c55e', label: 'Ölçülen RB (Siyah)' },
              { data: firstSmp.simulated_rb || [], color: '#38bdf8', dashed: true, label: 'Simüle RB (Siyah)' },
            ], 175)}
          </div>
          <div class="inno-card">
            <h3>🔬 Konsantrasyon Bağımlı K(c, λ) & S(c, λ) Eğrileri (KSCONC + KS)</h3>
            <table class="inno-table" style="margin-bottom:10px;">
              <thead><tr><th>Seviye</th><th>Konsantrasyon (CONC)</th><th>Ortalama K(c)</th><th>Ortalama S(c)</th><th>K/S Oranı</th></tr></thead>
              <tbody>
                ${kConcs.map((kc, idx) => {
                  const sc = sConcs[idx] || { values: [1] };
                  const avgK = (kc.values.reduce((a, b) => a + b, 0) / kc.values.length).toFixed(4);
                  const avgS = (sc.values.reduce((a, b) => a + b, 0) / sc.values.length).toFixed(4);
                  return `<tr><td>#${idx + 1}</td><td><b>c = ${kc.conc}</b></td><td>${avgK}</td><td>${avgS}</td><td>${(avgK / Math.max(0.0001, avgS)).toFixed(3)}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
            ${renderSpectralSvg([
              ...kConcs.map((kc, i) => ({ data: kc.values, color: i === 0 ? '#38bdf8' : '#ef4444', label: i === kConcs.length - 1 ? `K (c=${kc.conc})` : '' })),
              ...sConcs.map((sc, i) => ({ data: sc.values, color: '#22c55e', dashed: true, label: i === sConcs.length - 1 ? `S (c=${sc.conc})` : '' })),
            ], 185)}
            <div id="char-save-status" style="margin-top:8px;font-size:12px;color:#22c55e;"></div>
          </div>
        </div>
      `;

      document.getElementById('char-comp-sel').addEventListener('change', (e) => {
        if (isCnt) state.activeCntChaliquidId = Number(e.target.value);
        else state.activeBaseChaliquidId = Number(e.target.value);
        renderCharacterizationScreen(pane);
      });

      document.getElementById('btn-char-recalc').addEventListener('click', async () => {
        const checkedIds = Array.from(body.querySelectorAll('.smp-use-chk:checked')).map((el) => Number(el.dataset.sid));
        const rCalc = await fetch('/api/lab3/char/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chasetid: state.activeChasetId, chaliquidid: activeId, in_use_sample_ids: checkedIds }),
        });
        const calcData = await rCalc.json();
        state.charCalcResult = calcData.single;
        await fetch('/api/lab3/char/save_ks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: calcData.results }),
        });
        await loadAllData();
        await renderCharacterizationScreen(pane);
        const st = document.getElementById('char-save-status');
        if (st) st.textContent = `✅ Kubelka-Munk + Saunderson İki-Akılı NLLS çözücü tamamlandı! (RMS dE Beyaz=${calcData.single.rms_de_white}, Siyah=${calcData.single.rms_de_black})`;
      });

      document.getElementById('btn-char-save').addEventListener('click', async () => {
        document.getElementById('btn-char-recalc').click();
      });
    } else {
      body.innerHTML = `
        <div class="inno-card">
          <h3>🔗 Set Bağlama (Chaset Linking — CHASETINSYSTEM) & Tüm Seti Doğrulama (All / Test)</h3>
          <p style="font-size:12px;color:#94a3b8;">
            Aktif sistemde kullanılan karakterizasyon setlerini bağlar ve tüm bileşenlerin (16 Pasta + 18 Baz) K/S eğrilerini tek tuşla doğrular.
          </p>
          <button class="inno-btn inno-btn-success" id="btn-char-all">⚡ Setteki Tüm Bileşenleri Baştan Karakterize Et (Characterize ALL)</button>
          <div id="char-all-msg" style="margin-top:12px;font-size:12.5px;color:#22c55e;"></div>
        </div>
      `;
      document.getElementById('btn-char-all').addEventListener('click', async () => {
        document.getElementById('char-all-msg').textContent = '⏳ 34 bileşen için İki-Akılı Kubelka-Munk NLLS çözümü çalıştırılıyor...';
        const r = await fetch('/api/lab3/char/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chasetid: state.activeChasetId }),
        });
        const data = await r.json();
        await fetch('/api/lab3/char/save_ks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: data.results }),
        });
        await loadAllData();
        document.getElementById('char-all-msg').textContent = `✅ ${data.results.length} bileşenin tamamı başarıyla karakterize edildi ve KSCONC/KS tabloları güncellendi!`;
      });
    }
  }

  // ==========================================================================
  // 3.2 Rules Module (`MatchingAndCharacter/Rules/rules.py` — Product & System Rules)
  // ==========================================================================
  function renderRulesScreen(pane) {
    const pairs = state.lab3.system_rules.cntpairs || [];
    const baseRules = state.lab3.product_rules || [];
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.2 Kurallar (Product Rules [BASECNTRULE] & System Rules [CNTPAIR & CNTINSYSTEM])</b>
        <div class="lab3-tabstrip">
          <button class="lab3-tab ${state.rulesTab === 'SYSTEM_RULES' ? 'active' : ''}" data-rtab="SYSTEM_RULES">Sistem Kuralları & Pasta Çifti Matrisi (CNTPAIR)</button>
          <button class="lab3-tab ${state.rulesTab === 'PRODUCT_RULES' ? 'active' : ''}" data-rtab="PRODUCT_RULES">Ürün / Baz Pasta Kuralları (BASECNTRULE)</button>
        </div>
      </div>
      <div class="lab3-content">
        ${state.rulesTab === 'SYSTEM_RULES' ? `
          <div class="inno-grid-2">
            <div class="inno-card">
              <h3>⚙️ Sistem Pasta Skorları & Limitleri (CNTINSYSTEM)</h3>
              <table class="inno-table">
                <thead><tr><th>Pasta</th><th>Ad</th><th>Tip</th><th>Skor (0..45)</th><th>Min %</th><th>Max %</th><th>Aktif</th></tr></thead>
                <tbody>
                  ${state.lab3.system_rules.cntinsystem.map((r) => `
                    <tr>
                      <td><b>${r.cntcode}</b></td>
                      <td>${r.cntname}</td>
                      <td>${r.ptype === 2 ? 'Beyaz' : (r.ptype === 1 ? 'Siyah' : 'Kromatik')}</td>
                      <td><b>${r.score}</b></td>
                      <td>%${r.minpct}</td>
                      <td>%${r.maxpct}</td>
                      <td>${r.in_use ? '✅' : '❌'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="inno-card">
              <h3>🚫 Pasta Çifti Uyumluluk Matrisi (CNTPAIR — 0 = Yasaklı Çift)</h3>
              <p style="font-size:11.5px;color:#94a3b8;margin-top:0;">
                Skor = <b>0</b> olan pasta çiftleri (örn. <code>SYH + OS</code> iki siyah birlikte, <code>LY + SY</code> iki sarı birlikte, <code>MB + KB</code> iki mavi birlikte) eşleştirme motorunda aynı reçeteye girmez.
              </p>
              <div style="max-height:340px;overflow-y:auto;">
                <table class="inno-table">
                  <thead><tr><th>Pasta 1</th><th>Pasta 2</th><th>Çift Skoru</th><th>Durum</th></tr></thead>
                  <tbody>
                    ${pairs.slice(0, 40).map((p) => `
                      <tr>
                        <td><b>${p.cntcode1}</b></td>
                        <td><b>${p.cntcode2}</b></td>
                        <td><input type="number" class="inno-input pair-score-inp" data-pid="${p.pairid}" value="${p.score}" style="width:70px;" /></td>
                        <td>${p.score === 0 ? '<span style="color:#ef4444;font-weight:700;">⛔ Yasaklı Çift</span>' : '<span style="color:#22c55e;">✅ İzinli</span>'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : `
          <div class="inno-card">
            <h3>🪣 Baz Başına Pasta İzin & Dolum Kuralları (BASECNTRULE — Örn. C Şeffaf Bazda BV Beyaz Pasta Kısıtı)</h3>
            <div style="max-height:420px;overflow-y:auto;">
              <table class="inno-table">
                <thead><tr><th>Baz Kodu</th><th>Pasta Kodu</th><th>Skor</th><th>Max Dolum %</th><th>İzin Durumu</th></tr></thead>
                <tbody>
                  ${baseRules.slice(0, 48).map((br) => `
                    <tr>
                      <td><b>${br.basecode}</b></td>
                      <td><b>${br.cntcode}</b></td>
                      <td>${br.score}</td>
                      <td>%${br.maxpct}</td>
                      <td>${br.allowed ? '<span style="color:#22c55e;">✅ İzinli</span>' : '<span style="color:#ef4444;">⛔ C Bazda Beyaz Kısıtlı</span>'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;
    pane.querySelectorAll('[data-rtab]').forEach((b) => {
      b.addEventListener('click', () => {
        state.rulesTab = b.getAttribute('data-rtab');
        renderRulesScreen(pane);
      });
    });
    pane.querySelectorAll('.pair-score-inp').forEach((inp) => {
      inp.addEventListener('change', async () => {
        await fetch('/api/lab3/rules/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule_type: 'pair', pairid: Number(inp.dataset.pid), score: Number(inp.value) }),
        });
        await loadAllData();
        renderRulesScreen(pane);
      });
    });
  }

  // ==========================================================================
  // 3.3 Matching Module (`MatchingAndCharacter/Match/Matching.py` — 4 Tabs)
  // ==========================================================================
  async function renderMatchingScreen(pane) {
    const mtabs = [
      { id: 'COMPONENTS', label: '1. Bileşen Seçimi (Components)' },
      { id: 'PREFERENCES', label: '2. Eşleştirme Tercihleri (Preferences)' },
      { id: 'RESULTS', label: '3. Canlı Sonuçlar (Recommended / Cheapest / Most Accurate / Least Metameric)' },
      { id: 'STATISTICS', label: '4. İstatistikler (Statistics)' },
    ];

    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.3 Renk Eşleştirme (3-Aşamalı: Search [MFORMULA] ➔ Search & Correct ➔ Multi-Base NLLS Match)</b>
        <div class="lab3-tabstrip">
          ${mtabs.map((t) => `<button class="lab3-tab ${state.matchTab === t.id ? 'active' : ''}" data-mtab="${t.id}">${t.label}</button>`).join('')}
          <button class="inno-btn inno-btn-success" id="btn-start-match">🚀 Eşleştirmeyi Başlat (Match)</button>
        </div>
      </div>
      <div class="lab3-content" id="match-tab-body"></div>
    `;

    pane.querySelectorAll('[data-mtab]').forEach((b) => {
      b.addEventListener('click', () => {
        state.matchTab = b.getAttribute('data-mtab');
        renderMatchingScreen(pane);
      });
    });

    document.getElementById('btn-start-match').addEventListener('click', async () => {
      const resp = await fetch('/api/lab3/match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productid: state.selectedMatchProductId,
          cansizeid: state.selectedMatchCanSizeId,
          colourids: state.selectedMatchColourIds,
          options: state.lab3.match_settings[0]?.options || {},
        }),
      });
      state.matchRunOutput = await resp.json();
      state.activeMatchColourIdx = 0;
      state.matchTab = 'RESULTS';
      renderMatchingScreen(pane);
    });

    const body = document.getElementById('match-tab-body');
    if (state.matchTab === 'COMPONENTS') {
      body.innerHTML = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>🪣 Ürün, Ambalaj & Baz Seçimi (MatchingComponents)</h3>
            <div class="inno-grid-2">
              <div>
                <label class="inno-label">Hedef Ürün (PRODUCT)</label>
                <select id="m-prod-sel" class="inno-select">
                  ${state.lab3.products.map((p) => `<option value="${p.productid}" ${p.productid === state.selectedMatchProductId ? 'selected' : ''}>${p.productcode} — ${p.productname}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="inno-label">Ambalaj Boyutu (CANSIZE)</label>
                <select id="m-can-sel" class="inno-select">
                  ${state.lab3.cansizes.map((c) => `<option value="${c.cansizeid}" ${c.cansizeid === state.selectedMatchCanSizeId ? 'selected' : ''}>${c.cansizecode} (${c.nominalamount} L)</option>`).join('')}
                </select>
              </div>
            </div>
            <h4 style="margin:10px 0 6px;font-size:12.5px;color:#cbd5e1;">Kullanılabilir Pastalar (Min / Max / Must-Be)</h4>
            <div style="max-height:240px;overflow-y:auto;">
              <table class="inno-table">
                <thead><tr><th>Kullan</th><th>Pasta</th><th>Ad</th><th>Fiyat (₺/L)</th><th>Max %</th></tr></thead>
                <tbody>
                  ${state.lab3.colorants.map((c) => `
                    <tr>
                      <td><input type="checkbox" checked /></td>
                      <td><span class="inno-swatch" style="background:${c.hex_color}"></span><b>${c.cntcode}</b></td>
                      <td>${c.cntname}</td>
                      <td>₺${c.price_per_liter}</td>
                      <td>%${c.max_concentration}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="inno-card">
            <h3>🎨 Eşleştirilecek Hedef Renkler (Çoklu Renk Seçimi)</h3>
            <div style="max-height:330px;overflow-y:auto;">
              <table class="inno-table">
                <thead><tr><th>Seç</th><th>Kod</th><th>Renk Adı</th><th>CIE L*a*b*</th></tr></thead>
                <tbody>
                  ${state.lab3.colours.map((col) => `
                    <tr>
                      <td><input type="checkbox" class="m-col-chk" value="${col.colourid}" ${state.selectedMatchColourIds.includes(col.colourid) ? 'checked' : ''} /></td>
                      <td><span class="inno-swatch" style="background:${col.hex_color}"></span><b>${col.colourcode}</b></td>
                      <td>${col.colourname}</td>
                      <td style="font-family:monospace;">L*=${col.lab[0]} a*=${col.lab[1]} b*=${col.lab[2]}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      document.getElementById('m-prod-sel').addEventListener('change', (e) => { state.selectedMatchProductId = Number(e.target.value); });
      document.getElementById('m-can-sel').addEventListener('change', (e) => { state.selectedMatchCanSizeId = Number(e.target.value); });
      body.querySelectorAll('.m-col-chk').forEach((chk) => {
        chk.addEventListener('change', () => {
          state.selectedMatchColourIds = Array.from(body.querySelectorAll('.m-col-chk:checked')).map((el) => Number(el.value));
        });
      });
    } else if (state.matchTab === 'PREFERENCES') {
      const ms = state.lab3.match_settings[0] || { options: {}, levels: [], qa: [] };
      const opts = ms.options;
      body.innerHTML = `
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>⚙️ 3-Aşamalı Eşleştirme Motoru Parametreleri (MATCHSETTING)</h3>
            <div class="inno-grid-2">
              <div><label class="inno-label">1. Aşama: Search (MFORMULA Max dE)</label><input class="inno-input" type="number" step="0.1" value="${opts.searchmaxde || 1.2}" /></div>
              <div><label class="inno-label">2. Aşama: Search & Correct Max dE</label><input class="inno-input" type="number" step="0.1" value="${opts.searchcorrectmaxde || 4.5}" /></div>
              <div><label class="inno-label">3. Aşama: Match Max dE</label><input class="inno-input" type="number" step="0.1" value="${opts.maxde || 3.0}" /></div>
              <div><label class="inno-label">Hedef Opaklık dE (Opacity dE)</label><input class="inno-input" type="number" step="0.1" value="${opts.opacityde || 1.25}" /></div>
              <div><label class="inno-label">Min / Max Pasta Sayısı</label><input class="inno-input" value="${opts.mincnts || 1} .. ${opts.maxcnts || 4}" /></div>
              <div><label class="inno-label">Renk Farkı Denklemi & Işık</label><input class="inno-input" value="CMC 2:1 / D65 + A + F11" /></div>
            </div>
          </div>
          <div class="inno-card">
            <h3>📊 Sıralama Tolerans Seviyeleri (Sorting Tolerances ST 1..4) & Kalite Sınıfları</h3>
            <table class="inno-table">
              <thead><tr><th>Seviye (ST)</th><th>Max dE</th><th>Max Opa dE</th><th>Max Metamerizm</th><th>Maliyet Oranı</th></tr></thead>
              <tbody>
                ${(ms.levels || []).map((lv) => `
                  <tr><td><b>${lv.levelname}</b></td><td>${lv.maxde}</td><td>${lv.maxopade}</td><td>${lv.maxmetamerism}</td><td>${lv.costratio}x</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (state.matchTab === 'RESULTS') {
      if (!state.matchRunOutput) {
        document.getElementById('btn-start-match').click();
        return;
      }
      const resList = state.matchRunOutput.results || [];
      const activeCol = resList[state.activeMatchColourIdx] || resList[0];
      const prim = activeCol?.primary || {};
      const cats = ['Recommended', 'Cheapest', 'Most accurate', 'Least metameric'];
      const selFrm = prim[state.activeMatchCategory] || prim.Recommended || {};

      body.innerHTML = `
        <div class="inno-grid-3" style="grid-template-columns: 240px 1fr 360px;">
          <!-- Left: Target Colours List -->
          <div class="inno-card">
            <h3>🎯 Hedef Renkler (${resList.length})</h3>
            ${resList.map((r, idx) => {
              const rec = r.primary?.Recommended;
              return `
                <div class="m-res-col-item" data-idx="${idx}" style="padding:8px;border-radius:6px;margin-bottom:6px;cursor:pointer;border:1px solid ${idx === state.activeMatchColourIdx ? '#38bdf8' : '#334155'};background:${idx === state.activeMatchColourIdx ? 'rgba(2,132,199,0.22)' : '#0f172a'};">
                  <div><span class="inno-swatch" style="background:${r.target_hex}"></span><b>${r.colourcode}</b></div>
                  <div style="font-size:11px;color:#94a3b8;">${r.colourname}</div>
                  ${rec ? `<div style="font-size:11px;color:#22c55e;margin-top:3px;">dE=${rec.de} • ₺${rec.cntprice} • ST ${rec.levelnumber} (${rec.qa_grade})</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Center: 4 Primary Columns (Recommended, Cheapest, Most accurate, Least metameric) -->
          <div class="inno-card">
            <h3>🏆 4 Ana Reçete Kategorisi (tableView_rs_color_formulas) — ${activeCol?.colourcode || ''}</h3>
            <div class="inno-grid-4">
              ${cats.map((cat) => {
                const f = prim[cat];
                if (!f) return '';
                const isSel = state.activeMatchCategory === cat;
                return `
                  <div class="m-cat-card" data-cat="${cat}" style="background:#0f172a;border:2px solid ${isSel ? '#38bdf8' : '#334155'};border-radius:7px;padding:10px;cursor:pointer;">
                    <div style="font-weight:700;color:#38bdf8;font-size:12.5px;margin-bottom:4px;">${cat}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Kaynak: <b>${f.source}</b> • Baz: <b>${f.basecode}</b></div>
                    <div style="display:flex;gap:4px;margin-bottom:8px;">
                      <div style="flex:1;height:22px;background:${activeCol.target_hex};border-radius:3px;" title="Hedef"></div>
                      <div style="flex:1;height:22px;background:${f.hex};border-radius:3px;" title="Sentez"></div>
                    </div>
                    <table class="inno-table" style="font-size:11px;">
                      <tr><td>dE (D65/A/F11)</td><td><b>${f.eval.de1}</b> / ${f.eval.de2} / ${f.eval.de3}</td></tr>
                      <tr><td>Metamerizm (Me)</td><td><b>${f.eval.metamerism}</b></td></tr>
                      <tr><td>Opaklık CR / dE</td><td>%${f.eval.opacitycr} / ${f.eval.opacityde}</td></tr>
                      <tr><td>Pasta Maliyeti</td><td><b>₺${f.cntprice}</b> (₺${f.costperl}/L)</td></tr>
                      <tr><td>ST / BFS Skoru</td><td>ST ${f.levelnumber} • BFS ${f.bfsgrade}</td></tr>
                      <tr><td>TSR Solar</td><td>%${f.tsr}</td></tr>
                    </table>
                    <div style="margin-top:8px;border-top:1px solid #334155;padding-top:6px;">
                      ${f.cnts.map((c) => `
                        <div style="display:flex;justify-content:space-between;font-size:11.5px;">
                          <span><b>${c.cntcode}</b></span>
                          <span style="font-family:monospace;">${c.amount} ml</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="inno-btn inno-btn-success" id="btn-accept-curr">✅ Seçili Reçeteyi Onayla (Accept to Current)</button>
              <button class="inno-btn" id="btn-accept-ref">📌 Referans Reçetelere Ekle (MFORMULA)</button>
              <button class="inno-btn inno-btn-warn" id="btn-send-corr">🔧 Renk Düzeltmeye Gönder (Manual / Batch Correction)</button>
            </div>
            <div id="match-accept-msg" style="margin-top:8px;font-size:12px;color:#22c55e;"></div>
          </div>

          <!-- Right: Spectral Comparison & Detailed L*a*b* / XYZ -->
          <div class="inno-card">
            <h3>📈 Spektral Yansıtma & L*a*b* (${state.activeMatchCategory})</h3>
            ${renderSpectralSvg([
              { data: activeCol?.target_rw || [], color: '#f59e0b', label: 'Hedef Renk (RW %)' },
              { data: selFrm?.rw || [], color: '#22c55e', dashed: true, label: 'Sentezlenen Reçete (RW %)' },
              { data: selFrm?.rb || [], color: '#38bdf8', dashed: true, label: 'Siyah Substrat (RB %)' },
            ], 170)}
            <table class="inno-table" style="margin-top:10px;font-size:11.5px;">
              <tr><th>Parametre</th><th>Değer</th><th>Fark (Δ)</th></tr>
              <tr><td>L* (D65)</td><td>${selFrm.lab_d65?.['L*']}</td><td>ΔL* = ${selFrm.lab_d65?.['dL*']}</td></tr>
              <tr><td>a* (D65)</td><td>${selFrm.lab_d65?.['a*']}</td><td>Δa* = ${selFrm.lab_d65?.['da*']}</td></tr>
              <tr><td>b* (D65)</td><td>${selFrm.lab_d65?.['b*']}</td><td>Δb* = ${selFrm.lab_d65?.['db*']}</td></tr>
              <tr><td>XYZ (D65)</td><td>${selFrm.xyz_d65?.X}, ${selFrm.xyz_d65?.Y}, ${selFrm.xyz_d65?.Z}</td><td>ΔY = ${selFrm.xyz_d65?.dY}</td></tr>
              <tr><td>Otomatik Not</td><td colspan="2" style="color:#38bdf8;">${selFrm.inote || '-'}</td></tr>
            </table>
          </div>
        </div>
      `;

      body.querySelectorAll('.m-res-col-item').forEach((el) => {
        el.addEventListener('click', () => {
          state.activeMatchColourIdx = Number(el.dataset.idx);
          renderMatchingScreen(pane);
        });
      });
      body.querySelectorAll('.m-cat-card').forEach((el) => {
        el.addEventListener('click', () => {
          state.activeMatchCategory = el.dataset.cat;
          renderMatchingScreen(pane);
        });
      });
      document.getElementById('btn-accept-curr').addEventListener('click', async () => {
        await fetch('/api/lab3/match/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'current', productid: state.selectedMatchProductId, baseid: selFrm.baseid, colourid: activeCol.colourid, cnts: selFrm.cnts, de: selFrm.de }),
        });
        document.getElementById('match-accept-msg').textContent = `✅ ${activeCol.colourcode} (${state.activeMatchCategory}) reçetesi aktif katalog reçetesi olarak kaydedildi!`;
      });
      document.getElementById('btn-accept-ref').addEventListener('click', async () => {
        await fetch('/api/lab3/match/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'reference', productid: state.selectedMatchProductId, baseid: selFrm.baseid, colourid: activeCol.colourid, cnts: selFrm.cnts, rw: selFrm.rw, rb: selFrm.rb }),
        });
        await loadAllData();
        document.getElementById('match-accept-msg').textContent = `📌 ${activeCol.colourcode} reçetesi Referans Reçeteler (MFORMULA) tablosuna eklendi!`;
      });
      document.getElementById('btn-send-corr').addEventListener('click', () => {
        state.corrState.productid = state.selectedMatchProductId;
        state.corrState.baseid = selFrm.baseid;
        state.corrState.colourid = activeCol.colourid;
        state.corrState.formula_cnts = selFrm.cnts.map((c) => ({ cntid: c.cntid, cntcode: c.cntcode, amount: c.amount }));
        state.subScreen = 'CORRECTION';
        renderOverlay();
      });
    } else {
      const st = state.matchRunOutput?.statistics || { total_colours: 0, pass_rate_pct: 100, avg_de: 0.21, avg_cost: 14.5, avg_metamerism: 0.45, qa_counts: { Perfect: 3, Good: 1, Acceptable: 0, Poor: 0 } };
      body.innerHTML = `
        <div class="inno-grid-4">
          <div class="inno-card"><div class="inno-stat-num">%${st.pass_rate_pct}</div><div class="inno-stat-label">Eşleştirme Başarı Oranı (Pass Rate)</div></div>
          <div class="inno-card"><div class="inno-stat-num">${st.avg_de}</div><div class="inno-stat-label">Ortalama dE (D65)</div></div>
          <div class="inno-card"><div class="inno-stat-num">₺${st.avg_cost}</div><div class="inno-stat-label">Ortalama Pasta Maliyeti</div></div>
          <div class="inno-card"><div class="inno-stat-num">${st.avg_metamerism}</div><div class="inno-stat-label">Ortalama Metamerizm İndeksi</div></div>
        </div>
      `;
    }
  }

  // ==========================================================================
  // 3.4 Color Correction Module (`MatchingAndCharacter/ColorCorrection/ColorCorrection.py`)
  // ==========================================================================
  async function renderColorCorrectionScreen(pane) {
    const cs = state.corrState;
    if (!cs.result) {
      const r = await fetch('/api/lab3/correction/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cs),
      });
      cs.result = await r.json();
    }
    const res = cs.result;
    const bm = res.before_metrics || {};
    const am = res.after_metrics || {};

    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.4 Renk Düzeltme (Color Correction — 4 Mod: Formula / Batch [cnt] / Batch [cnt+base] / Manual Matching)</b>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="corr-mode-sel" class="inno-select" style="width:230px;">
            <option value="1" ${cs.mode === 1 ? 'selected' : ''}>1. Formula correction (± Pasta Düzeltme)</option>
            <option value="2" ${cs.mode === 2 ? 'selected' : ''}>2. Batch (cnt) (Kova Üzerine +Pasta İlavesi)</option>
            <option value="3" ${cs.mode === 3 ? 'selected' : ''}>3. Batch (cnt+base) (+Baz ve +Pasta İlavesi)</option>
            <option value="4" ${cs.mode === 4 ? 'selected' : ''}>4. Manual matching (Canlı Sentez)</option>
          </select>
          <button class="inno-btn inno-btn-success" id="btn-run-corr">🔧 Düzeltmeyi Hesapla (Calculate Correction)</button>
        </div>
      </div>
      <div class="lab3-content">
        <div class="inno-grid-3">
          <!-- Column 1: Formula in use | Correction | Corrected formula -->
          <div class="inno-card">
            <h3>🧪 Reçete / İlave / Düzeltilmiş Reçete (ml)</h3>
            <table class="inno-table">
              <thead><tr><th>Bileşen</th><th>Kullanımdaki (In Use)</th><th>Düzeltme (Change)</th><th>Düzeltilmiş (Corrected)</th></tr></thead>
              <tbody>
                <tr style="background:rgba(56,189,248,0.1);">
                  <td><b>Baz Boya</b></td>
                  <td>${res.base_in_use_ml} ml</td>
                  <td style="color:#f59e0b;font-weight:700;">+${res.base_change_ml} ml</td>
                  <td><b>${res.base_corrected_ml} ml</b></td>
                </tr>
                ${(res.corrected_cnts || []).map((c, idx) => `
                  <tr>
                    <td><b>${c.cntcode}</b></td>
                    <td><input type="number" step="0.1" class="inno-input corr-init-inp" data-idx="${idx}" value="${c.formula_amount ?? c.amount}" style="width:75px;" /></td>
                    <td style="color:#22c55e;font-weight:700;">${c.change_amount >= 0 ? '+' : ''}${c.change_amount ?? 0} ml</td>
                    <td><b>${c.amount} ml</b></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Column 2: Before & After Colorimetric Tables (D65 / A / F11) -->
          <div class="inno-card">
            <h3>📊 Düzeltme Öncesi vs Sonrası (tableWidget_before_d65 / after_d65)</h3>
            <table class="inno-table">
              <thead><tr><th>Metrik</th><th>Önce (Batch)</th><th>Sonra (Corrected)</th></tr></thead>
              <tbody>
                <tr><td><b>dE (D65)</b></td><td style="color:#f59e0b;font-weight:700;">${res.initial_de}</td><td style="color:#22c55e;font-weight:700;">${res.predicted_de}</td></tr>
                <tr><td>dE (A / F11)</td><td>${bm.eval?.de2 || '-'} / ${bm.eval?.de3 || '-'}</td><td>${am.eval?.de2 || '-'} / ${am.eval?.de3 || '-'}</td></tr>
                <tr><td>Metamerizm (DIN 6172)</td><td>${bm.eval?.metamerism || '-'}</td><td>${am.eval?.metamerism || '-'}</td></tr>
                <tr><td>Opaklık CR% / Opa dE</td><td>%${bm.eval?.opacitycr || '-'} / ${bm.eval?.opacityde || '-'}</td><td>%${am.eval?.opacitycr || '-'} / ${am.eval?.opacityde || '-'}</td></tr>
                <tr><td>Hedef L*a*b*</td><td colspan="2" style="font-family:monospace;">L*=${res.std_lab?.[0]} a*=${res.std_lab?.[1]} b*=${res.std_lab?.[2]}</td></tr>
                <tr><td>Sonuç L*a*b*</td><td style="font-family:monospace;">${res.batch_lab?.join(', ')}</td><td style="font-family:monospace;"><b>${res.corrected_lab?.join(', ')}</b></td></tr>
                <tr><td>ΔL*, ΔC*, ΔH*</td><td>${(res.delta_lch_before || []).join(', ')}</td><td style="color:#22c55e;"><b>${(res.delta_lch_after || []).join(', ')}</b></td></tr>
              </tbody>
            </table>
          </div>

          <!-- Column 3: Delta a*b* Bullseye + Spectral Curve -->
          <div class="inno-card">
            <h3>🎯 CIE Δa*b* & ΔL* Hedef Grafiği (DeltaABgraph)</h3>
            ${renderDeltaABSvg(
              (res.batch_lab?.[1] || 0) - (res.std_lab?.[1] || 0),
              (res.batch_lab?.[2] || 0) - (res.std_lab?.[2] || 0),
              (res.batch_lab?.[0] || 0) - (res.std_lab?.[0] || 0),
              (res.corrected_lab?.[1] || 0) - (res.std_lab?.[1] || 0),
              (res.corrected_lab?.[2] || 0) - (res.std_lab?.[2] || 0),
              (res.corrected_lab?.[0] || 0) - (res.std_lab?.[0] || 0)
            )}
          </div>
        </div>
        <div class="inno-card">
          <h3>📈 Düzeltilmiş Spektral Yansıtma Eğrileri (RW Beyaz Substrat & RB Siyah Substrat)</h3>
          ${renderSpectralSvg([
            { data: res.rw || [], color: '#22c55e', label: 'Düzeltilmiş RW (Beyaz Substrat %)' },
            { data: res.rb || [], color: '#38bdf8', dashed: true, label: 'Düzeltilmiş RB (Siyah Substrat %)' },
          ], 165)}
        </div>
      </div>
    `;

    document.getElementById('corr-mode-sel').addEventListener('change', (e) => {
      cs.mode = Number(e.target.value);
    });
    document.getElementById('btn-run-corr').addEventListener('click', async () => {
      pane.querySelectorAll('.corr-init-inp').forEach((inp) => {
        const idx = Number(inp.dataset.idx);
        if (cs.formula_cnts[idx]) cs.formula_cnts[idx].amount = Number(inp.value);
      });
      cs.result = null;
      await renderColorCorrectionScreen(pane);
    });
  }

  // ==========================================================================
  // 3.5 Reference Formulas (`MFORMULA`) & 3.6 Fill RGB (`FillRGB.py`)
  // ==========================================================================
  function renderReferenceFormulasScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.5 Referans Reçeteler (MFORMULA + LIQUIDINMFORMULA — Search & Search+Correct Veritabanı)</b>
      </div>
      <div class="lab3-content">
        <div class="inno-card">
          <h3>📌 Kayıtlı Referans Laboratuvar Reçeteleri (${state.lab3.mformulas.length})</h3>
          <table class="inno-table">
            <thead><tr><th>ID</th><th>Referans Adı</th><th>Baz</th><th>Baz Hacmi</th><th>Pasta İçeriği</th><th>CIE L*a*b*</th><th>Notlar</th></tr></thead>
            <tbody>
              ${state.lab3.mformulas.map((mf) => `
                <tr>
                  <td>#${mf.mformulaid}</td>
                  <td><span class="inno-swatch" style="background:${mf.hex_color}"></span><b>${mf.mformulaname}</b></td>
                  <td><b>${mf.basecode}</b></td>
                  <td>${mf.basevolume} ml</td>
                  <td style="font-family:monospace;">${mf.cnts.map((c) => `${c.cntcode}: ${c.amount}ml`).join(', ')}</td>
                  <td style="font-family:monospace;">L*=${mf.lab[0]} a*=${mf.lab[1]} b*=${mf.lab[2]}</td>
                  <td>${mf.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderFillRgbScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>3.6 RGB Doldur (Fill RGB — Spektral Yansıtmadan D65 sRGB Otomatik Hesaplama)</b>
      </div>
      <div class="lab3-content">
        <div class="inno-card">
          <h3>🌈 Kartela ve Reçete RGB Değerlerini Spektral Eğrilerden Yeniden Hesapla</h3>
          <p style="font-size:12px;color:#94a3b8;">
            Seçilen karteladaki tüm renklerin 400–700nm <code>REFLECTANCE</code> eğrilerinden CIE 1964 10° D65 tristimulus entegrasyonu ile <code>COLOURRGB</code> ve <code>L*a*b*</code> değerlerini günceller.
          </p>
          <button class="inno-btn inno-btn-success" id="btn-run-fillrgb">⚡ Tüm Kartelalar İçin Fill RGB Çalıştır</button>
          <div id="fillrgb-msg" style="margin-top:10px;color:#22c55e;font-size:12.5px;"></div>
        </div>
      </div>
    `;
    document.getElementById('btn-run-fillrgb').addEventListener('click', async () => {
      const r = await fetch('/api/lab3/fill_rgb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      document.getElementById('fillrgb-msg').textContent = `✅ ${d.updated_colours} rengin D65 XYZ -> L*a*b* -> sRGB dönüşümü tamamlandı!`;
      await loadAllData();
    });
  }

  // ==========================================================================
  // 4.1 Formula Management & 4.2 8-Tab Batch Operations (`BatchOperation.py`)
  // ==========================================================================
  function renderFormulaManagementScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar"><b>4.1 Reçete Yönetimi (Formula Management — Aktif Katalog Reçeteleri)</b></div>
      <div class="lab3-content">
        <div class="inno-card">
          <div style="max-height:460px;overflow-y:auto;">
            <table class="inno-table">
              <thead><tr><th>ID</th><th>Ürün ID</th><th>Baz ID</th><th>Renk ID</th><th>Versiyon</th><th>Tarih</th><th>Reçete Pastaları (ml/L)</th><th>ΔE</th></tr></thead>
              <tbody>
                ${state.lab3.formulas.slice(0, 60).map((f) => `
                  <tr>
                    <td>#${f.formulaid}</td>
                    <td>Ürün #${f.productid}</td>
                    <td>Baz #${f.baseid}</td>
                    <td>Renk #${f.colourid}</td>
                    <td><span class="inno-badge">${f.version}</span></td>
                    <td>${f.createdate}</td>
                    <td style="font-family:monospace;">${f.cnts.map((c) => `${c.cntcode}: ${c.amount}ml`).join(', ')}</td>
                    <td style="color:#22c55e;font-weight:700;">${f.delta_e}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderBatchOperationsScreen(pane) {
    const btabs = [
      'Formulas', 'Colors', 'Product prices', 'Base prices',
      'Colorant prices', 'Can sizes', 'Products', 'Formula Transfer (A2AA..Z2AA)',
    ];
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>4.2 Toplu İşlemler (8-Sekmeli Batch Operations + Commit / Rollback + 237 DLL Eklenti Desteği)</b>
        <div class="lab3-tabstrip">
          ${btabs.map((t) => `<button class="lab3-tab ${state.batchTab === t ? 'active' : ''}" data-btab="${t}">${t}</button>`).join('')}
        </div>
      </div>
      <div class="lab3-content">
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>⚡ Toplu İşlem Çalıştır — Sekme: ${state.batchTab}</h3>
            <div class="inno-grid-2">
              <div>
                <label class="inno-label">Çarpan / Katsayı (Factor)</label>
                <input id="batch-factor" type="number" step="0.01" value="1.05" class="inno-input" />
              </div>
              <div>
                <label class="inno-label">Dönüşüm Eklentisi (237 DLL / A2AA..Z2AA)</label>
                <select id="batch-dll" class="inno-select">
                  <option value="A2AA.dll">A2AA.dll (Chromaflo -> Polchem Color Suit AdjFunc)</option>
                  <option value="B2AA.dll">B2AA.dll (CPS Temacolor Polinom AdjFunc)</option>
                  <option value="C2AA.dll">C2AA.dll (Gravimetrik <-> Volümetrik)</option>
                </select>
              </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:10px;">
              <button class="inno-btn inno-btn-success" id="btn-batch-exec">▶️ Toplu İşlemi Uygula & Snapshot Al (Execute & Commit)</button>
              <button class="inno-btn inno-btn-warn" id="btn-batch-rollback">↩️ Son Toplu İşlemi Geri Al (Rollback Transaction)</button>
            </div>
            <div id="batch-op-msg" style="margin-top:10px;font-size:12.5px;color:#22c55e;"></div>
          </div>
          <div class="inno-card">
            <h3>📜 Toplu İşlem & Rollback Geçmişi (lab_batch_history)</h3>
            <table class="inno-table">
              <thead><tr><th>ID</th><th>Sekme</th><th>Eklenti</th><th>Etkilenen</th><th>Durum</th><th>Tarih</th></tr></thead>
              <tbody>
                ${(state.lab3.batch_history || []).map((bh) => `
                  <tr>
                    <td>#${bh.batchid}</td>
                    <td><b>${bh.tab_name}</b></td>
                    <td><code>${bh.plugin_dll}</code></td>
                    <td>${bh.affected_rows} kayıt</td>
                    <td style="color:${bh.status === 'COMMITTED' ? '#22c55e' : '#f59e0b'};font-weight:700;">${bh.status}</td>
                    <td>${bh.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    pane.querySelectorAll('[data-btab]').forEach((b) => {
      b.addEventListener('click', () => {
        state.batchTab = b.getAttribute('data-btab');
        renderBatchOperationsScreen(pane);
      });
    });
    document.getElementById('btn-batch-exec').addEventListener('click', async () => {
      const factor = Number(document.getElementById('batch-factor').value);
      const dll = document.getElementById('batch-dll').value;
      const r = await fetch('/api/lab3/batch_ops/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab_name: state.batchTab, operation: 'bulk_scale', factor, plugin_dll: dll }),
      });
      const d = await r.json();
      await loadAllData();
      renderBatchOperationsScreen(pane);
      document.getElementById('batch-op-msg').textContent = `✅ ${d.details}`;
    });
    document.getElementById('btn-batch-rollback').addEventListener('click', async () => {
      const r = await fetch('/api/lab3/batch_ops/rollback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      await loadAllData();
      renderBatchOperationsScreen(pane);
      document.getElementById('batch-op-msg').textContent = `↩️ Batch #${d.batchid} geri alındı (${d.restored} kayıt önceki değerine döndürüldü).`;
    });
  }

  // ==========================================================================
  // 4.3 Color Difference & Strength (`ColorDifference`) & 4.4 TSR (`TSR`)
  // ==========================================================================
  async function renderColorDiffScreen(pane) {
    if (!state.colorDiffResult) {
      const c1 = state.lab3.colours[0]?.refl || [];
      const c2 = state.lab3.colours[2]?.refl || [];
      const r = await fetch('/api/lab3/analysis/color_diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ std_refl: c1, smp_refl: c2 }),
      });
      state.colorDiffResult = await r.json();
    }
    const cd = state.colorDiffResult;
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>4.3 Renk Farkı, Opaklık, Beyazlık/Sarılık & Pasta Kuvveti (D65 / A / F11 • CMC / CIEDE2000 / DIN 6172)</b>
      </div>
      <div class="lab3-content">
        <div class="inno-grid-3">
          <div class="inno-card">
            <h3>📏 Çoklu Işık Kaynağı Renk Farkları (D65, A, F11)</h3>
            <table class="inno-table">
              <thead><tr><th>Denklem</th><th>D65 (Gün Işığı)</th><th>A (Akkor)</th><th>F11 (TL84)</th></tr></thead>
              <tbody>
                <tr><td><b>CMC (2:1)</b></td><td><b>${cd.de_metrics.D65.CMC21}</b></td><td>${cd.de_metrics.A.CMC21}</td><td>${cd.de_metrics.F11.CMC21}</td></tr>
                <tr><td><b>CMC (1:1)</b></td><td><b>${cd.de_metrics.D65.CMC11}</b></td><td>${cd.de_metrics.A.CMC11}</td><td>${cd.de_metrics.F11.CMC11}</td></tr>
                <tr><td><b>CIEDE2000</b></td><td><b>${cd.de_metrics.D65.CIEDE2000}</b></td><td>${cd.de_metrics.A.CIEDE2000}</td><td>${cd.de_metrics.F11.CIEDE2000}</td></tr>
                <tr><td><b>CIE 1976</b></td><td><b>${cd.de_metrics.D65.CIE76}</b></td><td>${cd.de_metrics.A.CIE76}</td><td>${cd.de_metrics.F11.CIE76}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="inno-card">
            <h3>🔬 Metamerizm, Opaklık & Renk Şiddeti (Strength %)</h3>
            <table class="inno-table">
              <tr><td>DIN 6172 Metamerizm (D65 vs A / F11)</td><td><b>${cd.metamerism.mi_a}</b> / <b>${cd.metamerism.mi_f11}</b></td></tr>
              <tr><td>Kubelka-Munk Pasta Kuvveti (Strength)</td><td style="color:#22c55e;font-weight:700;">%${cd.indices.strength_pct}</td></tr>
              <tr><td>CIE Beyazlık İndeksi (WI / Tint)</td><td>${cd.indices.std_wi} (Tw=${cd.indices.std_tw})</td></tr>
              <tr><td>ASTM E313 Sarılık İndeksi (YI)</td><td>${cd.indices.std_yi} ➔ ${cd.indices.smp_yi}</td></tr>
              <tr><td>Kontrast Oranı (CR%) / Opaklık dE</td><td>%${cd.opacity.std_cr} (Opa dE=${cd.opacity.std_opade})</td></tr>
            </table>
          </div>
          <div class="inno-card">
            <h3>🎯 CIE ΔL*, Δa*, Δb*, ΔC*, ΔH* (D65)</h3>
            ${renderDeltaABSvg(0, 0, 0, cd.deltas_d65.da, cd.deltas_d65.db, cd.deltas_d65.dL)}
          </div>
        </div>
      </div>
    `;
  }

  async function renderTsrSolarScreen(pane) {
    if (!state.tsrResult) {
      const r = await fetch('/api/lab3/analysis/tsr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vis_refl: state.lab3.colours[0]?.refl || [85.0], nir_boost: 1.18 }),
      });
      state.tsrResult = await r.json();
    }
    const t = state.tsrResult;
    pane.innerHTML = `
      <div class="lab3-header-bar">
        <b>4.4 TSR — Toplam Güneş Yansıtma Analizi (ASTM E903 / ASTM G173 • 300–2500nm 221 Nokta)</b>
      </div>
      <div class="lab3-content">
        <div class="inno-grid-4">
          <div class="inno-card"><div class="inno-stat-num" style="color:#22c55e;">%${t.total_tsr}</div><div class="inno-stat-label">Toplam Solar Yansıtma (TSR 300-2500nm)</div></div>
          <div class="inno-card"><div class="inno-stat-num">%${t.uv_tsr}</div><div class="inno-stat-label">UV Bölgesi (300-390nm)</div></div>
          <div class="inno-card"><div class="inno-stat-num">%${t.vis_tsr}</div><div class="inno-stat-label">Görünür Bölge (400-700nm)</div></div>
          <div class="inno-card"><div class="inno-stat-num" style="color:#38bdf8;">%${t.nir_tsr}</div><div class="inno-stat-label">Yakın Kızılötesi NIR (710-2500nm)</div></div>
        </div>
        <div class="inno-card">
          <h3>☀️ 300nm – 2500nm Tam Güneş Spektrumu Yansıtma Eğrisi (221 Dalga Boyu Noktası)</h3>
          ${renderSpectralSvg([{ data: t.refl_221, color: '#f59e0b', label: 'TSR Solar Yansıtma (%)' }], 210, 300, 2500)}
        </div>
      </div>
    `;
  }

  function renderBarcodesScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar"><b>4.5 Barkod Eylemleri (BARCODEACTION)</b></div>
      <div class="lab3-content">
        <div class="inno-card">
          <table class="inno-table">
            <thead><tr><th>ID</th><th>Barkod</th><th>Hedef Tipi</th><th>Hedef Kodu</th><th>Açıklama</th></tr></thead>
            <tbody>
              ${state.lab3.barcodes.map((b) => `
                <tr><td>#${b.barcodeid}</td><td><code>${b.barcode}</code></td><td><span class="inno-badge">${b.target_type}</span></td><td><b>${b.target_code}</b></td><td>${b.description}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderQueueInventoryScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar"><b>4.6 Saha Envanteri & Dolum Kuyruğu (Site Inventory & Dispense Queue)</b></div>
      <div class="lab3-content">
        <div class="inno-card">
          <h3>🧾 Dolum Kuyruğu & Son Sipariş Kalemleri</h3>
          <table class="inno-table">
            <thead><tr><th>ID</th><th>Tarih</th><th>Renk</th><th>Ürün / Baz</th><th>Ambalaj</th><th>Durum</th></tr></thead>
            <tbody>
              ${state.lab3.dispense_queue.map((q) => `
                <tr>
                  <td>#${q.itemid}</td>
                  <td>${q.created_at}</td>
                  <td><b>${q.colourcode}</b> — ${q.colourname}</td>
                  <td>${q.productcode} / ${q.basecode}</td>
                  <td>${q.cansizecode}</td>
                  <td>${q.orderstatus === 2 ? '✅ Tamamlandı' : '⏳ Kuyrukta'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderOptionsScreen(pane) {
    pane.innerHTML = `
      <div class="lab3-header-bar"><b>5. Seçenekler (Options — Spektrofotometre, Dispenser, Etiket Yazıcı & Dil)</b></div>
      <div class="lab3-content">
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3>📡 Spektrofotometre & Dispenser Bağlantısı</h3>
            <p style="font-size:12px;color:#94a3b8;">Aktif Spektrofotometre: <b>X-Rite Ci6x / ColorDesigner Sphere (SPIN)</b> • Aktif Dispenser: <b>Chromaflo 16-Kanister Simültane</b></p>
            <button class="inno-btn" id="btn-opt-hw">🎛️ Donanım Simülatör Konsolunu Aç</button>
          </div>
          <div class="inno-card">
            <h3>🌐 Dil & Bölgesel Ayarlar</h3>
            <p style="font-size:12px;color:#94a3b8;">Arayüz Dili: <b>Türkçe (TR)</b> • Ondalık Ayırıcı: <b>. / ,</b> • Optik Motor: <b>%100 Saf Python Kubelka-Munk + Saunderson</b></p>
          </div>
        </div>
      </div>
    `;
    document.getElementById('btn-opt-hw').addEventListener('click', () => switchView('HARDWARE'));
  }

  // ==========================================================================
  // Virtual Hardware Console (Spectro + 16-Canister Dispenser)
  // ==========================================================================
  function renderHardwareConsole(overlay) {
    const hw = state.dashboard?.hardware || {};
    const spec = hw.spectro || { model: 'X-Rite Ci64 UV', staged_sample: { name: 'RAL 7016', hex: '#373F43', lab: [26.2, -1.1, -3.4], refl: [] } };
    const staged = spec.staged_sample || {};
    const mach = hw.machine || { name: 'Chromaflo 16K', status: 'Hazır', last_action: '-', history: [] };
    const canisters = hw.canisters || state.lab3?.canisters || [];

    overlay.innerHTML = `
      <div style="padding:18px 24px;overflow-y:auto;height:calc(100vh - 44px);">
        <div class="inno-grid-2">
          <div class="inno-card">
            <h3><span>📡 Sanal Spektrofotometre (${spec.model})</span><span class="inno-badge" style="background:#16a34a;">Kalibre Edildi</span></h3>
            <div class="inno-grid-2">
              <div>
                <label class="inno-label">Hazır Kartela Numunesi Seç</label>
                <select id="sim-preset-col" class="inno-select">
                  ${(state.lab3?.colours || []).map((c) => `
                    <option value="${c.hex_color}" data-name="${c.colourcode} ${c.colourname}" ${c.hex_color === staged.hex ? 'selected' : ''}>
                      ${c.colourcode} - ${c.colourname} (${c.hex_color})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="inno-label">Özel Renk Seç (HEX)</label>
                <input id="sim-custom-hex" type="color" class="inno-input" value="${staged.hex || '#373F43'}" style="height:32px;padding:2px;" />
              </div>
            </div>
            <div style="display:flex;gap:10px;margin:10px 0;">
              <button id="btn-stage-sample" class="inno-btn" style="flex:1;">🎯 Numuneyi Ölçüm Kafasına Yerleştir</button>
              <button id="btn-sim-measure" class="inno-btn inno-btn-success" style="flex:1;">⚡ Spektral Ölçüm Tetikle (400–700nm)</button>
            </div>
            ${renderSpectralSvg([{ data: (staged.refl || []).map((x) => x <= 1.05 ? x * 100 : x), color: '#38bdf8', label: staged.name }], 155)}
          </div>
          <div class="inno-card">
            <h3><span>⚙️ ${mach.name}</span><span class="inno-badge">${mach.status}</span></h3>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <button class="inno-btn inno-btn-success" id="btn-refill-all">💧 16 Kanisteri Tam Doldur (2500 ml)</button>
              <button class="inno-btn" id="btn-purge-all">🚿 Otomatik Nozul Purge</button>
              <button class="inno-btn inno-btn-secondary" id="btn-stir-all">🔄 Kanisterleri Karıştır (Stir)</button>
            </div>
            <div style="padding:8px 12px;background:#0f172a;border-radius:6px;border:1px solid #334155;font-size:12px;">
              <b>Son Makine İşlemi:</b> <span style="color:#22c55e;">${mach.last_action}</span>
            </div>
          </div>
        </div>
        <div class="inno-card">
          <h3>🧪 16 Kanister Anlık Pasta Seviyeleri (Canister Inventory)</h3>
          <div class="canister-grid">
            ${canisters.map((c) => {
              const pct = Math.round((c.level / c.maxLevel) * 100);
              const hex = '#' + Number(c.rgb).toString(16).padStart(6, '0');
              return `
                <div class="canister-box">
                  <div style="display:flex;justify-content:space-between;">
                    <span><span class="inno-swatch" style="background:${hex};width:14px;height:14px;"></span><b>#${c.index} ${c.code}</b></span>
                    <span style="font-size:11px;color:#94a3b8;">%${pct}</span>
                  </div>
                  <div class="canister-bar-bg"><div style="width:${pct}%;height:100%;background:${pct < 20 ? '#ef4444' : '#38bdf8'};"></div></div>
                  <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
                    <span>${c.level} / ${c.maxLevel} ml</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    const presetSel = document.getElementById('sim-preset-col');
    const hexInput = document.getElementById('sim-custom-hex');
    if (presetSel) presetSel.addEventListener('change', () => { hexInput.value = presetSel.value; });
    document.getElementById('btn-stage-sample')?.addEventListener('click', async () => {
      const opt = presetSel.selectedOptions[0];
      const name = opt ? opt.dataset.name : `Özel (${hexInput.value})`;
      await fetch('/api/hardware/spectro/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hex: hexInput.value, name }) });
      await loadAllData(); renderOverlay();
    });
    document.getElementById('btn-sim-measure')?.addEventListener('click', async () => {
      await fetch('/api/hardware/spectro/measure', { method: 'POST', body: '{}' });
      await loadAllData(); renderOverlay();
    });
    document.getElementById('btn-refill-all')?.addEventListener('click', async () => {
      await fetch('/api/hardware/machine/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refill_all' }) });
      await loadAllData(); renderOverlay();
    });
    document.getElementById('btn-purge-all')?.addEventListener('click', async () => {
      await fetch('/api/hardware/machine/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'purge_all' }) });
      await loadAllData(); renderOverlay();
    });
    document.getElementById('btn-stir-all')?.addEventListener('click', async () => {
      await fetch('/api/hardware/machine/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stir_all' }) });
      await loadAllData(); renderOverlay();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createTopBar(); loadAllData(); });
  } else {
    createTopBar(); loadAllData();
  }
})();

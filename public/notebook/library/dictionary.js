/* =====================================================
   HUNA7-OS — DICTIONARY
   Design token registry. Single source of CSS truth.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Dictionary = (() => {
  let _tokens = { ...Huna7.CONSTANTS.DEFAULT_THEME };
  let _styleEl = null;

  // Apply tokens to :root CSS variables
  const applyTokens = (tokens) => {
    _tokens = { ...tokens };
    if (!_styleEl) {
      _styleEl = document.createElement('style');
      _styleEl.id = 'huna7-tokens';
      document.head.appendChild(_styleEl);
    }
    _styleEl.textContent = generateCSS(tokens);
  };

  const generateCSS = (t) => `
    :root {
      --h7-accent: ${t.accent};
      --h7-accent-alt: ${t.accentAlt};
      --h7-bg: ${t.bg};
      --h7-bg-panel: ${t.bgPanel};
      --h7-bg-glass: ${t.bgGlass};
      --h7-bg-glass-hover: ${t.bgGlassHover};
      --h7-border: ${t.border};
      --h7-text: ${t.text};
      --h7-text-muted: ${t.textMuted};
      --h7-radius: ${t.radius};
      --h7-radius-sm: ${t.radiusSm};
      --h7-radius-lg: ${t.radiusLg};
      --h7-blur: ${t.blur};
      --h7-shadow: ${t.shadow};
      --h7-shadow-sm: ${t.shadowSm};
      --h7-font-display: ${t.fontDisplay};
      --h7-font-mono: ${t.fontMono};
      --h7-anim-speed: ${t.animSpeed};
    }

    /* Global base styles */
    * { box-sizing: border-box; }
    body { font-family: var(--h7-font-display); color: var(--h7-text); }

    /* Glass panel utility */
    .h7-glass {
      background: var(--h7-bg-glass);
      backdrop-filter: blur(var(--h7-blur));
      -webkit-backdrop-filter: blur(var(--h7-blur));
      border: 1px solid var(--h7-border);
      border-radius: var(--h7-radius);
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--h7-border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--h7-text-muted); }

    /* Button reset */
    .h7-btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 6px; cursor: pointer; border: none; outline: none;
      font-family: var(--h7-font-display); font-size: 13px; font-weight: 500;
      border-radius: var(--h7-radius-sm); padding: 7px 14px;
      transition: all var(--h7-anim-speed) ease;
      user-select: none; -webkit-user-select: none;
    }
    .h7-btn-accent {
      background: var(--h7-accent); color: #fff;
    }
    .h7-btn-accent:hover { filter: brightness(1.15); }
    .h7-btn-ghost {
      background: var(--h7-bg-glass); color: var(--h7-text);
      border: 1px solid var(--h7-border);
    }
    .h7-btn-ghost:hover { background: var(--h7-bg-glass-hover); }
    .h7-btn-danger { background: #e05252; color: #fff; }
    .h7-btn-danger:hover { background: #c94444; }

    /* Input */
    .h7-input {
      width: 100%; padding: 9px 13px;
      background: var(--h7-bg-glass); border: 1px solid var(--h7-border);
      border-radius: var(--h7-radius-sm); color: var(--h7-text);
      font-family: var(--h7-font-display); font-size: 14px; outline: none;
      transition: border-color var(--h7-anim-speed) ease;
    }
    .h7-input:focus { border-color: var(--h7-accent); }
    .h7-input::placeholder { color: var(--h7-text-muted); }

    /* Label */
    .h7-label {
      display: block; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--h7-text-muted); margin-bottom: 6px;
    }

    /* Context menu */
    .h7-context-menu {
      position: fixed; min-width: 180px; padding: 5px;
      background: var(--h7-bg-panel);
      backdrop-filter: blur(var(--h7-blur));
      -webkit-backdrop-filter: blur(var(--h7-blur));
      border: 1px solid var(--h7-border);
      border-radius: var(--h7-radius);
      box-shadow: var(--h7-shadow);
      z-index: ${Huna7.CONSTANTS.Z.CONTEXT_MENU};
      user-select: none;
    }
    .h7-context-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px; border-radius: var(--h7-radius-sm);
      font-size: 13px; cursor: pointer; color: var(--h7-text);
      transition: background var(--h7-anim-speed) ease;
    }
    .h7-context-item:hover { background: var(--h7-bg-glass-hover); }
    .h7-context-item.danger { color: #e05252; }
    .h7-context-divider {
      height: 1px; background: var(--h7-border); margin: 4px 0;
    }
  `;

  const get = (token) => _tokens[token];
  const getAll = () => ({ ..._tokens });

  // Generate wallpaper gradient CSS
  const getWallpaperCSS = (name) => {
    const wallpapers = {
      'gradient-aurora': 'linear-gradient(135deg, #0a0a1a 0%, #0d1b35 25%, #0a2040 50%, #061830 75%, #050e1a 100%)',
      'gradient-midnight': 'linear-gradient(160deg, #000008 0%, #0a0820 50%, #050312 100%)',
      'gradient-dusk': 'linear-gradient(135deg, #1a0a28 0%, #2d1050 30%, #1a0535 70%, #0a0215 100%)',
      'gradient-forest': 'linear-gradient(150deg, #020e05 0%, #071a0c 40%, #050f08 100%)',
      'gradient-ocean': 'linear-gradient(135deg, #020a14 0%, #04142a 40%, #020810 100%)',
    };
    return wallpapers[name] || wallpapers['gradient-aurora'];
  };

  return { applyTokens, generateCSS, get, getAll, getWallpaperCSS };
})();

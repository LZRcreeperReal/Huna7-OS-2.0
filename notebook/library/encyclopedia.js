/* =====================================================
   HUNA7-OS — ENCYCLOPEDIA
   Theme engine. Applies themes to the UI.
   Storage is handled by notebook/themes.js.
   These are separate responsibilities.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Encyclopedia = (() => {
  const BUILTIN_THEMES = {
    midnight: {
      name: 'Midnight', accent: '#5E7FFF', accentAlt: '#A78BFA',
      bg: '#0a0a0f', bgPanel: 'rgba(18,18,28,0.88)',
      bgGlass: 'rgba(255,255,255,0.06)', bgGlassHover: 'rgba(255,255,255,0.10)',
      border: 'rgba(255,255,255,0.10)', text: '#F0F0F8', textMuted: 'rgba(240,240,248,0.55)',
      radius: '12px', radiusSm: '8px', radiusLg: '18px',
      blur: '24px', shadow: '0 8px 32px rgba(0,0,0,0.5)', shadowSm: '0 2px 12px rgba(0,0,0,0.35)',
      fontDisplay: "'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      fontMono: "'SF Mono','Fira Code','Consolas',monospace",
      animSpeed: '220ms', wallpaper: 'gradient-aurora',
    },
    obsidian: {
      name: 'Obsidian', accent: '#00D4A0', accentAlt: '#00B8D4',
      bg: '#080808', bgPanel: 'rgba(12,12,12,0.92)',
      bgGlass: 'rgba(255,255,255,0.04)', bgGlassHover: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.08)', text: '#E8E8E8', textMuted: 'rgba(232,232,232,0.5)',
      radius: '10px', radiusSm: '6px', radiusLg: '16px',
      blur: '20px', shadow: '0 8px 32px rgba(0,0,0,0.6)', shadowSm: '0 2px 12px rgba(0,0,0,0.4)',
      fontDisplay: "'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      fontMono: "'SF Mono','Fira Code','Consolas',monospace",
      animSpeed: '180ms', wallpaper: 'gradient-midnight',
    },
    dusk: {
      name: 'Dusk', accent: '#FF6B9D', accentAlt: '#FF9A5C',
      bg: '#0f0a14', bgPanel: 'rgba(22,15,30,0.88)',
      bgGlass: 'rgba(255,255,255,0.05)', bgGlassHover: 'rgba(255,255,255,0.09)',
      border: 'rgba(255,255,255,0.09)', text: '#F5EFF8', textMuted: 'rgba(245,239,248,0.55)',
      radius: '14px', radiusSm: '9px', radiusLg: '20px',
      blur: '28px', shadow: '0 8px 36px rgba(0,0,0,0.45)', shadowSm: '0 2px 12px rgba(0,0,0,0.3)',
      fontDisplay: "'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      fontMono: "'SF Mono','Fira Code','Consolas',monospace",
      animSpeed: '250ms', wallpaper: 'gradient-dusk',
    },
    arctic: {
      name: 'Arctic', accent: '#2979FF', accentAlt: '#00B0FF',
      bg: '#f0f4f8', bgPanel: 'rgba(255,255,255,0.85)',
      bgGlass: 'rgba(0,0,0,0.04)', bgGlassHover: 'rgba(0,0,0,0.07)',
      border: 'rgba(0,0,0,0.10)', text: '#1a1a2e', textMuted: 'rgba(26,26,46,0.5)',
      radius: '12px', radiusSm: '8px', radiusLg: '18px',
      blur: '20px', shadow: '0 4px 24px rgba(0,0,0,0.12)', shadowSm: '0 2px 8px rgba(0,0,0,0.08)',
      fontDisplay: "'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      fontMono: "'SF Mono','Fira Code','Consolas',monospace",
      animSpeed: '200ms', wallpaper: 'gradient-ocean',
    },
  };

  let _current = null;

  // Init — load from Notebook.Themes storage first, fallback to localStorage
  const init = () => {
    const saved = Huna7.Notebook?.Themes?.getActive?.()
      || Huna7.Storage.getTheme();
    apply(saved || BUILTIN_THEMES.midnight);
  };

  // Apply a theme object — renders it AND persists it
  const apply = (theme) => {
    _current = { ...theme };
    Huna7.Dictionary.applyTokens(theme);

    // Persist via Notebook.Themes (storage layer)
    Huna7.Notebook?.Themes?.setActive?.(_current);
    // Also write to legacy storage key for backward compat
    Huna7.Storage.saveTheme(_current);

    // Sync preferences
    if (_current.name) Huna7.Notebook?.Preferences?.set?.('theme', _current.name.toLowerCase());

    Huna7.Binder.emit('theme:changed', _current);
  };

  const applyByName = (name) => {
    const key = name.toLowerCase();
    const builtin = BUILTIN_THEMES[key];
    if (builtin) { apply(builtin); return; }
    // Check custom themes
    const custom = Huna7.Notebook?.Themes?.getCustom?.();
    if (custom && custom[key]) { apply(custom[key]); return; }
    // Try to find by theme name string match
    const allCustom = custom || {};
    const match = Object.values(allCustom).find(t => t.name?.toLowerCase() === key);
    if (match) apply(match);
  };

  const getCurrent = () => _current ? { ..._current } : { ...BUILTIN_THEMES.midnight };

  const getBuiltins = () => ({ ...BUILTIN_THEMES });

  const getCustom = () => Huna7.Notebook?.Themes?.getCustom?.() || {};

  const getAllThemes = () => {
    const custom = getCustom();
    return {
      ...Object.fromEntries(Object.entries(BUILTIN_THEMES).map(([k,v]) => [k, { ...v, isBuiltin: true }])),
      ...Object.fromEntries(Object.entries(custom).map(([k,v]) => [k, { ...v, isBuiltin: false }])),
    };
  };

  const saveCustom = (key, theme) => {
    Huna7.Notebook?.Themes?.saveCustom?.(key, theme);
  };

  const deleteCustom = (key) => {
    Huna7.Notebook?.Themes?.deleteCustom?.(key);
  };

  const exportTheme = (name) => {
    const all = getAllThemes();
    const theme = all[name] || _current;
    Huna7.Notebook?.Themes?.exportTheme?.(theme);
  };

  const importTheme = (jsonStr) => {
    return Huna7.Notebook?.Themes?.importTheme?.(jsonStr) || { success: false, error: 'Themes subsystem not ready' };
  };

  return { init, apply, applyByName, getCurrent, getBuiltins, getCustom, getAllThemes, saveCustom, deleteCustom, exportTheme, importTheme };
})();

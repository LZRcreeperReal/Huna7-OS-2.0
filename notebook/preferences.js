/* =====================================================
   HUNA7-OS — NOTEBOOK: PREFERENCES
   User preferences. Immediate OS-wide propagation.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Preferences = (() => {
  const KEY = 'preferences';

  const DEFAULTS = {
    // Appearance
    theme:           'midnight',
    wallpaper:       'gradient-aurora',
    fontSize:         14,
    fontFamily:      'system',
    accentColor:     '#5E7FFF',
    // Animations
    animations:       true,
    animationSpeed:  'normal',   // 'slow' | 'normal' | 'fast' | 'off'
    // System behavior
    clock24h:         false,
    sounds:           false,
    notifications:    true,
    autosave:         true,
    // Accessibility
    reduceMotion:     false,
    highContrast:     false,
    largeText:        false,
    // Desktop
    dockAutohide:     false,
    dockSize:        'medium',
    dockPosition:    'bottom',
    desktopIconSize: 'medium',
    showGrid:         false,
    // Editor
    editorWordWrap:   true,
    editorLineNums:   true,
    editorTabSize:    2,
    // Terminal
    termFontSize:     13,
    termHistoryLimit: 500,
    // Explorer
    explorerView:    'list',
    explorerSort:    'name',
    explorerOrder:   'asc',
    showHiddenFiles:  false,
  };

  let _prefs = { ...DEFAULTS };

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    const stored = Huna7.Storage.get(KEY, {});
    _prefs = { ...DEFAULTS, ...stored };
    return { ..._prefs };
  };

  const seedDefaults = () => {
    const existing = Huna7.Storage.get(KEY);
    if (!existing) Huna7.Storage.set(KEY, { ...DEFAULTS });
    _prefs = { ...DEFAULTS };
  };

  // ── Get / Set ─────────────────────────────────────────

  const get = (key, fallback) => {
    if (key === undefined) return { ..._prefs };
    return _prefs[key] !== undefined ? _prefs[key] : (fallback !== undefined ? fallback : DEFAULTS[key]);
  };

  const set = (key, value) => {
    if (typeof key === 'object') {
      Object.assign(_prefs, key);
    } else {
      _prefs[key] = value;
    }
    _persist();
    Huna7.Binder.emit('preferences:changed', typeof key === 'object' ? key : { [key]: value });
    _propagate(typeof key === 'object' ? key : { [key]: value });
    return { ..._prefs };
  };

  const toggle = (key) => set(key, !_prefs[key]);

  const reset = (key) => {
    if (key) {
      _prefs[key] = DEFAULTS[key];
      _persist();
      Huna7.Binder.emit('preferences:changed', { [key]: _prefs[key] });
    } else {
      _prefs = { ...DEFAULTS };
      _persist();
      Huna7.Binder.emit('preferences:changed', { ..._prefs });
    }
  };

  // ── Propagation ───────────────────────────────────────

  const _propagate = (changed) => {
    if ('theme' in changed) Huna7.Encyclopedia?.applyByName(changed.theme);
    if ('wallpaper' in changed) Huna7.Blackboard?.updateWallpaper(changed.wallpaper);
    if ('animationSpeed' in changed) _applyAnimSpeed(changed.animationSpeed);
    if ('reduceMotion' in changed && changed.reduceMotion) _applyAnimSpeed('off');
  };

  const _applyAnimSpeed = (speed) => {
    const speeds = { slow: '400ms', normal: '220ms', fast: '120ms', off: '0ms' };
    const v = speeds[speed] || '220ms';
    document.documentElement.style.setProperty('--h7-anim-speed', v);
  };

  const _persist = () => Huna7.Storage.set(KEY, _prefs);

  return { load, seedDefaults, get, set, toggle, reset, DEFAULTS };
})();

/* =====================================================
   HUNA7-OS — NOTEBOOK: WALLPAPER
   Wallpaper persistence. Gradient + image support.
   Future-ready for animated wallpapers.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Wallpaper = (() => {
  const KEY         = 'wallpaper';
  const HISTORY_KEY = 'wallpaper_history';
  const MAX_HISTORY = 5;

  const TYPES = {
    GRADIENT: 'gradient',
    IMAGE:    'image',
    SOLID:    'solid',
    ANIMATED: 'animated',   // future
  };

  const DEFAULT = {
    type:  TYPES.GRADIENT,
    value: 'gradient-aurora',
    opacity: 1,
    blur:    0,
    fit:    'cover',
  };

  let _current = { ...DEFAULT };

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    const stored = Huna7.Storage.get(KEY);
    if (stored) _current = { ...DEFAULT, ...stored };
    return { ..._current };
  };

  // ── Get / Set ─────────────────────────────────────────

  const getCurrent = () => ({ ..._current });

  const setGradient = (name) => {
    _set({ type: TYPES.GRADIENT, value: name });
  };

  const setSolid = (color) => {
    _set({ type: TYPES.SOLID, value: color });
  };

  /**
   * Set a custom image wallpaper.
   * @param {string} dataUrl  base64 data URL
   */
  const setImage = (dataUrl) => {
    _set({ type: TYPES.IMAGE, value: dataUrl });
  };

  const setOpacity = (val) => {
    _current.opacity = Math.max(0, Math.min(1, val));
    _persist();
    _emit();
  };

  const setBlur = (val) => {
    _current.blur = Math.max(0, Math.min(40, val));
    _persist();
    _emit();
  };

  // ── CSS generation ────────────────────────────────────

  /**
   * Returns a CSS string suitable for a background property.
   */
  const toCSS = (wp = _current) => {
    if (!wp) return Huna7.Dictionary.getWallpaperCSS(DEFAULT.value);
    switch (wp.type) {
      case TYPES.GRADIENT:
        return Huna7.Dictionary.getWallpaperCSS(wp.value);
      case TYPES.SOLID:
        return wp.value || '#000';
      case TYPES.IMAGE:
        return `url("${wp.value}")`;
      default:
        return Huna7.Dictionary.getWallpaperCSS(DEFAULT.value);
    }
  };

  // ── History ───────────────────────────────────────────

  const getHistory = () => Huna7.Storage.get(HISTORY_KEY, []);

  const _addHistory = (entry) => {
    // Store only gradient/solid in history (images are too large)
    if (entry.type === TYPES.IMAGE) return;
    const hist = getHistory().filter(h => h.value !== entry.value);
    hist.unshift(entry);
    Huna7.Storage.set(HISTORY_KEY, hist.slice(0, MAX_HISTORY));
  };

  // ── Internals ─────────────────────────────────────────

  const _set = (partial) => {
    _current = { ...DEFAULT, ..._current, ...partial };
    _persist();
    _addHistory(_current);
    _emit();
  };

  const _persist = () => {
    // Don't persist image data URLs > 500KB in localStorage
    const toSave = _current.type === TYPES.IMAGE && _current.value?.length > 500000
      ? { ..._current, value: DEFAULT.value, type: TYPES.GRADIENT }
      : _current;
    Huna7.Storage.set(KEY, toSave);
  };

  const _emit = () => {
    Huna7.Binder.emit('wallpaper:changed', { ..._current, css: toCSS() });
  };

  return {
    TYPES, load, getCurrent,
    setGradient, setSolid, setImage, setOpacity, setBlur,
    toCSS, getHistory,
  };
})();

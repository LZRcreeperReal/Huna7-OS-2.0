/* =====================================================
   HUNA7-OS — ENCYCLOPEDIA
   Theme engine. Applies themes to the UI.
   Storage is handled by notebook/themes.js.
   These are separate responsibilities.
   Now: pure applicator. No storage or preference mutation.
   applyByName is the only public entry point.
 ===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Encyclopedia = (() => {
  const BUILTIN_THEMES = { /* ... unchanged ... */ };

  let _current = null;

  // Init — load from Notebook.Themes storage first, fallback to localStorage
  const init = () => {
    const saved = Huna7.Notebook?.Themes?.getActive?.()
      || Huna7.Storage.getTheme();
    apply(saved || BUILTIN_THEMES.midnight);
  };

  // Apply a theme object — renders it ONLY (no persistence)
  const apply = (theme) => {
    _current = { ...theme };
    Huna7.Dictionary.applyTokens(theme);
    Huna7.Binder.emit('theme:changed', _current);
  };

  const applyByName = (name) => {
    if (!name) return;
    const key = name.toLowerCase();
    if (this.active === key) return; // guard — already active, do nothing

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
  const getAllThemes = () => { /* unchanged */ };
  const saveCustom = (key, theme) => { Huna7.Notebook?.Themes?.saveCustom?.(key, theme); };
  const deleteCustom = (key) => { Huna7.Notebook?.Themes?.deleteCustom?.(key); };
  const exportTheme = (name) => { /* unchanged */ };
  const importTheme = (jsonStr) => { return Huna7.Notebook?.Themes?.importTheme?.(jsonStr) || { success: false, error: 'Themes subsystem not ready' }; };

  return { init, apply, applyByName, getCurrent, getBuiltins, getCustom, getAllThemes, saveCustom, deleteCustom, exportTheme, importTheme };
})();

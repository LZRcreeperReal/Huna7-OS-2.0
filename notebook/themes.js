/* =====================================================
   HUNA7-OS — NOTEBOOK: THEMES
   Theme persistence layer.
   Storage & retrieval only.
   library/encyclopedia.js handles rendering/application.
   setActive is now idempotent.
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Themes = (() => {
  const ACTIVE_KEY  = 'active_theme';
  const CUSTOM_KEY  = 'custom_themes';
  const HISTORY_KEY = 'theme_history';
  const MAX_HISTORY = 10;

  let _customThemes = {};
  let _activeTheme  = null;   // renamed for clarity (was _active)

  // ── Lifecycle ─────────────────────────────────────────
  const load = () => {
    _customThemes = Huna7.Storage.get(CUSTOM_KEY, {});
    _activeTheme  = Huna7.Storage.get(ACTIVE_KEY, null);
    return _activeTheme;
  };

  // ── Active Theme ──────────────────────────────────────
  const getActive = () => _activeTheme ? { ..._activeTheme } : null;

  const setActive = (theme) => {
    if (!theme) return;
    const name = theme.name || 'unknown';
    if (_activeTheme && _activeTheme.name === name) return; // guard — already active

    _activeTheme = { ...theme };
    Huna7.Storage.set(ACTIVE_KEY, _activeTheme);
    _addToHistory(name);
    Huna7.Binder.emit('themes:active_changed', { ..._activeTheme });
  };

  // ── Custom Themes ─────────────────────────────────────
  const saveCustom = (key, theme) => {
    _customThemes[key] = { ...theme };
    Huna7.Storage.set(CUSTOM_KEY, _customThemes);
    Huna7.Binder.emit('themes:custom_saved', { key, theme });
  };

  const deleteCustom = (key) => {
    delete _customThemes[key];
    Huna7.Storage.set(CUSTOM_KEY, _customThemes);
    Huna7.Binder.emit('themes:custom_deleted', { key });
  };

  const getCustom = () => ({ ..._customThemes });
  const getAllKeys = () => Object.keys(_customThemes);

  // ── Import / Export ───────────────────────────────────
  const exportTheme = (theme) => { /* unchanged */ };
  const importTheme = (jsonStr) => { /* unchanged */ };

  // ── History ───────────────────────────────────────────
  const getHistory = () => Huna7.Storage.get(HISTORY_KEY, []);
  const _addToHistory = (name) => { /* unchanged */ };
  const clearHistory = () => Huna7.Storage.remove(HISTORY_KEY);

  return {
    load, getActive, setActive,
    saveCustom, deleteCustom, getCustom, getAllKeys,
    exportTheme, importTheme,
    getHistory, clearHistory,
  };
})();

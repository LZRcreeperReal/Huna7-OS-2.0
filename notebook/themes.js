/* =====================================================
   HUNA7-OS — NOTEBOOK: THEMES
   Theme persistence layer.
   Storage & retrieval only.
   library/encyclopedia.js handles rendering/application.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Themes = (() => {
  const ACTIVE_KEY  = 'active_theme';
  const CUSTOM_KEY  = 'custom_themes';
  const HISTORY_KEY = 'theme_history';
  const MAX_HISTORY = 10;

  let _customThemes = {};
  let _activeTheme  = null;

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    _customThemes = Huna7.Storage.get(CUSTOM_KEY, {});
    _activeTheme  = Huna7.Storage.get(ACTIVE_KEY, null);
    return _activeTheme;
  };

  // ── Active Theme ──────────────────────────────────────

  const getActive = () => _activeTheme ? { ..._activeTheme } : null;

  const setActive = (theme) => {
    _activeTheme = { ...theme };
    Huna7.Storage.set(ACTIVE_KEY, _activeTheme);
    _addToHistory(theme.name || 'unknown');
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

  const exportTheme = (theme) => {
    const json = JSON.stringify(theme, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (theme.name || 'theme').replace(/\s+/g, '-').toLowerCase() + '.theme';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (jsonStr) => {
    try {
      const theme = JSON.parse(jsonStr);
      if (!theme.name || !theme.accent) throw new Error('Invalid theme format');
      const key = theme.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
      saveCustom(key, theme);
      return { success: true, key, theme };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // ── History ───────────────────────────────────────────

  const getHistory = () => Huna7.Storage.get(HISTORY_KEY, []);

  const _addToHistory = (name) => {
    const hist = getHistory().filter(n => n !== name);
    hist.unshift(name);
    Huna7.Storage.set(HISTORY_KEY, hist.slice(0, MAX_HISTORY));
  };

  const clearHistory = () => Huna7.Storage.remove(HISTORY_KEY);

  return {
    load, getActive, setActive,
    saveCustom, deleteCustom, getCustom, getAllKeys,
    exportTheme, importTheme,
    getHistory, clearHistory,
  };
})();

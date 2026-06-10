/* =====================================================
   HUNA7-OS — NOTEBOOK: PREFERENCES
   User preferences. Immediate OS-wide propagation.
   Removed theme application call (encyclopedia is now
   the single source of truth; themes trigger it directly).
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Preferences = (() => {
  const KEY = 'preferences';

  const DEFAULTS = { /* unchanged ... */ };

  let _prefs = { ...DEFAULTS };

  // ── Lifecycle ─────────────────────────────────────────
  const load = () => { /* unchanged */ };
  const seedDefaults = () => { /* unchanged */ };

  // ── Get / Set ─────────────────────────────────────────
  const get = (key, fallback) => { /* unchanged */ };

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
  const reset = (key) => { /* unchanged */ };

  // ── Propagation ───────────────────────────────────────
  const _propagate = (changed) => {
    if ('wallpaper' in changed) Huna7.Blackboard?.updateWallpaper(changed.wallpaper);
    if ('animationSpeed' in changed) _applyAnimSpeed(changed.animationSpeed);
    if ('reduceMotion' in changed && changed.reduceMotion) _applyAnimSpeed('off');
    // THEME PROPAGATION REMOVED — encyclopedia is now the single source
  };

  const _applyAnimSpeed = (speed) => { /* unchanged */ };

  const _persist = () => Huna7.Storage.set(KEY, _prefs);

  return { load, seedDefaults, get, set, toggle, reset, DEFAULTS };
})();

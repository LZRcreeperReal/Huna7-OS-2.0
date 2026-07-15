/* =====================================================
   HUNA7-OS — NOTEBOOK: STARTUP-APPS
   Startup application manager.
   Integrates with startup/launch.js.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.StartupApps = (() => {
  const KEY = 'startup_apps';

  // Default apps to launch on every boot
  const DEFAULTS = [
    // { appId: 'clock', delay: 0, options: {} },
  ];

  let _apps = [...DEFAULTS];

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    _apps = Huna7.Storage.get(KEY, [...DEFAULTS]);
    return [..._apps];
  };

  // ── Registration ──────────────────────────────────────

  /**
   * Register an app to launch on startup.
   * @param {string} appId
   * @param {number} delay   ms after desktop ready
   * @param {object} options passed to app launch
   */
  const register = (appId, delay = 0, options = {}) => {
    if (_apps.find(a => a.appId === appId)) return; // already registered
    _apps.push({ appId, delay, options });
    _persist();
    Huna7.Binder.emit('startup:app_registered', { appId });
  };

  const unregister = (appId) => {
    _apps = _apps.filter(a => a.appId !== appId);
    _persist();
    Huna7.Binder.emit('startup:app_unregistered', { appId });
  };

  const isRegistered = (appId) => _apps.some(a => a.appId === appId);

  const getAll = () => [..._apps];

  // ── Execution ─────────────────────────────────────────

  /**
   * Launch all registered startup apps.
   * Called by startup/launch.js after desktop is ready.
   */
  const launchAll = () => {
    const sorted = [..._apps].sort((a, b) => (a.delay || 0) - (b.delay || 0));
    sorted.forEach(({ appId, delay, options }) => {
      Huna7.Schedule.delay(() => {
        try { Huna7.Chalk.spawn(appId, options || {}); }
        catch (e) { console.warn('[StartupApps] Failed to launch:', appId, e); }
      }, delay || 0, `startup.${appId}`);
    });
  };

  // ── User-facing ───────────────────────────────────────

  /**
   * Reorder startup apps.
   * @param {string[]} orderedIds
   */
  const reorder = (orderedIds) => {
    const map = new Map(_apps.map(a => [a.appId, a]));
    _apps = orderedIds.map(id => map.get(id)).filter(Boolean);
    _persist();
  };

  const setDelay = (appId, delay) => {
    const app = _apps.find(a => a.appId === appId);
    if (app) { app.delay = delay; _persist(); }
  };

  const reset = () => {
    _apps = [...DEFAULTS];
    _persist();
  };

  const _persist = () => Huna7.Storage.set(KEY, _apps);

  return { load, register, unregister, isRegistered, getAll, launchAll, reorder, setDelay, reset };
})();

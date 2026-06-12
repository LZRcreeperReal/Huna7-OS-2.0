/* =====================================================
   HUNA7-OS — BLUEPRINT
   Configuration management for the OS and apps.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Blueprint = (() => {
  const _configs = new Map();

  const define = (namespace, defaults) => {
    const stored = Huna7.Storage.get('config_' + namespace, {});
    _configs.set(namespace, { ...defaults, ...stored });
  };

  const get = (namespace, key) => {
    const cfg = _configs.get(namespace) || {};
    return key ? cfg[key] : { ...cfg };
  };

  const set = (namespace, key, value) => {
    const cfg = _configs.get(namespace) || {};
    if (typeof key === 'object') Object.assign(cfg, key);
    else cfg[key] = value;
    _configs.set(namespace, cfg);
    Huna7.Storage.set('config_' + namespace, cfg);
    Huna7.Binder.emit('config:changed', { namespace, key, value });
  };

  const reset = (namespace) => {
    Huna7.Storage.remove('config_' + namespace);
    _configs.delete(namespace);
  };

  // Pre-define OS-level configs
  const initDefaults = () => {
    define('desktop', { showGrid: false, iconSize: 'medium', wallpaper: 'gradient-aurora' });
    define('dock', { autohide: false, size: 'medium', position: 'bottom' });
    define('system', { animations: true, sounds: false, notifications: true, clock24h: false });
    define('terminal', { fontSize: 13, fontFamily: 'mono', historyLimit: 500, promptChar: '>' });
    define('writer', { wordWrap: true, showLineNumbers: false, fontSize: 14, autosave: true });
    define('explorer', { view: 'list', sortBy: 'name', sortOrder: 'asc', showHidden: false });
  };

  return { define, get, set, reset, initDefaults };
})();

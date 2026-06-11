/* =====================================================
   HUNA7-OS — NOTEBOOK: REGISTRY
   Central configuration registry.
   Single authoritative source for all OS config.
   All modules query here instead of storing duplicates.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Registry = (() => {
  const KEY = 'registry';

  const DEFAULTS = {
    // OS metadata
    'os.version':     Huna7.CONSTANTS.VERSION,
    'os.name':        Huna7.CONSTANTS.OS_NAME,
    'os.installDate': null,
    'os.lastBoot':    null,

    // Installed apps (builtin)
    'apps.installed': [
      'explorer','terminal','taskmanager','themes','settings',
      'calculator','clock','media','orbit','voxstudio',
      'monitor','notes','images','audio','workspace','packagecenter',
    ],
    'apps.disabled': [],

    // Dock order
    'dock.order': ['explorer','terminal','writer','notes','voxstudio','orbit','settings','monitor','calculator','themes'],

    // Desktop
    'desktop.icons': [],
    'desktop.gridSnap': false,

    // Startup
    'startup.enabled': true,
    'startup.apps': [],
    'startup.delay': 500,

    // Window manager
    'wm.snapEnabled': true,
    'wm.snapThreshold': 20,
    'wm.defaultWidth': 760,
    'wm.defaultHeight': 520,
    'wm.rememberPositions': true,

    // Notifications
    'notifications.enabled': true,
    'notifications.sound': false,
    'notifications.duration': 4000,

    // File associations
    'files.associations': {
      '.note':   'writer',
      '.pencil': 'voxstudio',
      '.data':   'writer',
      '.theme':  'themes',
      '.jpg':    'images',
      '.jpeg':   'images',
      '.png':    'images',
      '.gif':    'images',
      '.svg':    'images',
      '.mp3':    'audio',
      '.ogg':    'audio',
      '.wav':    'audio',
    },

    // System flags
    'flags.firstBoot': true,
    'flags.tutorialShown': false,
    'flags.setupComplete': false,
  };

  let _reg = {};

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    const stored = Huna7.Storage.get(KEY, {});
    _reg = { ...DEFAULTS, ...stored };
    return _reg;
  };

  const seedDefaults = () => {
    const existing = Huna7.Storage.get(KEY, {});
    // Merge — don't overwrite existing values
    _reg = { ...DEFAULTS, ...existing };
    _reg['os.installDate'] = _reg['os.installDate'] || Date.now();
    _reg['flags.setupComplete'] = true;
    _persist();
  };

  // ── Read ──────────────────────────────────────────────

  const get = (key, fallback) => {
    if (key === undefined) return { ..._reg };
    return _reg[key] !== undefined ? _reg[key] : (fallback !== undefined ? fallback : DEFAULTS[key]);
  };

  const getSection = (prefix) => {
    const result = {};
    Object.entries(_reg).forEach(([k, v]) => {
      if (k.startsWith(prefix + '.')) result[k.slice(prefix.length + 1)] = v;
    });
    return result;
  };

  // ── Write ─────────────────────────────────────────────

  const set = (key, value) => {
    if (typeof key === 'object') {
      Object.assign(_reg, key);
    } else {
      _reg[key] = value;
    }
    _persist();
    Huna7.Binder.emit('registry:changed', typeof key === 'object' ? key : { [key]: value });
    return value;
  };

  const del = (key) => {
    delete _reg[key];
    _persist();
  };

  // ── App Registry ──────────────────────────────────────

  const isAppInstalled = (appId) => (_reg['apps.installed'] || []).includes(appId);
  const isAppDisabled  = (appId) => (_reg['apps.disabled']  || []).includes(appId);

  const installApp = (appId, meta = {}) => {
    const installed = [...(_reg['apps.installed'] || [])];
    if (!installed.includes(appId)) installed.push(appId);
    set('apps.installed', installed);
    if (meta.name) set(`apps.${appId}.name`, meta.name);
    if (meta.icon) set(`apps.${appId}.icon`, meta.icon);
    if (meta.version) set(`apps.${appId}.version`, meta.version);
    Huna7.Binder.emit('registry:app_installed', { appId, meta });
  };

  const uninstallApp = (appId) => {
    set('apps.installed', (_reg['apps.installed'] || []).filter(id => id !== appId));
    Huna7.Binder.emit('registry:app_uninstalled', { appId });
  };

  // ── File Associations ─────────────────────────────────

  const getAppForFile = (filename) => {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    const assoc = _reg['files.associations'] || {};
    return assoc[ext] || null;
  };

  const setFileAssociation = (ext, appId) => {
    const assoc = { ...(_reg['files.associations'] || {}) };
    assoc[ext] = appId;
    set('files.associations', assoc);
  };

  // ── Boot tracking ─────────────────────────────────────

  const recordBoot = () => {
    set('os.lastBoot', Date.now());
    set('flags.firstBoot', false);
  };

  const _persist = () => Huna7.Storage.set(KEY, _reg);

  return {
    load, seedDefaults, get, getSection, set, del,
    isAppInstalled, isAppDisabled, installApp, uninstallApp,
    getAppForFile, setFileAssociation, recordBoot,
  };
})();

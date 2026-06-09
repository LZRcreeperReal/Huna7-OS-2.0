/* =====================================================
   HUNA7-OS — COMPASS
   Service registry. Track, discover, lifecycle.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Compass = (() => {
  const _services = new Map();

  const register = (name, service, meta = {}) => {
    if (_services.has(name)) console.warn(`[Compass] Overwriting service: ${name}`);
    _services.set(name, { name, service, meta, registered: Date.now(), status: 'active' });
    Huna7.Binder.emit('service:registered', { name, meta });
    return service;
  };

  const get = (name) => {
    const entry = _services.get(name);
    if (!entry) throw new Error(`[Compass] Service not found: ${name}`);
    return entry.service;
  };

  const has = (name) => _services.has(name);

  const unregister = (name) => {
    _services.delete(name);
    Huna7.Binder.emit('service:unregistered', { name });
  };

  const setStatus = (name, status) => {
    const entry = _services.get(name);
    if (entry) { entry.status = status; _services.set(name, entry); }
  };

  const list = () =>
    Array.from(_services.values()).map(({ name, meta, registered, status }) => ({
      name, meta, registered, status,
    }));

  // Register all core OS services
  const initCoreServices = () => {
    register('fs',       Huna7.VFS,         { desc: 'Virtual File System' });
    register('folder',   Huna7.Folder,      { desc: 'Directory Manager' });
    register('archive',  Huna7.Archive,     { desc: 'Import/Export' });
    register('theme',    Huna7.Encyclopedia, { desc: 'Theme Engine' });
    register('tokens',   Huna7.Dictionary,  { desc: 'Design Tokens' });
    register('icons',    Huna7.Glossary,    { desc: 'Icon System' });
    register('security', Huna7.Security,    { desc: 'Auth & Crypto' });
    register('storage',  Huna7.Storage,     { desc: 'Persistent Storage' });
    register('helpers',  Huna7.Helpers,     { desc: 'Utilities' });
    register('anim',     Huna7.Animations,  { desc: 'Animation Engine' });
    register('motion',   Huna7.Indexer,     { desc: 'UI Motion' });
  };

  return { register, get, has, unregister, setStatus, list, initCoreServices };
})();

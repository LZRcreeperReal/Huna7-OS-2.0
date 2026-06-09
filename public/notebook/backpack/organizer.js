/* =====================================================
   HUNA7-OS — ORGANIZER
   IndexedDB abstraction layer. All storage ops go here.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Organizer = (() => {
  let _db = null;
  const DB_NAME = Huna7.CONSTANTS.DB_NAME;
  const DB_VERSION = Huna7.CONSTANTS.DB_VERSION;
  const STORES = { FS: 'filesystem', META: 'metadata', PREFS: 'prefs' };

  const init = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _db = req.result; resolve(); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.FS)) {
        const fs = db.createObjectStore(STORES.FS, { keyPath: 'path' });
        fs.createIndex('parent', 'parent', { unique: false });
        fs.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.PREFS)) {
        db.createObjectStore(STORES.PREFS, { keyPath: 'key' });
      }
    };
  });

  // Generic transaction helper
  const tx = (storeName, mode, fn) => new Promise((resolve, reject) => {
    if (!_db) { reject(new Error('DB not initialized')); return; }
    const transaction = _db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  // Filesystem store operations
  const fs = {
    put: (entry) => tx(STORES.FS, 'readwrite', (s) => s.put(entry)),
    get: (path) => tx(STORES.FS, 'readonly', (s) => s.get(path)),
    delete: (path) => tx(STORES.FS, 'readwrite', (s) => s.delete(path)),
    getByParent: (parent) => new Promise((resolve, reject) => {
      if (!_db) { reject(new Error('DB not initialized')); return; }
      const t = _db.transaction(STORES.FS, 'readonly');
      const s = t.objectStore(STORES.FS);
      const idx = s.index('parent');
      const req = idx.getAll(parent);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }),
    getAll: () => new Promise((resolve, reject) => {
      if (!_db) { reject(new Error('DB not initialized')); return; }
      const t = _db.transaction(STORES.FS, 'readonly');
      const req = t.objectStore(STORES.FS).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }),
    clear: () => new Promise((resolve, reject) => {
      if (!_db) { reject(new Error('DB not initialized')); return; }
      const t = _db.transaction(STORES.FS, 'readwrite');
      const req = t.objectStore(STORES.FS).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }),
  };

  // Metadata store (key/value for system metadata)
  const meta = {
    set: (key, value) => tx(STORES.META, 'readwrite', (s) => s.put({ key, value })),
    get: (key) => tx(STORES.META, 'readonly', (s) => s.get(key)).then(r => r?.value ?? null),
    delete: (key) => tx(STORES.META, 'readwrite', (s) => s.delete(key)),
    clear: () => new Promise((resolve, reject) => {
      if (!_db) { reject(); return; }
      const req = _db.transaction(STORES.META, 'readwrite').objectStore(STORES.META).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }),
  };

  // Wipe all IndexedDB data
  const wipeAll = () => new Promise((resolve) => {
    if (!_db) { resolve(); return; }
    _db.close();
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => { _db = null; resolve(); };
    req.onerror = () => resolve();
  });

  const isReady = () => !!_db;

  return { init, fs, meta, wipeAll, isReady, STORES };
})();

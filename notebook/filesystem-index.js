/* =====================================================
   HUNA7-OS — NOTEBOOK: FILESYSTEM-INDEX
   Fast file lookup layer. Metadata cache + search index.
   Works alongside backpack/notebook.js (VFS).
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.FilesystemIndex = (() => {
  let _cache   = new Map();  // path → entry
  let _byParent= new Map();  // parentPath → Set<path>
  let _built   = false;

  // ── Build / Rebuild ───────────────────────────────────

  const build = async () => {
    _cache.clear();
    _byParent.clear();
    const all = await Huna7.Organizer.fs.getAll().catch(() => []);
    for (const entry of all) _index(entry);
    _built = true;
    Huna7.Binder.emit('fsindex:built', { count: _cache.size });
  };

  const _index = (entry) => {
    if (!entry?.path) return;
    _cache.set(entry.path, entry);
    const parent = entry.parent || '/';
    if (!_byParent.has(parent)) _byParent.set(parent, new Set());
    _byParent.get(parent).add(entry.path);
  };

  const _deindex = (path) => {
    const entry = _cache.get(path);
    if (!entry) return;
    _cache.delete(path);
    const parent = entry.parent || '/';
    _byParent.get(parent)?.delete(path);
  };

  // Keep index in sync with VFS events
  const _bindEvents = () => {
    Huna7.Binder.on('fs:changed', async ({ path, op, dest }) => {
      if (op === 'create' || op === 'update') {
        const entry = await Huna7.Organizer.fs.get(path).catch(() => null);
        if (entry) _index(entry);
      } else if (op === 'delete') {
        _deindex(path);
      } else if (op === 'move' && dest) {
        _deindex(path);
        const entry = await Huna7.Organizer.fs.get(dest).catch(() => null);
        if (entry) _index(entry);
      } else if (op === 'import') {
        await build();
      }
    });
  };

  // ── Lookup ────────────────────────────────────────────

  /** Get a single entry instantly (O(1)). */
  const get = (path) => _cache.get(Huna7.Helpers.normalizePath(path)) || null;

  /** List direct children of a directory (O(n_children)). */
  const listDir = (dirPath) => {
    dirPath = Huna7.Helpers.normalizePath(dirPath);
    const paths = _byParent.get(dirPath);
    if (!paths) return [];
    return Array.from(paths).map(p => _cache.get(p)).filter(Boolean);
  };

  /** Check existence instantly. */
  const exists = (path) => _cache.has(Huna7.Helpers.normalizePath(path));

  // ── Search ────────────────────────────────────────────

  /**
   * Full-text search across name + content.
   * Returns entries sorted by relevance (name match first).
   */
  const search = (query, startPath = '/') => {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];
    for (const [path, entry] of _cache) {
      if (!path.startsWith(startPath)) continue;
      const nameMatch    = entry.name?.toLowerCase().includes(q);
      const contentMatch = entry.content?.toLowerCase().includes(q);
      if (nameMatch || contentMatch) {
        results.push({ ...entry, _score: nameMatch ? 2 : 1 });
      }
    }
    return results.sort((a, b) => b._score - a._score || b.modified - a.modified);
  };

  // ── Recent ────────────────────────────────────────────

  const getRecent = (limit = 10) => {
    return Array.from(_cache.values())
      .filter(e => e.type === 'file')
      .sort((a, b) => b.modified - a.modified)
      .slice(0, limit);
  };

  // ── Stats ─────────────────────────────────────────────

  const getStats = () => {
    let files = 0, dirs = 0, totalSize = 0;
    for (const e of _cache.values()) {
      if (e.type === 'file') { files++; totalSize += e.size || 0; }
      else dirs++;
    }
    return { files, dirs, totalSize, totalEntries: _cache.size };
  };

  // ── Path resolution ───────────────────────────────────

  /** Resolve a path that might be relative to a cwd. */
  const resolve = (path, cwd = '/') => {
    if (path.startsWith('/')) return Huna7.Helpers.normalizePath(path);
    return Huna7.Helpers.normalizePath(cwd + '/' + path);
  };

  /** Return breadcrumb array for a path. */
  const breadcrumbs = (path) => {
    const parts = Huna7.Helpers.normalizePath(path).split('/').filter(Boolean);
    const crumbs = [{ name: 'Root', path: '/' }];
    let built = '';
    parts.forEach(p => { built += '/' + p; crumbs.push({ name: p, path: built }); });
    return crumbs;
  };

  const isReady = () => _built;

  const init = async () => {
    await build();
    _bindEvents();
  };

  return { init, build, get, listDir, exists, search, getRecent, getStats, resolve, breadcrumbs, isReady };
})();

// Convenient alias used throughout the OS (VFS = Virtual File System facade)

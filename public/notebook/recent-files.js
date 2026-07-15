/* =====================================================
   HUNA7-OS — NOTEBOOK: RECENT-FILES
   Recent activity tracking.
   Used by Explorer, Writer, VoxStudio, Launcher.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.RecentFiles = (() => {
  const KEY        = 'recent_files';
  const KEY_DIRS   = 'recent_dirs';
  const KEY_PROJ   = 'recent_projects';
  const KEY_SCRIPTS= 'recent_scripts';
  const MAX        = 20;

  // ── Core ──────────────────────────────────────────────

  const _load = (k) => Huna7.Storage.get(k, []);
  const _save = (k, arr) => Huna7.Storage.set(k, arr.slice(0, MAX));

  const _add = (storageKey, entry) => {
    let list = _load(storageKey);
    // Remove duplicate by path
    list = list.filter(e => e.path !== entry.path);
    list.unshift({ ...entry, accessedAt: Date.now() });
    _save(storageKey, list);
    return list;
  };

  // ── Files ─────────────────────────────────────────────

  /**
   * Record file access. Called by Writer, VoxStudio, Images, Audio, etc.
   * @param {object} entry { path, name, appId }
   */
  const addFile = (entry) => {
    const list = _add(KEY, entry);
    Huna7.Binder.emit('recent:file_added', entry);
    return list;
  };

  const getFiles = (limit = MAX) => _load(KEY).slice(0, limit);

  const removeFile = (path) => {
    _save(KEY, _load(KEY).filter(e => e.path !== path));
  };

  // ── Directories ───────────────────────────────────────

  const addDir = (entry) => {
    return _add(KEY_DIRS, entry);
  };

  const getDirs = (limit = 10) => _load(KEY_DIRS).slice(0, limit);

  // ── Scripts (VoxScript) ───────────────────────────────

  const addScript = (entry) => {
    const list = _add(KEY_SCRIPTS, { ...entry, type: 'script' });
    Huna7.Binder.emit('recent:script_added', entry);
    return list;
  };

  const getScripts = (limit = 10) => _load(KEY_SCRIPTS).slice(0, limit);

  // ── Projects ──────────────────────────────────────────

  const addProject = (entry) => _add(KEY_PROJ, { ...entry, type: 'project' });

  const getProjects = (limit = 10) => _load(KEY_PROJ).slice(0, limit);

  // ── Unified ───────────────────────────────────────────

  /** Get all recent activity combined, sorted by time. */
  const getAll = (limit = 15) => {
    const combined = [
      ..._load(KEY).map(e => ({ ...e, _type: 'file' })),
      ..._load(KEY_DIRS).map(e => ({ ...e, _type: 'dir' })),
      ..._load(KEY_SCRIPTS).map(e => ({ ...e, _type: 'script' })),
    ];
    return combined
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, limit);
  };

  // ── Clear ─────────────────────────────────────────────

  const clearAll = () => {
    [KEY, KEY_DIRS, KEY_PROJ, KEY_SCRIPTS].forEach(k => Huna7.Storage.remove(k));
    Huna7.Binder.emit('recent:cleared', {});
  };

  const clearFiles   = () => Huna7.Storage.remove(KEY);
  const clearScripts = () => Huna7.Storage.remove(KEY_SCRIPTS);

  return {
    addFile, getFiles, removeFile,
    addDir, getDirs,
    addScript, getScripts,
    addProject, getProjects,
    getAll, clearAll, clearFiles, clearScripts,
  };
})();

/* =====================================================
   HUNA7-OS — NOTEBOOK
   Virtual File System. IndexedDB-backed. Full VFS.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.VFS = (() => {
  // Entry types
  const TYPE = { FILE: 'file', DIR: 'directory' };

  const makeEntry = (path, type, content = '', meta = {}) => ({
    path, type, name: Huna7.Helpers.getFileName(path),
    parent: Huna7.Helpers.getDirPath(path),
    content, size: typeof content === 'string' ? content.length : 0,
    created: Date.now(), modified: Date.now(),
    tags: [], ...meta,
  });

  // Initialize VFS with default structure
  const init = async () => {
    await Huna7.Organizer.init();
    const root = await Huna7.Organizer.fs.get('/');
    if (!root) {
      await _createDefaults();
    }
  };

  const _createDefaults = async () => {
    const dirs = ['/', '/Home', '/Home/Documents', '/Home/Downloads', '/Home/Desktop',
      '/Home/Music', '/Home/Pictures', '/System', '/System/Apps', '/Trash'];
    for (const d of dirs) {
      await Huna7.Organizer.fs.put(makeEntry(d, TYPE.DIR));
    }
    // Preinstalled files
    await writeFile('/Home/Documents/guide.note', GUIDE_CONTENT);
    await writeFile('/Home/Documents/voxscript-guide.note', VOXSCRIPT_GUIDE_CONTENT);
    await writeFile('/Home/Desktop/Welcome.note', 'Welcome to Huna7-OS!\n\nYour personal operating system in the browser.\n\nOpen the Explorer to browse files.\nOpen VoxStudio to write scripts.\n\nEnjoy!');
    await writeFile('/Home/Desktop/hello.pencil', `# My first VoxScript\nlet name = "World"\nfn greet(n) {\n  notify("Hello, " + n + "!")\n}\ngreet(name)\n`);
  };

  // --- Core Operations ---
  const readFile = async (path) => {
    const entry = await Huna7.Organizer.fs.get(Huna7.Helpers.normalizePath(path));
    if (!entry || entry.type !== TYPE.FILE) throw new Error(`File not found: ${path}`);
    return entry;
  };

  const writeFile = async (path, content, meta = {}) => {
    path = Huna7.Helpers.normalizePath(path);
    const existing = await Huna7.Organizer.fs.get(path);
    const entry = existing
      ? { ...existing, content, size: content.length, modified: Date.now(), ...meta }
      : makeEntry(path, TYPE.FILE, content, meta);
    await Huna7.Organizer.fs.put(entry);
    Huna7.Binder.emit('fs:changed', { path, op: existing ? 'update' : 'create' });
    return entry;
  };

  const readDir = async (path) => {
    path = Huna7.Helpers.normalizePath(path);
    const entries = await Huna7.Organizer.fs.getByParent(path);
    return entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === TYPE.DIR ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  };

  const mkdir = async (path) => {
    path = Huna7.Helpers.normalizePath(path);
    const existing = await Huna7.Organizer.fs.get(path);
    if (existing) return existing;
    const entry = makeEntry(path, TYPE.DIR);
    await Huna7.Organizer.fs.put(entry);
    Huna7.Binder.emit('fs:changed', { path, op: 'mkdir' });
    return entry;
  };

  const deleteEntry = async (path, recursive = true) => {
    path = Huna7.Helpers.normalizePath(path);
    const entry = await Huna7.Organizer.fs.get(path);
    if (!entry) return;
    if (entry.type === TYPE.DIR && recursive) {
      const children = await readDir(path);
      for (const child of children) await deleteEntry(child.path, true);
    }
    await Huna7.Organizer.fs.delete(path);
    Huna7.Binder.emit('fs:changed', { path, op: 'delete' });
  };

  const moveEntry = async (src, dest) => {
    src = Huna7.Helpers.normalizePath(src);
    dest = Huna7.Helpers.normalizePath(dest);
    const entry = await Huna7.Organizer.fs.get(src);
    if (!entry) throw new Error(`Not found: ${src}`);
    if (entry.type === TYPE.DIR) {
      const all = await Huna7.Organizer.fs.getAll();
      const descendants = all.filter(e => e.path.startsWith(src + '/') || e.path === src);
      for (const d of descendants) {
        const newPath = dest + d.path.slice(src.length);
        await Huna7.Organizer.fs.delete(d.path);
        await Huna7.Organizer.fs.put({ ...d, path: newPath, name: Huna7.Helpers.getFileName(newPath), parent: Huna7.Helpers.getDirPath(newPath), modified: Date.now() });
      }
    } else {
      await Huna7.Organizer.fs.delete(src);
      await Huna7.Organizer.fs.put({ ...entry, path: dest, name: Huna7.Helpers.getFileName(dest), parent: Huna7.Helpers.getDirPath(dest), modified: Date.now() });
    }
    Huna7.Binder.emit('fs:changed', { src, dest, op: 'move' });
  };

  const copyEntry = async (src, dest) => {
    src = Huna7.Helpers.normalizePath(src);
    dest = Huna7.Helpers.normalizePath(dest);
    const entry = await Huna7.Organizer.fs.get(src);
    if (!entry) throw new Error(`Not found: ${src}`);
    await Huna7.Organizer.fs.put({ ...entry, path: dest, name: Huna7.Helpers.getFileName(dest), parent: Huna7.Helpers.getDirPath(dest), created: Date.now(), modified: Date.now() });
    Huna7.Binder.emit('fs:changed', { src, dest, op: 'copy' });
  };

  const rename = async (path, newName) => {
    const parent = Huna7.Helpers.getDirPath(path);
    return moveEntry(path, parent + '/' + newName);
  };

  const exists = async (path) => {
    const e = await Huna7.Organizer.fs.get(Huna7.Helpers.normalizePath(path));
    return !!e;
  };

  const stat = async (path) => {
    return Huna7.Organizer.fs.get(Huna7.Helpers.normalizePath(path));
  };

  const search = async (query, startPath = '/') => {
    const all = await Huna7.Organizer.fs.getAll();
    const q = query.toLowerCase();
    return all.filter(e =>
      e.path.startsWith(startPath) &&
      (e.name.toLowerCase().includes(q) || (e.content && e.content.toLowerCase().includes(q)))
    );
  };

  const getRecentFiles = async (limit = 10) => {
    const all = await Huna7.Organizer.fs.getAll();
    return all
      .filter(e => e.type === TYPE.FILE)
      .sort((a, b) => b.modified - a.modified)
      .slice(0, limit);
  };

  return { init, readFile, writeFile, readDir, mkdir, deleteEntry, moveEntry, copyEntry, rename, exists, stat, search, getRecentFiles, TYPE };
})();

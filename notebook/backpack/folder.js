/* =====================================================
   HUNA7-OS — FOLDER
   Directory management and navigation.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Folder = (() => {
  // Navigation history per context
  const _histories = new Map();

  const createNavigator = (id, startPath = '/Home') => {
    const history = [startPath];
    let pos = 0;
    _histories.set(id, { history, pos: 0 });

    return {
      current: () => history[_histories.get(id).pos],
      navigate: async (path) => {
        const state = _histories.get(id);
        state.history = state.history.slice(0, state.pos + 1);
        state.history.push(path);
        state.pos = state.history.length - 1;
        return Huna7.VFS.readDir(path);
      },
      back: async () => {
        const state = _histories.get(id);
        if (state.pos > 0) state.pos--;
        return Huna7.VFS.readDir(state.history[state.pos]);
      },
      forward: async () => {
        const state = _histories.get(id);
        if (state.pos < state.history.length - 1) state.pos++;
        return Huna7.VFS.readDir(state.history[state.pos]);
      },
      canBack: () => _histories.get(id).pos > 0,
      canForward: () => { const s = _histories.get(id); return s.pos < s.history.length - 1; },
      getBreadcrumbs: () => {
        const state = _histories.get(id);
        const path = state.history[state.pos];
        const parts = path.split('/').filter(Boolean);
        const crumbs = [{ name: 'Root', path: '/' }];
        let build = '';
        for (const p of parts) {
          build += '/' + p;
          crumbs.push({ name: p, path: build });
        }
        return crumbs;
      },
    };
  };

  // Get sorted entries with folders first
  const readDirSorted = async (path, sortBy = 'name', order = 'asc') => {
    const entries = await Huna7.VFS.readDir(path);
    return sortEntries(entries, sortBy, order);
  };

  const sortEntries = (entries, sortBy = 'name', order = 'asc') => {
    const dirs = entries.filter(e => e.type === Huna7.VFS.TYPE.DIR);
    const files = entries.filter(e => e.type === Huna7.VFS.TYPE.FILE);
    const compare = (a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return order === 'asc' ? -1 : 1;
      if (va > vb) return order === 'asc' ? 1 : -1;
      return 0;
    };
    return [...dirs.sort(compare), ...files.sort(compare)];
  };

  // Build a tree structure for the sidebar
  const buildTree = async (path = '/', depth = 3, current = 0) => {
    if (current >= depth) return [];
    const entries = await Huna7.VFS.readDir(path);
    const dirs = entries.filter(e => e.type === Huna7.VFS.TYPE.DIR);
    const result = [];
    for (const d of dirs) {
      const children = await buildTree(d.path, depth, current + 1);
      result.push({ ...d, children });
    }
    return result;
  };

  // Create folder with auto-increment if exists
  const createFolder = async (parent, baseName = 'New Folder') => {
    const existing = await Huna7.VFS.readDir(parent);
    const names = new Set(existing.map(e => e.name));
    let name = baseName;
    let i = 1;
    while (names.has(name)) { name = `${baseName} ${i++}`; }
    return Huna7.VFS.mkdir(parent + '/' + name);
  };

  // Get total size of directory (recursive)
  const getDirSize = async (path) => {
    const entries = await Huna7.VFS.readDir(path);
    let size = 0;
    for (const e of entries) {
      if (e.type === Huna7.VFS.TYPE.FILE) size += e.size || 0;
      else size += await getDirSize(e.path);
    }
    return size;
  };

  // Get item count in directory
  const getItemCount = async (path) => {
    const entries = await Huna7.VFS.readDir(path);
    return entries.length;
  };

  return { createNavigator, readDirSorted, sortEntries, buildTree, createFolder, getDirSize, getItemCount };
})();

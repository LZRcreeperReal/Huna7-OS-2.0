/* =====================================================
   HUNA7-OS — APPS: EXPLORER
   Full file manager. Folders, files, drag, search.
   Now fully safe for chalk.spawn() (variables init first).
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

/* wrapper — runs immediately so all vars are ready before Chalk calls launch */
const initApp = (launchFn) => {
  Huna7.Apps.Explorer = (() => {
    const launch = launchFn;
    return { launch };
  })();
};

initApp(() => {
  const launch = (pid, options = {}) => {
    const startPath = options.path || '/Home';
    const nav = Huna7.Folder.createNavigator(pid, startPath);
    let currentEntries = [];
    let selected = new Set();
    let viewMode = Huna7.Blueprint.get('explorer', 'view') || 'list';
    let sortBy = Huna7.Blueprint.get('explorer', 'sortBy') || 'name';
    let clipboard = null;

    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Explorer', appId: 'explorer', width: 820, height: 520,
    });

    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    const mkBtn = (icon, title, action) => {
      const b = document.createElement('button');
      b.className = 'h7-btn h7-btn-ghost';
      b.style.cssText = 'padding:4px 8px;height:28px;';
      b.innerHTML = Huna7.Glossary.get(icon, 14);
      b.title = title;
      b.addEventListener('click', action);
      return b;
    };

    const backBtn = mkBtn('arrowLeft', 'Back', async () => { if (nav.canBack()) { currentEntries = await nav.back(); render(); updateBreadcrumbs(); } });
    const fwdBtn  = mkBtn('arrowRight', 'Forward', async () => { if (nav.canForward()) { currentEntries = await nav.forward(); render(); updateBreadcrumbs(); } });
    const upBtn   = mkBtn('chevronUp', 'Up', () => { const p = Huna7.Helpers.getDirPath(nav.current()); navigate(p); });
    const refreshBtn = mkBtn('refresh', 'Refresh', refresh);
    const newFolderBtn = mkBtn('plus', 'New Folder', newFolder);

    // Search
    const searchInput = document.createElement('input');
    searchInput.className = 'h7-input';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText = 'flex:1;max-width:200px;height:28px;padding:4px 10px;font-size:12px;';
    searchInput.addEventListener('input', Huna7.Helpers.debounce(doSearch, 300));

    // View toggle
    const viewBtn = mkBtn('grid', 'Toggle View', () => {
      viewMode = viewMode === 'list' ? 'grid' : 'list';
      viewBtn.innerHTML = Huna7.Glossary.get(viewMode === 'list' ? 'grid' : 'list', 14);
      render();
    });

    toolbar.append(backBtn, fwdBtn, upBtn, refreshBtn, document.createElement('div'), newFolderBtn, searchInput, viewBtn);
    const sep = toolbar.children[4];
    sep.style.cssText = 'flex:1;';

    // Breadcrumbs
    const breadcrumbs = document.createElement('div');
    breadcrumbs.style.cssText = 'display:flex;align-items:center;gap:4px;padding:4px 12px;font-size:12px;color:var(--h7-text-muted);flex-shrink:0;overflow:hidden;';

    // Main layout
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;min-height:0;';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:160px;border-right:1px solid var(--h7-border);overflow-y:auto;padding:8px;flex-shrink:0;';
    const sidebarItems = [
      { icon: 'home',     label: 'Home',      path: '/Home' },
      { icon: 'folder',   label: 'Documents', path: '/Home/Documents' },
      { icon: 'download', label: 'Downloads', path: '/Home/Downloads' },
      { icon: 'image',    label: 'Pictures',  path: '/Home/Pictures' },
      { icon: 'music',    label: 'Music',     path: '/Home/Music' },
      { icon: 'folder',   label: 'Desktop',   path: '/Home/Desktop' },
      { icon: 'trash',    label: 'Trash',     path: '/Trash' },
    ];
    sidebarItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'h7-context-item';
      row.innerHTML = Huna7.Glossary.get(item.icon, 13) + ` <span style="font-size:12px">${item.label}</span>`;
      row.addEventListener('click', () => navigate(item.path));
      sidebar.appendChild(row);
    });

    // File list
    const fileList = document.createElement('div');
    fileList.style.cssText = 'flex:1;overflow-y:auto;padding:8px;min-width:0;';

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'height:22px;border-top:1px solid var(--h7-border);padding:0 12px;display:flex;align-items:center;font-size:11px;color:var(--h7-text-muted);gap:16px;flex-shrink:0;';

    body.append(sidebar, fileList);
    contentEl.append(toolbar, breadcrumbs, body, statusBar);

    const updateBreadcrumbs = () => {
      breadcrumbs.innerHTML = nav.getBreadcrumbs().map((c, i, arr) =>
        `<span onclick="event.currentTarget._path='${c.path}'" data-path="${c.path}" style="cursor:pointer;${i === arr.length-1 ? 'color:var(--h7-text);font-weight:500;' : ''}hover:color:var(--h7-text)">${c.name}</span>${i < arr.length-1 ? Huna7.Glossary.get('chevronRight', 10) : ''}`
      ).join('');
      breadcrumbs.querySelectorAll('span[data-path]').forEach(el => {
        el.addEventListener('click', () => navigate(el.getAttribute('data-path')));
      });
    };

    const navigate = async (path) => {
      currentEntries = await nav.navigate(path);
      selected.clear();
      render();
      updateBreadcrumbs();
    };

    const refresh = async () => {
      currentEntries = await Huna7.VFS.readDir(nav.current());
      render();
    };

    const render = () => {
      fileList.innerHTML = '';
      if (!currentEntries.length) { fileList.appendChild(Huna7.Sketch.emptyState('folder', 'Empty folder', 'No files here')); return; }
      const sorted = Huna7.Folder.sortEntries(currentEntries, sortBy);

      if (viewMode === 'grid') {
        fileList.style.display = 'flex';
        fileList.style.flexWrap = 'wrap';
        fileList.style.gap = '8px';
        fileList.style.alignContent = 'flex-start';
        sorted.forEach(entry => fileList.appendChild(buildGridItem(entry)));
      } else {
        fileList.style.display = 'block';
        sorted.forEach(entry => fileList.appendChild(buildListItem(entry)));
      }

      statusBar.textContent = `${currentEntries.length} item${currentEntries.length !== 1 ? 's' : ''}${selected.size > 0 ? ` — ${selected.size} selected` : ''}`;
      Huna7.Animations.staggerReveal(Array.from(fileList.children), 15);
    };

    const buildListItem = (entry) => {
      const row = document.createElement('div');
      row.style.cssText = `display:flex;align-items:center;gap:10px;padding:5px 8px;
        border-radius:var(--h7-radius-sm);cursor:pointer;transition:background 150ms;`;
      row.addEventListener('mouseenter', () => { if (!selected.has(entry.path)) row.style.background = 'var(--h7-bg-glass)'; });
      row.addEventListener('mouseleave', () => { if (!selected.has(entry.path)) row.style.background = ''; });

      const icon = Huna7.Sketch.fileIcon(entry);
      const name = document.createElement('div');
      name.style.cssText = 'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      name.textContent = entry.name;
      const modified = document.createElement('div');
      modified.style.cssText = 'font-size:11px;color:var(--h7-text-muted);flex-shrink:0;';
      modified.textContent = Huna7.Helpers.formatDate(entry.modified);
      const size = document.createElement('div');
      size.style.cssText = 'font-size:11px;color:var(--h7-text-muted);width:70px;text-align:right;flex-shrink:0;';
      size.textContent = entry.type === 'file' ? Huna7.Helpers.formatBytes(entry.size) : '--';

      row.append(icon, name, modified, size);
      _attachItemHandlers(row, entry);
      return row;
    };

    const buildGridItem = (entry) => {
      const item = document.createElement('div');
      item.style.cssText = `width:90px;height:90px;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:6px;border-radius:var(--h7-radius);cursor:pointer;
        padding:8px;transition:background 150ms;`;
      item.addEventListener('mouseenter', () => { if (!selected.has(entry.path)) item.style.background = 'var(--h7-bg-glass)'; });
      item.addEventListener('mouseleave', () => { if (!selected.has(entry.path)) item.style.background = ''; });
      const icon = Huna7.Sketch.fileIcon(entry);
      icon.style.cssText = 'width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;';
      const name = document.createElement('div');
      name.style.cssText = 'font-size:11px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:82px;';
      name.textContent = entry.name;
      item.append(icon, name);
      _attachItemHandlers(item, entry);
      return item;
    };

    const _attachItemHandlers = (el, entry) => {
      el.addEventListener('click', (e) => {
        if (!e.ctrlKey && !e.metaKey) selected.clear();
        if (selected.has(entry.path)) selected.delete(entry.path);
        else selected.add(entry.path);
        el.style.background = selected.has(entry.path) ? 'rgba(94,127,255,0.15)' : '';
        statusBar.textContent = `${currentEntries.length} items — ${selected.size} selected`;
      });
      el.addEventListener('dblclick', () => openEntry(entry));
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); entryContextMenu(e, entry); });
    };

    const openEntry = (entry) => {
      if (entry.type === 'directory') navigate(entry.path);
      else {
        const ext = Huna7.Helpers.getFileExtension(entry.name);
        if (ext === '.note' || ext === '.pencil') Huna7.Chalk.spawn('writer', { file: entry.path });
        else if (['.jpg','.png','.gif','.webp','.svg'].includes(ext)) Huna7.Chalk.spawn('images', { file: entry.path });
        else if (['.mp3','.ogg','.wav'].includes(ext)) Huna7.Chalk.spawn('audio', { file: entry.path });
        else Huna7.Chalk.spawn('writer', { file: entry.path });
      }
    };

    const entryContextMenu = (e, entry) => {
      Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [
        { icon: 'edit', label: 'Open',   action: () => openEntry(entry) },
        { icon: 'copy', label: 'Copy',   action: () => { clipboard = { entry, op: 'copy' }; } },
        { icon: 'paste',label: 'Cut',    action: () => { clipboard = { entry, op: 'cut' }; } },
        '-',
        { icon: 'edit', label: 'Rename', action: () => renameEntry(entry) },
        { icon: 'trash', label: 'Delete', action: () => deleteEntry(entry), danger: true },
        '-',
        { icon: 'info', label: 'Properties', action: () => showProperties(entry) },
      ]);
    };

    const newFolder = async () => {
      const name = await Huna7.Toolbox.showPrompt('New Folder', 'Folder name');
      if (!name) return;
      await Huna7.Folder.createFolder(nav.current(), name);
      refresh();
    };

    const renameEntry = async (entry) => {
      const newName = await Huna7.Toolbox.showPrompt('Rename', entry.name);
      if (!newName || newName === entry.name) return;
      await Huna7.VFS.rename(entry.path, newName);
      refresh();
    };

    const deleteEntry = async (entry) => {
      const ok = await Huna7.Toolbox.showModal('Delete', `Delete "${entry.name}"? This cannot be undone.`, [
        { label: 'Cancel', type: 'ghost', value: false },
        { label: 'Delete', type: 'danger', value: true },
      ]);
      if (!ok) return;
      await Huna7.VFS.deleteEntry(entry.path);
      refresh();
    };

    const showProperties = (entry) => {
      Huna7.Toolbox.showModal('Properties', `
        Name: ${entry.name}
        Type: ${entry.type}
        Size: ${Huna7.Helpers.formatBytes(entry.size || 0)}
        Created: ${Huna7.Helpers.formatDateTime(entry.created)}
        Modified: ${Huna7.Helpers.formatDateTime(entry.modified)}
        Path: ${entry.path}
      `.trim().split('\n').map(l => l.trim()).join('\n'));
    };

    const doSearch = async () => {
      const q = searchInput.value.trim();
      if (!q) { refresh(); return; }
      currentEntries = await Huna7.VFS.search(q, nav.current());
      render();
    };

    // Paste handler
    fileList.addEventListener('contextmenu', (e) => {
      if (e.target === fileList) {
        e.preventDefault();
        Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [
          { icon: 'plus', label: 'New Folder', action: newFolder },
          ...(clipboard ? [{ icon: 'paste', label: 'Paste', action: async () => {
            const dest = nav.current() + '/' + clipboard.entry.name;
            if (clipboard.op === 'copy') await Huna7.VFS.copyEntry(clipboard.entry.path, dest);
            else await Huna7.VFS.moveEntry(clipboard.entry.path, dest);
            clipboard = null; refresh();
          }}] : []),
        ]);
      }
    });

    if (options.searchQuery) { searchInput.value = options.searchQuery; doSearch(); }
    navigate(startPath);
    updateBreadcrumbs();

    Huna7.Binder.on('fs:changed', refresh);
    return { windowId: id, cleanup: () => Huna7.Binder.off('fs:changed', refresh) };
  };
});

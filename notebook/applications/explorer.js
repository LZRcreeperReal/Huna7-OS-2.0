/* =====================================================
   HUNA7-OS — APPS: EXPLORER
   Full file manager. Folders, files, drag, search.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Explorer = (() => {
  function launch(pid, options = {}) {
    const startPath = options.path || '/Home';
    const nav = Huna7.Folder.createNavigator(pid, startPath);

    let currentEntries = [];
    let selected = new Set();
    let viewMode = Huna7.Blueprint.get('explorer', 'view') || 'list';
    let sortBy = Huna7.Blueprint.get('explorer', 'sortBy') || 'name';
    let clipboard = null;

    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Explorer',
      appId: 'explorer',
      width: 820,
      height: 520,
    });

    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    // =========================
    // Toolbar
    // =========================
    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    function mkBtn(icon, title, action) {
      const b = document.createElement('button');
      b.className = 'h7-btn h7-btn-ghost';
      b.style.cssText = 'padding:4px 8px;height:28px;';
      b.innerHTML = Huna7.Glossary.get(icon, 14);
      b.title = title;
      b.addEventListener('click', action);
      return b;
    }

    const backBtn = mkBtn('arrowLeft', 'Back', async () => {
      if (nav.canBack()) {
        currentEntries = await nav.back();
        render();
        updateBreadcrumbs();
      }
    });

    const fwdBtn = mkBtn('arrowRight', 'Forward', async () => {
      if (nav.canForward()) {
        currentEntries = await nav.forward();
        render();
        updateBreadcrumbs();
      }
    });

    const upBtn = mkBtn('chevronUp', 'Up', () => {
      const p = Huna7.Helpers.getDirPath(nav.current());
      navigate(p);
    });

    const refreshBtn = mkBtn('refresh', 'Refresh', refresh);

    const deleteBtn = mkBtn('trash', 'Delete Selected', deleteSelected);

    const newFolderBtn = mkBtn('plus', 'New Folder', newFolder);

    // Search
    const searchInput = document.createElement('input');
    searchInput.className = 'h7-input';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText =
      'flex:1;max-width:200px;height:28px;padding:4px 10px;font-size:12px;';
    searchInput.addEventListener('input', Huna7.Helpers.debounce(doSearch, 300));

    // View toggle
    const viewBtn = mkBtn('grid', 'Toggle View', () => {
      viewMode = viewMode === 'list' ? 'grid' : 'list';
      viewBtn.innerHTML = Huna7.Glossary.get(
        viewMode === 'list' ? 'grid' : 'list',
        14
      );
      render();
    });

    toolbar.append(
      backBtn,
      fwdBtn,
      upBtn,
      refreshBtn,
      deleteBtn,
      newFolderBtn,
      searchInput,
      viewBtn
    );

    // =========================
    // Breadcrumbs
    // =========================
    const breadcrumbs = document.createElement('div');
    breadcrumbs.style.cssText =
      'display:flex;align-items:center;gap:4px;padding:4px 12px;font-size:12px;color:var(--h7-text-muted);flex-shrink:0;overflow:hidden;';

    // =========================
    // Body
    // =========================
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;min-height:0;';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.style.cssText =
      'width:160px;border-right:1px solid var(--h7-border);overflow-y:auto;padding:8px;flex-shrink:0;';

    const sidebarItems = [
      { icon: 'home', label: 'Home', path: '/Home' },
      { icon: 'folder', label: 'Documents', path: '/Home/Documents' },
      { icon: 'download', label: 'Downloads', path: '/Home/Downloads' },
      { icon: 'image', label: 'Pictures', path: '/Home/Pictures' },
      { icon: 'music', label: 'Music', path: '/Home/Music' },
      { icon: 'folder', label: 'Desktop', path: '/Home/Desktop' },
      { icon: 'trash', label: 'Trash', path: '/Trash' },
    ];

    sidebarItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'h7-context-item';
      row.innerHTML =
        Huna7.Glossary.get(item.icon, 13) +
        ` <span style="font-size:12px">${item.label}</span>`;
      row.addEventListener('click', () => navigate(item.path));
      sidebar.appendChild(row);
    });

    const fileList = document.createElement('div');
    fileList.style.cssText = 'flex:1;overflow-y:auto;padding:8px;min-width:0;';

    const statusBar = document.createElement('div');
    statusBar.style.cssText =
      'height:22px;border-top:1px solid var(--h7-border);padding:0 12px;display:flex;align-items:center;font-size:11px;color:var(--h7-text-muted);gap:16px;flex-shrink:0;';

    body.append(sidebar, fileList);
    contentEl.append(toolbar, breadcrumbs, body, statusBar);

    // =========================
    // Breadcrumbs
    // =========================
    function updateBreadcrumbs() {
      breadcrumbs.innerHTML = nav
        .getBreadcrumbs()
        .map(
          (c, i, arr) =>
            `<span data-path="${c.path}" style="cursor:pointer;${
              i === arr.length - 1
                ? 'color:var(--h7-text);font-weight:500;'
                : ''
            }">${c.name}</span>${
              i < arr.length - 1
                ? Huna7.Glossary.get('chevronRight', 10)
                : ''
            }`
        )
        .join('');

      breadcrumbs.querySelectorAll('span[data-path]').forEach(el => {
        el.addEventListener('click', () =>
          navigate(el.getAttribute('data-path'))
        );
      });
    }

    // =========================
    // Navigation
    // =========================
    async function navigate(path) {
      currentEntries = await nav.navigate(path);
      selected.clear();
      render();
      updateBreadcrumbs();
    }

    async function refresh() {
      currentEntries = await Huna7.VFS.readDir(nav.current());
      render();
    }

    // =========================
    // Render
    // =========================
    function render() {
      fileList.innerHTML = '';

      if (!currentEntries.length) {
        fileList.appendChild(
          Huna7.Sketch.emptyState('folder', 'Empty folder', 'No files here')
        );
        return;
      }

      const sorted = Huna7.Folder.sortEntries(currentEntries, sortBy);

      if (viewMode === 'grid') {
        fileList.style.display = 'flex';
        fileList.style.flexWrap = 'wrap';
        fileList.style.gap = '8px';

        sorted.forEach(entry =>
          fileList.appendChild(buildGridItem(entry))
        );
      } else {
        fileList.style.display = 'block';
        sorted.forEach(entry =>
          fileList.appendChild(buildListItem(entry))
        );
      }

      statusBar.textContent = `${currentEntries.length} items${
        selected.size ? ` — ${selected.size} selected` : ''
      }`;
    }

    // =========================
    // List Item
    // =========================
    function buildListItem(entry) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:5px 8px;border-radius:6px;cursor:pointer;';

      const icon = Huna7.Sketch.fileIcon(entry);

      const name = document.createElement('div');
      name.style.cssText =
        'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      name.textContent = entry.name;

      row.append(icon, name);

      attachHandlers(row, entry);
      return row;
    }

    // =========================
    // Grid Item
    // =========================
    function buildGridItem(entry) {
      const item = document.createElement('div');
      item.style.cssText =
        'width:90px;height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;border-radius:8px;cursor:pointer;';

      const icon = Huna7.Sketch.fileIcon(entry);

      const name = document.createElement('div');
      name.style.cssText =
        'font-size:11px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:82px;';
      name.textContent = entry.name;

      item.append(icon, name);

      attachHandlers(item, entry);
      return item;
    }

    // =========================
    // Selection logic
    // =========================
    function attachHandlers(el, entry) {
      el.addEventListener('click', e => {
        if (!e.ctrlKey && !e.metaKey) selected.clear();

        if (selected.has(entry.path)) selected.delete(entry.path);
        else selected.add(entry.path);

        render();
      });

      el.addEventListener('dblclick', () => openEntry(entry));

      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        entryContextMenu(e, entry);
      });
    }

    // =========================
    // Open file
    // =========================
    function openEntry(entry) {
      if (entry.type === 'directory') return navigate(entry.path);

      const ext = Huna7.Helpers.getFileExtension(entry.name);

      if (['.jpg', '.png', '.gif', '.webp', '.svg'].includes(ext))
        Huna7.Chalk.spawn('images', { file: entry.path });
      else if (['.mp3', '.ogg', '.wav'].includes(ext))
        Huna7.Chalk.spawn('audio', { file: entry.path });
      else Huna7.Chalk.spawn('writer', { file: entry.path });
    }

    // =========================
    // Context menu
    // =========================
    function entryContextMenu(e, entry) {
      Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [
        { icon: 'edit', label: 'Open', action: () => openEntry(entry) },
        { icon: 'copy', label: 'Copy', action: () => (clipboard = { entry, op: 'copy' }) },
        { icon: 'paste', label: 'Cut', action: () => (clipboard = { entry, op: 'cut' }) },
        '-',
        { icon: 'edit', label: 'Rename', action: () => renameEntry(entry) },
        { icon: 'trash', label: 'Delete', action: () => deleteEntry(entry), danger: true },
      ]);
    }

    // =========================
    // File ops
    // =========================
    async function newFolder() {
      const name = await Huna7.Toolbox.showPrompt('New Folder', 'Folder name');
      if (!name) return;
      await Huna7.Folder.createFolder(nav.current(), name);
      refresh();
    }

    async function renameEntry(entry) {
      const newName = await Huna7.Toolbox.showPrompt('Rename', entry.name);
      if (!newName || newName === entry.name) return;
      await Huna7.VFS.rename(entry.path, newName);
      refresh();
    }

    async function deleteEntry(entry) {
      const ok = await Huna7.Toolbox.showModal(
        'Delete',
        `Delete "${entry.name}"?`,
        [
          { label: 'Cancel', type: 'ghost', value: false },
          { label: 'Delete', type: 'danger', value: true },
        ]
      );

      if (!ok) return;

      await Huna7.VFS.deleteEntry(entry.path);
      refresh();
    }

    // =========================
    // MULTI DELETE (NEW)
    // =========================
    async function deleteSelected() {
      if (selected.size === 0) return;

      const ok = await Huna7.Toolbox.showModal(
        'Delete Selected',
        `Delete ${selected.size} item(s)?`,
        [
          { label: 'Cancel', type: 'ghost', value: false },
          { label: 'Delete', type: 'danger', value: true },
        ]
      );

      if (!ok) return;

      await Promise.all(
        [...selected].map(p => Huna7.VFS.deleteEntry(p))
      );

      selected.clear();
      refresh();
    }

    // =========================
    // Search
    // =========================
    async function doSearch() {
      const q = searchInput.value.trim();
      if (!q) return refresh();

      currentEntries = await Huna7.VFS.search(q, nav.current());
      render();
    }

    // =========================
    // Init
    // =========================
    fileList.addEventListener('contextmenu', e => {
      if (e.target === fileList) {
        e.preventDefault();
        Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [
          { icon: 'plus', label: 'New Folder', action: newFolder },
          ...(clipboard
            ? [
                {
                  icon: 'paste',
                  label: 'Paste',
                  action: async () => {
                    const dest =
                      nav.current() + '/' + clipboard.entry.name;

                    if (clipboard.op === 'copy')
                      await Huna7.VFS.copyEntry(
                        clipboard.entry.path,
                        dest
                      );
                    else
                      await Huna7.VFS.moveEntry(
                        clipboard.entry.path,
                        dest
                      );

                    clipboard = null;
                    refresh();
                  },
                },
              ]
            : []),
        ]);
      }
    });

    if (options.searchQuery) {
      searchInput.value = options.searchQuery;
      doSearch();
    }

    navigate(startPath);
    updateBreadcrumbs();

    Huna7.Binder.on('fs:changed', refresh);

    return {
      windowId: id,
      cleanup: () => Huna7.Binder.off('fs:changed', refresh),
    };
  }

  return { launch };
})();

/* =====================================================
   HUNA7-OS — LAUNCHER
   Application launcher. Spotlight-style search.
   Triggered by Ctrl+Space or OS name click.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Launcher = (() => {
  let _overlay = null;
  let _visible  = false;

  const show = () => {
    if (_visible) { hide(); return; }
    _visible = true;

    _overlay = document.createElement('div');
    _overlay.style.cssText = `
      position:fixed;inset:0;z-index:${Huna7.CONSTANTS.Z.MODAL - 1};
      display:flex;flex-direction:column;align-items:center;
      padding-top:80px;
      background:rgba(0,0,0,0.55);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      width:580px;max-height:70vh;
      background:rgba(14,14,22,0.96);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:18px;
      box-shadow:0 32px 80px rgba(0,0,0,0.7);
      display:flex;flex-direction:column;overflow:hidden;
    `;

    // Search bar
    const searchRow = document.createElement('div');
    searchRow.style.cssText = 'display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);';
    const searchIcon = document.createElement('div');
    searchIcon.innerHTML = Huna7.Glossary.get('search', 18);
    searchIcon.style.cssText = 'color:rgba(255,255,255,0.4);flex-shrink:0;';
    const input = document.createElement('input');
    input.style.cssText = `flex:1;background:transparent;border:none;outline:none;font-size:18px;color:#fff;font-family:var(--h7-font-display);`;
    input.placeholder = 'Search apps, files, commands...';
    const kbHint = document.createElement('div');
    kbHint.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.25);';
    kbHint.textContent = 'ESC to close';
    searchRow.append(searchIcon, input, kbHint);

    // Results container
    const results = document.createElement('div');
    results.style.cssText = 'overflow-y:auto;max-height:calc(70vh - 72px);padding:8px;';

    panel.append(searchRow, results);
    _overlay.appendChild(panel);
    document.body.appendChild(_overlay);

    Huna7.Animations.windowOpen(panel, 180);

    const renderResults = (query = '') => {
      results.innerHTML = '';
      const q = query.toLowerCase().trim();

      if (!q) {
        // Default: show app grid + recent files
        _renderSection(results, 'Applications', _getAppItems(''));
        const recent = Huna7.Notebook.RecentFiles.getFiles(6);
        if (recent.length) _renderSection(results, 'Recent Files', recent.map(f => ({
          icon: 'file', label: f.name, sub: f.path,
          action: () => { hide(); const ext = Huna7.Helpers.getFileExtension(f.name); Huna7.Chalk.spawn(Huna7.Notebook.Registry.getAppForFile(f.name) || 'writer', { file: f.path }); },
        })));
      } else {
        // Apps matching query
        const apps = _getAppItems(q);
        if (apps.length) _renderSection(results, 'Apps', apps);

        // File search
        Huna7.Notebook.FilesystemIndex.search(q).then(files => {
          if (!files.length) return;
          const fileItems = files.slice(0, 6).map(f => ({
            icon: f.type === 'directory' ? 'folder' : 'file',
            label: f.name, sub: f.path,
            action: () => { hide(); if (f.type === 'directory') Huna7.Chalk.spawn('explorer', { path: f.path }); else Huna7.Chalk.spawn(Huna7.Notebook.Registry.getAppForFile(f.name) || 'writer', { file: f.path }); },
          }));
          _renderSection(results, 'Files', fileItems);
        });

        // VoxScript quick run
        if (q.startsWith('>')) {
          _renderSection(results, 'Run VoxScript', [{
            icon: 'vox', label: 'Execute: ' + q.slice(1).trim(), sub: 'Run inline VoxScript',
            action: async () => { hide(); await Huna7.VoxScript.Runtime.run(q.slice(1).trim(), { outputFn: console.log }); },
          }]);
        }
      }
    };

    const _getAppItems = (q) => {
      return Huna7.Chalk.getAllApps()
        .filter(a => !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
        .map(a => ({
          icon: a.id, label: a.name, sub: 'Application', isApp: true,
          action: () => { hide(); Huna7.Chalk.spawn(a.id); },
        }));
    };

    const _renderSection = (container, title, items) => {
      if (!items.length) return;
      const section = document.createElement('div');
      section.style.cssText = 'margin-bottom:4px;';
      const sectionTitle = document.createElement('div');
      sectionTitle.style.cssText = 'padding:6px 10px 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);';
      sectionTitle.textContent = title;
      section.appendChild(sectionTitle);

      items.slice(0, 8).forEach((item, idx) => {
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:background 120ms;`;
        row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.08)');
        row.addEventListener('mouseleave', () => row.style.background = '');

        const iconEl = document.createElement('div');
        iconEl.style.cssText = `width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;color:var(--h7-accent);flex-shrink:0;`;
        iconEl.innerHTML = item.isApp ? Huna7.Glossary.getAppIcon(item.icon, 17) : Huna7.Glossary.get(item.icon, 17);

        const text = document.createElement('div');
        text.style.cssText = 'flex:1;min-width:0;';
        text.innerHTML = `<div style="font-size:14px;">${Huna7.Helpers.escapeHtml(item.label)}</div><div style="font-size:11px;color:rgba(255,255,255,0.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Huna7.Helpers.escapeHtml(item.sub || '')}</div>`;

        row.append(iconEl, text);
        row.addEventListener('click', () => item.action());
        section.appendChild(row);
      });

      container.appendChild(section);
    };

    input.addEventListener('input', Huna7.Helpers.debounce(() => renderResults(input.value), 150));
    renderResults();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
      if (e.key === 'Enter') {
        const first = results.querySelector('[style*="cursor:pointer"]');
        if (first) first.click();
      }
    });

    _overlay.addEventListener('click', (e) => { if (e.target === _overlay) hide(); });
    setTimeout(() => input.focus(), 50);

    // Listen for global search trigger
    Huna7.Binder.once('ui:global_search', show);
  };

  const hide = () => {
    if (!_visible) return;
    _visible = false;
    if (_overlay) {
      _overlay.style.transition = 'opacity 150ms ease';
      _overlay.style.opacity = '0';
      setTimeout(() => { _overlay?.remove(); _overlay = null; }, 160);
    }
  };

  const toggle = () => _visible ? hide() : show();

  // Wire keyboard shortcut
  const init = () => {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') { e.preventDefault(); toggle(); }
    });
    Huna7.Binder.on('ui:global_search', show);
  };

  return { show, hide, toggle, init };
})();

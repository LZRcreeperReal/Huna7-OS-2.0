/* =====================================================
   HUNA7-OS — APPS: PACKAGE CENTER
   Local package manager. Install, remove, browse .hpkg files.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.PackageCenter = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Package Center', appId: 'packagecenter', width: 740, height: 520,
    });
    contentEl.style.display = 'flex';

    // Package registry
    let installed = Huna7.Notebook.Registry.get('packages.installed', []);

    // Built-in featured packages (local demos)
    const FEATURED = [
      {
        id: 'huna7-devtools', name: 'Dev Tools', version: '1.0.0', author: 'Huna7',
        description: 'Enhanced developer utilities for VoxScript debugging and system inspection.',
        size: '12 KB', category: 'Development', icon: 'code',
        builtin: true,
      },
      {
        id: 'huna7-calculator-sci', name: 'Scientific Calculator+', version: '1.1.0', author: 'Huna7',
        description: 'Extended scientific calculator with unit conversion and graphing support.',
        size: '8 KB', category: 'Utilities', icon: 'calculator',
        builtin: true,
      },
      {
        id: 'huna7-clock-widget', name: 'Clock Widget', version: '1.0.0', author: 'Community',
        description: 'Minimal always-on-top clock widget for your desktop.',
        size: '4 KB', category: 'Widgets', icon: 'clock',
        builtin: true,
      },
      {
        id: 'huna7-color-picker', name: 'Color Picker', version: '1.0.0', author: 'Community',
        description: 'Pick and convert colors between HEX, RGB, and HSL.',
        size: '6 KB', category: 'Design', icon: 'palette',
        builtin: true,
      },
    ];

    // ── Sidebar ───────────────────────────────────────────
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:180px;border-right:1px solid var(--h7-border);display:flex;flex-direction:column;padding:10px 8px;gap:2px;flex-shrink:0;';

    let activeSection = 'featured';

    const navItems = [
      { id: 'featured',   icon: 'star',     label: 'Featured' },
      { id: 'installed',  icon: 'check',    label: 'Installed' },
      { id: 'import',     icon: 'upload',   label: 'Import Package' },
    ];

    const navEls = {};
    navItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'h7-context-item';
      row.innerHTML = Huna7.Glossary.get(item.icon, 14) + ` <span>${item.label}</span>`;
      row.addEventListener('click', () => { activeSection = item.id; renderNav(); renderMain(); });
      navEls[item.id] = row;
      sidebar.appendChild(row);
    });

    const renderNav = () => {
      Object.entries(navEls).forEach(([key, el]) => {
        el.style.background = key === activeSection ? 'var(--h7-bg-glass-hover)' : '';
      });
    };
    renderNav();

    // ── Main ──────────────────────────────────────────────
    const main = document.createElement('div');
    main.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';

    const mainHeader = document.createElement('div');
    mainHeader.style.cssText = 'padding:14px 18px;border-bottom:1px solid var(--h7-border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;';

    const mainTitle = document.createElement('div');
    mainTitle.style.cssText = 'font-size:15px;font-weight:600;';

    const searchInput = document.createElement('input');
    searchInput.className = 'h7-input';
    searchInput.placeholder = 'Search packages...';
    searchInput.style.cssText = 'width:180px;height:28px;padding:4px 10px;font-size:12px;';

    mainHeader.append(mainTitle, searchInput);

    const mainBody = document.createElement('div');
    mainBody.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';

    main.append(mainHeader, mainBody);
    contentEl.append(sidebar, main);

    const buildPackageCard = (pkg) => {
      const isInstalled = installed.some(p => p.id === pkg.id);
      const card = document.createElement('div');
      card.className = 'h7-glass';
      card.style.cssText = 'padding:16px;display:flex;gap:14px;align-items:flex-start;margin-bottom:10px;';

      const iconWrap = document.createElement('div');
      iconWrap.style.cssText = `width:44px;height:44px;border-radius:10px;background:var(--h7-bg-glass);
        display:flex;align-items:center;justify-content:center;color:var(--h7-accent);flex-shrink:0;`;
      iconWrap.innerHTML = Huna7.Glossary.get(pkg.icon || 'package', 22);

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      info.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:3px;">
          <span style="font-size:14px;font-weight:600;">${pkg.name}</span>
          <span style="font-size:11px;color:var(--h7-text-muted);">v${pkg.version}</span>
          ${Huna7.Sketch.badge(pkg.category, 'rgba(94,127,255,0.3)').outerHTML}
        </div>
        <div style="font-size:12px;color:var(--h7-text-muted);margin-bottom:8px;line-height:1.5;">${pkg.description}</div>
        <div style="font-size:11px;color:var(--h7-text-muted);">by ${pkg.author} · ${pkg.size}</div>
      `;

      const actionBtn = document.createElement('button');
      actionBtn.className = isInstalled ? 'h7-btn h7-btn-ghost' : 'h7-btn h7-btn-accent';
      actionBtn.style.cssText = 'padding:6px 16px;font-size:12px;flex-shrink:0;';
      actionBtn.textContent = isInstalled ? 'Remove' : 'Install';
      actionBtn.addEventListener('click', async () => {
        if (isInstalled) {
          installed = installed.filter(p => p.id !== pkg.id);
          Huna7.Notebook.Registry.set('packages.installed', installed);
          Huna7.Bulletin.info('Package Center', `Removed: ${pkg.name}`);
        } else {
          installed.push({ ...pkg, installedAt: Date.now() });
          Huna7.Notebook.Registry.set('packages.installed', installed);
          Huna7.Bulletin.success('Package Center', `Installed: ${pkg.name}`);
        }
        renderMain();
      });

      card.append(iconWrap, info, actionBtn);
      return card;
    };

    const renderMain = () => {
      mainBody.innerHTML = '';
      const q = searchInput.value.toLowerCase();

      if (activeSection === 'featured') {
        mainTitle.textContent = 'Featured Packages';
        const filtered = FEATURED.filter(p => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        if (!filtered.length) { mainBody.appendChild(Huna7.Sketch.emptyState('package', 'No results', 'Try a different search')); return; }
        filtered.forEach(pkg => mainBody.appendChild(buildPackageCard(pkg)));

      } else if (activeSection === 'installed') {
        mainTitle.textContent = `Installed (${installed.length})`;
        if (!installed.length) { mainBody.appendChild(Huna7.Sketch.emptyState('package', 'Nothing installed', 'Browse Featured to install packages')); return; }
        const filtered = installed.filter(p => !q || p.name.toLowerCase().includes(q));
        filtered.forEach(pkg => mainBody.appendChild(buildPackageCard(pkg)));

      } else if (activeSection === 'import') {
        mainTitle.textContent = 'Import Package File';
        const desc = document.createElement('div');
        desc.style.cssText = 'font-size:13px;color:var(--h7-text-muted);margin-bottom:16px;line-height:1.7;';
        desc.innerHTML = `Import a local <code style="background:var(--h7-bg-glass);padding:2px 6px;border-radius:4px;font-family:var(--h7-font-mono);">.hpkg</code> package file.
          <br>Package files contain app metadata, VoxScript code, and assets.`;

        const dropZone = document.createElement('div');
        dropZone.style.cssText = `border:2px dashed var(--h7-border);border-radius:var(--h7-radius);
          padding:40px;text-align:center;cursor:pointer;transition:border-color 150ms;`;
        dropZone.innerHTML = `<div style="color:var(--h7-text-muted)">${Huna7.Glossary.get('upload', 32)}</div>
          <div style="font-size:14px;margin-top:12px;">Click to select .hpkg file</div>
          <div style="font-size:12px;color:var(--h7-text-muted);margin-top:4px;">or drag and drop here</div>`;
        dropZone.addEventListener('mouseenter', () => dropZone.style.borderColor = 'var(--h7-accent)');
        dropZone.addEventListener('mouseleave', () => dropZone.style.borderColor = 'var(--h7-border)');
        dropZone.addEventListener('click', () => {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.hpkg,.json';
          inp.onchange = async () => {
            const file = inp.files[0]; if (!file) return;
            try {
              const text = await file.text();
              const pkg = JSON.parse(text);
              if (!pkg.id || !pkg.name) throw new Error('Invalid package format');
              installed.push({ ...pkg, installedAt: Date.now() });
              Huna7.Notebook.Registry.set('packages.installed', installed);
              Huna7.Bulletin.success('Package Center', `Installed: ${pkg.name}`);
              activeSection = 'installed'; renderNav(); renderMain();
            } catch (e) { Huna7.Bulletin.error('Package Center', 'Invalid package: ' + e.message); }
          };
          inp.click();
        });

        // Format spec
        const spec = document.createElement('div');
        spec.className = 'h7-glass';
        spec.style.cssText = 'padding:14px;margin-top:16px;font-size:12px;font-family:var(--h7-font-mono);line-height:1.8;color:var(--h7-text-muted);';
        spec.innerHTML = `Package format (.hpkg = JSON):<br>
{<br>
&nbsp;&nbsp;"id": "my-package",<br>
&nbsp;&nbsp;"name": "My Package",<br>
&nbsp;&nbsp;"version": "1.0.0",<br>
&nbsp;&nbsp;"author": "Your Name",<br>
&nbsp;&nbsp;"description": "What it does",<br>
&nbsp;&nbsp;"category": "Utilities",<br>
&nbsp;&nbsp;"scripts": ["main.pencil"]<br>
}`;

        mainBody.append(desc, dropZone, spec);
      }
    };

    searchInput.addEventListener('input', Huna7.Helpers.debounce(renderMain, 200));
    renderMain();

    return { windowId: id };
  };

  return { launch };
})();

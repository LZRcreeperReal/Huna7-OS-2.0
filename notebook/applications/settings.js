/* =====================================================
   HUNA7-OS — APPS: SETTINGS
   System settings. Appearance, behavior, accessibility.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Settings = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Settings', appId: 'settings', width: 700, height: 520,
    });
    contentEl.style.cssText = 'display:flex;';

    const SECTIONS = [
      { id: 'appearance', icon: 'palette',   label: 'Appearance' },
      { id: 'system',     icon: 'settings',  label: 'System' },
      { id: 'desktop',    icon: 'monitor',   label: 'Desktop' },
      { id: 'privacy',    icon: 'lock',      label: 'Privacy' },
      { id: 'about',      icon: 'info',      label: 'About' },
    ];

    let activeSection = 'appearance';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:180px;border-right:1px solid var(--h7-border);padding:8px;flex-shrink:0;';
    function renderSidebar() {
      sidebar.innerHTML = '';
      SECTIONS.forEach(s => {
        const row = document.createElement('div');
        row.className = 'h7-context-item';
        row.style.background = s.id === activeSection ? 'var(--h7-bg-glass-hover)' : '';
        row.innerHTML = Huna7.Glossary.get(s.icon, 14) + ` <span>${s.label}</span>`;
        row.addEventListener('click', () => { activeSection = s.id; renderSidebar(); renderContent(); });
        sidebar.appendChild(row);
      });
    };

    // Content
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:20px 24px;';

    function mkSection(title) {
      const el = document.createElement('div');
      el.innerHTML = `<h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">${title}</h2>`;
      return el;
    };

    function mkRow(label, sub = '', control) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--h7-border);gap:16px;';
      const left = document.createElement('div');
      left.innerHTML = `<div style="font-size:14px;font-weight:500;">${label}</div>${sub ? `<div style="font-size:12px;color:var(--h7-text-muted);margin-top:2px;">${sub}</div>` : ''}`;
      row.append(left, control);
      return row;
    };

    function mkToggle(key, ns = 'system') {
      const val = Huna7.Blueprint.get(ns, key) !== false;
      const wrap = document.createElement('div');
      wrap.style.cssText = `width:40px;height:22px;border-radius:11px;background:${val ? 'var(--h7-accent)' : 'rgba(255,255,255,0.15)'};
        position:relative;cursor:pointer;transition:background 200ms;flex-shrink:0;`;
      const thumb = document.createElement('div');
      thumb.style.cssText = `position:absolute;top:3px;left:${val ? '21px' : '3px'};width:16px;height:16px;
        border-radius:50%;background:#fff;transition:left 200ms;`;
      let state = val;
      wrap.appendChild(thumb);
      wrap.addEventListener('click', () => {
        state = !state;
        wrap.style.background = state ? 'var(--h7-accent)' : 'rgba(255,255,255,0.15)';
        thumb.style.left = state ? '21px' : '3px';
        Huna7.Blueprint.set(ns, key, state);
      });
      return wrap;
    };

    function mkSelect(options, currentVal, onChange) {
      const sel = document.createElement('select');
      sel.className = 'h7-input';
      sel.style.cssText = 'width:auto;padding:5px 10px;height:32px;min-width:120px;';
      options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        if (o.value === currentVal) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => onChange(sel.value));
      return sel;
    };

    function renderContent() {
      content.innerHTML = '';

      if (activeSection === 'appearance') {
        const sec = mkSection('Appearance');
        const theme = Huna7.Encyclopedia.getCurrent();
        const themes = Object.entries(Huna7.Encyclopedia.getAllThemes());

        const themeGrid = document.createElement('div');
        themeGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:20px;';
        themes.forEach(([key, t]) => {
          const card = document.createElement('div');
          card.style.cssText = `border-radius:var(--h7-radius);padding:10px;cursor:pointer;
            border:2px solid ${t.name === theme.name ? 'var(--h7-accent)' : 'var(--h7-border)'};
            background:var(--h7-bg-glass);transition:border-color 150ms;`;
          const preview = document.createElement('div');
          preview.style.cssText = `height:36px;border-radius:6px;margin-bottom:6px;background:${t.bg};`;
          const colorRow = document.createElement('div');
          colorRow.style.cssText = 'display:flex;gap:4px;margin-bottom:6px;';
          [t.accent, t.accentAlt, t.text].forEach(c => {
            const dot = document.createElement('div');
            dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${c};`;
            colorRow.appendChild(dot);
          });
          const nameEl = document.createElement('div');
          nameEl.style.cssText = 'font-size:12px;font-weight:500;';
          nameEl.textContent = t.name;
          card.append(preview, colorRow, nameEl);
          card.addEventListener('click', () => {
            Huna7.Encyclopedia.applyByName(key);
            renderContent();
          });
          themeGrid.appendChild(card);
        });

        const wallpaperSec = document.createElement('div');
        wallpaperSec.innerHTML = '<div class="h7-label" style="margin-bottom:10px;">Wallpaper</div>';
        const wpGrid = document.createElement('div');
        wpGrid.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';
        Huna7.CONSTANTS.WALLPAPERS.forEach(wp => {
          const btn = document.createElement('div');
          btn.style.cssText = `width:64px;height:40px;border-radius:8px;cursor:pointer;
            background:${Huna7.Dictionary.getWallpaperCSS(wp)};
            border:2px solid ${theme.wallpaper === wp ? 'var(--h7-accent)' : 'transparent'};transition:border-color 150ms;`;
          btn.addEventListener('click', () => {
            const cur = Huna7.Encyclopedia.getCurrent();
            Huna7.Encyclopedia.apply({ ...cur, wallpaper: wp });
            Huna7.Blackboard.updateWallpaper(wp);
            renderContent();
          });
          wpGrid.appendChild(btn);
        });
        wallpaperSec.appendChild(wpGrid);

        const btn = document.createElement('button');
        btn.className = 'h7-btn h7-btn-accent';
        btn.style.marginTop = '20px';
        btn.textContent = 'Open Theme Editor';
        btn.addEventListener('click', () => Huna7.Chalk.spawn('themes'));

        sec.append(themeGrid, wallpaperSec, btn);
        content.appendChild(sec);

      } else if (activeSection === 'system') {
        const sec = mkSection('System');
        sec.append(
          mkRow('Animations', 'Enable UI animations', mkToggle('animations')),
          mkRow('Notifications', 'Show system notifications', mkToggle('notifications')),
          mkRow('24-Hour Clock', 'Use 24h time format', mkToggle('clock24h')),
          mkRow('Autosave', 'Auto-save files in Writer', mkToggle('autosave', 'writer')),
          mkRow('Word Wrap', 'Wrap text in Writer', mkToggle('wordWrap', 'writer')),
          mkRow('Font Size', 'Terminal font size',
            mkSelect([{value:'12',label:'12px'},{value:'13',label:'13px'},{value:'14',label:'14px'},{value:'16',label:'16px'}],
              String(Huna7.Blueprint.get('terminal','fontSize')||13), (v) => Huna7.Blueprint.set('terminal','fontSize',parseInt(v)))),
        );
        content.appendChild(sec);

      } else if (activeSection === 'desktop') {
        const sec = mkSection('Desktop');
        sec.append(
          mkRow('Icon Size', 'Size of desktop icons',
            mkSelect([{value:'small',label:'Small'},{value:'medium',label:'Medium'},{value:'large',label:'Large'}],
              Huna7.Blueprint.get('desktop','iconSize')||'medium', (v) => Huna7.Blueprint.set('desktop','iconSize',v))),
          mkRow('Dock Autohide', 'Hide dock when not in use', mkToggle('autohide', 'dock')),
          mkRow('Show Grid', 'Show icon alignment grid', mkToggle('showGrid', 'desktop')),
        );
        content.appendChild(sec);

      } else if (activeSection === 'privacy') {
        const sec = mkSection('Privacy & Security');
        const profile = Huna7.Storage.getProfile();
        const info = document.createElement('div');
        info.style.cssText = 'font-size:14px;color:var(--h7-text-muted);margin-bottom:20px;line-height:1.7;';
        info.innerHTML = `Logged in as <strong>${profile?.username || 'unknown'}</strong>.<br>
          All data is stored locally in your browser.<br>
          No data is sent to any server.`;

        const resetBtn = document.createElement('button');
        resetBtn.className = 'h7-btn h7-btn-danger';
        resetBtn.style.marginTop = '12px';
        resetBtn.textContent = 'Reset Huna7-OS';
        resetBtn.addEventListener('click', async () => {
          const ok = await Huna7.Toolbox.showModal('Reset Huna7-OS',
            '⚠️ This will delete ALL files, settings, and your profile. This cannot be undone.',
            [{ label: 'Cancel', type: 'ghost', value: false }, { label: 'Reset Everything', type: 'danger', value: true }]
          );
          if (!ok) return;
          const ok2 = await Huna7.Toolbox.showModal('Are you absolutely sure?',
            'Every file will be deleted. Your profile will be removed. Huna7-OS will restart.',
            [{ label: 'Go Back', type: 'ghost', value: false }, { label: 'Delete Everything', type: 'danger', value: true }]
          );
          if (!ok2) return;
          await Huna7.Notebook.Authentication.resetSystem();
        });
        sec.append(info, resetBtn);
        content.appendChild(sec);

      } else if (activeSection === 'about') {
        const sec = mkSection('About Huna7-OS');
        const logo = document.createElement('div');
        logo.style.cssText = 'text-align:center;margin-bottom:20px;';
        logo.innerHTML = `
          <div style="font-size:48px;font-weight:800;letter-spacing:-0.04em;background:linear-gradient(135deg,var(--h7-accent),var(--h7-accent-alt));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Huna7</div>
          <div style="font-size:14px;color:var(--h7-text-muted);margin-top:4px;">OS v${Huna7.CONSTANTS.VERSION}</div>
        `;
        const details = document.createElement('div');
        details.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;';
        [
          ['Version', Huna7.CONSTANTS.VERSION],
          ['VoxScript', '1.0'],
          ['Kernel', 'Chalk'],
          ['Storage', 'IndexedDB + localStorage'],
          ['Uptime', Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime())],
          ['User', Huna7.Attendance.getUsername()],
        ].forEach(([k, v]) => {
          details.innerHTML += `<div style="color:var(--h7-text-muted)">${k}</div><div>${v}</div>`;
        });
        sec.append(logo, details);
        content.appendChild(sec);
      }
    };

    renderSidebar();
    renderContent();
    contentEl.append(sidebar, content);

    return { windowId: id };
  };

  return { launch };
})();

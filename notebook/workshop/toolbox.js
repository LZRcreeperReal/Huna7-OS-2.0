/* =====================================================
   HUNA7-OS — TOOLBOX
   Reusable shared utility functions across apps.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Toolbox = (() => {
  // Build a standard app window shell
  const createAppShell = (title, appId, width, height, content = '') => {
    return Huna7.Desk.createWindow({ title, appId, width, height, content });
  };

  // Build a toolbar with buttons
  const buildToolbar = (items) => {
    const bar = document.createElement('div');
    bar.style.cssText = `display:flex;align-items:center;gap:4px;padding:0 10px;
      height:36px;border-bottom:1px solid var(--h7-border);flex-shrink:0;`;
    items.forEach(item => {
      if (item === '|') {
        const sep = document.createElement('div');
        sep.style.cssText = 'width:1px;height:18px;background:var(--h7-border);margin:0 2px;';
        bar.appendChild(sep);
      } else {
        const btn = document.createElement('button');
        btn.className = 'h7-btn h7-btn-ghost';
        btn.style.cssText = 'padding:4px 8px;font-size:12px;height:26px;';
        btn.innerHTML = item.icon ? Huna7.Glossary.get(item.icon, 13) + (item.label ? ` <span>${item.label}</span>` : '') : item.label || '';
        btn.title = item.title || item.label || '';
        if (item.action) btn.addEventListener('click', item.action);
        if (item.disabled) btn.disabled = true;
        bar.appendChild(btn);
      }
    });
    return bar;
  };

  // Build a sidebar
  const buildSidebar = (items, onSelect) => {
    const sidebar = document.createElement('div');
    sidebar.style.cssText = `width:180px;min-width:140px;border-right:1px solid var(--h7-border);
      overflow-y:auto;padding:8px;flex-shrink:0;`;
    items.forEach(item => {
      if (item.type === 'section') {
        const label = document.createElement('div');
        label.className = 'h7-label';
        label.style.cssText = 'padding:12px 8px 4px;';
        label.textContent = item.label;
        sidebar.appendChild(label);
      } else {
        const row = document.createElement('div');
        row.className = 'h7-context-item';
        row.innerHTML = (item.icon ? Huna7.Glossary.get(item.icon, 14) : '') + ` <span>${item.label}</span>`;
        row.addEventListener('click', () => { onSelect && onSelect(item); });
        if (item.active) row.style.background = 'var(--h7-bg-glass-hover)';
        sidebar.appendChild(row);
      }
    });
    return sidebar;
  };

  // Build a table
  const buildTable = (columns, rows) => {
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label;
      th.style.cssText = `padding:8px 12px;text-align:left;border-bottom:1px solid var(--h7-border);
        color:var(--h7-text-muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;`;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'transition:background 150ms ease;';
      tr.addEventListener('mouseenter', () => tr.style.background = 'var(--h7-bg-glass)');
      tr.addEventListener('mouseleave', () => tr.style.background = '');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.style.cssText = 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);';
        td.innerHTML = col.render ? col.render(row) : Huna7.Helpers.escapeHtml(String(row[col.key] ?? ''));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  };

  // Context menu builder
  const showContextMenu = (x, y, items) => {
    document.querySelectorAll('.h7-context-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'h7-context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    items.forEach(item => {
      if (item === '-') {
        const div = document.createElement('div');
        div.className = 'h7-context-divider';
        menu.appendChild(div);
      } else {
        const row = document.createElement('div');
        row.className = 'h7-context-item' + (item.danger ? ' danger' : '');
        row.innerHTML = (item.icon ? Huna7.Glossary.get(item.icon, 13) : '<span style="width:13px"></span>') + ` <span>${item.label}</span>` + (item.shortcut ? `<span style="margin-left:auto;font-size:11px;opacity:0.5">${item.shortcut}</span>` : '');
        if (!item.disabled) row.addEventListener('click', () => { menu.remove(); item.action && item.action(); });
        if (item.disabled) row.style.opacity = '0.4';
        menu.appendChild(row);
      }
    });
    document.body.appendChild(menu);
    // Reposition if off-screen
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
      if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
    });
    const close = (e) => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true), 0);
    return menu;
  };

  // Modal dialog builder
  const showModal = (title, content, buttons = []) => {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:${Huna7.CONSTANTS.Z.MODAL};
        display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
      const dialog = document.createElement('div');
      dialog.className = 'h7-glass';
      dialog.style.cssText = 'min-width:320px;max-width:480px;padding:24px;box-shadow:var(--h7-shadow);';
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-size:16px;font-weight:600;margin-bottom:12px;';
      titleEl.textContent = title;
      const contentEl = document.createElement('div');
      contentEl.style.cssText = 'font-size:14px;color:var(--h7-text-muted);margin-bottom:20px;line-height:1.6;';
      if (typeof content === 'string') contentEl.textContent = content;
      else contentEl.appendChild(content);
      const btnsEl = document.createElement('div');
      btnsEl.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
      buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = `h7-btn h7-btn-${btn.type || 'ghost'}`;
        b.textContent = btn.label;
        b.addEventListener('click', () => { overlay.remove(); resolve(btn.value); });
        btnsEl.appendChild(b);
      });
      if (!buttons.length) {
        const b = document.createElement('button');
        b.className = 'h7-btn h7-btn-accent';
        b.textContent = 'OK';
        b.addEventListener('click', () => { overlay.remove(); resolve(true); });
        btnsEl.appendChild(b);
      }
      dialog.append(titleEl, contentEl, btnsEl);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      Huna7.Animations.windowOpen(dialog);
    });
  };

  // Show a prompt input dialog
  const showPrompt = (title, placeholder = '') => {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:${Huna7.CONSTANTS.Z.MODAL};
        display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
      const dialog = document.createElement('div');
      dialog.className = 'h7-glass';
      dialog.style.cssText = 'min-width:320px;padding:24px;box-shadow:var(--h7-shadow);';
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-size:15px;font-weight:600;margin-bottom:14px;';
      titleEl.textContent = title;
      const input = document.createElement('input');
      input.className = 'h7-input';
      input.placeholder = placeholder;
      input.style.marginBottom = '16px';
      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
      const cancel = document.createElement('button');
      cancel.className = 'h7-btn h7-btn-ghost'; cancel.textContent = 'Cancel';
      cancel.addEventListener('click', () => { overlay.remove(); resolve(null); });
      const ok = document.createElement('button');
      ok.className = 'h7-btn h7-btn-accent'; ok.textContent = 'OK';
      ok.addEventListener('click', () => { overlay.remove(); resolve(input.value); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') cancel.click(); });
      btns.append(cancel, ok);
      dialog.append(titleEl, input, btns);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      setTimeout(() => input.focus(), 50);
    });
  };

  // Build a simple status bar for apps
  const buildStatusBar = (items) => {
    const bar = document.createElement('div');
    bar.style.cssText = `height:24px;border-top:1px solid var(--h7-border);display:flex;align-items:center;
      padding:0 12px;gap:16px;font-size:11px;color:var(--h7-text-muted);flex-shrink:0;`;
    items.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item;
      bar.appendChild(span);
    });
    return bar;
  };

  return { createAppShell, buildToolbar, buildSidebar, buildTable, showContextMenu, showModal, showPrompt, buildStatusBar };
})();

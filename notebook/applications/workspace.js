/* =====================================================
   HUNA7-OS — APPS: WORKSPACE
   Workspace control center. Manage virtual desktops.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Workspace = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Workspace Manager', appId: 'workspace', width: 560, height: 400,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;padding:20px;gap:16px;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div style="font-size:18px;font-weight:700;">Workspaces</div>';
    const addBtn = document.createElement('button');
    addBtn.className = 'h7-btn h7-btn-accent';
    addBtn.innerHTML = Huna7.Glossary.get('plus', 13) + ' <span>New Workspace</span>';
    addBtn.addEventListener('click', () => { Huna7.Homeroom.addWorkspace(); renderList(); });
    header.appendChild(addBtn);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;flex:1;overflow-y:auto;';

    const info = document.createElement('div');
    info.style.cssText = 'font-size:12px;color:var(--h7-text-muted);line-height:1.6;padding:8px;background:var(--h7-bg-glass);border-radius:var(--h7-radius-sm);';
    info.innerHTML = 'Use <kbd style="background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:3px;">Ctrl+←</kbd> and <kbd style="background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:3px;">Ctrl+→</kbd> to switch workspaces.';

    contentEl.append(header, list, info);

    function renderList() {
      list.innerHTML = '';
      const workspaces = Huna7.Homeroom.getAll();
      const active = Huna7.Homeroom.getActive();

      workspaces.forEach((ws, i) => {
        const card = document.createElement('div');
        card.className = 'h7-glass';
        card.style.cssText = `padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;
          border-color:${ws.id === active.id ? 'var(--h7-accent)' : 'var(--h7-border)'};
          transition:border-color 150ms;`;

        const indicator = document.createElement('div');
        indicator.style.cssText = `width:8px;height:8px;border-radius:50%;flex-shrink:0;
          background:${ws.id === active.id ? 'var(--h7-accent)' : 'var(--h7-border)'};`;

        const label = document.createElement('div');
        label.style.cssText = 'flex:1;';
        label.innerHTML = `<div style="font-size:14px;font-weight:${ws.id === active.id ? '600' : '400'}">${ws.name}</div>
          <div style="font-size:11px;color:var(--h7-text-muted)">${ws.windows?.length || 0} windows${ws.id === active.id ? ' · Active' : ''}</div>`;

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;';

        const switchBtn = document.createElement('button');
        switchBtn.className = 'h7-btn h7-btn-ghost';
        switchBtn.style.cssText = 'padding:3px 10px;font-size:11px;height:24px;';
        switchBtn.textContent = ws.id === active.id ? 'Current' : 'Switch';
        switchBtn.disabled = ws.id === active.id;
        switchBtn.addEventListener('click', (e) => { e.stopPropagation(); Huna7.Homeroom.switchTo(i); renderList(); });

        const renameBtn = document.createElement('button');
        renameBtn.className = 'h7-btn h7-btn-ghost';
        renameBtn.style.cssText = 'padding:3px 8px;font-size:11px;height:24px;';
        renameBtn.innerHTML = Huna7.Glossary.get('edit', 11);
        renameBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const name = await Huna7.Toolbox.showPrompt('Rename Workspace', ws.name);
          if (name) { Huna7.Homeroom.renameWorkspace(i, name); renderList(); }
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'h7-btn h7-btn-ghost';
        delBtn.style.cssText = 'padding:3px 8px;font-size:11px;height:24px;';
        delBtn.innerHTML = Huna7.Glossary.get('trash', 11);
        delBtn.style.color = '#e05252';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); Huna7.Homeroom.removeWorkspace(i); renderList(); });
        if (workspaces.length <= 1) delBtn.disabled = true;

        actions.append(switchBtn, renameBtn, delBtn);
        card.append(indicator, label, actions);
        card.addEventListener('click', () => { if (ws.id !== active.id) { Huna7.Homeroom.switchTo(i); renderList(); } });
        list.appendChild(card);
      });
    };

    renderList();
    Huna7.Binder.on('workspace:switched', renderList);
    Huna7.Binder.on('workspace:added',   renderList);
    Huna7.Binder.on('workspace:removed', renderList);

    return { windowId: id, cleanup: () => { Huna7.Binder.off('workspace:switched', renderList); } };
  };

  return { launch };
})();

/* =====================================================
   HUNA7-OS — HOMEROOM
   Workspace manager. Multiple virtual desktops.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Homeroom = (() => {
  const _workspaces = [];
  let _active = 0;
  let _indicator = null;

  const init = () => {
    const saved = Huna7.Storage.get('workspaces', null);
    if (saved) {
      saved.forEach(w => _workspaces.push({ ...w, windows: [] }));
    } else {
      ['Main', 'Work', 'Media'].forEach((name, i) => _workspaces.push({ id: i, name, windows: [] }));
    }
    _active = Huna7.Storage.get('active_workspace', 0);
  };

  const getAll = () => _workspaces.map(w => ({ ...w, windows: [...w.windows] }));

  const getActive = () => _workspaces[_active] || _workspaces[0];

  const switchTo = (index) => {
    if (index < 0 || index >= _workspaces.length) return;
    // Hide windows from current workspace
    _hideWorkspaceWindows(_active);
    _active = index;
    // Show windows of new workspace
    _showWorkspaceWindows(_active);
    Huna7.Storage.set('active_workspace', _active);
    Huna7.Binder.emit('workspace:switched', { index: _active, workspace: getActive() });
    _updateIndicator();
  };

  const addWorkspace = (name = 'New') => {
    const id = _workspaces.length;
    _workspaces.push({ id, name, windows: [] });
    _persistWorkspaces();
    Huna7.Binder.emit('workspace:added', { id, name });
    _updateIndicator();
    return id;
  };

  const removeWorkspace = (index) => {
    if (_workspaces.length <= 1) return;
    _workspaces.splice(index, 1);
    _workspaces.forEach((w, i) => w.id = i);
    if (_active >= _workspaces.length) _active = _workspaces.length - 1;
    _persistWorkspaces();
    Huna7.Binder.emit('workspace:removed', { index });
    _updateIndicator();
  };

  const renameWorkspace = (index, name) => {
    if (_workspaces[index]) {
      _workspaces[index].name = name;
      _persistWorkspaces();
      _updateIndicator();
    }
  };

  const assignWindow = (windowId, workspaceIndex) => {
    _workspaces.forEach(w => { w.windows = w.windows.filter(id => id !== windowId); });
    if (_workspaces[workspaceIndex]) _workspaces[workspaceIndex].windows.push(windowId);
  };

  const unassignWindow = (windowId) => {
    _workspaces.forEach(w => { w.windows = w.windows.filter(id => id !== windowId); });
  };

  const _hideWorkspaceWindows = (idx) => {
    const ws = _workspaces[idx];
    if (!ws) return;
    ws.windows.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  };

  const _showWorkspaceWindows = (idx) => {
    const ws = _workspaces[idx];
    if (!ws) return;
    ws.windows.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
  };

  const _persistWorkspaces = () => {
    Huna7.Storage.set('workspaces', _workspaces.map(w => ({ id: w.id, name: w.name })));
  };

  const createIndicator = () => {
    _indicator = document.createElement('div');
    _indicator.style.cssText = 'display:flex;gap:6px;align-items:center;';
    _updateIndicator();
    Huna7.Binder.on('workspace:switched', _updateIndicator);
    return _indicator;
  };

  const _updateIndicator = () => {
    if (!_indicator) return;
    _indicator.innerHTML = _workspaces.map((w, i) => `
      <div onclick="Huna7.Homeroom.switchTo(${i})" style="
        width:${i === _active ? 20 : 8}px;height:8px;border-radius:4px;cursor:pointer;
        background:${i === _active ? 'var(--h7-accent)' : 'var(--h7-border)'};
        transition:all 250ms ease;
      " title="${w.name}"></div>
    `).join('');
  };

  return { init, getAll, getActive, switchTo, addWorkspace, removeWorkspace, renameWorkspace, assignWindow, unassignWindow, createIndicator };
})();

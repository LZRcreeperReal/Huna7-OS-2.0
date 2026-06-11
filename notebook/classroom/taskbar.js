/* =====================================================
   HUNA7-OS — TASKBAR
   Bottom bar showing minimized windows as clickable tabs.
   Appears only when at least one window is minimized.
   Lives between the dock and the desktop area.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Taskbar = (() => {
  const HEIGHT = 36;
  let _el     = null;
  let _root   = null;
  // Map of windowId -> { appId, title, element }
  const _items = new Map();

  const init = (root) => {
    _root = root;

    _el = document.createElement('div');
    _el.id = 'h7-taskbar';
    _el.style.cssText = `
      position:absolute;
      left:0;right:0;
      bottom:${Huna7.CONSTANTS.DOCK_HEIGHT}px;
      height:${HEIGHT}px;
      display:flex;
      align-items:center;
      gap:4px;
      padding:0 10px;
      background:rgba(0,0,0,0.45);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      border-top:1px solid rgba(255,255,255,0.07);
      z-index:${Huna7.CONSTANTS.Z.DOCK - 1};
      overflow-x:auto;
      overflow-y:hidden;
      opacity:0;
      pointer-events:none;
      transition:opacity 200ms ease, transform 200ms ease;
      transform:translateY(6px);
    `;
    // Hide scrollbar
    _el.style.scrollbarWidth = 'none';
    _root.appendChild(_el);

    // Wire events
    Huna7.Binder.on('window:minimized', ({ id, appId, title }) => _addItem(id, appId, title));
    Huna7.Binder.on('window:restored',  ({ id }) => _removeItem(id));
    Huna7.Binder.on('window:closed',    ({ id }) => _removeItem(id));
    Huna7.Binder.on('window:opened',    ({ id, appId, title }) => {
      // If somehow the window was in taskbar (shouldn't be) remove it
      _removeItem(id);
    });
  };

  const _addItem = (id, appId, title) => {
    if (_items.has(id)) return;

    const item = document.createElement('div');
    item.style.cssText = `
      display:flex;align-items:center;gap:7px;
      padding:0 10px 0 8px;
      height:26px;
      border-radius:6px;
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.10);
      cursor:pointer;
      font-size:12px;
      color:rgba(255,255,255,0.8);
      white-space:nowrap;
      flex-shrink:0;
      max-width:180px;
      overflow:hidden;
      transition:background 150ms ease, border-color 150ms ease;
      user-select:none;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = 'display:flex;align-items:center;opacity:0.7;flex-shrink:0;';
    icon.innerHTML = Huna7.Glossary.getAppIcon(appId, 12);

    const label = document.createElement('span');
    label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;';
    label.textContent = title || appId;

    // Click restores the window
    item.addEventListener('click', () => {
      Huna7.Desk.restore(id);
    });
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255,255,255,0.14)';
      item.style.borderColor = 'rgba(255,255,255,0.20)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'rgba(255,255,255,0.08)';
      item.style.borderColor = 'rgba(255,255,255,0.10)';
    });

    item.append(icon, label);
    _el.appendChild(item);
    _items.set(id, { appId, title, element: item });

    _show();
    // Animate item in
    item.style.opacity = '0';
    item.style.transform = 'scale(0.85)';
    item.style.transition = 'opacity 150ms ease, transform 150ms ease';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      item.style.opacity = '1';
      item.style.transform = 'scale(1)';
    }));

    // Also push the desktop area up so windows aren't hidden behind taskbar
    _adjustDesktop(true);
  };

  const _removeItem = (id) => {
    const entry = _items.get(id);
    if (!entry) return;
    entry.element.remove();
    _items.delete(id);
    if (_items.size === 0) {
      _hide();
      _adjustDesktop(false);
    }
  };

  const _show = () => {
    _el.style.opacity = '1';
    _el.style.pointerEvents = 'auto';
    _el.style.transform = 'translateY(0)';
  };

  const _hide = () => {
    _el.style.opacity = '0';
    _el.style.pointerEvents = 'none';
    _el.style.transform = 'translateY(6px)';
  };

  // Shift the desktop bottom edge up when taskbar is visible
  const _adjustDesktop = (visible) => {
    const desktop = document.getElementById('h7-desktop');
    if (!desktop) return;
    const base = Huna7.CONSTANTS.DOCK_HEIGHT;
    desktop.style.bottom = visible ? (base + HEIGHT) + 'px' : base + 'px';
  };

  // Update a tab's title (e.g. after setTitle is called)
  const updateTitle = (id, newTitle) => {
    const entry = _items.get(id);
    if (!entry) return;
    entry.title = newTitle;
    const label = entry.element.querySelector('span:last-child');
    if (label) label.textContent = newTitle;
  };

  return { init, updateTitle };
})();

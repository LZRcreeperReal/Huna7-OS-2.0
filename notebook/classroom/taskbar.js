/* =====================================================
   HUNA7-OS — TASKBAR
   Right-side vertical panel for minimized windows.
   Slides in from the right when windows are minimized.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Taskbar = (() => {
  const WIDTH = 200;
  let _el   = null;
  let _root = null;
  const _items = new Map();

  const init = (root) => {
    _root = root;

    // Inject keyframe for subtle entrance animation
    if (!document.getElementById('h7-taskbar-styles')) {
      const s = document.createElement('style');
      s.id = 'h7-taskbar-styles';
      s.textContent = `
        @keyframes h7-item-in {
          from { opacity:0; transform:translateX(14px); }
          to   { opacity:1; transform:translateX(0); }
        }
        #h7-taskbar::-webkit-scrollbar { width:0; }
        #h7-taskbar { scrollbar-width:none; }
      `;
      document.head.appendChild(s);
    }

    _el = document.createElement('div');
    _el.id = 'h7-taskbar';
    _el.style.cssText = `
      position:absolute;
      right:0;
      top:${Huna7.CONSTANTS.STATUS_BAR_HEIGHT}px;
      bottom:${Huna7.CONSTANTS.DOCK_HEIGHT}px;
      width:${WIDTH}px;
      display:flex;
      flex-direction:column;
      gap:6px;
      padding:12px 8px;
      z-index:${Huna7.CONSTANTS.Z.DOCK - 2};
      overflow-y:auto;
      overflow-x:hidden;
      pointer-events:none;
      opacity:0;
      transform:translateX(${WIDTH}px);
      transition:opacity 280ms cubic-bezier(0.2,0.8,0.3,1),
                 transform 280ms cubic-bezier(0.2,0.8,0.3,1);
    `;

    // Header label — only visible when panel is open
    const header = document.createElement('div');
    header.id = 'h7-taskbar-header';
    header.style.cssText = `
      font-size:10px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:0.12em;
      color:rgba(255,255,255,0.25);
      padding:0 6px 4px;
      flex-shrink:0;
    `;
    header.textContent = 'Minimized';
    _el.appendChild(header);

    _root.appendChild(_el);

    Huna7.Binder.on('window:minimized', ({ id, appId, title }) => _addItem(id, appId, title));
    Huna7.Binder.on('window:restored',  ({ id }) => _removeItem(id));
    Huna7.Binder.on('window:closed',    ({ id }) => _removeItem(id));
  };

  const _addItem = (id, appId, title) => {
    if (_items.has(id)) return;

    const item = document.createElement('div');
    item.dataset.windowId = id;
    item.style.cssText = `
      display:flex;
      align-items:center;
      gap:9px;
      padding:9px 10px;
      border-radius:10px;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.09);
      cursor:pointer;
      flex-shrink:0;
      overflow:hidden;
      animation:h7-item-in 220ms cubic-bezier(0.2,0.8,0.3,1) both;
      transition:background 160ms ease, border-color 160ms ease,
                 transform 160ms cubic-bezier(0.2,0.8,0.3,1),
                 box-shadow 160ms ease;
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      user-select:none;
    `;

    // Coloured icon pill
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `
      width:28px; height:28px;
      border-radius:7px;
      background:rgba(94,127,255,0.18);
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
      color:var(--h7-accent);
    `;
    iconWrap.innerHTML = Huna7.Glossary.getAppIcon(appId, 15);

    // Text block
    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-size:12px;
      font-weight:600;
      color:rgba(255,255,255,0.88);
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    `;
    titleEl.textContent = title || _getAppName(appId);

    const subEl = document.createElement('div');
    subEl.style.cssText = `
      font-size:10px;
      color:rgba(255,255,255,0.35);
    `;
    subEl.textContent = 'Minimized';

    textWrap.append(titleEl, subEl);

    // Restore dot indicator
    const dot = document.createElement('div');
    dot.style.cssText = `
      width:6px; height:6px;
      border-radius:50%;
      background:var(--h7-accent);
      flex-shrink:0;
      opacity:0.6;
    `;

    item.append(iconWrap, textWrap, dot);

    // Hover states
    item.addEventListener('mouseenter', () => {
      item.style.background    = 'rgba(255,255,255,0.11)';
      item.style.borderColor   = 'rgba(255,255,255,0.18)';
      item.style.transform     = 'translateX(-2px)';
      item.style.boxShadow     = '0 4px 16px rgba(0,0,0,0.3)';
      dot.style.opacity        = '1';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background    = 'rgba(255,255,255,0.06)';
      item.style.borderColor   = 'rgba(255,255,255,0.09)';
      item.style.transform     = '';
      item.style.boxShadow     = '';
      dot.style.opacity        = '0.6';
    });
    item.addEventListener('mousedown', () => {
      item.style.transform = 'translateX(-1px) scale(0.97)';
    });
    item.addEventListener('mouseup', () => {
      item.style.transform = 'translateX(-2px)';
    });

    item.addEventListener('click', () => {
      Huna7.Desk.restore(id);
    });

    _el.appendChild(item);
    _items.set(id, { appId, title: title || _getAppName(appId), element: item, titleEl });

    _show();
  };

  const _removeItem = (id) => {
    const entry = _items.get(id);
    if (!entry) return;

    // Animate out
    const el = entry.element;
    el.style.transition = 'opacity 180ms ease, transform 180ms ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(12px)';
    setTimeout(() => el.remove(), 190);

    _items.delete(id);
    if (_items.size === 0) {
      setTimeout(_hide, 200);
    }
  };

  const _show = () => {
    _el.style.opacity       = '1';
    _el.style.pointerEvents = 'auto';
    _el.style.transform     = 'translateX(0)';
  };

  const _hide = () => {
    if (_items.size > 0) return; // another item appeared while we waited
    _el.style.opacity       = '0';
    _el.style.pointerEvents = 'none';
    _el.style.transform     = `translateX(${WIDTH}px)`;
  };

  const _getAppName = (appId) => {
    return Huna7.Chalk?.getAppInfo?.(appId)?.name || appId;
  };

  const updateTitle = (id, newTitle) => {
    const entry = _items.get(id);
    if (!entry) return;
    entry.title = newTitle;
    if (entry.titleEl) entry.titleEl.textContent = newTitle;
  };

  return { init, updateTitle };
})();

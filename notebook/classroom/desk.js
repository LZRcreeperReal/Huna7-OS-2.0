/* =====================================================
   HUNA7-OS — DESK
   Window manager. Full drag/resize/snap/z-order system.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Desk = (() => {
  let _container = null;
  let _zCounter = Huna7.CONSTANTS.Z.WINDOWS;
  const _windows = new Map();

  const init = (container) => { _container = container; };

  const createWindow = ({ title, appId, width, height, content = '', minWidth, minHeight, resizable = true, x, y } = {}) => {
    const id = Huna7.Helpers.generateId('win');
    const W = width  || Huna7.CONSTANTS.DEFAULT_WINDOW_WIDTH;
    const H = height || Huna7.CONSTANTS.DEFAULT_WINDOW_HEIGHT;
    const mW = minWidth  || Huna7.CONSTANTS.MIN_WINDOW_WIDTH;
    const mH = minHeight || Huna7.CONSTANTS.MIN_WINDOW_HEIGHT;
    const startX = x ?? Math.max(20, (window.innerWidth  - W) / 2 + Huna7.Helpers.randomBetween(-60, 60));
    const startY = y ?? Math.max(36, (window.innerHeight - H) / 2 + Huna7.Helpers.randomBetween(-40, 40));

    const win = document.createElement('div');
    win.id = id;
    win.style.cssText = `
      position:absolute;left:${startX}px;top:${startY}px;
      width:${W}px;height:${H}px;min-width:${mW}px;min-height:${mH}px;
      display:flex;flex-direction:column;
      background:var(--h7-bg-panel);
      backdrop-filter:blur(var(--h7-blur));-webkit-backdrop-filter:blur(var(--h7-blur));
      border:1px solid var(--h7-border);border-radius:var(--h7-radius-lg);
      box-shadow:var(--h7-shadow);overflow:hidden;
      z-index:${++_zCounter};user-select:none;
    `;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `height:38px;display:flex;align-items:center;padding:0 12px;
      border-bottom:1px solid var(--h7-border);flex-shrink:0;gap:10px;cursor:default;`;

    // Traffic lights
    const lights = document.createElement('div');
    lights.style.cssText = 'display:flex;gap:7px;align-items:center;flex-shrink:0;';
    lights.className = 'h7-trafficlights';
    const mkLight = (color, hoverColor, action) => {
      const btn = document.createElement('div');
      btn.style.cssText = `width:13px;height:13px;border-radius:50%;background:${color};cursor:pointer;
        transition:filter 150ms ease;flex-shrink:0;`;
      btn.addEventListener('mouseenter', () => btn.style.filter = 'brightness(1.2)');
      btn.addEventListener('mouseleave', () => btn.style.filter = '');
      btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); });
      btn.addEventListener('click', (e) => { e.stopPropagation(); action(); });
      return btn;
    };
    const closeBtn    = mkLight('#FF5F57', '#FF5F57', () => close(id));
    const minimizeBtn = mkLight('#FFBD2E', '#FFBD2E', () => minimize(id));
    const maximizeBtn = mkLight('#28C840', '#28C840', () => toggleMaximize(id));
    lights.append(closeBtn, minimizeBtn, maximizeBtn);

    // App icon + title
    const appIcon = document.createElement('div');
    appIcon.style.cssText = 'color:var(--h7-text-muted);display:flex;align-items:center;';
    appIcon.innerHTML = appId ? Huna7.Glossary.getAppIcon(appId, 14) : '';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:13px;font-weight:600;flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 30px;';
    titleEl.textContent = title || 'Window';

    titleBar.append(lights, appIcon, titleEl);
    win.appendChild(titleBar);

    // Content area
    const contentEl = document.createElement('div');
    contentEl.style.cssText = 'flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;';
    if (typeof content === 'string') contentEl.innerHTML = content;
    else if (content instanceof Node) contentEl.appendChild(content);
    win.appendChild(contentEl);

    // Resize handles (8 directions)
    if (resizable) _addResizeHandles(win, id);

    _container.appendChild(win);
    Huna7.Animations.windowOpen(win);
    _makeDraggable(win, titleBar, id);
    _focus(id);

    const record = { id, appId, title, el: win, contentEl, titleEl, minimized: false, maximized: false, prevRect: null, state: 'normal' };
    _windows.set(id, record);
    Huna7.Homeroom.assignWindow(id, Huna7.Homeroom.getActive().id);
    Huna7.Binder.emit('window:opened', { id, appId, title });

    win.addEventListener('pointerdown', () => _focus(id));
    return { id, contentEl, titleEl, win };
  };

  const _focus = (id) => {
    _windows.forEach((w, wid) => {
      if (wid !== id) w.el.style.zIndex = Math.min(parseInt(w.el.style.zIndex), _zCounter - 1);
    });
    const w = _windows.get(id);
    if (w) { w.el.style.zIndex = ++_zCounter; Huna7.Binder.emit('window:focused', { id }); }
  };

  const close = (id) => {
    const w = _windows.get(id);
    if (!w) return;
    w.el.style.transition = 'opacity 180ms ease, transform 180ms ease';
    w.el.style.opacity = '0';
    w.el.style.transform = 'scale(0.92)';
    setTimeout(() => { w.el.remove(); _windows.delete(id); Huna7.Homeroom.unassignWindow(id); Huna7.Binder.emit('window:closed', { id }); }, 190);
  };

  const minimize = (id) => {
    const w = _windows.get(id);
    if (!w || w.minimized) return;
    w.minimized = true;
    w.el.style.transition = 'all 250ms cubic-bezier(0.4,0,0.6,1)';
    w.el.style.opacity = '0';
    w.el.style.transform = 'scale(0.7) translateY(40px)';
    setTimeout(() => { w.el.style.display = 'none'; w.el.style.transition = ''; }, 260);
    Huna7.Binder.emit('window:minimized', { id, appId: w.appId, title: w.title });
  };

  const restore = (id) => {
    const w = _windows.get(id);
    if (!w) return;
    w.minimized = false;
    w.el.style.display = '';
    w.el.style.opacity = '0';
    w.el.style.transform = 'scale(0.7) translateY(40px)';
    requestAnimationFrame(() => {
      w.el.style.transition = 'all 250ms cubic-bezier(0.2,0.8,0.3,1)';
      w.el.style.opacity = '1';
      w.el.style.transform = 'scale(1) translateY(0)';
      setTimeout(() => { w.el.style.transition = ''; }, 260);
    });
    _focus(id);
    Huna7.Binder.emit('window:restored', { id, appId: w.appId, title: w.title });
  };

  const toggleMaximize = (id) => {
    const w = _windows.get(id);
    if (!w) return;
    if (w.maximized) {
      const r = w.prevRect;
      Object.assign(w.el.style, { left: r.left+'px', top: r.top+'px', width: r.width+'px', height: r.height+'px', borderRadius: '', transition: 'all 250ms cubic-bezier(0.2,0.8,0.3,1)' });
      w.maximized = false;
      setTimeout(() => { w.el.style.transition = ''; }, 260);
    } else {
      const sb = Huna7.CONSTANTS.STATUS_BAR_HEIGHT, dk = Huna7.CONSTANTS.DOCK_HEIGHT;
      w.prevRect = { left: w.el.offsetLeft, top: w.el.offsetTop, width: w.el.offsetWidth, height: w.el.offsetHeight };
      Object.assign(w.el.style, { left:'0', top: sb+'px', width:'100%', height: (window.innerHeight - sb - dk)+'px', borderRadius:'0', transition: 'all 250ms cubic-bezier(0.2,0.8,0.3,1)' });
      w.maximized = true;
      setTimeout(() => { w.el.style.transition = ''; }, 260);
    }
    Huna7.Binder.emit('window:maximized', { id, maximized: w.maximized });
  };

  const setTitle = (id, title) => {
    const w = _windows.get(id);
    if (w) { w.titleEl.textContent = title; w.title = title; }
  };

  const getAll = () => Array.from(_windows.values()).map(w => ({ id: w.id, title: w.title, appId: w.appId, minimized: w.minimized }));

  const _makeDraggable = (win, handle, id) => {
    let dragging = false, ox = 0, oy = 0;
    handle.style.cursor = 'grab';
    handle.addEventListener('pointerdown', (e) => {
      // Never drag when clicking any button or interactive element in the titlebar
      if (e.target.closest('button,a,[role="button"]')) return;
      if (e.target.closest('.h7-trafficlights')) return;
      if (e.button !== 0) return; // left button only
      dragging = true;
      ox = e.clientX - win.offsetLeft;
      oy = e.clientY - win.offsetTop;
      handle.style.cursor = 'grabbing';
      handle.setPointerCapture(e.pointerId);
      _focus(id);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const w = _windows.get(id);
      if (w?.maximized) return;
      const nx = Huna7.Helpers.clamp(e.clientX - ox, -win.offsetWidth + 80, window.innerWidth - 80);
      const ny = Huna7.Helpers.clamp(e.clientY - oy, Huna7.CONSTANTS.STATUS_BAR_HEIGHT, window.innerHeight - 40);
      win.style.left = nx + 'px';
      win.style.top  = ny + 'px';
    });
    handle.addEventListener('pointerup', () => { dragging = false; handle.style.cursor = 'grab'; });
  };

  const _addResizeHandles = (win, id) => {
    const edges = [
      { pos: 'n',  cursor: 'ns-resize',   style: 'top:0;left:4px;right:4px;height:5px;' },
      { pos: 's',  cursor: 'ns-resize',   style: 'bottom:0;left:4px;right:4px;height:5px;' },
      { pos: 'e',  cursor: 'ew-resize',   style: 'top:4px;right:0;bottom:4px;width:5px;' },
      { pos: 'w',  cursor: 'ew-resize',   style: 'top:4px;left:0;bottom:4px;width:5px;' },
      { pos: 'ne', cursor: 'ne-resize',   style: 'top:0;right:0;width:10px;height:10px;' },
      { pos: 'nw', cursor: 'nw-resize',   style: 'top:0;left:0;width:10px;height:10px;' },
      { pos: 'se', cursor: 'se-resize',   style: 'bottom:0;right:0;width:10px;height:10px;' },
      { pos: 'sw', cursor: 'sw-resize',   style: 'bottom:0;left:0;width:10px;height:10px;' },
    ];
    edges.forEach(({ pos, cursor, style }) => {
      const handle = document.createElement('div');
      handle.style.cssText = `position:absolute;${style}cursor:${cursor};z-index:10;`;
      _attachResize(win, handle, pos, id);
      win.appendChild(handle);
    });
  };

  const _attachResize = (win, handle, pos, id) => {
    let resizing = false, startX, startY, startW, startH, startL, startT;
    const mW = parseInt(win.style.minWidth) || Huna7.CONSTANTS.MIN_WINDOW_WIDTH;
    const mH = parseInt(win.style.minHeight) || Huna7.CONSTANTS.MIN_WINDOW_HEIGHT;
    handle.addEventListener('pointerdown', (e) => {
      const w = _windows.get(id);
      if (w?.maximized) return;
      e.stopPropagation(); resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = win.offsetWidth; startH = win.offsetHeight;
      startL = win.offsetLeft; startT = win.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (pos.includes('e')) win.style.width  = Math.max(mW, startW + dx) + 'px';
      if (pos.includes('s')) win.style.height = Math.max(mH, startH + dy) + 'px';
      if (pos.includes('w')) { const nw = Math.max(mW, startW - dx); if (nw > mW) { win.style.width = nw+'px'; win.style.left = (startL + dx)+'px'; } }
      if (pos.includes('n')) { const nh = Math.max(mH, startH - dy); if (nh > mH) { win.style.height = nh+'px'; win.style.top = (startT + dy)+'px'; } }
    });
    handle.addEventListener('pointerup', () => { resizing = false; });
  };

  // Snap window to edge
  const snapWindow = (id, direction) => {
    const w = _windows.get(id);
    if (!w) return;
    const sb = Huna7.CONSTANTS.STATUS_BAR_HEIGHT, dk = Huna7.CONSTANTS.DOCK_HEIGHT;
    const half = window.innerWidth / 2, h = window.innerHeight - sb - dk;
    const snaps = {
      left:  { left: 0, top: sb, width: half, height: h },
      right: { left: half, top: sb, width: half, height: h },
      top:   { left: 0, top: sb, width: window.innerWidth, height: h / 2 },
      full:  { left: 0, top: sb, width: window.innerWidth, height: h },
    };
    const rect = snaps[direction];
    if (!rect) return;
    w.el.style.transition = 'all 220ms cubic-bezier(0.2,0.8,0.3,1)';
    Object.assign(w.el.style, { left: rect.left+'px', top: rect.top+'px', width: rect.width+'px', height: rect.height+'px' });
    setTimeout(() => { w.el.style.transition = ''; }, 230);
  };

  return { init, createWindow, close, minimize, restore, toggleMaximize, setTitle, snapWindow, getAll, focus: _focus };
})();

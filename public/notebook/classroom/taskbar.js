/* =====================================================
   HUNA7-OS — TASKBAR
   Right-side vertical panel for minimized windows.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Taskbar = (() => {
  const WIDTH = 210;
  let _el   = null;
  let _root = null;
  const _items = new Map();

  const init = (root) => {
    _root = root;

    if (!document.getElementById('h7-taskbar-styles')) {
      const s = document.createElement('style');
      s.id = 'h7-taskbar-styles';
      s.textContent = `
        @keyframes h7-tb-in {
          from { opacity:0; transform:translateX(16px) scale(0.95); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        #h7-taskbar::-webkit-scrollbar { width: 0; }
        #h7-taskbar { scrollbar-width: none; }
        .h7-tb-item svg {
          display:block;
          flex-shrink:0;
        }
      `;
      document.head.appendChild(s);
    }

    _el = document.createElement('div');
    _el.id = 'h7-taskbar';
    _el.style.cssText = [
      'position:absolute',
      'right:0',
      'top:' + Huna7.CONSTANTS.STATUS_BAR_HEIGHT + 'px',
      'bottom:' + Huna7.CONSTANTS.DOCK_HEIGHT + 'px',
      'width:' + WIDTH + 'px',
      'display:flex',
      'flex-direction:column',
      'gap:5px',
      'padding:10px 8px 10px 6px',
      'z-index:' + (Huna7.CONSTANTS.Z.DOCK - 2),
      'overflow-y:auto',
      'overflow-x:hidden',
      'pointer-events:none',
      'opacity:0',
      'transform:translateX(' + WIDTH + 'px)',
      'transition:opacity 280ms cubic-bezier(0.2,0.8,0.3,1), transform 280ms cubic-bezier(0.2,0.8,0.3,1)',
    ].join(';') + ';';

    const header = document.createElement('div');
    header.style.cssText = [
      'font-size:10px',
      'font-weight:700',
      'text-transform:uppercase',
      'letter-spacing:0.12em',
      'color:rgba(255,255,255,0.22)',
      'padding:2px 8px 6px',
      'flex-shrink:0',
    ].join(';') + ';';
    header.textContent = 'Minimized';
    _el.appendChild(header);

    _root.appendChild(_el);

    Huna7.Binder.on('window:minimized', ({ id, appId, title }) => {
      _addItem(id, appId, title);
    });
    Huna7.Binder.on('window:restored', ({ id }) => { _removeItem(id); });
    Huna7.Binder.on('window:closed',   ({ id }) => { _removeItem(id); });
  };

  const _getAccent = () => {
    // Read the actual computed CSS variable at call time
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--h7-accent').trim() || '#5E7FFF';
  };

  const _addItem = (id, appId, title) => {
    if (_items.has(id)) return;

    const displayTitle = (title && title.trim()) ? title.trim() : _getAppName(appId);
    const accent = _getAccent();

    const item = document.createElement('div');
    item.className = 'h7-tb-item';
    item.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:10px',
      'padding:8px 10px 8px 8px',
      'border-radius:11px',
      'background:rgba(255,255,255,0.07)',
      'border:1px solid rgba(255,255,255,0.10)',
      'cursor:pointer',
      'flex-shrink:0',
      'overflow:hidden',
      'animation:h7-tb-in 220ms cubic-bezier(0.2,0.8,0.3,1) both',
      'transition:background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease',
      'backdrop-filter:blur(16px)',
      '-webkit-backdrop-filter:blur(16px)',
      'user-select:none',
      '-webkit-user-select:none',
    ].join(';') + ';';

    // Icon pill - use inline background and hardcoded color
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = [
      'width:30px',
      'height:30px',
      'border-radius:8px',
      'background:' + accent + '22',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-shrink:0',
      'color:' + accent,
    ].join(';') + ';';

    // Get the SVG and inject explicit color attribute
    const svgStr = Huna7.Glossary.getAppIcon(appId, 16);
    // Replace stroke="currentColor" with explicit accent color so it always shows
    const coloredSvg = svgStr
      .replace(/stroke="currentColor"/g, 'stroke="' + accent + '"')
      .replace(/fill="currentColor"/g,   'fill="'   + accent + '"');
    iconWrap.innerHTML = coloredSvg;

    // Text block
    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;overflow:hidden;';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = [
      'font-size:12px',
      'font-weight:600',
      'color:rgba(255,255,255,0.90)',
      'overflow:hidden',
      'text-overflow:ellipsis',
      'white-space:nowrap',
      'line-height:1.3',
      "font-family:-apple-system,'Segoe UI',sans-serif",
    ].join(';') + ';';
    titleEl.textContent = displayTitle;

    const subEl = document.createElement('div');
    subEl.style.cssText = [
      'font-size:10px',
      'color:rgba(255,255,255,0.30)',
      "font-family:-apple-system,'Segoe UI',sans-serif",
    ].join(';') + ';';
    subEl.textContent = 'Click to restore';

    textWrap.append(titleEl, subEl);

    // Accent dot
    const dot = document.createElement('div');
    dot.style.cssText = [
      'width:5px',
      'height:5px',
      'border-radius:50%',
      'background:' + accent,
      'flex-shrink:0',
      'opacity:0.55',
      'transition:opacity 140ms ease',
    ].join(';') + ';';

    item.append(iconWrap, textWrap, dot);

    item.addEventListener('mouseenter', () => {
      item.style.background   = 'rgba(255,255,255,0.12)';
      item.style.borderColor  = 'rgba(255,255,255,0.20)';
      item.style.transform    = 'translateX(-3px)';
      item.style.boxShadow    = '0 4px 20px rgba(0,0,0,0.35)';
      dot.style.opacity       = '1';
      subEl.textContent       = 'Click to restore';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background   = 'rgba(255,255,255,0.07)';
      item.style.borderColor  = 'rgba(255,255,255,0.10)';
      item.style.transform    = '';
      item.style.boxShadow    = '';
      dot.style.opacity       = '0.55';
    });
    item.addEventListener('mousedown',  () => { item.style.transform = 'translateX(-1px) scale(0.97)'; });
    item.addEventListener('mouseup',    () => { item.style.transform = 'translateX(-3px)'; });
    item.addEventListener('click',      () => { Huna7.Desk.restore(id); });

    _el.appendChild(item);
    _items.set(id, { appId, title: displayTitle, element: item, titleEl });
    _show();
  };

  const _removeItem = (id) => {
    const entry = _items.get(id);
    if (!entry) return;
    const el = entry.element;
    el.style.transition = 'opacity 160ms ease, transform 160ms ease';
    el.style.opacity    = '0';
    el.style.transform  = 'translateX(14px)';
    setTimeout(() => el.remove(), 170);
    _items.delete(id);
    if (_items.size === 0) setTimeout(_hide, 180);
  };

  const _show = () => {
    _el.style.opacity       = '1';
    _el.style.pointerEvents = 'auto';
    _el.style.transform     = 'translateX(0)';
  };

  const _hide = () => {
    if (_items.size > 0) return;
    _el.style.opacity       = '0';
    _el.style.pointerEvents = 'none';
    _el.style.transform     = 'translateX(' + WIDTH + 'px)';
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

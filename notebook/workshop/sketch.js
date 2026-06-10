/* =====================================================
   HUNA7-OS — SKETCH
   Helper utilities and common UI patterns for apps.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Sketch = (() => {
  // Build a standard two-pane layout (sidebar + main)
  const twoPaneLayout = (sidebar, main) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex:1;overflow:hidden;min-height:0;';
    wrap.append(sidebar, main);
    return wrap;
  };

  // Build a standard three-pane layout
  const threePaneLayout = (left, center, right) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex:1;overflow:hidden;min-height:0;';
    wrap.append(left, center, right);
    return wrap;
  };

  // Create an icon + label item (desktop icon style)
  const desktopIcon = (appId, label, onClick) => {
    const item = document.createElement('div');
    item.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:6px;
      padding:10px 6px;border-radius:var(--h7-radius);cursor:pointer;width:80px;
      transition:background var(--h7-anim-speed) ease;user-select:none;`;
    item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.08)');
    item.addEventListener('mouseleave', () => item.style.background = '');
    item.addEventListener('dblclick', onClick);
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `width:48px;height:48px;border-radius:12px;
      background:var(--h7-bg-glass);display:flex;align-items:center;justify-content:center;
      box-shadow:var(--h7-shadow-sm);color:var(--h7-accent);`;
    iconWrap.innerHTML = Huna7.Glossary.getAppIcon(appId, 24);
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.cssText = 'font-size:11px;text-align:center;color:var(--h7-text);line-height:1.3;max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    item.append(iconWrap, labelEl);
    return item;
  };

  // Create a file icon
  const fileIcon = (entry) => {
    const ext = Huna7.Helpers.getFileExtension(entry.name);
    const colorMap = { '.pencil': '#5E7FFF', '.note': '#98c379', '.data': '#d19a66', '.theme': '#c678dd', '.hpkg': '#56b6c2' };
    const color = colorMap[ext] || 'var(--h7-text-muted)';
    const icon = document.createElement('div');
    icon.style.cssText = `width:36px;height:36px;border-radius:8px;display:flex;align-items:center;
      justify-content:center;color:${color};background:rgba(255,255,255,0.05);flex-shrink:0;`;
    icon.innerHTML = entry.type === 'directory' ? Huna7.Glossary.get('folder', 18) : Huna7.Glossary.get('file', 18);
    return icon;
  };

  // Spinner
  const spinner = (size = 20) => {
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;
      border:2px solid var(--h7-border);border-top-color:var(--h7-accent);
      animation:h7-spin 0.7s linear infinite;`;
    if (!document.querySelector('#h7-spin-style')) {
      const s = document.createElement('style');
      s.id = 'h7-spin-style';
      s.textContent = '@keyframes h7-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }
    return el;
  };

  // Empty state placeholder
  const emptyState = (icon, title, subtitle = '') => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px;padding:40px;opacity:0.5;';
    const iconEl = document.createElement('div');
    iconEl.innerHTML = Huna7.Glossary.get(icon, 40);
    iconEl.style.color = 'var(--h7-text-muted)';
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-size:15px;font-weight:600;color:var(--h7-text);';
    const subEl = document.createElement('div');
    subEl.textContent = subtitle;
    subEl.style.cssText = 'font-size:13px;color:var(--h7-text-muted);';
    wrap.append(iconEl, titleEl, subEl);
    return wrap;
  };

  // Progress bar
  const progressBar = (value = 0, color = 'var(--h7-accent)') => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'height:4px;background:var(--h7-bg-glass);border-radius:2px;overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;background:${color};border-radius:2px;transition:width 300ms ease;width:${value}%;`;
    wrap.appendChild(fill);
    wrap.update = (pct) => { fill.style.width = Math.max(0, Math.min(100, pct)) + '%'; };
    return wrap;
  };

  // Badge / pill
  const badge = (text, color = 'var(--h7-accent)') => {
    const el = document.createElement('span');
    el.textContent = text;
    el.style.cssText = `display:inline-flex;align-items:center;padding:2px 7px;border-radius:12px;
      font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;
      background:${color};color:#fff;`;
    return el;
  };

  // Tab bar
  const tabBar = (tabs, onSelect, activeIndex = 0) => {
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;border-bottom:1px solid var(--h7-border);flex-shrink:0;overflow-x:auto;';
    let currentActive = activeIndex;
    const tabEls = tabs.map((tab, i) => {
      const el = document.createElement('div');
      el.style.cssText = `padding:8px 16px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;
        white-space:nowrap;transition:all var(--h7-anim-speed) ease;color:var(--h7-text-muted);`;
      el.textContent = tab.label || tab;
      const setActive = () => {
        tabEls.forEach(t => { t.style.color = 'var(--h7-text-muted)'; t.style.borderBottomColor = 'transparent'; });
        el.style.color = 'var(--h7-text)';
        el.style.borderBottomColor = 'var(--h7-accent)';
      };
      if (i === activeIndex) setActive();
      el.addEventListener('click', () => { setActive(); onSelect && onSelect(i, tab); });
      bar.appendChild(el);
      return el;
    });
    return bar;
  };

  return { twoPaneLayout, threePaneLayout, desktopIcon, fileIcon, spinner, emptyState, progressBar, badge, tabBar };
})();

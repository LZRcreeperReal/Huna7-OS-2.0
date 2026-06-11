/* =====================================================
   HUNA7-OS — STARTUP: LOADING
   Boot progress screen. Real stages, real timing.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Loading = (() => {
  let _el       = null;
  let _barFill  = null;
  let _stageEl  = null;
  let _detailEl = null;
  let _dotTimer = null;

  /**
   * Mount the boot loader into `root`.
   * Returns { updateStage, updateProgress, dismiss }
   */
  const mount = (root) => {
    _el = document.createElement('div');
    _el.id = 'h7-loading';
    _el.style.cssText = `
      position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH - 1};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:#000;gap:28px;opacity:0;transition:opacity 300ms ease;
    `;

    // Mini logo at top
    const miniLogo = document.createElement('div');
    miniLogo.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
    miniLogo.innerHTML = Huna7.Startup.Logo.getSVGString(32, '#5E7FFF') +
      `<span style="font-size:18px;font-weight:700;letter-spacing:-0.03em;color:#fff;opacity:0.9;">Huna7-OS</span>`;

    // Progress bar
    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'width:320px;height:2px;background:rgba(255,255,255,0.08);border-radius:1px;overflow:hidden;';
    _barFill = document.createElement('div');
    _barFill.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#5E7FFF,#A78BFA);border-radius:1px;transition:width 400ms cubic-bezier(0.4,0,0.2,1);';
    barWrap.appendChild(_barFill);

    // Stage label
    _stageEl = document.createElement('div');
    _stageEl.style.cssText = 'font-size:13px;font-weight:500;color:rgba(255,255,255,0.85);letter-spacing:0.02em;min-height:20px;';

    // Detail / sub-message
    _detailEl = document.createElement('div');
    _detailEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.05em;font-family:var(--h7-font-mono);min-height:16px;';

    // Animated dots indicator
    const dots = document.createElement('div');
    dots.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
    const dotEls = Array.from({length: 3}, (_, i) => {
      const d = document.createElement('div');
      d.style.cssText = `width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.2);
        transition:background 200ms ease;`;
      dots.appendChild(d);
      return d;
    });

    let dotIdx = 0;
    _dotTimer = setInterval(() => {
      dotEls.forEach((d, i) => { d.style.background = i === dotIdx ? 'rgba(94,127,255,0.9)' : 'rgba(255,255,255,0.15)'; });
      dotIdx = (dotIdx + 1) % 3;
    }, 400);

    _el.append(miniLogo, barWrap, _stageEl, _detailEl, dots);
    root.appendChild(_el);

    // Fade in
    requestAnimationFrame(() => requestAnimationFrame(() => { _el.style.opacity = '1'; }));

    return { updateStage, updateProgress, addDetail, dismiss };
  };

  const updateStage = (label) => {
    if (!_stageEl) return;
    _stageEl.style.opacity = '0';
    setTimeout(() => {
      _stageEl.textContent = label;
      _stageEl.style.transition = 'opacity 200ms ease';
      _stageEl.style.opacity = '1';
    }, 100);
  };

  const updateProgress = (pct) => {
    if (_barFill) _barFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  };

  const addDetail = (msg) => {
    if (!_detailEl) return;
    _detailEl.textContent = msg;
  };

  const dismiss = (onDone) => {
    if (_dotTimer) clearInterval(_dotTimer);
    if (!_el) { if (onDone) onDone(); return; }
    updateProgress(100);
    setTimeout(() => {
      if (!_el) return;
      _el.style.transition = 'opacity 400ms ease';
      _el.style.opacity = '0';
      setTimeout(() => {
        _el?.remove(); _el = null;
        if (onDone) onDone();
      }, 420);
    }, 300);
  };

  return { mount, updateStage, updateProgress, addDetail, dismiss };
})();

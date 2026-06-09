/* =====================================================
   HUNA7-OS — STARTUP: SPLASH
   Splash screen. Logo reveal + initial brand intro.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Splash = (() => {
  let _el = null;

  /**
   * Show the splash screen in `root`.
   * @param {HTMLElement} root
   * @param {Function}    onDone  called after animation completes
   */
  const show = (root, onDone) => {
    _el = document.createElement('div');
    _el.id = 'h7-splash';
    _el.style.cssText = `
      position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:#000;gap:0;overflow:hidden;
    `;

    // Ambient glow behind logo
    const glow = document.createElement('div');
    glow.style.cssText = `
      position:absolute;width:400px;height:400px;border-radius:50%;
      background:radial-gradient(circle,rgba(94,127,255,0.18) 0%,transparent 70%);
      pointer-events:none;opacity:0;transition:opacity 800ms ease 200ms;
    `;

    // Logo container
    const logoWrap = document.createElement('div');
    logoWrap.style.cssText = 'display:flex;align-items:center;justify-content:center;';

    _el.append(glow, logoWrap);
    root.appendChild(_el);

    // Render animated logo
    requestAnimationFrame(() => {
      glow.style.opacity = '1';
      Huna7.Startup.Logo.render(logoWrap, {
        size: 140,
        animated: true,
        onDone: () => {
          // Linger briefly then fade out
          setTimeout(() => dismiss(onDone), 400);
        },
      });
    });
  };

  const dismiss = (onDone) => {
    if (!_el) { if (onDone) onDone(); return; }
    _el.style.transition = 'opacity 500ms ease';
    _el.style.opacity = '0';
    setTimeout(() => {
      _el?.remove();
      _el = null;
      if (onDone) onDone();
    }, 510);
  };

  const isVisible = () => !!_el;

  return { show, dismiss, isVisible };
})();

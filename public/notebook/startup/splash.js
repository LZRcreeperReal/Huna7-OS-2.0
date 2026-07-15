/* =====================================================
   HUNA7-OS — STARTUP: SPLASH
   Splash screen. Logo reveal + 2 second linger.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Splash = (() => {
  let _el = null;

  const show = (root, onDone) => {
    _el = document.createElement('div');
    _el.id = 'h7-splash';
    _el.style.cssText = `
      position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:#000;overflow:hidden;
    `;

    const glow = document.createElement('div');
    glow.style.cssText = `
      position:absolute;width:500px;height:500px;border-radius:50%;
      background:radial-gradient(circle,rgba(94,127,255,0.15) 0%,transparent 70%);
      pointer-events:none;opacity:0;transition:opacity 1000ms ease;
    `;

    const logoWrap = document.createElement('div');
    logoWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;';

    _el.append(glow, logoWrap);
    root.appendChild(_el);

    requestAnimationFrame(() => {
      glow.style.opacity = '1';
      Huna7.Startup.Logo.render(logoWrap, {
        size: 160,
        animated: true,
        onDone: () => {
          // Show logo for 2 full seconds after animation completes
          setTimeout(() => dismiss(onDone), 2000);
        },
      });
    });
  };

  const dismiss = (onDone) => {
    if (!_el) { if (onDone) onDone(); return; }
    _el.style.transition = 'opacity 600ms ease';
    _el.style.opacity = '0';
    setTimeout(() => {
      _el?.remove();
      _el = null;
      if (onDone) onDone();
    }, 620);
  };

  const isVisible = () => !!_el;
  return { show, dismiss, isVisible };
})();

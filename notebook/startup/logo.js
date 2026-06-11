/* =====================================================
   HUNA7-OS — STARTUP: LOGO
   Official Huna7-OS SVG logo. No emoji. No placeholders.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Logo = (() => {

  /**
   * Render the Huna7-OS SVG logo into a container.
   * @param {HTMLElement} container
   * @param {object}      opts  { size, animated, color, onDone }
   */
  const render = (container, opts = {}) => {
    const size     = opts.size     || 120;
    const animated = opts.animated !== false;
    const color    = opts.color    || '#5E7FFF';
    const alt      = opts.altColor || '#A78BFA';
    const onDone   = opts.onDone   || null;

    // Remove any existing logo
    container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:${Math.round(size*0.18)}px;`;

    // ── SVG Mark ─────────────────────────────────────────
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width',  size);
    svg.setAttribute('height', size);
    svg.style.cssText = animated ? 'opacity:0;transform:scale(0.7);transition:opacity 300ms cubic-bezier(0.2,0.8,0.3,1),transform 300ms cubic-bezier(0.34,1.56,0.64,1);' : '';

    // Outer hexagon ring
    const hex = document.createElementNS(svgNS, 'polygon');
    hex.setAttribute('points', '50 3 93 27 93 73 50 97 7 73 7 27');
    hex.setAttribute('fill', 'none');
    hex.setAttribute('stroke', color);
    hex.setAttribute('stroke-width', '3');
    hex.setAttribute('stroke-opacity', '0.35');
    if (animated) {
      hex.style.cssText = `stroke-dasharray:260;stroke-dashoffset:260;transition:stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1) 200ms;`;
    }

    // Inner H glyph — two vertical bars + bridge
    const barL = document.createElementNS(svgNS, 'rect');
    barL.setAttribute('x', '26'); barL.setAttribute('y', '24');
    barL.setAttribute('width', '12'); barL.setAttribute('height', '52');
    barL.setAttribute('rx', '6');
    barL.setAttribute('fill', `url(#hg1)`);
    if (animated) barL.style.cssText = 'opacity:0;transform:translateY(8px);transition:opacity 200ms ease 200ms,transform 200ms cubic-bezier(0.2,0.8,0.3,1) 500ms;';

    const barR = document.createElementNS(svgNS, 'rect');
    barR.setAttribute('x', '62'); barR.setAttribute('y', '24');
    barR.setAttribute('width', '12'); barR.setAttribute('height', '52');
    barR.setAttribute('rx', '6');
    barR.setAttribute('fill', `url(#hg2)`);
    if (animated) barR.style.cssText = 'opacity:0;transform:translateY(8px);transition:opacity 200ms ease 250ms,transform 200ms cubic-bezier(0.2,0.8,0.3,1) 600ms;';

    const bridge = document.createElementNS(svgNS, 'rect');
    bridge.setAttribute('x', '32'); bridge.setAttribute('y', '44');
    bridge.setAttribute('width', '36'); bridge.setAttribute('height', '12');
    bridge.setAttribute('rx', '6');
    bridge.setAttribute('fill', `url(#hg3)`);
    if (animated) bridge.style.cssText = 'opacity:0;transform:scaleX(0);transform-origin:center;transition:opacity 350ms ease 700ms,transform 350ms cubic-bezier(0.34,1.56,0.64,1) 700ms;';

    // Gradients
    const defs = document.createElementNS(svgNS, 'defs');
    const mkGrad = (id, x1, y1, x2, y2, c1, c2) => {
      const g = document.createElementNS(svgNS, 'linearGradient');
      g.setAttribute('id', id);
      g.setAttribute('x1', x1); g.setAttribute('y1', y1);
      g.setAttribute('x2', x2); g.setAttribute('y2', y2);
      const s1 = document.createElementNS(svgNS, 'stop');
      s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', c1);
      const s2 = document.createElementNS(svgNS, 'stop');
      s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', c2);
      g.append(s1, s2);
      return g;
    };
    defs.append(
      mkGrad('hg1', '0', '0', '0', '1', color, alt),
      mkGrad('hg2', '0', '0', '0', '1', alt, color),
      mkGrad('hg3', '0', '0', '1', '0', color, alt),
    );

    svg.append(defs, hex, barL, barR, bridge);

    // ── Wordmark ─────────────────────────────────────────
    const wordmark = document.createElement('div');
    const fs = Math.round(size * 0.22);
    wordmark.style.cssText = `font-size:${fs}px;font-weight:800;letter-spacing:-0.04em;
      background:linear-gradient(135deg,${color},${alt});
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      ${animated ? 'opacity:0;transform:translateY(6px);transition:opacity 200ms ease 300ms,transform 200ms ease 300ms;' : ''}`;
    wordmark.textContent = 'Huna7-OS';

    const sub = document.createElement('div');
    sub.style.cssText = `font-size:${Math.round(fs * 0.55)}px;color:rgba(255,255,255,0.35);letter-spacing:0.12em;text-transform:uppercase;font-weight:500;
      ${animated ? 'opacity:0;transition:opacity 200ms ease 350ms;' : ''}`;
    sub.textContent = `v${Huna7.CONSTANTS.VERSION}`;

    wrap.append(svg, wordmark, sub);
    container.appendChild(wrap);

    // ── Animate ───────────────────────────────────────────
    if (animated) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        svg.style.opacity   = '1';
        svg.style.transform = 'scale(1)';
        hex.style.strokeDashoffset = '0';
        setTimeout(() => { barL.style.opacity = '1'; barL.style.transform = 'translateY(0)'; }, 50);
        setTimeout(() => { barR.style.opacity = '1'; barR.style.transform = 'translateY(0)'; }, 50);
        setTimeout(() => { bridge.style.opacity = '1'; bridge.style.transform = 'scaleX(1)'; }, 50);
        setTimeout(() => { wordmark.style.opacity = '1'; wordmark.style.transform = 'translateY(0)'; }, 50);
        setTimeout(() => { sub.style.opacity = '1'; }, 50);
        if (onDone) setTimeout(onDone, 500);
      }));
    }

    return wrap;
  };

  /** Return raw SVG string for use in dock icons etc. */
  const getSVGString = (size = 24, color = 'currentColor') => `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50 3 93 27 93 73 50 97 7 73 7 27" fill="none" stroke="${color}" stroke-width="4" stroke-opacity="0.5"/>
      <rect x="26" y="24" width="12" height="52" rx="6" fill="${color}"/>
      <rect x="62" y="24" width="12" height="52" rx="6" fill="${color}"/>
      <rect x="32" y="44" width="36" height="12" rx="6" fill="${color}" opacity="0.8"/>
    </svg>`;

  return { render, getSVGString };
})();

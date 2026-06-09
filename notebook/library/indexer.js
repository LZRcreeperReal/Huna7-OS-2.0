/* =====================================================
   HUNA7-OS — INDEXER
   UI animation and transition orchestration layer.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Indexer = (() => {
  // Track running animations
  const _running = new Map();

  // Transition a numeric CSS property on an element
  const tween = (el, prop, from, to, duration = 220, easeFn = null) => {
    const ease = easeFn || Huna7.Animations.ease.outCubic;
    const id = `${el._h7id || (el._h7id = Huna7.Helpers.generateId())}_${prop}`;
    if (_running.has(id)) cancelAnimationFrame(_running.get(id));
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const val = Huna7.Helpers.lerp(from, to, ease(t));
      el.style[prop] = typeof from === 'number' ? val : val + 'px';
      if (t < 1) _running.set(id, requestAnimationFrame(tick));
      else _running.delete(id);
    };
    _running.set(id, requestAnimationFrame(tick));
  };

  // Smooth reveal for container + children
  const revealContainer = (container, childSelector = '*', staggerMs = 40) => {
    const children = container.querySelectorAll(childSelector);
    Huna7.Animations.staggerReveal(Array.from(children), staggerMs);
  };

  // Transition entire page/layer
  const pageTransition = (el, direction = 'in', duration = 280) => {
    if (direction === 'in') {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.display = '';
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(0.2,0.8,0.3,1)`;
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      });
    } else {
      el.style.transition = `opacity ${duration * 0.7}ms ease, transform ${duration * 0.7}ms ease`;
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => { el.style.display = 'none'; }, duration * 0.7);
    }
  };

  // Ripple effect on click
  const ripple = (el, x, y) => {
    const r = document.createElement('span');
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `
      position: absolute; border-radius: 50%; pointer-events: none;
      width: ${size}px; height: ${size}px;
      left: ${x - rect.left - size/2}px; top: ${y - rect.top - size/2}px;
      background: rgba(255,255,255,0.15);
      transform: scale(0); animation: h7-ripple 500ms ease-out forwards;
    `;
    if (!document.querySelector('#h7-ripple-style')) {
      const s = document.createElement('style');
      s.id = 'h7-ripple-style';
      s.textContent = '@keyframes h7-ripple { to { transform: scale(1); opacity: 0; } }';
      document.head.appendChild(s);
    }
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(r);
    setTimeout(() => r.remove(), 500);
  };

  // Attach ripple to button
  const attachRipple = (el) => {
    el.addEventListener('pointerdown', (e) => ripple(el, e.clientX, e.clientY));
  };

  // Pulse glow on element
  const pulse = (el, color = 'var(--h7-accent)', duration = 600) => {
    el.style.boxShadow = `0 0 0 0 ${color}`;
    el.style.transition = `box-shadow ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.boxShadow = `0 0 0 8px transparent`;
      setTimeout(() => { el.style.boxShadow = ''; el.style.transition = ''; }, duration);
    });
  };

  // Type-writer text animation
  const typewriter = (el, text, speed = 30, onDone) => {
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i >= text.length) { if (onDone) onDone(); return; }
      el.textContent += text[i++];
      setTimeout(tick, speed + Math.random() * speed * 0.5);
    };
    tick();
  };

  // Scroll to element smoothly
  const scrollTo = (container, el) => {
    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - containerRect.top;
    const startScrollTop = container.scrollTop;
    const targetScrollTop = startScrollTop + offset - containerRect.height / 2 + elRect.height / 2;
    Huna7.Animations.animate({
      duration: 280, easing: Huna7.Animations.ease.outCubic,
      onUpdate: (t) => { container.scrollTop = Huna7.Helpers.lerp(startScrollTop, targetScrollTop, t); },
    });
  };

  return { tween, revealContainer, pageTransition, ripple, attachRipple, pulse, typewriter, scrollTo };
})();

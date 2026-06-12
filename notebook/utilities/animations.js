/* =====================================================
   HUNA7-OS — ANIMATIONS
   Core animation utilities for smooth OS motion.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Animations = (() => {
  // Easing functions
  const ease = {
    outCubic: t => 1 - Math.pow(1 - t, 3),
    outQuart: t => 1 - Math.pow(1 - t, 4),
    inOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2,
    outElastic: t => t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * (2*Math.PI)/3) + 1,
    outSpring: t => {
      const c4 = (2*Math.PI)/3;
      return t === 0 ? 0 : t === 1 ? 1 :
        Math.pow(2, -10*t) * Math.sin((t*10 - 0.75) * c4) + 1;
    },
  };

  // Core animator
  const animate = ({ duration = 300, easing = ease.outCubic, onUpdate, onComplete }) => {
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      onUpdate(eased, progress);
      if (progress < 1) requestAnimationFrame(tick);
      else if (onComplete) onComplete();
    };
    requestAnimationFrame(tick);
  };

  // Fade in element
  const fadeIn = (el, duration = 200, from = 0) => {
    el.style.opacity = from;
    el.style.display = '';
    animate({
      duration,
      easing: ease.outCubic,
      onUpdate: (t) => { el.style.opacity = Huna7.Helpers.lerp(from, 1, t); },
    });
  };

  // Fade out element
  const fadeOut = (el, duration = 160, onDone) => {
    const startOpacity = parseFloat(el.style.opacity) || 1;
    animate({
      duration,
      easing: ease.outCubic,
      onUpdate: (t) => { el.style.opacity = Huna7.Helpers.lerp(startOpacity, 0, t); },
      onComplete: () => {
        el.style.display = 'none';
        if (onDone) onDone();
      },
    });
  };

  // Slide + fade in (window open)
  const windowOpen = (el, duration = 220) => {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.92) translateY(8px)';
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.2,0.8,0.3,1), transform ${duration}ms cubic-bezier(0.2,0.8,0.3,1)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'scale(1) translateY(0)';
      });
    });
  };

  // Minimize animation
  const windowMinimize = (el, targetRect, onDone) => {
    const rect = el.getBoundingClientRect();
    el.style.transition = 'all 280ms cubic-bezier(0.4,0,0.6,1)';
    el.style.opacity = '0';
    el.style.transform = `scale(0.1) translate(${targetRect.x - rect.left}px, ${targetRect.y - rect.top}px)`;
    setTimeout(() => { el.style.display = 'none'; if (onDone) onDone(); }, 290);
  };

  // Scale pop (notifications, alerts)
  const scalePop = (el) => {
    el.style.transform = 'scale(0.85)';
    el.style.transition = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.style.transform = 'scale(1)'; });
    });
  };

  // Shake (error state)
  const shake = (el) => {
    el.style.transition = 'transform 60ms ease';
    const positions = [0, -8, 8, -6, 6, -3, 3, 0];
    let i = 0;
    const step = () => {
      if (i >= positions.length) { el.style.transform = ''; el.style.transition = ''; return; }
      el.style.transform = `translateX(${positions[i]}px)`;
      i++;
      setTimeout(step, 60);
    };
    step();
  };

  // Apply CSS transition shorthand
  const transition = (el, props = 'all', dur = 200, easing = 'cubic-bezier(0.2,0.8,0.3,1)') => {
    el.style.transition = `${props} ${dur}ms ${easing}`;
  };

  // Staggered reveal for lists
  const staggerReveal = (elements, delay = 40, duration = 180) => {
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => {
        el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  };

  return { ease, animate, fadeIn, fadeOut, windowOpen, windowMinimize, scalePop, shake, transition, staggerReveal };
})();

/* =====================================================
   HUNA7-OS — PROTOTYPE
   Development diagnostics. Disabled in production.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Prototype = (() => {
  const PROD = false; // Set true to disable all diagnostics

  const init = () => {
    if (PROD) return;
    // Expose useful references on window for devtools
    window.__h7 = {
      Chalk: Huna7.Chalk, Binder: Huna7.Binder, Notebook: Huna7.Notebook,
      Compass: Huna7.Compass, Ruler: Huna7.Ruler, Encyclopedia: Huna7.Encyclopedia,
      VoxScript: Huna7.VoxScript, Drafting: Huna7.Drafting,
      dump: () => Huna7.Drafting.dumpState(),
      spawn: (id) => Huna7.Chalk.spawn(id),
      run: (code) => Huna7.VoxScript.Runtime.run(code, { outputFn: console.log }),
    };
    console.info('%cHuna7-OS ' + Huna7.CONSTANTS.VERSION, 'color:#5E7FFF;font-weight:bold;font-size:14px;');
    console.info('Dev tools: window.__h7');
  };

  const assert = (condition, msg) => {
    if (!PROD && !condition) throw new Error('[Prototype] Assertion failed: ' + msg);
  };

  const benchmark = async (label, fn, iterations = 100) => {
    if (PROD) return;
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const s = performance.now();
      await fn();
      times.push(performance.now() - s);
    }
    const avg = times.reduce((a,b) => a+b, 0) / times.length;
    const min = Math.min(...times), max = Math.max(...times);
    console.log(`[Benchmark] ${label}: avg=${avg.toFixed(2)}ms min=${min.toFixed(2)}ms max=${max.toFixed(2)}ms`);
  };

  return { init, assert, benchmark };
})();

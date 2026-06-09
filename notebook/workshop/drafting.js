/* =====================================================
   HUNA7-OS — DRAFTING
   Debugging helpers and diagnostic tools.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Drafting = (() => {
  let _enabled = true;
  const _buffer = [];
  const MAX_BUFFER = 200;

  const log = (module, ...args) => {
    if (!_enabled) return;
    const entry = { time: Date.now(), module, args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) };
    _buffer.push(entry);
    if (_buffer.length > MAX_BUFFER) _buffer.shift();
    console.log(`[${module}]`, ...args);
  };

  const warn = (module, ...args) => {
    if (!_enabled) return;
    console.warn(`[${module}]`, ...args);
  };

  const error = (module, ...args) => {
    console.error(`[${module}]`, ...args);
    Huna7.Binder.emit('system:error', { module, args });
  };

  const getLogs = (module) => module ? _buffer.filter(e => e.module === module) : [..._buffer];

  const clearLogs = () => { _buffer.length = 0; };

  const enable = () => { _enabled = true; };
  const disable = () => { _enabled = false; };

  // Performance measure helper
  const measure = (label, fn) => {
    const start = performance.now();
    const result = fn();
    const dur = performance.now() - start;
    log('perf', `${label}: ${dur.toFixed(2)}ms`);
    return result;
  };

  // Async measure
  const measureAsync = async (label, fn) => {
    const start = performance.now();
    const result = await fn();
    const dur = performance.now() - start;
    log('perf', `${label}: ${dur.toFixed(2)}ms`);
    return result;
  };

  // Dump system state
  const dumpState = () => ({
    processes: Huna7.Chalk.getAllProcesses(),
    services: Huna7.Compass.list(),
    timers: Huna7.Schedule.list(),
    uptime: Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime()),
    theme: Huna7.Encyclopedia.getCurrent()?.name,
    profile: Huna7.Storage.getProfile()?.username,
  });

  return { log, warn, error, getLogs, clearLogs, enable, disable, measure, measureAsync, dumpState };
})();

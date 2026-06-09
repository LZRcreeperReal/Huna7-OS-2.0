/* =====================================================
   HUNA7-OS — SCHEDULE
   Task scheduler. Timers and process queues.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Schedule = (() => {
  const _timers = new Map();
  const _intervals = new Map();
  const _queue = [];
  let _queueRunning = false;
  let _taskIdCounter = 0;

  const nextId = () => `task_${++_taskIdCounter}`;

  // Single-shot timer
  const delay = (fn, ms, label = '') => {
    const id = nextId();
    const handle = setTimeout(() => { fn(); _timers.delete(id); }, ms);
    _timers.set(id, { handle, label, type: 'timeout', created: Date.now(), ms });
    return id;
  };

  // Repeating interval
  const repeat = (fn, ms, label = '') => {
    const id = nextId();
    const handle = setInterval(fn, ms);
    _intervals.set(id, { handle, label, type: 'interval', created: Date.now(), ms });
    return id;
  };

  // Cancel a timer or interval
  const cancel = (id) => {
    if (_timers.has(id)) { clearTimeout(_timers.get(id).handle); _timers.delete(id); }
    if (_intervals.has(id)) { clearInterval(_intervals.get(id).handle); _intervals.delete(id); }
  };

  // Cancel all timers
  const cancelAll = () => {
    _timers.forEach(({ handle }) => clearTimeout(handle));
    _intervals.forEach(({ handle }) => clearInterval(handle));
    _timers.clear();
    _intervals.clear();
  };

  // Queue a microtask
  const queue = (fn) => {
    _queue.push(fn);
    if (!_queueRunning) _drainQueue();
  };

  const _drainQueue = async () => {
    _queueRunning = true;
    while (_queue.length > 0) {
      const fn = _queue.shift();
      try { await fn(); } catch (e) { console.error('[Schedule] queued task failed:', e); }
    }
    _queueRunning = false;
  };

  // Next animation frame
  const nextFrame = (fn) => requestAnimationFrame(fn);

  // After paint (double rAF)
  const afterPaint = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  // Idle callback
  const idle = (fn) => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn);
    else delay(fn, 0);
  };

  // Debounce shortcut
  const debounce = (fn, ms) => Huna7.Helpers.debounce(fn, ms);

  // Throttle shortcut
  const throttle = (fn, ms) => Huna7.Helpers.throttle(fn, ms);

  // List all active timers
  const list = () => [
    ...Array.from(_timers.values()),
    ...Array.from(_intervals.values()),
  ];

  return { delay, repeat, cancel, cancelAll, queue, nextFrame, afterPaint, idle, debounce, throttle, list };
})();

/* =====================================================
   HUNA7-OS — BINDER
   Global event bus. All inter-module communication.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Binder = (() => {
  const _listeners = new Map();
  const _queue = [];
  let _ready = false;

  const on = (event, handler, once = false) => {
    if (!_listeners.has(event)) _listeners.set(event, []);
    _listeners.get(event).push({ handler, once });
    return () => off(event, handler);
  };

  const once = (event, handler) => on(event, handler, true);

  const off = (event, handler) => {
    if (!_listeners.has(event)) return;
    const list = _listeners.get(event).filter(h => h.handler !== handler);
    _listeners.set(event, list);
  };

  const emit = (event, data) => {
    if (!_ready) { _queue.push({ event, data }); return; }
    _dispatch(event, data);
  };

  const _dispatch = (event, data) => {
    const handlers = _listeners.get(event) || [];
    const toRemove = [];
    for (const { handler, once } of handlers) {
      try { handler(data); } catch (e) { console.error(`[Binder] Error in ${event}:`, e); }
      if (once) toRemove.push(handler);
    }
    if (toRemove.length) {
      _listeners.set(event, handlers.filter(h => !toRemove.includes(h.handler)));
    }
    // Wildcard handlers
    const wild = _listeners.get('*') || [];
    for (const { handler } of wild) {
      try { handler({ event, data }); } catch (e) {}
    }
  };

  const ready = () => {
    _ready = true;
    while (_queue.length) {
      const { event, data } = _queue.shift();
      _dispatch(event, data);
    }
  };

  const clear = (event) => {
    if (event) _listeners.delete(event);
    else _listeners.clear();
  };

  // Convenience: listen to all events
  const onAll = (handler) => on('*', handler);

  return { on, once, off, emit, ready, clear, onAll };
})();

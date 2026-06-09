/* =====================================================
   HUNA7-OS — UTILITIES: ERRORS
   Centralized error management. System, app, VoxScript.
   All subsystems should use this for error handling.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Errors = (() => {
  const _log = [];
  const MAX_LOG = 300;

  // Error types
  const TYPE = {
    SYSTEM:    'system',
    APP:       'app',
    VOXSCRIPT: 'voxscript',
    FS:        'filesystem',
    AUTH:      'auth',
    NETWORK:   'network',
    UNKNOWN:   'unknown',
  };

  // Severity levels
  const LEVEL = {
    DEBUG:   'debug',
    INFO:    'info',
    WARNING: 'warning',
    ERROR:   'error',
    FATAL:   'fatal',
  };

  // ── Core logging ──────────────────────────────────────

  const _record = (type, level, message, context = {}) => {
    const entry = {
      id: Huna7.Helpers.generateId('err'),
      type, level, message,
      context, stack: new Error().stack,
      timestamp: Date.now(),
    };
    _log.push(entry);
    if (_log.length > MAX_LOG) _log.shift();

    // Always log to console
    const consoleFn = level === LEVEL.FATAL || level === LEVEL.ERROR ? console.error
      : level === LEVEL.WARNING ? console.warn : console.log;
    consoleFn(`[${type.toUpperCase()}] ${message}`, context);

    // Emit to bus
    Huna7.Binder.emit('error:recorded', entry);

    return entry;
  };

  // ── Public API ────────────────────────────────────────

  const debug   = (type, msg, ctx) => _record(type, LEVEL.DEBUG,   msg, ctx);
  const info    = (type, msg, ctx) => _record(type, LEVEL.INFO,    msg, ctx);
  const warning = (type, msg, ctx) => _record(type, LEVEL.WARNING, msg, ctx);
  const error   = (type, msg, ctx) => _record(type, LEVEL.ERROR,   msg, ctx);
  const fatal   = (type, msg, ctx) => {
    const entry = _record(type, LEVEL.FATAL, msg, ctx);
    _showCrashDialog(msg, ctx);
    return entry;
  };

  // ── Convenience shortcuts ─────────────────────────────

  const system    = (msg, ctx) => error(TYPE.SYSTEM, msg, ctx);
  const app       = (appId, msg, ctx) => error(TYPE.APP, msg, { appId, ...ctx });
  const voxscript = (msg, ctx) => error(TYPE.VOXSCRIPT, msg, ctx);
  const fs        = (msg, ctx) => warning(TYPE.FS, msg, ctx);
  const auth      = (msg, ctx) => warning(TYPE.AUTH, msg, ctx);

  // ── Crash dialog ──────────────────────────────────────

  const _showCrashDialog = (message, context = {}) => {
    // Attempt to show a user-friendly crash dialog
    try {
      Huna7.Toolbox?.showModal(
        'System Error',
        `Huna7-OS encountered an unexpected error.\n\n${message}\n\nYou can try refreshing the page.`,
        [
          { label: 'Refresh', type: 'accent', value: 'refresh' },
          { label: 'Dismiss', type: 'ghost', value: 'dismiss' },
        ]
      ).then(result => {
        if (result === 'refresh') location.reload();
      });
    } catch {
      // Toolbox not available — raw alert
      if (window.confirm(`Huna7-OS Error: ${message}\n\nRefresh the page?`)) location.reload();
    }
  };

  // ── Try/catch wrapper ─────────────────────────────────

  /**
   * Wrap an async function with automatic error recording.
   * @param {string}   type     Error type constant
   * @param {Function} fn       Async function to execute
   * @param {Function} fallback Optional fallback on error
   */
  const guard = async (type, fn, fallback = null) => {
    try {
      return await fn();
    } catch (e) {
      error(type, e.message, { error: e });
      if (fallback) return fallback(e);
      return null;
    }
  };

  // ── Global uncaught handler ───────────────────────────

  const installGlobalHandlers = () => {
    window.addEventListener('error', (e) => {
      error(TYPE.UNKNOWN, e.message, { filename: e.filename, lineno: e.lineno });
    });
    window.addEventListener('unhandledrejection', (e) => {
      error(TYPE.UNKNOWN, String(e.reason), { promise: true });
    });
  };

  // ── Log access ────────────────────────────────────────

  const getLogs = (type, level, limit = 50) => {
    let results = [..._log];
    if (type)  results = results.filter(e => e.type  === type);
    if (level) results = results.filter(e => e.level === level);
    return results.slice(-limit).reverse();
  };

  const clearLogs = () => { _log.length = 0; };

  return {
    TYPE, LEVEL,
    debug, info, warning, error, fatal,
    system, app, voxscript, fs, auth,
    guard, installGlobalHandlers,
    getLogs, clearLogs,
  };
})();

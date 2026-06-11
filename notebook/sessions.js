/* =====================================================
   HUNA7-OS — NOTEBOOK: SESSIONS
   Session lifecycle. All session state lives here.
   Other modules must use this — not manage sessions directly.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Sessions = (() => {
  const KEY = 'session';
  const TIMEOUT_MS = 0; // 0 = disabled; set e.g. 30 * 60 * 1000 for 30min

  let _session = null;
  let _locked  = false;
  let _timeoutTimer = null;

  // ── Create ───────────────────────────────────────────

  const createSession = (username) => {
    _session = {
      id: Huna7.Security.generateSessionToken(),
      username,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      locked: false,
    };
    _persist();
    _resetTimeout();
    Huna7.Binder.emit('session:created', { ..._session });
    return { ..._session };
  };

  // ── Restore ──────────────────────────────────────────

  const restoreSession = () => {
    const stored = Huna7.Storage.get(KEY);
    if (!stored) return null;

    // Sessions older than 24h are invalid
    if (Date.now() - stored.loginTime > 86400000) {
      Huna7.Storage.remove(KEY);
      return null;
    }

    _session = stored;
    _locked  = !!stored.locked;
    _resetTimeout();
    Huna7.Binder.emit('session:restored', { ..._session });
    return { ..._session };
  };

  // ── Destroy ──────────────────────────────────────────

  const destroySession = () => {
    _session = null;
    _locked  = false;
    if (_timeoutTimer) clearTimeout(_timeoutTimer);
    Huna7.Storage.remove(KEY);
    Huna7.Binder.emit('session:destroyed', {});
  };

  // ── Lock / Unlock ────────────────────────────────────

  const lockSession = () => {
    if (!_session) return;
    _locked = true;
    _session.locked = true;
    _persist();
    if (_timeoutTimer) clearTimeout(_timeoutTimer);
    Huna7.Binder.emit('session:locked', {});
  };

  const unlockSession = () => {
    if (!_session) return;
    _locked = false;
    _session.locked = false;
    _session.lastActivity = Date.now();
    _persist();
    _resetTimeout();
    Huna7.Binder.emit('session:unlocked', {});
  };

  // ── Activity ─────────────────────────────────────────

  const touch = () => {
    if (!_session || _locked) return;
    _session.lastActivity = Date.now();
    _resetTimeout();
  };

  const _resetTimeout = () => {
    if (!TIMEOUT_MS) return;
    if (_timeoutTimer) clearTimeout(_timeoutTimer);
    _timeoutTimer = setTimeout(() => lockSession(), TIMEOUT_MS);
  };

  // ── Getters ──────────────────────────────────────────

  const isLoggedIn  = () => !!_session && !_locked;
  const isLocked    = () => _locked;
  const getSession  = () => _session ? { ..._session } : null;
  const getUsername = () => _session?.username || '';
  const getLoginTime= () => _session?.loginTime || null;

  const _persist = () => {
    if (_session) Huna7.Storage.set(KEY, _session);
  };

  // Auto-touch on user interaction
  if (typeof document !== 'undefined') {
    ['click','keydown','mousemove','touchstart'].forEach(evt =>
      document.addEventListener(evt, () => touch(), { passive: true })
    );
  }

  return {
    createSession, restoreSession, destroySession,
    lockSession, unlockSession, touch,
    isLoggedIn, isLocked, getSession, getUsername, getLoginTime,
  };
})();

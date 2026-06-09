/* =====================================================
   HUNA7-OS — STORAGE
   localStorage abstraction with namespacing.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Storage = (() => {
  const PREFIX = Huna7.CONSTANTS.STORAGE_PREFIX;

  const key = (k) => PREFIX + k;

  const set = (k, value) => {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] set failed:', e);
      return false;
    }
  };

  const get = (k, fallback = null) => {
    try {
      const raw = localStorage.getItem(key(k));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const remove = (k) => {
    try { localStorage.removeItem(key(k)); return true; }
    catch { return false; }
  };

  const has = (k) => localStorage.getItem(key(k)) !== null;

  const clear = () => {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  };

  const keys = () => {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) result.push(k.slice(PREFIX.length));
    }
    return result;
  };

  // Profile management
  const saveProfile = (profile) => set('profile', profile);
  const getProfile = () => get('profile');
  const hasProfile = () => has('profile');

  const savePreferences = (prefs) => set('preferences', prefs);
  const getPreferences = () => get('preferences', {});

  const saveTheme = (theme) => set('theme', theme);
  const getTheme = () => get('theme', Huna7.CONSTANTS.DEFAULT_THEME);

  const saveSession = (session) => set('session', session);
  const getSession = () => get('session');
  const clearSession = () => remove('session');

  const saveLoginAttempts = (data) => set('login_attempts', data);
  const getLoginAttempts = () => get('login_attempts', { count: 0, lastAttempt: 0 });

  const clearAll = () => clear();

  return {
    set, get, remove, has, clear, keys,
    saveProfile, getProfile, hasProfile,
    savePreferences, getPreferences,
    saveTheme, getTheme,
    saveSession, getSession, clearSession,
    saveLoginAttempts, getLoginAttempts,
    clearAll,
  };
})();

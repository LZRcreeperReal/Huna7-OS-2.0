/* =====================================================
   HUNA7-OS — ATTENDANCE
   UI session state facade.
   Delegates to notebook/sessions.js and notebook/authentication.js.
   Other UI files use this — not sessions.js directly.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Attendance = (() => {

  // Delegate all session state to the authoritative source
  const isLoggedIn  = () => Huna7.Notebook.Sessions.isLoggedIn();
  const getSession  = () => Huna7.Notebook.Sessions.getSession();
  const getUsername = () => Huna7.Notebook.Sessions.getUsername()
    || Huna7.Notebook.Profile.getUsername()
    || Huna7.Storage.getProfile()?.username
    || '';

  const login = (username, password) =>
    Huna7.Notebook.Authentication.login(username, password);

  const logout = () => {
    Huna7.Notebook.Authentication.logout();
  };

  const lock = () => {
    Huna7.Notebook.Sessions.lockSession();
  };

  const restoreSession = () =>
    Huna7.Notebook.Sessions.restoreSession();

  const getLoginDelay = () =>
    Huna7.Notebook.Authentication.getLoginDelay();

  return {
    isLoggedIn, getSession, getUsername,
    login, logout, lock, restoreSession, getLoginDelay,
  };
})();

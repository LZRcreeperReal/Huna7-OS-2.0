/* =====================================================
   HUNA7-OS — RULER
   Permission manager. Controls all API access.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Ruler = (() => {
  const _appPermissions = new Map();

  const PERMISSIONS = {
    FS_READ:      'fs.read',
    FS_WRITE:     'fs.write',
    FS_DELETE:    'fs.delete',
    NOTIFY:       'notify',
    SPAWN:        'process.spawn',
    KILL:         'process.kill',
    THEME:        'theme',
    NETWORK:      'network',
    CLIPBOARD:    'clipboard',
    SYSTEM:       'system',
  };

  // Default permissions per app type
  const DEFAULT_APP_PERMISSIONS = [
    PERMISSIONS.FS_READ, PERMISSIONS.NOTIFY, PERMISSIONS.SPAWN,
  ];

  const SYSTEM_PERMISSIONS = Object.values(PERMISSIONS);

  const grant = (appId, permissions) => {
    const existing = _appPermissions.get(appId) || new Set();
    permissions.forEach(p => existing.add(p));
    _appPermissions.set(appId, existing);
  };

  const revoke = (appId, permission) => {
    const existing = _appPermissions.get(appId);
    if (existing) existing.delete(permission);
  };

  const check = (appId, permission) => {
    if (appId === 'system') return true;
    const perms = _appPermissions.get(appId);
    return perms ? perms.has(permission) : false;
  };

  const require = (appId, permission) => {
    if (!check(appId, permission)) {
      throw new Error(`Permission denied: ${appId} requires ${permission}`);
    }
  };

  const grantDefault = (appId) => grant(appId, DEFAULT_APP_PERMISSIONS);
  const grantSystem = (appId) => grant(appId, SYSTEM_PERMISSIONS);

  const getPermissions = (appId) => {
    const p = _appPermissions.get(appId);
    return p ? Array.from(p) : [];
  };

  // Initialize system app permissions
  const initSystemPermissions = () => {
    const sysApps = ['chalk', 'launch', 'attendance', 'blackboard', 'desk'];
    sysApps.forEach(id => grantSystem(id));
    // Grant voxscript runtime controlled access
    grant('voxruntime', [
      PERMISSIONS.FS_READ, PERMISSIONS.FS_WRITE, PERMISSIONS.NOTIFY,
      PERMISSIONS.SPAWN, PERMISSIONS.THEME,
    ]);
  };

  return { PERMISSIONS, grant, revoke, check, require, grantDefault, grantSystem, getPermissions, initSystemPermissions };
})();

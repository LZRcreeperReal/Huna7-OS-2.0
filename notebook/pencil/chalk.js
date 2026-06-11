/* =====================================================
   HUNA7-OS — CHALK
   Main Kernel. Process creation, routing, registry.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Chalk = (() => {
  const _processes = new Map();
  let _pidCounter = 1000;
  let _bootTime   = null;

  const _appRegistry = {
    explorer:      { id: 'explorer',      name: 'Explorer',         module: () => Huna7.Apps.Explorer },
    terminal:      { id: 'terminal',      name: 'Terminal',         module: () => Huna7.Apps.Terminal },
    writer:        { id: 'writer',        name: 'Writer',           module: () => Huna7.Apps.Writer },
    themes:        { id: 'themes',        name: 'Theme Editor',     module: () => Huna7.Apps.Themes },
    settings:      { id: 'settings',      name: 'Settings',         module: () => Huna7.Apps.Settings },
    calculator:    { id: 'calculator',    name: 'Calculator',       module: () => Huna7.Apps.Calculator },
    clock:         { id: 'clock',         name: 'Clock',            module: () => Huna7.Apps.Clock },
    media:         { id: 'media',         name: 'Media Player',     module: () => Huna7.Apps.Media },
    orbit:         { id: 'orbit',         name: 'Orbit',            module: () => Huna7.Apps.Orbit },
    voxstudio:     { id: 'voxstudio',     name: 'VoxStudio',        module: () => Huna7.Apps.VoxStudio },
    monitor:       { id: 'monitor',       name: 'System Monitor',   module: () => Huna7.Apps.Monitor },
    notes:         { id: 'notes',         name: 'Notes',            module: () => Huna7.Apps.Notes },
    images:        { id: 'images',        name: 'Images',           module: () => Huna7.Apps.Images },
    audio:         { id: 'audio',         name: 'Audio',            module: () => Huna7.Apps.Audio },
    workspace:     { id: 'workspace',     name: 'Workspace',        module: () => Huna7.Apps.Workspace },
    packagecenter: { id: 'packagecenter', name: 'Package Center',   module: () => Huna7.Apps.PackageCenter },
    glibrary:      { id: 'glibrary',      name: 'Game Library',      module: () => Huna7.Apps.GLibrary },
  };

  const init = () => {
    _bootTime = Date.now();
    Huna7.Notebook?.Updates?.checkOnBoot?.();
    Huna7.Ruler.initSystemPermissions();
    Huna7.Compass.initCoreServices();
    Huna7.Binder.ready();
    Huna7.Eraser.startGC(60000);
    Huna7.Binder.emit('kernel:ready', { bootTime: _bootTime });
  };

  const spawn = (appId, options = {}) => {
    const app = _appRegistry[appId];
    if (!app) {
      console.error(`[Chalk] Unknown app: ${appId}`);
      return null;
    }

    const pid = ++_pidCounter;
    const proc = {
      pid, appId,
      name: options.name || app.name,
      status: 'starting',
      created: Date.now(),
      windowId: null,
      timers: [],
      cleanup: null,
      options,
    };
    _processes.set(pid, proc);
    Huna7.Ruler.grantDefault(appId);
    Huna7.Binder.emit('process:spawn', { pid, appId, name: proc.name });

    // Launch — handle both sync and async launch functions
    try {
      const mod = app.module();
      if (!mod || typeof mod.launch !== 'function') {
        console.error(`[Chalk] App ${appId} has no launch() function`);
        proc.status = 'error';
        return pid;
      }

      const resultOrPromise = mod.launch(pid, options);
      const handleResult = (result) => {
        if (result && result.windowId) proc.windowId = result.windowId;
        if (result && result.cleanup)  proc.cleanup  = result.cleanup;
        proc.status = 'running';
        Huna7.Binder.emit('process:running', { pid, appId });
        Huna7.Notebook?.RecentFiles?.addFile?.({ path: '/System/Apps/' + appId, name: app.name, appId });
      };

      if (resultOrPromise && typeof resultOrPromise.then === 'function') {
        resultOrPromise.then(handleResult).catch(e => {
          console.error(`[Chalk] Async launch failed for ${appId}:`, e);
          proc.status = 'error';
        });
      } else {
        handleResult(resultOrPromise);
      }
    } catch (e) {
      console.error(`[Chalk] Failed to launch ${appId}:`, e);
      proc.status = 'error';
    }

    return pid;
  };

  const getProcess         = (pid)    => _processes.get(pid);
  const getProcessesByApp  = (appId)  => Array.from(_processes.values()).filter(p => p.appId === appId);
  const getAllProcesses     = ()       => Array.from(_processes.values());
  const removeProcess      = (pid)    => _processes.delete(pid);
  const getUptime          = ()       => _bootTime ? Date.now() - _bootTime : 0;
  const getAppInfo         = (appId)  => _appRegistry[appId] || null;
  const getAllApps          = ()       => Object.values(_appRegistry);
  const isAppEnabled       = (appId)  => !Huna7.Notebook?.Registry?.isAppDisabled?.(appId);

  const updateProcess = (pid, updates) => {
    const p = _processes.get(pid);
    if (p) _processes.set(pid, { ...p, ...updates });
  };

  const routeEvent = (pid, event, data) => {
    if (_processes.get(pid)) Huna7.Binder.emit(`process:${pid}:${event}`, data);
  };

  return {
    init, spawn, getProcess, getProcessesByApp, getAllProcesses, removeProcess,
    getUptime, getAppInfo, getAllApps, isAppEnabled, updateProcess, routeEvent,
  };
})();

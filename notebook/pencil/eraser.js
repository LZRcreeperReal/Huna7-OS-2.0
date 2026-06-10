/* =====================================================
   HUNA7-OS — ERASER
   Process cleanup. Terminates apps, reclaims resources.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Eraser = (() => {
  // Terminate a process by PID
  const terminate = (pid) => {
    const proc = Huna7.Chalk.getProcess(pid);
    if (!proc) return false;

    // Cleanup steps
    try {
      // 1. Close any associated windows
      if (proc.windowId) {
        const winEl = document.getElementById(proc.windowId);
        if (winEl) winEl.remove();
      }

      // 2. Cancel any timers associated with the process
      if (proc.timers) proc.timers.forEach(t => Huna7.Schedule.cancel(t));

      // 3. Unbind any event listeners
      if (proc.cleanup && typeof proc.cleanup === 'function') proc.cleanup();

      // 4. Remove DOM elements
      if (proc.rootEl) Huna7.Helpers.removeElement(proc.rootEl);

      // 5. Emit termination event
      Huna7.Binder.emit('process:terminated', { pid, appId: proc.appId });

      return true;
    } catch (e) {
      console.error('[Eraser] Cleanup failed for PID', pid, e);
      return false;
    }
  };

  // Terminate all processes for an app
  const terminateApp = (appId) => {
    const processes = Huna7.Chalk.getProcessesByApp(appId);
    processes.forEach(p => terminate(p.pid));
  };

  // Force kill — removes process record regardless
  const forceKill = (pid) => {
    terminate(pid);
    Huna7.Chalk.removeProcess(pid);
  };

  // Garbage collect stale processes
  const gc = () => {
    const stale = Huna7.Chalk.getAllProcesses().filter(p => {
      // Check if window still exists
      if (p.windowId && !document.getElementById(p.windowId)) return true;
      return p.status === 'zombie';
    });
    stale.forEach(p => {
      Huna7.Chalk.removeProcess(p.pid);
      Huna7.Binder.emit('process:gc', { pid: p.pid });
    });
    return stale.length;
  };

  // Schedule periodic GC
  let _gcTimer = null;
  const startGC = (intervalMs = 30000) => {
    _gcTimer = Huna7.Schedule.repeat(gc, intervalMs, 'eraser.gc');
  };

  const stopGC = () => { if (_gcTimer) Huna7.Schedule.cancel(_gcTimer); };

  return { terminate, terminateApp, forceKill, gc, startGC, stopGC };
})();

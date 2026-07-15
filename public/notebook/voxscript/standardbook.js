/* =====================================================
   HUNA7-OS — VOXSCRIPT: STANDARDBOOK
   Standard library. All OS APIs exposed to VoxScript.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.StandardBook = (() => {
  const buildAPI = (pid, outputFn) => {
    const output = outputFn || console.log;
    const checkPerm = (perm) => {
      if (!Huna7.Ruler.check('voxruntime', perm)) throw new Error(`Permission denied: ${perm}`);
    };

    // --- fs module ---
    const fs = {
      read: async (path) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.FS_READ);
        const entry = await Huna7.VFS.readFile(path);
        return entry.content;
      },
      write: async (path, content) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.FS_WRITE);
        await Huna7.VFS.writeFile(path, String(content));
        return true;
      },
      delete: async (path) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.FS_DELETE);
        await Huna7.VFS.deleteEntry(path);
        return true;
      },
      list: async (path) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.FS_READ);
        return await Huna7.VFS.readDir(path);
      },
      exists: async (path) => Huna7.VFS.exists(path),
      mkdir: async (path) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.FS_WRITE);
        await Huna7.VFS.mkdir(path);
        return true;
      },
    };

    // --- system module ---
    const system = {
      log: (msg) => { output('[log] ' + String(msg)); },
      notify: (title, msg) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.NOTIFY);
        Huna7.Bulletin?.show(String(title), String(msg || ''), 'info');
      },
      exit: () => { throw new Error('__EXIT__'); },
      version: () => Huna7.CONSTANTS.VERSION,
      uptime: () => Huna7.Chalk.getUptime(),
      username: () => Huna7.Storage.getProfile()?.username || 'user',
    };

    // --- process module ---
    const process = {
      spawn: (appId) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.SPAWN);
        return Huna7.Chalk.spawn(appId);
      },
      kill: (pid) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.KILL);
        Huna7.Eraser.terminate(pid);
      },
      list: () => Huna7.Chalk.getAllProcesses().map(p => ({ pid: p.pid, name: p.name, status: p.status })),
      self: () => ({ pid }),
    };

    // --- event module ---
    const event = {
      emit: (evtName, data) => { Huna7.Binder.emit('vox:' + evtName, data); },
      listen: (evtName, handler) => Huna7.Binder.on('vox:' + evtName, handler),
    };

    // --- theme module ---
    const theme = {
      set: (name) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.THEME);
        Huna7.Encyclopedia.applyByName(name);
      },
      update: (partial) => {
        checkPerm(Huna7.Ruler.PERMISSIONS.THEME);
        const current = Huna7.Encyclopedia.getCurrent();
        Huna7.Encyclopedia.apply({ ...current, ...partial });
      },
      get: () => Huna7.Encyclopedia.getCurrent(),
    };

    // --- math module ---
    const math = {
      abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
      round: Math.round, sqrt: Math.sqrt, pow: Math.pow,
      min: Math.min, max: Math.max, random: Math.random,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      log: Math.log, log2: Math.log2, log10: Math.log10,
      PI: Math.PI, E: Math.E,
      clamp: (v, mn, mx) => Math.max(mn, Math.min(mx, v)),
    };

    // --- time module ---
    const time = {
      now: () => Date.now(),
      sleep: (ms) => new Promise(r => setTimeout(r, Number(ms))),
      format: (ts) => new Date(ts).toLocaleString(),
    };

    // --- string utilities ---
    const str = {
      upper: (s) => String(s).toUpperCase(),
      lower: (s) => String(s).toLowerCase(),
      trim: (s) => String(s).trim(),
      includes: (s, sub) => String(s).includes(sub),
      startsWith: (s, sub) => String(s).startsWith(sub),
      endsWith: (s, sub) => String(s).endsWith(sub),
      replace: (s, a, b) => String(s).replace(a, b),
      slice: (s, start, end) => String(s).slice(start, end),
      length: (s) => String(s).length,
    };

    // --- json module ---
    const json = {
      parse: (s) => { try { return JSON.parse(s); } catch { return null; } },
      stringify: (v) => JSON.stringify(v),
    };

    // Global functions accessible without module prefix
    const _globals = {
      print: (v) => { output(String(v ?? 'null')); },
      log: (v) => { output('[log] ' + String(v ?? '')); },
      notify: (title, msg) => system.notify(title, msg),
      range: (start, end, step = 1) => { const a = []; for (let i = start; i < end; i += step) a.push(i); return a; },
      len: (v) => Array.isArray(v) ? v.length : String(v ?? '').length,
      type: (v) => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v,
      str: (v) => String(v ?? ''),
      num: (v) => Number(v),
      bool: (v) => Boolean(v),
      keys: (o) => Object.keys(o || {}),
      values: (o) => Object.values(o || {}),
      push: (arr, v) => { arr.push(v); return arr; },
      pop: (arr) => arr.pop(),
      shift: (arr) => arr.shift(),
      unshift: (arr, v) => { arr.unshift(v); return arr.length; },
      slice: (arr, s, e) => arr.slice(s, e),
      join: (arr, d = ',') => arr.join(d),
      split: (s, d) => String(s).split(d),
      includes: (arr, v) => arr.includes(v),
      indexOf: (arr, v) => arr.indexOf(v),
      // Shortcuts for common OS actions. The full modules remain available.
      read: fs.read,
      write: fs.write,
      list: fs.list,
      exists: fs.exists,
      mkdir: fs.mkdir,
      sleep: time.sleep,
      open: process.spawn,
      alert: system.notify,
      // Expose modules as objects
      fs, system, process, event, theme, math, time, str, json,
      // Convenient aliases
      Math: math, Time: time, FS: fs,
    };

    return { _globals, fs, system, process, event, theme, math, time, str, json };
  };

  return { buildAPI };
})();

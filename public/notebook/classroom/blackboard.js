/* =====================================================
   HUNA7-OS — BLACKBOARD
   Desktop renderer. Wallpaper, dock, status bar, icons.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Blackboard = (() => {
  let _root = null;
  let _desktop = null;
  let _dock = null;
  let _statusBar = null;
  let _clockInterval = null;

  const getDockApps = () => Huna7.Notebook?.Shortcuts?.getDockOrder?.() || ["explorer","terminal","glibrary","notes","voxstudio","orbit","settings","monitor","calculator","themes"];

  const render = (root) => {
    _root = root;
    _root.innerHTML = '';
    _root.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;';

    _applyWallpaper();
    _buildStatusBar();
    _buildDesktop();
    _buildDock();
    Huna7.Bulletin.init(_root);
    Huna7.Desk.init(_desktop);
    Huna7.Taskbar.init(_root);
    _bindEvents();
    _startClock();
    _renderDesktopIcons();

    Huna7.Animations.fadeIn(_root, 400);
  };

  const _applyWallpaper = () => {
    const theme = Huna7.Encyclopedia.getCurrent();
    const wp = Huna7.Notebook?.Wallpaper?.getCurrent?.();
    const bg = wp && wp.type === 'image'
      ? `url("${wp.value}")`
      : Huna7.Dictionary.getWallpaperCSS(wp?.value || theme?.wallpaper || 'gradient-aurora');
    _root.style.background = bg;
    _root.style.backgroundSize = 'cover';
    _root.style.backgroundPosition = 'center';
    // Add noise overlay only once
    if (!document.getElementById('h7-noise-overlay')) {
      const noise = document.createElement('div');
      noise.id = 'h7-noise-overlay';
      noise.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");`;
      _root.appendChild(noise);
    }
  };

  const _buildStatusBar = () => {
    _statusBar = document.createElement('div');
    _statusBar.style.cssText = `position:absolute;top:0;left:0;right:0;height:${Huna7.CONSTANTS.STATUS_BAR_HEIGHT}px;
      display:flex;align-items:center;padding:0 14px;z-index:${Huna7.CONSTANTS.Z.STATUS_BAR};
      background:rgba(0,0,0,0.35);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;`;

    // Left: OS name
    const left = document.createElement('div');
    left.style.cssText = 'display:flex;align-items:center;gap:12px;';
    const osName = document.createElement('div');
    osName.style.cssText = 'font-weight:700;font-size:13px;color:var(--h7-text);letter-spacing:-0.01em;';
    osName.textContent = Huna7.CONSTANTS.OS_NAME;
    osName.style.cursor = 'pointer';
    osName.addEventListener('click', _showLauncher);
    left.appendChild(osName);

    // Workspace indicator
    const wsIndicator = Huna7.Homeroom.createIndicator();
    left.appendChild(wsIndicator);

    // Center: app menu (future)
    const center = document.createElement('div');
    center.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;';

    // Right: system tray
    const right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:14px;color:var(--h7-text);';

    // Temperature display
    const tempEl = document.createElement('div');
    tempEl.id = 'statusbar-temp';
    tempEl.style.cssText = 'font-size:12px;color:var(--h7-text-muted);display:flex;align-items:center;gap:4px;';
    tempEl.title = 'Outside temperature (IP-based location)';

    // Battery display
    const battEl = document.createElement('div');
    battEl.id = 'statusbar-battery';
    battEl.style.cssText = 'font-size:12px;color:var(--h7-text-muted);display:flex;align-items:center;gap:4px;';

    // Username
    const user = document.createElement('div');
    user.style.cssText = 'font-size:12px;color:var(--h7-text-muted);display:flex;align-items:center;gap:5px;';
    user.innerHTML = Huna7.Glossary.get('user', 12) + ` <span>${Huna7.Attendance.getUsername()}</span>`;

    // Clock
    const clock = document.createElement('div');
    clock.id = 'statusbar-clock';
    clock.style.cssText = 'font-size:13px;font-weight:500;min-width:70px;text-align:right;cursor:pointer;';
    clock.addEventListener('click', () => Huna7.Chalk.spawn('clock'));

    // Power button
    const powerBtn = document.createElement('div');
    powerBtn.innerHTML = Huna7.Glossary.get('power', 14);
    powerBtn.style.cssText = 'cursor:pointer;color:var(--h7-text-muted);transition:color 150ms;display:flex;';
    powerBtn.addEventListener('mouseenter', () => powerBtn.style.color = '#e05252');
    powerBtn.addEventListener('mouseleave', () => powerBtn.style.color = 'var(--h7-text-muted)');
    powerBtn.addEventListener('click', _showPowerMenu);

    right.append(tempEl, battEl, user, clock, powerBtn);

    // Fetch real temperature via IP geolocation -> wttr.in (no API key needed)
    _fetchTemperature(tempEl);
    _initBattery(battEl);
    _statusBar.append(left, center, right);
    _root.appendChild(_statusBar);
  };

  const _buildDesktop = () => {
    _desktop = document.createElement('div');
    _desktop.id = 'h7-desktop';
    _desktop.style.cssText = `position:absolute;left:0;right:0;
      top:${Huna7.CONSTANTS.STATUS_BAR_HEIGHT}px;
      bottom:${Huna7.CONSTANTS.DOCK_HEIGHT}px;
      z-index:${Huna7.CONSTANTS.Z.DESKTOP};overflow:hidden;`;
    _desktop.addEventListener('contextmenu', _desktopContextMenu);
    _root.appendChild(_desktop);
  };

  const _buildDock = () => {
    _dock = document.createElement('div');
    _dock.style.cssText = `position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
      height:${Huna7.CONSTANTS.DOCK_HEIGHT - 16}px;
      display:flex;align-items:center;gap:7px;padding:0 10px;
      background:rgba(255,255,255,0.08);
      backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
      border:1px solid rgba(255,255,255,0.14);border-radius:20px;
      z-index:${Huna7.CONSTANTS.Z.DOCK};box-shadow:0 10px 30px rgba(0,0,0,0.34);`;

    getDockApps().forEach(appId => {
      const info = Huna7.Chalk.getAppInfo(appId);
      if (!info) return;
      const item = _buildDockItem(appId, info.name);
      _dock.appendChild(item);
    });

    _root.appendChild(_dock);
    Huna7.Animations.staggerReveal(Array.from(_dock.children), 30);
  };

  const _buildDockItem = (appId, name) => {
    const item = document.createElement('div');
    item.style.cssText = `width:46px;height:46px;border-radius:12px;
      background:var(--h7-bg-glass);display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:background 160ms ease,box-shadow 160ms ease,transform 160ms ease;
      color:var(--h7-text);position:relative;flex-shrink:0;`;
    item.title = name;
    item.innerHTML = Huna7.Glossary.getAppIcon(appId, 24);
    item.setAttribute('data-app', appId);

    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-2px)';
      item.style.background = 'var(--h7-bg-glass-hover)';
      item.style.boxShadow = '0 5px 14px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.08)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
      item.style.background = '';
      item.style.boxShadow = '';
    });
    item.addEventListener('click', () => {
      Huna7.Indexer.ripple(item, item.getBoundingClientRect().left + 24, item.getBoundingClientRect().top + 24);
      Huna7.Chalk.spawn(appId);
    });
    return item;
  };

  const _renderDesktopIcons = async () => {
    const iconArea = document.createElement('div');
    iconArea.style.cssText = 'position:absolute;top:16px;left:16px;display:flex;flex-direction:column;gap:8px;z-index:10;';
    try {
      const entries = await Huna7.VFS.readDir('/Home/Desktop');
      entries.forEach(entry => {
        const icon = Huna7.Sketch.desktopIcon(
          entry.type === 'directory' ? 'folder' : Huna7.Helpers.getFileExtension(entry.name).slice(1) || 'file',
          entry.name,
          () => _openEntry(entry)
        );
        iconArea.appendChild(icon);
      });
    } catch {}
    _desktop.appendChild(iconArea);
  };

  const _openEntry = (entry) => {
    const ext = Huna7.Helpers.getFileExtension(entry.name);
    if (entry.type === 'directory') Huna7.Chalk.spawn('explorer', { path: entry.path });
    else if (ext === '.note') Huna7.Chalk.spawn('writer', { file: entry.path });
    else if (ext === '.pencil') Huna7.VoxScript.Runtime.runFile(entry.path, { outputFn: console.log });
    else Huna7.Chalk.spawn('writer', { file: entry.path });
  };

  const _startClock = () => {
    const update = () => {
      const el = document.getElementById('statusbar-clock');
      if (!el) return;
      const prefs = Huna7.Blueprint.get('system');
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: !prefs?.clock24h });
    };
    update();
    _clockInterval = Huna7.Schedule.repeat(update, 1000, 'statusbar.clock');
  };

  const _desktopContextMenu = (e) => {
    e.preventDefault();
    Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [
      { icon: 'refresh', label: 'Refresh Desktop', action: () => { _desktop.innerHTML = ''; _renderDesktopIcons(); Huna7.Desk.init(_desktop); } },
      '-',
      { icon: 'palette', label: 'Change Theme',    action: () => Huna7.Chalk.spawn('themes') },
      { icon: 'settings',label: 'System Settings', action: () => Huna7.Chalk.spawn('settings') },
      '-',
      { icon: 'workspace',label: 'New Workspace',  action: () => Huna7.Homeroom.addWorkspace() },
      '-',
      { icon: 'terminal', label: 'Open Terminal',  action: () => Huna7.Chalk.spawn('terminal') },
    ]);
  };

  const _showLauncher = () => Huna7.Launcher?.toggle?.() || Huna7.Chalk.spawn("settings");

  const _showPowerMenu = (e) => {
    Huna7.Toolbox.showContextMenu(e.clientX - 120, e.clientY + 8, [
      { icon: 'lock',    label: 'Lock Screen',  action: () => Huna7.Attendance.lock() },
      '-',
      { icon: 'power',   label: 'Sign Out',     action: async () => {
        const ok = await Huna7.Toolbox.showModal('Sign Out', 'Sign out of Huna7-OS?', [
          { label: 'Cancel', type: 'ghost', value: false },
          { label: 'Sign Out', type: 'danger', value: true },
        ]);
        if (ok) { Huna7.Attendance.logout(); location.reload(); }
      }},
    ]);
  };

  const _bindEvents = () => {
    Huna7.Binder.on('theme:changed', () => { _applyWallpaper(); });
    Huna7.Binder.on('fs:changed', ({ op }) => {
      if (op === 'create' || op === 'delete' || op === 'move') {
        const iconArea = _desktop.querySelector('div');
        if (iconArea) { iconArea.remove(); _renderDesktopIcons(); }
      }
    });
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'l') { e.preventDefault(); Huna7.Attendance.lock(); }
        if (e.key === 'f') { e.preventDefault(); _showGlobalSearch(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); const ws = Huna7.Homeroom.getActive(); Huna7.Homeroom.switchTo(ws.id - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); const ws = Huna7.Homeroom.getActive(); Huna7.Homeroom.switchTo(ws.id + 1); }
      }
    });
  };

  const _showGlobalSearch = () => {
    Huna7.Toolbox.showPrompt('Global Search', 'Search files, apps...').then(async (q) => {
      if (!q) return;
      const results = await Huna7.VFS.search(q);
      Huna7.Bulletin.info('Search', `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`);
      if (results.length > 0) Huna7.Chalk.spawn('explorer', { searchQuery: q });
    });
  };

  // ── Real temperature via IP geolocation + wttr.in ──────────
  const _fetchTemperature = async (el) => {
    try {
      // Step 1: get city from IP using ipapi.co (free, no key)
      const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
      if (!geoRes.ok) throw new Error('geo failed');
      const geo = await geoRes.json();
      const city = geo.city || geo.region || '';
      if (!city) throw new Error('no city');

      // Step 2: get weather from wttr.in (free, no key needed)
      const wRes = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { signal: AbortSignal.timeout(5000) });
      if (!wRes.ok) throw new Error('weather failed');
      const w = await wRes.json();
      const tempC = parseInt(w.current_condition?.[0]?.temp_C ?? '0');
      const tempF = Math.round(tempC * 9/5 + 32);
      const desc  = w.current_condition?.[0]?.weatherDesc?.[0]?.value || '';

      // Pick icon based on weather code
      const code = parseInt(w.current_condition?.[0]?.weatherCode || '0');
      let icon = '🌡️';
      if (code === 113) icon = '☀️';
      else if (code <= 116) icon = '⛅';
      else if (code <= 122) icon = '☁️';
      else if (code <= 200) icon = '🌫️';
      else if (code <= 296) icon = '🌦️';
      else if (code <= 320) icon = '🌧️';
      else if (code <= 395) icon = '⛈️';

      el.innerHTML = `<span style="font-size:13px">${icon}</span><span>${tempF}°F</span>`;
      el.title = `${city}: ${desc} — ${tempC}°C / ${tempF}°F`;

      // Refresh every 10 minutes
      Huna7.Schedule.delay(() => _fetchTemperature(el), 600000, 'weather.refresh');
    } catch (e) {
      // Silently fail - don't show anything if fetch fails
      el.textContent = '';
    }
  };

  // ── Real battery via Battery Status API ─────────────────
  const _initBattery = async (el) => {
    if (!navigator.getBattery) { el.textContent = ''; return; }
    try {
      const battery = await navigator.getBattery();

      const updateBattery = () => {
        const pct = Math.round(battery.level * 100);
        const charging = battery.charging;
        // Color: green >50, yellow 20-50, red <20
        const color = pct > 50 ? '#4CAF50' : pct > 20 ? '#FF9800' : '#e05252';
        // Battery icon using inline SVG bar
        const fill = Math.round(pct / 100 * 16);
        el.innerHTML = `
          <svg width="22" height="12" viewBox="0 0 22 12" style="display:block">
            <rect x="0.5" y="0.5" width="18" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <rect x="19" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
            <rect x="1.5" y="1.5" width="${fill}" height="9" rx="1.5" fill="${color}"/>
            ${charging ? '<text x="9" y="9" font-size="7" fill="#fff" text-anchor="middle">⚡</text>' : ''}
          </svg>
          <span style="color:${color}">${pct}%</span>`;
        el.title = `Battery: ${pct}%${charging ? ' (charging)' : ''}`;
      };

      updateBattery();
      battery.addEventListener('levelchange',   updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
    } catch (e) {
      el.textContent = '';
    }
  };

  const updateWallpaper = (name) => { Huna7.Notebook?.Wallpaper?.setGradient?.(name);
    const bg = Huna7.Dictionary.getWallpaperCSS(name);
    _root.style.background = bg;
  };

  return { render, updateWallpaper };
})();

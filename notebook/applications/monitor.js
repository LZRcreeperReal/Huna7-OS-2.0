/* =====================================================
   HUNA7-OS — APPS: MONITOR
   System monitor. Processes, memory, storage, uptime.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Monitor = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'System Monitor', appId: 'monitor', width: 680, height: 500,
    });
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    let refreshInterval = null;
    let activeTab = 0;

    const tabBar = Huna7.Sketch.tabBar(['Overview', 'Processes', 'Storage'], (i) => { activeTab = i; renderTab(); });
    contentEl.appendChild(tabBar);

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:16px;';
    contentEl.appendChild(body);

    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'height:22px;border-top:1px solid var(--h7-border);padding:0 12px;display:flex;align-items:center;font-size:11px;color:var(--h7-text-muted);gap:16px;flex-shrink:0;';
    contentEl.appendChild(statusBar);

    const fakeMemUsage = () => ({ used: Math.floor(180 + Math.random() * 40), total: 512 });
    const fakeCPU = () => Math.floor(5 + Math.random() * 20);

    const mkStatCard = (label, value, sub = '', accent = false) => {
      const card = document.createElement('div');
      card.className = 'h7-glass';
      card.style.cssText = 'padding:16px;flex:1;min-width:120px;';
      card.innerHTML = `
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);margin-bottom:6px;">${label}</div>
        <div style="font-size:28px;font-weight:300;${accent ? 'color:var(--h7-accent);' : ''}">${value}</div>
        ${sub ? `<div style="font-size:11px;color:var(--h7-text-muted);margin-top:4px;">${sub}</div>` : ''}`;
      return card;
    };

    const mkGraph = (label, values, color = 'var(--h7-accent)') => {
      const wrap = document.createElement('div');
      wrap.className = 'h7-glass';
      wrap.style.cssText = 'padding:14px;flex:1;';
      wrap.innerHTML = `<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);margin-bottom:10px;">${label}</div>`;
      const canvas = document.createElement('canvas');
      canvas.width = 260; canvas.height = 60; canvas.style.width = '100%';
      wrap.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const draw = (vals) => {
        ctx.clearRect(0, 0, 260, 60);
        const max = Math.max(...vals, 1);
        ctx.beginPath();
        vals.forEach((v, i) => {
          const x = (i / (vals.length - 1)) * 260;
          const y = 60 - (v / max) * 54;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.lineTo(260, 60); ctx.lineTo(0, 60); ctx.closePath();
        ctx.fillStyle = color.replace(')', ',0.15)').replace('var(--h7-accent)', 'rgba(94,127,255,0.15)'); ctx.fill();
      };
      draw(values);
      wrap._draw = draw;
      return wrap;
    };

    const cpuHistory = Array(30).fill(0);
    const memHistory = Array(30).fill(0);

    let cpuGraph, memGraph;

    const renderTab = () => {
      body.innerHTML = '';

      if (activeTab === 0) {
        // Overview
        const mem = fakeMemUsage();
        const cpu = fakeCPU();

        const row1 = document.createElement('div');
        row1.style.cssText = 'display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;';
        row1.append(
          mkStatCard('Uptime', Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime())),
          mkStatCard('Processes', Huna7.Chalk.getAllProcesses().length, 'running', true),
          mkStatCard('Memory', `${mem.used}MB`, `of ${mem.total}MB`),
          mkStatCard('CPU', cpu + '%', 'simulated', cpu > 50),
        );

        const row2 = document.createElement('div');
        row2.style.cssText = 'display:flex;gap:10px;margin-bottom:14px;';
        cpuGraph = mkGraph('CPU Usage', cpuHistory.slice());
        memGraph = mkGraph('Memory Usage', memHistory.map(v => v/512), 'rgba(167,139,250,1)');
        row2.append(cpuGraph, memGraph);

        const infoGrid = document.createElement('div');
        infoGrid.className = 'h7-glass';
        infoGrid.style.cssText = 'padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;';
        [
          ['OS', `Huna7-OS v${Huna7.CONSTANTS.VERSION}`],
          ['User', Huna7.Attendance.getUsername()],
          ['Theme', Huna7.Encyclopedia.getCurrent()?.name || 'Unknown'],
          ['VoxScript', '1.0 (Sandboxed)'],
          ['Storage', 'IndexedDB + localStorage'],
          ['Engine', 'Chalk Kernel'],
        ].forEach(([k,v]) => {
          infoGrid.innerHTML += `<div style="color:var(--h7-text-muted)">${k}</div><div>${v}</div>`;
        });

        body.append(row1, row2, infoGrid);
        statusBar.textContent = `CPU: ${cpu}%  |  Memory: ${mem.used}MB / ${mem.total}MB  |  Uptime: ${Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime())}`;

      } else if (activeTab === 1) {
        // Processes
        const procs = Huna7.Chalk.getAllProcesses();
        const table = document.createElement('div');

        const header = document.createElement('div');
        header.style.cssText = 'display:grid;grid-template-columns:60px 80px 1fr 100px 80px;gap:12px;padding:6px 10px;border-bottom:1px solid var(--h7-border);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--h7-text-muted);';
        header.innerHTML = '<div>PID</div><div>Status</div><div>Name</div><div>App</div><div>Action</div>';
        table.appendChild(header);

        procs.forEach(p => {
          const row = document.createElement('div');
          row.style.cssText = 'display:grid;grid-template-columns:60px 80px 1fr 100px 80px;gap:12px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;align-items:center;transition:background 120ms;';
          row.addEventListener('mouseenter', () => row.style.background = 'var(--h7-bg-glass)');
          row.addEventListener('mouseleave', () => row.style.background = '');
          const statusColor = p.status === 'running' ? '#4CAF50' : p.status === 'error' ? '#e05252' : 'var(--h7-text-muted)';
          const killBtn = document.createElement('button');
          killBtn.className = 'h7-btn h7-btn-danger';
          killBtn.style.cssText = 'padding:2px 8px;font-size:11px;height:22px;';
          killBtn.textContent = 'Kill';
          killBtn.addEventListener('click', () => { Huna7.Eraser.terminate(p.pid); renderTab(); });
          row.innerHTML = `<div style="font-family:var(--h7-font-mono);color:var(--h7-text-muted)">${p.pid}</div><div style="color:${statusColor}">${p.status}</div><div>${p.name}</div><div style="color:var(--h7-text-muted)">${p.appId}</div>`;
          row.appendChild(killBtn);
          table.appendChild(row);
        });

        if (!procs.length) table.appendChild(Huna7.Sketch.emptyState('cpu', 'No processes', 'Nothing running'));
        body.appendChild(table);
        statusBar.textContent = `${procs.length} process(es) running`;

      } else {
        // Storage
        Huna7.Organizer.fs.getAll().then(all => {
          const total = all.reduce((s, e) => s + (e.size || 0), 0);
          const files = all.filter(e => e.type === 'file').length;
          const dirs  = all.filter(e => e.type === 'directory').length;

          const cards = document.createElement('div');
          cards.style.cssText = 'display:flex;gap:10px;margin-bottom:16px;';
          cards.append(
            mkStatCard('Total Files', files, 'files'),
            mkStatCard('Directories', dirs, 'folders'),
            mkStatCard('Data Used', Huna7.Helpers.formatBytes(total), 'stored locally'),
          );

          const recent = document.createElement('div');
          recent.innerHTML = '<div class="h7-label" style="margin-bottom:8px;">Recent Files</div>';
          const recFiles = all.filter(e => e.type === 'file').sort((a,b) => b.modified - a.modified).slice(0, 8);
          recFiles.forEach(f => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;';
            row.innerHTML = `${Huna7.Sketch.fileIcon(f).outerHTML}<div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}</div><div style="color:var(--h7-text-muted);font-size:11px;">${Huna7.Helpers.formatBytes(f.size||0)}</div><div style="color:var(--h7-text-muted);font-size:11px;">${Huna7.Helpers.formatDate(f.modified)}</div>`;
            recent.appendChild(row);
          });

          body.append(cards, recent);
          statusBar.textContent = `${files} files  |  ${Huna7.Helpers.formatBytes(total)} used`;
        });
      }
    };

    renderTab();
    refreshInterval = Huna7.Schedule.repeat(() => {
      const cpu = fakeCPU();
      const mem = fakeMemUsage().used;
      cpuHistory.push(cpu); cpuHistory.shift();
      memHistory.push(mem); memHistory.shift();
      if (activeTab === 0) renderTab();
    }, 2000, 'monitor.refresh');

    return { windowId: id, cleanup: () => Huna7.Schedule.cancel(refreshInterval) };
  };

  return { launch };
})();

/* =====================================================
   HUNA7-OS — APPS: CLOCK
   World clock, stopwatch, and countdown timer.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Clock = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Clock', appId: 'clock', width: 420, height: 460,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;';

    const tabs = ['Clock', 'Stopwatch', 'Timer'];
    let activeTab = 0;
    let swRunning = false, swStart = 0, swElapsed = 0, swInterval = null;
    let timerRunning = false, timerEnd = 0, timerInterval = null, timerSet = 0;

    const tabBar = Huna7.Sketch.tabBar(tabs, (i) => { activeTab = i; renderPanel(); });
    contentEl.appendChild(tabBar);

    const panel = document.createElement('div');
    panel.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:20px;';
    contentEl.appendChild(panel);

    const ZONES = [
      { city: 'Local', zone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      { city: 'UTC', zone: 'UTC' },
      { city: 'New York', zone: 'America/New_York' },
      { city: 'London', zone: 'Europe/London' },
      { city: 'Paris', zone: 'Europe/Paris' },
      { city: 'Tokyo', zone: 'Asia/Tokyo' },
      { city: 'Sydney', zone: 'Australia/Sydney' },
    ];

    let clockInterval = null;

    function renderPanel() {
      panel.innerHTML = '';
      if (clockInterval) clearInterval(clockInterval);
      if (activeTab === 0) renderClock();
      else if (activeTab === 1) renderStopwatch();
      else renderTimer();
    };

    function renderClock() {
      // Analog clock
      const canvas = document.createElement('canvas');
      canvas.width = 180; canvas.height = 180;
      canvas.style.cssText = 'border-radius:50%;';
      panel.appendChild(canvas);

      // Digital display
      const digital = document.createElement('div');
      digital.style.cssText = 'font-size:42px;font-weight:200;letter-spacing:-0.02em;font-family:var(--h7-font-mono);';
      panel.appendChild(digital);

      const dateEl = document.createElement('div');
      dateEl.style.cssText = 'font-size:14px;color:var(--h7-text-muted);';
      panel.appendChild(dateEl);

      // World clocks
      const worldWrap = document.createElement('div');
      worldWrap.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:4px;margin-top:8px;';
      ZONES.slice(1, 4).forEach(z => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--h7-border);';
        row.innerHTML = `<span style="color:var(--h7-text-muted)">${z.city}</span><span id="zone-${z.city.replace(' ','_')}"></span>`;
        worldWrap.appendChild(row);
      });
      panel.appendChild(worldWrap);

      function drawClock() {
        const ctx = canvas.getContext('2d');
        const now = new Date();
        const cx = 90, cy = 90, r = 80;
        ctx.clearRect(0, 0, 180, 180);

        // Face
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();

        // Hour markers
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const isMain = i % 3 === 0;
          const r1 = isMain ? r - 8 : r - 5;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, isMain ? 3 : 1.5, 0, Math.PI*2);
          ctx.fillStyle = isMain ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'; ctx.fill();
        }

        function drawHand(angle, length, width, color) {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
          ctx.beginPath(); ctx.moveTo(0, -length); ctx.lineTo(0, length * 0.15);
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
        };

        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;

        drawHand((h / 12) * Math.PI * 2 - Math.PI / 2, r * 0.55, 3, 'rgba(255,255,255,0.9)');
        drawHand((m / 60) * Math.PI * 2 - Math.PI / 2, r * 0.75, 2, 'rgba(255,255,255,0.8)');
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--h7-accent').trim() || '#5E7FFF';
        drawHand((s / 60) * Math.PI * 2 - Math.PI / 2, r * 0.82, 1, accentColor);

        // Center dot
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2);
        ctx.fillStyle = accentColor; ctx.fill();

        // Digital
        const use24 = Huna7.Blueprint.get('system', 'clock24h');
        digital.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !use24 });
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // World zones
        ZONES.slice(1, 4).forEach(z => {
          const el = document.getElementById('zone-' + z.city.replace(' ', '_'));
          if (el) el.textContent = new Date().toLocaleTimeString('en-US', { timeZone: z.zone, hour: '2-digit', minute: '2-digit', hour12: true });
        });
      };

      drawClock();
      clockInterval = setInterval(drawClock, 100);
    };

    function renderStopwatch() {
      const display = document.createElement('div');
      display.style.cssText = 'font-size:56px;font-weight:200;font-family:var(--h7-font-mono);letter-spacing:-0.02em;';
      display.textContent = '00:00.000';

      const laps = document.createElement('div');
      laps.style.cssText = 'width:100%;max-height:140px;overflow-y:auto;font-size:12px;';
      let lapList = [];

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;';

      const startStopBtn = document.createElement('button');
      startStopBtn.className = 'h7-btn h7-btn-accent';
      startStopBtn.style.cssText = 'padding:10px 28px;font-size:15px;border-radius:50px;';
      startStopBtn.textContent = 'Start';

      const lapResetBtn = document.createElement('button');
      lapResetBtn.className = 'h7-btn h7-btn-ghost';
      lapResetBtn.style.cssText = 'padding:10px 24px;font-size:15px;border-radius:50px;';
      lapResetBtn.textContent = 'Lap';

      function fmt(ms) {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const milli = ms % 1000;
        return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(milli).padStart(3,'0')}`;
      };

      function tick() { display.textContent = fmt(swRunning ? swElapsed + Date.now() - swStart : swElapsed); };

      startStopBtn.addEventListener('click', () => {
        swRunning = !swRunning;
        if (swRunning) { swStart = Date.now(); swInterval = setInterval(tick, 31); startStopBtn.textContent = 'Stop'; startStopBtn.style.background = '#e05252'; }
        else { swElapsed += Date.now() - swStart; clearInterval(swInterval); startStopBtn.textContent = 'Start'; startStopBtn.style.background = ''; }
      });

      lapResetBtn.addEventListener('click', () => {
        if (swRunning) { lapList.push(fmt(swElapsed + Date.now() - swStart)); laps.innerHTML = lapList.map((l, i) => `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--h7-border);"><span style="color:var(--h7-text-muted)">Lap ${i+1}</span><span>${l}</span></div>`).join(''); }
        else { swRunning = false; swElapsed = 0; swStart = 0; lapList = []; display.textContent = '00:00.000'; laps.innerHTML = ''; startStopBtn.textContent = 'Start'; startStopBtn.style.background = ''; }
      });

      btnRow.append(startStopBtn, lapResetBtn);
      panel.append(display, btnRow, laps);
      tick();
    };

    function renderTimer() {
      const display = document.createElement('div');
      display.style.cssText = 'font-size:56px;font-weight:200;font-family:var(--h7-font-mono);letter-spacing:-0.02em;';

      let remaining = timerSet || 0;

      function fmt(ms) {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      };

      display.textContent = fmt(remaining);

      // Time setters
      const setRow = document.createElement('div');
      setRow.style.cssText = 'display:flex;gap:8px;align-items:center;';
      [[60,'1m'],[300,'5m'],[600,'10m'],[1800,'30m'],[3600,'1h']].forEach(([ms, label]) => {
        const b = document.createElement('button');
        b.className = 'h7-btn h7-btn-ghost';
        b.style.cssText = 'padding:5px 10px;font-size:12px;border-radius:20px;';
        b.textContent = label;
        b.addEventListener('click', () => { remaining = ms * 1000; timerSet = remaining; display.textContent = fmt(remaining); });
        setRow.appendChild(b);
      });

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;';
      const startBtn = document.createElement('button');
      startBtn.className = 'h7-btn h7-btn-accent';
      startBtn.style.cssText = 'padding:10px 28px;font-size:15px;border-radius:50px;';
      startBtn.textContent = 'Start';

      const resetBtn = document.createElement('button');
      resetBtn.className = 'h7-btn h7-btn-ghost';
      resetBtn.style.cssText = 'padding:10px 24px;font-size:15px;border-radius:50px;';
      resetBtn.textContent = 'Reset';

      const progressBar = Huna7.Sketch.progressBar(0, 'var(--h7-accent)');
      progressBar.style.cssText += 'width:100%;height:4px;border-radius:2px;';

      startBtn.addEventListener('click', () => {
        timerRunning = !timerRunning;
        if (timerRunning) {
          timerEnd = Date.now() + remaining;
          startBtn.textContent = 'Pause'; startBtn.style.background = '#e09000';
          timerInterval = setInterval(() => {
            remaining = Math.max(0, timerEnd - Date.now());
            display.textContent = fmt(remaining);
            progressBar.update(100 - (remaining / timerSet) * 100);
            if (remaining === 0) {
              clearInterval(timerInterval); timerRunning = false;
              startBtn.textContent = 'Start'; startBtn.style.background = '';
              Huna7.Bulletin.info('Timer', 'Timer finished!');
              Huna7.Animations.shake(display);
            }
          }, 250);
        } else {
          clearInterval(timerInterval); remaining = Math.max(0, timerEnd - Date.now());
          startBtn.textContent = 'Start'; startBtn.style.background = '';
        }
      });

      resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval); timerRunning = false;
        remaining = timerSet; display.textContent = fmt(remaining);
        progressBar.update(0); startBtn.textContent = 'Start'; startBtn.style.background = '';
      });

      btnRow.append(startBtn, resetBtn);
      panel.append(display, progressBar, setRow, btnRow);
    };

    renderPanel();

    return {
      windowId: id,
      cleanup: () => { if (clockInterval) clearInterval(clockInterval); if (swInterval) clearInterval(swInterval); if (timerInterval) clearInterval(timerInterval); }
    };
  };

  return { launch };
})();

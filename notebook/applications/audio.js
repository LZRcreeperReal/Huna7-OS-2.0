/* =====================================================
   HUNA7-OS — APPS: AUDIO
   Music player with playlist support.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Audio = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Audio', appId: 'audio', width: 400, height: 520,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;background:#0d0d10;';

    let playlist = [], currentIdx = 0, audio = new Audio(), isPlaying = false, updateTimer = null;

    // Album art area
    const artWrap = document.createElement('div');
    artWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:28px 24px 16px;gap:12px;';
    const art = document.createElement('div');
    art.style.cssText = `width:140px;height:140px;border-radius:16px;background:var(--h7-bg-glass);
      display:flex;align-items:center;justify-content:center;color:var(--h7-text-muted);box-shadow:var(--h7-shadow);`;
    art.innerHTML = Huna7.Glossary.get('music', 48);

    const trackName = document.createElement('div');
    trackName.style.cssText = 'font-size:16px;font-weight:600;text-align:center;';
    trackName.textContent = 'No track';
    const artistName = document.createElement('div');
    artistName.style.cssText = 'font-size:13px;color:var(--h7-text-muted);text-align:center;';
    artistName.textContent = 'Add music to begin';
    artWrap.append(art, trackName, artistName);

    // Progress
    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = 'padding:0 24px;display:flex;flex-direction:column;gap:4px;';
    const progressBar = document.createElement('input');
    progressBar.type = 'range'; progressBar.min = 0; progressBar.max = 100; progressBar.value = 0;
    progressBar.style.cssText = 'width:100%;height:4px;cursor:pointer;accent-color:var(--h7-accent);';
    const timeRow = document.createElement('div');
    timeRow.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;color:var(--h7-text-muted);font-family:var(--h7-font-mono);';
    const curTime = document.createElement('span'); curTime.textContent = '0:00';
    const durTime = document.createElement('span'); durTime.textContent = '0:00';
    timeRow.append(curTime, durTime);
    progressWrap.append(progressBar, timeRow);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 24px;';

    const mkCtrl = (icon, size = 20) => {
      const btn = document.createElement('button');
      btn.style.cssText = `background:none;border:none;cursor:pointer;color:var(--h7-text);padding:8px;
        border-radius:50%;transition:background 150ms;display:flex;align-items:center;`;
      btn.innerHTML = Huna7.Glossary.get(icon, size);
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--h7-bg-glass)');
      btn.addEventListener('mouseleave', () => btn.style.background = '');
      return btn;
    };

    const prevBtn   = mkCtrl('skipPrev', 20);
    const playBtn   = mkCtrl('play', 32);
    const nextBtn   = mkCtrl('skipNext', 20);
    const volBtn    = mkCtrl('volume', 16);

    controls.append(prevBtn, playBtn, nextBtn, volBtn);

    // Volume
    const volWrap = document.createElement('div');
    volWrap.style.cssText = 'padding:0 24px 12px;display:flex;align-items:center;gap:10px;';
    const volSlider = document.createElement('input');
    volSlider.type = 'range'; volSlider.min = 0; volSlider.max = 100; volSlider.value = 80;
    volSlider.style.cssText = 'flex:1;height:3px;accent-color:var(--h7-accent);cursor:pointer;';
    volSlider.addEventListener('input', () => { audio.volume = volSlider.value / 100; });
    volWrap.append(Huna7.Glossary.get('volume', 14), volSlider);

    // Playlist
    const plHeader = document.createElement('div');
    plHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid var(--h7-border);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);';
    plHeader.textContent = 'Playlist';
    const addBtn = document.createElement('button');
    addBtn.className = 'h7-btn h7-btn-ghost';
    addBtn.style.cssText = 'padding:3px 8px;height:24px;font-size:11px;';
    addBtn.innerHTML = Huna7.Glossary.get('plus', 11) + ' Add';
    addBtn.addEventListener('click', addFiles);
    plHeader.appendChild(addBtn);

    const plList = document.createElement('div');
    plList.style.cssText = 'flex:1;overflow-y:auto;';

    contentEl.append(artWrap, progressWrap, controls, volWrap, plHeader, plList);

    const fmt = (s) => { if (isNaN(s)) return '0:00'; const m = Math.floor(s/60), ss = Math.floor(s%60); return `${m}:${String(ss).padStart(2,'0')}`; };

    const renderPlaylist = () => {
      plList.innerHTML = '';
      if (!playlist.length) { plList.appendChild(Huna7.Sketch.emptyState('music', 'Empty playlist', 'Click + Add to import audio')); return; }
      playlist.forEach((track, i) => {
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:10px;padding:7px 14px;cursor:pointer;
          background:${i === currentIdx ? 'rgba(94,127,255,0.12)' : 'transparent'};
          border-left:${i === currentIdx ? '2px solid var(--h7-accent)' : '2px solid transparent'};
          transition:background 120ms;`;
        row.addEventListener('mouseenter', () => { if (i !== currentIdx) row.style.background = 'var(--h7-bg-glass)'; });
        row.addEventListener('mouseleave', () => { if (i !== currentIdx) row.style.background = 'transparent'; });
        const num = document.createElement('div');
        num.style.cssText = 'width:20px;font-size:11px;color:var(--h7-text-muted);font-family:var(--h7-font-mono);text-align:right;';
        num.textContent = i === currentIdx && isPlaying ? '▶' : (i + 1);
        const name = document.createElement('div');
        name.style.cssText = 'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        name.textContent = track.name;
        const del = document.createElement('button');
        del.innerHTML = Huna7.Glossary.get('close', 10);
        del.style.cssText = 'background:none;border:none;cursor:pointer;color:var(--h7-text-muted);padding:2px;opacity:0;transition:opacity 150ms;';
        row.addEventListener('mouseenter', () => del.style.opacity = '1');
        row.addEventListener('mouseleave', () => del.style.opacity = '0');
        del.addEventListener('click', (e) => { e.stopPropagation(); playlist.splice(i, 1); renderPlaylist(); });
        row.append(num, name, del);
        row.addEventListener('dblclick', () => { currentIdx = i; playTrack(); });
        plList.appendChild(row);
      });
    };

    const playTrack = () => {
      if (!playlist.length) return;
      const track = playlist[currentIdx];
      audio.src = track.url;
      audio.volume = volSlider.value / 100;
      audio.play().catch(()=>{});
      isPlaying = true;
      playBtn.innerHTML = Huna7.Glossary.get('pause', 32);
      trackName.textContent = track.name;
      Huna7.Desk.setTitle(id, 'Audio — ' + track.name);
      renderPlaylist();
    };

    playBtn.addEventListener('click', () => {
      if (!playlist.length) { addFiles(); return; }
      if (isPlaying) { audio.pause(); isPlaying = false; playBtn.innerHTML = Huna7.Glossary.get('play', 32); }
      else { audio.play().catch(()=>{}); isPlaying = true; playBtn.innerHTML = Huna7.Glossary.get('pause', 32); }
    });
    prevBtn.addEventListener('click', () => { currentIdx = (currentIdx - 1 + playlist.length) % playlist.length; playTrack(); });
    nextBtn.addEventListener('click', () => { currentIdx = (currentIdx + 1) % playlist.length; playTrack(); });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      progressBar.value = pct;
      curTime.textContent = fmt(audio.currentTime);
      durTime.textContent = fmt(audio.duration);
    });
    audio.addEventListener('ended', () => { currentIdx = (currentIdx + 1) % playlist.length; playTrack(); });
    progressBar.addEventListener('input', () => { if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration; });

    function addFiles() {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
      input.onchange = () => {
        Array.from(input.files).forEach(f => {
          playlist.push({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) });
        });
        renderPlaylist();
        if (playlist.length === input.files.length) playTrack();
      };
      input.click();
    }

    audio.volume = 0.8;
    renderPlaylist();
    return { windowId: id, cleanup: () => { audio.pause(); audio.src = ''; } };
  };

  return { launch };
})();

/* =====================================================
   HUNA7-OS — APPS: MEDIA
   Audio/video media player.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Media = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Media Player', appId: 'media', width: 720, height: 480,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;background:#000;';

    let media = null;
    let isVideo = false;

    const videoEl = document.createElement('video');
    videoEl.style.cssText = 'flex:1;width:100%;background:#000;display:none;';
    videoEl.controls = false;

    const audioPlaceholder = document.createElement('div');
    audioPlaceholder.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;';
    audioPlaceholder.innerHTML = `<div style="color:rgba(255,255,255,0.15);">${Huna7.Glossary.get('music', 80)}</div>
      <div id="media-title" style="font-size:18px;font-weight:300;color:rgba(255,255,255,0.6);">No media loaded</div>`;

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:12px 16px;background:rgba(0,0,0,0.8);flex-shrink:0;';

    const progressRow = document.createElement('div');
    progressRow.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:11px;font-family:var(--h7-font-mono);color:rgba(255,255,255,0.5);';
    const curT = document.createElement('span'); curT.textContent = '0:00';
    const prog = document.createElement('input');
    prog.type = 'range'; prog.min = 0; prog.max = 100; prog.value = 0;
    prog.style.cssText = 'flex:1;accent-color:var(--h7-accent);height:4px;cursor:pointer;';
    const durT = document.createElement('span'); durT.textContent = '0:00';
    progressRow.append(curT, prog, durT);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:center;';

    function mkBtn(icon, action, size=20) {
      const b = document.createElement('button');
      b.style.cssText = 'background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.8);padding:6px;border-radius:50%;transition:background 150ms;';
      b.innerHTML = Huna7.Glossary.get(icon, size);
      b.addEventListener('mouseenter', () => b.style.background = 'rgba(255,255,255,0.1)');
      b.addEventListener('mouseleave', () => b.style.background = '');
      b.addEventListener('click', action);
      return b;
    };

    const playBtn = mkBtn('play', togglePlay, 32);
    const openBtn = mkBtn('upload', openFile, 16);
    const volIcon = mkBtn('volume', ()=>{}, 16);

    const volSlider = document.createElement('input');
    volSlider.type = 'range'; volSlider.min = 0; volSlider.max = 100; volSlider.value = 80;
    volSlider.style.cssText = 'width:80px;accent-color:var(--h7-accent);height:3px;cursor:pointer;';
    volSlider.addEventListener('input', () => { if (videoEl.src) videoEl.volume = volSlider.value / 100; });

    btnRow.append(openBtn, playBtn, volIcon, volSlider);
    controls.append(progressRow, btnRow);

    contentEl.append(videoEl, audioPlaceholder, controls);

    function fmt(s) { if (!isFinite(s)) return '0:00'; const m = Math.floor(s/60), ss = Math.floor(s%60); return `${m}:${String(ss).padStart(2,'0')}`; };

    function togglePlay() {
      if (!videoEl.src) { openFile(); return; }
      videoEl.paused ? videoEl.play() : videoEl.pause();
    }

    function openFile() {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'video/*,audio/*';
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        const url = URL.createObjectURL(f);
        videoEl.src = url;
        videoEl.volume = volSlider.value / 100;
        isVideo = f.type.startsWith('video/');
        videoEl.style.display = isVideo ? 'block' : 'none';
        audioPlaceholder.style.display = isVideo ? 'none' : 'flex';
        document.getElementById('media-title')?.[ 'textContent' !== undefined ? 'textContent' : 'innerText' ] && (document.getElementById('media-title').textContent = f.name);
        Huna7.Desk.setTitle(id, 'Media — ' + f.name);
        videoEl.play();
      };
      inp.click();
    }

    videoEl.addEventListener('timeupdate', () => {
      if (!videoEl.duration) return;
      prog.value = (videoEl.currentTime / videoEl.duration) * 100;
      curT.textContent = fmt(videoEl.currentTime);
      durT.textContent = fmt(videoEl.duration);
    });
    videoEl.addEventListener('play',  () => { playBtn.innerHTML = Huna7.Glossary.get('pause', 32); });
    videoEl.addEventListener('pause', () => { playBtn.innerHTML = Huna7.Glossary.get('play', 32); });
    prog.addEventListener('input', () => { if (videoEl.duration) videoEl.currentTime = (prog.value/100)*videoEl.duration; });

    return { windowId: id, cleanup: () => { videoEl.pause(); videoEl.src = ''; } };
  };

  return { launch };
})();

/* =====================================================
   HUNA7-OS — APPS: IMAGES
   Image viewer. Zoom, rotate, slideshow.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Images = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Images', appId: 'images', width: 700, height: 520,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;background:#0a0a0a;';

    let zoom = 1, rotation = 0, currentFile = null, imageList = [], currentIdx = 0, slideshowTimer = null;

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;background:var(--h7-bg-panel);';

    const mkBtn = (icon, title, action) => {
      const b = document.createElement('button');
      b.className = 'h7-btn h7-btn-ghost';
      b.style.cssText = 'padding:4px 8px;height:27px;';
      b.innerHTML = Huna7.Glossary.get(icon, 13);
      b.title = title;
      b.addEventListener('click', action);
      return b;
    };

    const prevBtn  = mkBtn('arrowLeft',  'Previous', prevImage);
    const nextBtn  = mkBtn('arrowRight', 'Next',     nextImage);
    const zoomInBtn  = mkBtn('plus',    'Zoom In',  () => { zoom = Math.min(5, zoom + 0.25); applyTransform(); });
    const zoomOutBtn = mkBtn('minus',   'Zoom Out', () => { zoom = Math.max(0.1, zoom - 0.25); applyTransform(); });
    const fitBtn   = mkBtn('maximize',  'Fit',      () => { zoom = 1; rotation = 0; applyTransform(); });
    const rotateBtn = mkBtn('refresh',  'Rotate',   () => { rotation = (rotation + 90) % 360; applyTransform(); });
    const ssBtn    = mkBtn('play',      'Slideshow', toggleSlideshow);
    const openBtn  = mkBtn('upload',    'Open File', openFile);

    const fileLabel = document.createElement('div');
    fileLabel.style.cssText = 'flex:1;font-size:12px;color:var(--h7-text-muted);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    const zoomLabel = document.createElement('div');
    zoomLabel.style.cssText = 'font-size:11px;color:var(--h7-text-muted);font-family:var(--h7-font-mono);min-width:48px;text-align:right;';

    toolbar.append(openBtn, prevBtn, nextBtn, fileLabel, zoomOutBtn, zoomLabel, zoomInBtn, fitBtn, rotateBtn, ssBtn);

    const viewer = document.createElement('div');
    viewer.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;cursor:grab;';

    const img = document.createElement('img');
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;transition:transform 200ms ease;user-select:none;';
    img.draggable = false;
    viewer.appendChild(img);

    const empty = Huna7.Sketch.emptyState('image', 'No image', 'Open an image file to view it');
    viewer.appendChild(empty);

    const strip = document.createElement('div');
    strip.style.cssText = 'height:70px;border-top:1px solid var(--h7-border);display:flex;gap:4px;padding:6px;overflow-x:auto;flex-shrink:0;background:var(--h7-bg-panel);';

    contentEl.append(toolbar, viewer, strip);

    const applyTransform = () => {
      img.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
      zoomLabel.textContent = Math.round(zoom * 100) + '%';
    };

    const loadImage = (src, name) => {
      img.src = src;
      img.style.display = 'block';
      empty.style.display = 'none';
      fileLabel.textContent = name || '';
      applyTransform();
    };

    const loadFromVFS = async (path) => {
      try {
        const entry = await Huna7.VFS.readFile(path);
        if (entry.content.startsWith('data:')) { loadImage(entry.content, entry.name); }
        else { fileLabel.textContent = 'Cannot display: ' + entry.name; }
      } catch { fileLabel.textContent = 'File not found'; }
    };

    const openFile = () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { loadImage(e.target.result, file.name); Huna7.Desk.setTitle(id, 'Images — ' + file.name); };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    const loadDir = async (dirPath) => {
      const entries = await Huna7.VFS.readDir(dirPath);
      imageList = entries.filter(e => e.type === 'file' && /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(e.name));
      renderStrip();
    };

    const renderStrip = () => {
      strip.innerHTML = '';
      imageList.forEach((entry, i) => {
        const thumb = document.createElement('div');
        thumb.style.cssText = `width:56px;height:56px;border-radius:6px;background:var(--h7-bg-glass);
          display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;
          border:2px solid ${i === currentIdx ? 'var(--h7-accent)' : 'transparent'};transition:border-color 150ms;`;
        thumb.innerHTML = Huna7.Glossary.get('image', 20);
        thumb.addEventListener('click', () => { currentIdx = i; loadFromVFS(entry.path); renderStrip(); });
        strip.appendChild(thumb);
      });
    };

    function prevImage() { if (imageList.length) { currentIdx = (currentIdx - 1 + imageList.length) % imageList.length; loadFromVFS(imageList[currentIdx].path); renderStrip(); } }
    function nextImage() { if (imageList.length) { currentIdx = (currentIdx + 1) % imageList.length; loadFromVFS(imageList[currentIdx].path); renderStrip(); } }

    function toggleSlideshow() {
      if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; ssBtn.innerHTML = Huna7.Glossary.get('play', 13); }
      else { slideshowTimer = setInterval(nextImage, 3000); ssBtn.innerHTML = Huna7.Glossary.get('stop', 13); }
    }

    // Wheel zoom
    viewer.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom = Huna7.Helpers.clamp(zoom - e.deltaY * 0.001, 0.1, 5);
      applyTransform();
    }, { passive: false });

    // Keyboard nav
    const onKey = (e) => {
      if (!document.getElementById(id)) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === '+' || e.key === '=') { zoom = Math.min(5, zoom + 0.1); applyTransform(); }
      if (e.key === '-') { zoom = Math.max(0.1, zoom - 0.1); applyTransform(); }
    };
    document.addEventListener('keydown', onKey);

    if (options.file) { loadFromVFS(options.file); loadDir(Huna7.Helpers.getDirPath(options.file)); }
    else empty.style.display = 'flex';

    applyTransform();
    return { windowId: id, cleanup: () => { clearInterval(slideshowTimer); document.removeEventListener('keydown', onKey); } };
  };

  return { launch };
})();

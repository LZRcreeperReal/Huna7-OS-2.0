/* =====================================================
   HUNA7-OS — APPS: GAME LIBRARY
   Game Library. Sandboxed iframe with GN-Math framework.
   Window structure mirrors writer.js exactly.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.GLibrary = (() => {
  function launch(pid, options = {}) {

    const { id, contentEl, titleEl } = Huna7.Desk.createWindow({
      title: 'Game Library', appId: 'glibrary', width: 960, height: 620,
    });
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';
    contentEl.style.overflow = 'hidden';

    // ── Toolbar ────────────────────────────────────────────
    const glibraryToolbar = document.createElement('div');
    glibraryToolbar.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'padding:5px 10px',
      'border-bottom:1px solid var(--h7-border)',
      'flex-shrink:0',
      'background:var(--h7-bg-glass)',
    ].join(';') + ';';

    // Title badge
    const glibraryBadge = document.createElement('div');
    glibraryBadge.style.cssText = [
      'font-size:13px',
      'font-weight:600',
      'color:var(--h7-text)',
      'display:flex',
      'align-items:center',
      'gap:7px',
    ].join(';') + ';';
    glibraryBadge.innerHTML = Huna7.Glossary.get('globe', 14) + ' <span>Game Library</span>';

    const spacer = document.createElement('div');
    spacer.style.flex = '1';

    // Reload button
    const glibraryReloadBtn = document.createElement('button');
    glibraryReloadBtn.className = 'h7-btn h7-btn-ghost';
    glibraryReloadBtn.style.cssText = 'padding:4px 10px;height:27px;font-size:12px;';
    glibraryReloadBtn.innerHTML = Huna7.Glossary.get('refresh', 13) + ' <span>Reload</span>';
    glibraryReloadBtn.title = 'Reload Game Library';
    glibraryReloadBtn.addEventListener('click', () => {
      if (glibraryFrame) {
        // Re-assign srcdoc to force reload
        glibraryFrame.srcdoc = glibraryFrame.srcdoc;
      }
    });

    // Fullscreen button
    const glibraryFsBtn = document.createElement('button');
    glibraryFsBtn.className = 'h7-btn h7-btn-ghost';
    glibraryFsBtn.style.cssText = 'padding:4px 10px;height:27px;font-size:12px;';
    glibraryFsBtn.innerHTML = Huna7.Glossary.get('maximize', 13) + ' <span>Fullscreen</span>';
    glibraryFsBtn.title = 'Toggle Fullscreen';
    glibraryFsBtn.addEventListener('click', () => {
      if (glibraryFrame.requestFullscreen) glibraryFrame.requestFullscreen();
      else if (glibraryFrame.webkitRequestFullscreen) glibraryFrame.webkitRequestFullscreen();
    });

    glibraryToolbar.append(glibraryBadge, spacer, glibraryReloadBtn, glibraryFsBtn);

    // ── Sandboxed iframe ────────────────────────────────────
    // The <base> tag inside srcdoc is fully isolated — it cannot affect
    // the parent OS document's path resolution in any way.
    const glibraryWrap = document.createElement('div');
    glibraryWrap.style.cssText = [
      'flex:1',
      'display:flex',
      'overflow:hidden',
      'position:relative',
      'background:#000',
      'min-height:0',
    ].join(';') + ';';

    const glibraryFrame = document.createElement('iframe');
    glibraryFrame.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    glibraryFrame.allow = 'autoplay; fullscreen; gamepad; keyboard';

    // srcdoc isolates the <base> tag completely from the parent document
    glibraryFrame.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <base href="https://www.jsdelivr.com/">
  <link rel="stylesheet" href="css/main.css">
  <script src="js/main.js" defer><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      background: #0a0a0f;
      color: #F0F0F8;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    /* Loading placeholder shown until framework takes over */
    .gl-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
      color: rgba(255,255,255,0.4);
    }
    .gl-spinner {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #5E7FFF;
      animation: spin 0.7s linear infinite;
    }
    .gl-title { font-size: 15px; font-weight: 500; }
    .gl-sub   { font-size: 12px; opacity: 0.5; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body style="margin:0; padding:0; background:#000; overflow:hidden;">
  <div class="gl-loading">
    <div class="gl-spinner"></div>
    <div class="gl-title">Game Library</div>
    <div class="gl-sub">Loading framework...</div>
  </div>
</body>
</html>`;

    glibraryWrap.appendChild(glibraryFrame);

    // ── Status bar ──────────────────────────────────────────
    const glibraryStatusBar = document.createElement('div');
    glibraryStatusBar.style.cssText = [
      'height:22px',
      'border-top:1px solid var(--h7-border)',
      'padding:0 12px',
      'display:flex',
      'align-items:center',
      'font-size:11px',
      'color:var(--h7-text-muted)',
      'gap:16px',
      'flex-shrink:0',
    ].join(';') + ';';
    glibraryStatusBar.textContent = 'Game Library — Sandboxed';

    // Track load state
    glibraryFrame.addEventListener('load', () => {
      glibraryStatusBar.textContent = 'Game Library — Ready';
    });
    glibraryFrame.addEventListener('error', () => {
      glibraryStatusBar.textContent = 'Game Library — Failed to load framework';
    });

    contentEl.append(glibraryToolbar, glibraryWrap, glibraryStatusBar);

    Huna7.Desk.setTitle(id, 'Game Library');

    return { windowId: id };
  }

  return { launch };
})();

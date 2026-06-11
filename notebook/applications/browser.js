/* =====================================================
   HUNA7-OS — APPS: ORBIT
   Orbit — the Huna7-OS browser. Tabs, bookmarks, history.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Orbit = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Orbit', appId: 'orbit', width: 900, height: 600,
    });
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    let tabs = [], activeTab = 0;
    let bookmarks = Huna7.Storage.get('orbit_bookmarks', []);
    let history   = Huna7.Storage.get('orbit_history', []);

    const HOME = 'data:text/html,<style>body{background:%230a0a0f;color:%23F0F0F8;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px;}</style><h1 style="font-weight:200;font-size:2rem;letter-spacing:-0.03em;">Orbit</h1><p style="color:rgba(240,240,248,.45)">Enter a URL above to browse the web</p>';

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;align-items:stretch;border-bottom:1px solid var(--h7-border);overflow-x:auto;min-height:36px;flex-shrink:0;background:rgba(0,0,0,0.2);';

    // Address bar row
    const addrRow = document.createElement('div');
    addrRow.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    function mkNavBtn(icon, action) {
      const b = document.createElement('button');
      b.className = 'h7-btn h7-btn-ghost';
      b.style.cssText = 'padding:4px 7px;height:28px;';
      b.innerHTML = Huna7.Glossary.get(icon, 13);
      b.addEventListener('click', action);
      return b;
    };

    const backBtn    = mkNavBtn('arrowLeft',  () => { try { getFrame()?.contentWindow.history.back(); } catch {} });
    const fwdBtn     = mkNavBtn('arrowRight', () => { try { getFrame()?.contentWindow.history.forward(); } catch {} });
    const refreshBtn = mkNavBtn('refresh',    () => { try { getFrame()?.contentWindow.location.reload(); } catch {} });
    const homeBtn    = mkNavBtn('home',       () => navigate(HOME));

    const addrBar = document.createElement('input');
    addrBar.className = 'h7-input';
    addrBar.style.cssText = 'flex:1;height:28px;padding:4px 10px;font-size:13px;font-family:var(--h7-font-mono);';
    addrBar.placeholder = 'Enter URL or search...';
    addrBar.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(addrBar.value); });

    const bookmarkBtn = mkNavBtn('bookmarks', toggleBookmark);
    const newTabBtn   = mkNavBtn('plus',      () => openTab());

    addrRow.append(backBtn, fwdBtn, refreshBtn, homeBtn, addrBar, bookmarkBtn, newTabBtn);

    // Frame container
    const frameWrap = document.createElement('div');
    frameWrap.style.cssText = 'flex:1;position:relative;overflow:hidden;';

    contentEl.append(tabBar, addrRow, frameWrap);

    // ── Tabs ──────────────────────────────────────────────

    function openTab(url = HOME, title = 'New Tab') {
      const frame = document.createElement('iframe');
      frame.style.cssText = 'width:100%;height:100%;border:none;position:absolute;inset:0;';
      frame.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
      frame.src = url;

      const tab = { id: Huna7.Helpers.generateId('tab'), title, url, frame };
      tabs.push(tab);
      frameWrap.appendChild(frame);

      frame.addEventListener('load', () => {
        try {
          const loc = frame.contentWindow?.location?.href;
          if (loc && loc !== 'about:blank') {
            tab.url = loc;
            addrBar.value = loc !== HOME ? loc : '';
            tab.title = frame.contentDocument?.title || loc;
            renderTabBar();
            addToHistory(tab.url, tab.title);
          }
        } catch {}
      });

      switchTab(tabs.length - 1);
    };

    function switchTab(idx) {
      activeTab = idx;
      tabs.forEach((t, i) => { t.frame.style.display = i === idx ? 'block' : 'none'; });
      const tab = tabs[idx];
      if (tab) addrBar.value = tab.url !== HOME ? tab.url : '';
      renderTabBar();
    };

    function closeTab(idx) {
      tabs[idx]?.frame.remove();
      tabs.splice(idx, 1);
      if (!tabs.length) openTab();
      else switchTab(Math.min(idx, tabs.length - 1));
      renderTabBar();
    };

    const getFrame = () => tabs[activeTab]?.frame;

    function renderTabBar() {
      tabBar.innerHTML = '';
      tabs.forEach((tab, i) => {
        const el = document.createElement('div');
        el.style.cssText = `display:flex;align-items:center;gap:8px;padding:0 12px;cursor:pointer;
          min-width:120px;max-width:180px;font-size:12px;border-right:1px solid var(--h7-border);
          background:${i === activeTab ? 'var(--h7-bg-glass)' : 'transparent'};
          border-bottom:${i === activeTab ? '2px solid var(--h7-accent)' : '2px solid transparent'};
          transition:background 150ms;overflow:hidden;flex-shrink:0;`;
        const favicon = document.createElement('div');
        favicon.style.cssText = 'width:12px;height:12px;flex-shrink:0;color:var(--h7-text-muted);';
        favicon.innerHTML = Huna7.Glossary.get('globe', 12);
        const label = document.createElement('span');
        label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        label.textContent = tab.title || 'Loading...';
        const x = document.createElement('span');
        x.innerHTML = Huna7.Glossary.get('close', 10);
        x.style.cssText = 'opacity:0.5;flex-shrink:0;';
        x.addEventListener('click', (e) => { e.stopPropagation(); closeTab(i); });
        el.append(favicon, label, x);
        el.addEventListener('click', () => switchTab(i));
        tabBar.appendChild(el);
      });
    };

    // ── Navigation ────────────────────────────────────────

    function navigate(input) {
      let url = input.trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url) && !url.startsWith('data:') && !url.startsWith('about:')) {
        url = url.includes('.') && !url.includes(' ') ? 'https://' + url : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
      const frame = getFrame();
      if (!frame) { openTab(url); return; }
      frame.src = url;
      if (tabs[activeTab]) { tabs[activeTab].url = url; addrBar.value = url; }
      addToHistory(url, url);
    };

    // ── Bookmarks ─────────────────────────────────────────

    function toggleBookmark() {
      const url = tabs[activeTab]?.url;
      if (!url || url === HOME) return;
      const exists = bookmarks.find(b => b.url === url);
      if (exists) {
        bookmarks = bookmarks.filter(b => b.url !== url);
        Huna7.Bulletin.info('Orbit', 'Bookmark removed');
      } else {
        bookmarks.unshift({ url, title: tabs[activeTab]?.title || url, addedAt: Date.now() });
        Huna7.Bulletin.success('Orbit', 'Bookmarked!');
      }
      Huna7.Storage.set('orbit_bookmarks', bookmarks);
    };

    function showBookmarks() {
      const bm = bookmarks.map(b => `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;font-size:13px;" onclick="parent.navigate('${b.url}')"><div>${b.title}</div><div style="font-size:11px;color:rgba(255,255,255,0.4)">${b.url}</div></div>`).join('') || '<div style="color:rgba(255,255,255,0.4);font-size:13px;">No bookmarks yet</div>';
      navigate(`data:text/html,<style>body{background:%230a0a0f;color:%23F0F0F8;font-family:system-ui;padding:24px;}</style><h2>Bookmarks</h2>${bm}`);
    };

    // ── History ───────────────────────────────────────────

    function addToHistory(url, title) {
      if (url === HOME || url.startsWith('data:')) return;
      history.unshift({ url, title, visitedAt: Date.now() });
      if (history.length > 200) history.pop();
      Huna7.Storage.set('orbit_history', history);
    };

    // Start with one tab
    openTab(HOME);

    return { windowId: id };
  };

  return { launch };
})();

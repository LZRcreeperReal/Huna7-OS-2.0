/* =====================================================
   HUNA7-OS — APPS: WRITER
   Text editor. Tabs, search/replace, autosave.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Writer = (() => {
  const launch = (pid, options = {}) => {
    const tabs = [];
    let activeTab = 0;
    let findBarVisible = false;
    let autosaveTimer = null;

    const { id, contentEl, titleEl } = Huna7.Desk.createWindow({
      title: 'Writer', appId: 'writer', width: 760, height: 540,
    });
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;border-bottom:1px solid var(--h7-border);flex-shrink:0;overflow-x:auto;min-height:36px;align-items:stretch;';
    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'h7-btn h7-btn-ghost';
    newTabBtn.style.cssText = 'padding:4px 10px;border-radius:0;border-left:1px solid var(--h7-border);flex-shrink:0;font-size:16px;';
    newTabBtn.innerHTML = Huna7.Glossary.get('plus', 13);
    newTabBtn.title = 'New Tab';
    newTabBtn.addEventListener('click', () => openTab());

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;padding:4px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    const mkBtn = (icon, title, action, label = '') => {
      const b = document.createElement('button');
      b.className = 'h7-btn h7-btn-ghost';
      b.style.cssText = 'padding:4px 8px;height:27px;font-size:12px;';
      b.innerHTML = Huna7.Glossary.get(icon, 13) + (label ? ` <span>${label}</span>` : '');
      b.title = title;
      b.addEventListener('click', action);
      return b;
    };

    const saveBtn    = mkBtn('download', 'Save (Ctrl+S)', saveActive, 'Save');
    const findBtn    = mkBtn('search',   'Find (Ctrl+F)', toggleFind, 'Find');
    const runBtn     = mkBtn('play',     'Run Script',    runScript,  'Run');
    const wordWrapBtn = mkBtn('list',    'Toggle Word Wrap', toggleWordWrap, 'Wrap');

    const sep = document.createElement('div'); sep.style.cssText = 'width:1px;height:16px;background:var(--h7-border);margin:0 2px;';
    const sep2 = sep.cloneNode();
    const fontSizeLabel = document.createElement('span');
    fontSizeLabel.style.cssText = 'font-size:11px;color:var(--h7-text-muted);';
    fontSizeLabel.textContent = '14px';
    const fontUp   = mkBtn('plus',  'Increase Font', () => changeFontSize(1));
    const fontDown = mkBtn('minus', 'Decrease Font', () => changeFontSize(-1));

    toolbar.append(saveBtn, findBtn, sep, runBtn, sep2, wordWrapBtn, fontUp, fontSizeLabel, fontDown);

    // Find bar
    const findBar = document.createElement('div');
    findBar.style.cssText = 'display:none;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';
    const findInput = document.createElement('input');
    findInput.className = 'h7-input';
    findInput.placeholder = 'Find...';
    findInput.style.cssText = 'width:200px;height:27px;padding:4px 8px;font-size:12px;';
    const replaceInput = document.createElement('input');
    replaceInput.className = 'h7-input';
    replaceInput.placeholder = 'Replace...';
    replaceInput.style.cssText = 'width:200px;height:27px;padding:4px 8px;font-size:12px;';
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'h7-btn h7-btn-ghost';
    replaceBtn.style.cssText = 'height:27px;font-size:12px;padding:4px 8px;';
    replaceBtn.textContent = 'Replace All';
    replaceBtn.addEventListener('click', replaceAll);
    const closeFind = document.createElement('button');
    closeFind.className = 'h7-btn h7-btn-ghost';
    closeFind.style.cssText = 'height:27px;padding:4px 7px;';
    closeFind.innerHTML = Huna7.Glossary.get('close', 12);
    closeFind.addEventListener('click', () => { findBarVisible = false; findBar.style.display = 'none'; });
    const matchCount = document.createElement('span');
    matchCount.style.cssText = 'font-size:11px;color:var(--h7-text-muted);';
    findInput.addEventListener('input', () => { highlightMatches(); updateMatchCount(); });
    findBar.append(findInput, replaceInput, replaceBtn, matchCount, closeFind);

    // Editor area
    const editorWrap = document.createElement('div');
    editorWrap.style.cssText = 'flex:1;display:flex;overflow:hidden;min-height:0;position:relative;';

    // Line numbers
    const lineNums = document.createElement('div');
    lineNums.style.cssText = `width:44px;padding:10px 0;background:rgba(0,0,0,0.15);
      font-family:var(--h7-font-mono);font-size:13px;line-height:1.6;
      color:var(--h7-text-muted);text-align:right;padding-right:10px;
      overflow:hidden;flex-shrink:0;user-select:none;`;

    // Textarea
    const textarea = document.createElement('textarea');
    textarea.style.cssText = `flex:1;background:transparent;border:none;outline:none;resize:none;
      font-family:var(--h7-font-mono);font-size:13px;line-height:1.6;
      color:var(--h7-text);padding:10px 14px;tab-size:2;white-space:pre;overflow:auto;`;
    textarea.spellcheck = false;

    editorWrap.append(lineNums, textarea);

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'height:22px;border-top:1px solid var(--h7-border);padding:0 12px;display:flex;align-items:center;font-size:11px;color:var(--h7-text-muted);gap:16px;flex-shrink:0;';

    contentEl.append(tabBar, toolbar, findBar, editorWrap, statusBar);

    let fontSize = parseInt(Huna7.Blueprint.get('writer', 'fontSize')) || 14;
    let wordWrap = Huna7.Blueprint.get('writer', 'wordWrap') !== false;
    updateTextareaStyle();

    function updateTextareaStyle() {
      textarea.style.fontSize = fontSize + 'px';
      textarea.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
      fontSizeLabel.textContent = fontSize + 'px';
    }

    function changeFontSize(delta) { fontSize = Math.max(10, Math.min(28, fontSize + delta)); updateTextareaStyle(); }
    function toggleWordWrap() { wordWrap = !wordWrap; updateTextareaStyle(); }

    // Tab management
    const openTab = async (filePath = null, content = '') => {
      let tabContent = content;
      let tabPath = filePath;
      let tabName = tabPath ? Huna7.Helpers.getFileName(tabPath) : 'Untitled';

      if (filePath) {
        try {
          const entry = await Huna7.VFS.readFile(filePath);
          tabContent = entry.content || '';
          tabName = entry.name;
        } catch { tabContent = ''; }
      }

      const tabIdx = tabs.length;
      const tab = { path: tabPath, name: tabName, content: tabContent, modified: false, idx: tabIdx };
      tabs.push(tab);
      renderTabBar();
      switchTab(tabIdx);
    };

    const renderTabBar = () => {
      tabBar.innerHTML = '';
      tabs.forEach((tab, i) => {
        const el = document.createElement('div');
        el.style.cssText = `display:flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;
          min-width:100px;max-width:160px;font-size:12px;border-right:1px solid var(--h7-border);
          transition:background 150ms;flex-shrink:0;
          background:${i === activeTab ? 'var(--h7-bg-glass)' : 'transparent'};
          border-bottom:${i === activeTab ? '2px solid var(--h7-accent)' : '2px solid transparent'};`;
        const nameEl = document.createElement('span');
        nameEl.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameEl.textContent = (tab.modified ? '● ' : '') + tab.name;
        const closeEl = document.createElement('span');
        closeEl.style.cssText = 'opacity:0.5;font-size:11px;flex-shrink:0;';
        closeEl.innerHTML = Huna7.Glossary.get('close', 10);
        closeEl.addEventListener('click', (e) => { e.stopPropagation(); closeTab(i); });
        el.append(nameEl, closeEl);
        el.addEventListener('click', () => switchTab(i));
        tabBar.appendChild(el);
      });
      tabBar.appendChild(newTabBtn);
    };

    const switchTab = (idx) => {
      if (activeTab >= 0 && tabs[activeTab]) {
        tabs[activeTab].content = textarea.value;
      }
      activeTab = idx;
      const tab = tabs[idx];
      if (!tab) return;
      textarea.value = tab.content;
      Huna7.Desk.setTitle(id, `Writer — ${tab.name}`);
      renderTabBar();
      updateStatus();
      updateLineNumbers();
    };

    const closeTab = (idx) => {
      if (tabs[idx]?.modified) {
        Huna7.Toolbox.showModal('Unsaved Changes', `"${tabs[idx].name}" has unsaved changes.`, [
          { label: 'Discard', type: 'danger', value: 'discard' },
          { label: 'Save', type: 'accent', value: 'save' },
          { label: 'Cancel', type: 'ghost', value: 'cancel' },
        ]).then(async (v) => {
          if (v === 'cancel') return;
          if (v === 'save') await saveTab(idx);
          tabs.splice(idx, 1);
          if (!tabs.length) openTab();
          else switchTab(Math.min(idx, tabs.length - 1));
          renderTabBar();
        });
      } else {
        tabs.splice(idx, 1);
        if (!tabs.length) openTab();
        else switchTab(Math.min(idx, tabs.length - 1));
        renderTabBar();
      }
    };

    const saveActive = () => saveTab(activeTab);

    const saveTab = async (idx) => {
      const tab = tabs[idx];
      if (!tab) return;
      tab.content = textarea.value;
      if (!tab.path) {
        const name = await Huna7.Toolbox.showPrompt('Save As', 'filename.note');
        if (!name) return;
        tab.path = '/Home/Documents/' + name;
        tab.name = name;
      }
      await Huna7.VFS.writeFile(tab.path, tab.content);
      tab.modified = false;
      renderTabBar();
      Huna7.Bulletin.success('Saved', tab.name);
    };

    const runScript = async () => {
      const tab = tabs[activeTab];
      if (!tab) return;
      const code = textarea.value;
      const ext = tab.path ? Huna7.Helpers.getFileExtension(tab.path) : '';
      if (ext !== '.pencil' && !code.startsWith('#!vox')) {
        Huna7.Bulletin.warning('Writer', 'Save as .pencil to run as VoxScript');
        return;
      }
      Huna7.Bulletin.info('VoxScript', 'Running script...');
      const result = await Huna7.VoxScript.Runtime.run(code, { pid, outputFn: console.log });
      if (result.success) Huna7.Bulletin.success('VoxScript', 'Script completed');
      else Huna7.Bulletin.error('VoxScript', result.errors[0] || 'Error');
    };

    const toggleFind = () => {
      findBarVisible = !findBarVisible;
      findBar.style.display = findBarVisible ? 'flex' : 'none';
      if (findBarVisible) { findInput.focus(); findInput.select(); }
    };

    const highlightMatches = () => { /* Basic highlight via textarea selection */ };

    const updateMatchCount = () => {
      const q = findInput.value;
      if (!q) { matchCount.textContent = ''; return; }
      const text = textarea.value;
      const count = (text.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      matchCount.textContent = `${count} match${count !== 1 ? 'es' : ''}`;
    };

    const replaceAll = () => {
      const q = findInput.value, r = replaceInput.value;
      if (!q) return;
      textarea.value = textarea.value.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), r);
      markModified();
    };

    const markModified = () => {
      if (tabs[activeTab]) { tabs[activeTab].modified = true; renderTabBar(); }
    };

    const updateLineNumbers = () => {
      const lines = textarea.value.split('\n').length;
      lineNums.innerHTML = Array.from({ length: lines }, (_, i) => `<div style="line-height:1.6;padding-right:10px;">${i + 1}</div>`).join('');
    };

    const updateStatus = () => {
      const text = textarea.value;
      const lines = text.split('\n').length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const pos = textarea.selectionStart;
      const lineNum = text.substring(0, pos).split('\n').length;
      const colNum = pos - text.lastIndexOf('\n', pos - 1);
      statusBar.textContent = `Ln ${lineNum}, Col ${colNum}  |  ${lines} lines  ${words} words  ${chars} chars`;
    };

    textarea.addEventListener('input', () => {
      markModified();
      updateLineNumbers();
      updateStatus();
      if (autosaveTimer) clearTimeout(autosaveTimer);
      if (Huna7.Blueprint.get('writer', 'autosave')) {
        autosaveTimer = setTimeout(() => { if (tabs[activeTab]?.path) saveActive(); }, 3000);
      }
    });

    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveActive(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); toggleFind(); }
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    });

    textarea.addEventListener('scroll', () => { lineNums.scrollTop = textarea.scrollTop; });
    textarea.addEventListener('keyup', updateStatus);
    textarea.addEventListener('click', updateStatus);

    // Open initial file or new tab
    if (options.file) openTab(options.file);
    else openTab();

    return { windowId: id };
  };

  return { launch };
})();

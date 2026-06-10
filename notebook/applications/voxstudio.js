/* =====================================================
   HUNA7-OS — APPS: VOXSTUDIO
   Official VoxScript IDE. Editor, console, debugger.
   Now fully safe for chalk.spawn().
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

/* wrapper — runs immediately so all vars are ready before Chalk calls launch */
const initApp = (launchFn) => {
  Huna7.Apps.VoxStudio = (() => {
    const launch = launchFn;
    return { launch };
  })();
};

initApp(() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'VoxStudio', appId: 'voxstudio', width: 880, height: 580,
    });
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';

    let currentFile = options.file || null;
    let isModified  = false;
    let isRunning   = false;

    // Inject highlight styles
    if (!document.querySelector('#vox-hl-style')) {
      const s = document.createElement('style');
      s.id = 'vox-hl-style';
      s.textContent = Huna7.VoxScript.Debugger.getHighlightCSS();
      document.head.appendChild(s);
    }

    // ── Toolbar ───────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    const mkBtn = (icon, label, action, cls='h7-btn-ghost') => {
      const b = document.createElement('button');
      b.className = `h7-btn ${cls}`;
      b.style.cssText = 'padding:4px 10px;height:27px;font-size:12px;';
      b.innerHTML = Huna7.Glossary.get(icon, 13) + (label ? ` <span>${label}</span>` : '');
      b.addEventListener('click', action);
      return b;
    };

    const newBtn    = mkBtn('plus',     'New',     newFile);
    const openBtn   = mkBtn('upload',   'Open',    openFile);
    const saveBtn   = mkBtn('download', 'Save',    saveFile);
    const runBtn    = mkBtn('play',     'Run',     runScript, 'h7-btn-accent');
    const stopBtn   = mkBtn('stop',     'Stop',    stopScript);
    stopBtn.style.display = 'none';
    const clearBtn  = mkBtn('trash',    'Clear',   () => { consoleEl.innerHTML = ''; });
    const fmtBtn    = mkBtn('code',     'Format',  formatCode);

    const fileLabel = document.createElement('div');
    fileLabel.style.cssText = 'flex:1;font-size:12px;color:var(--h7-text-muted);margin:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    fileLabel.textContent = 'untitled.pencil';

    const validLabel = document.createElement('div');
    validLabel.style.cssText = 'font-size:11px;font-family:var(--h7-font-mono);padding:3px 8px;border-radius:4px;';

    toolbar.append(newBtn, openBtn, saveBtn, fileLabel, fmtBtn, validLabel, clearBtn, runBtn, stopBtn);

    // ── Main split: editor | console ─────────────────────
    const body = document.createElement('div');
    body.style.cssText = 'flex:1;display:flex;overflow:hidden;min-height:0;';

    // ── File sidebar ──────────────────────────────────────
    const fileSidebar = document.createElement('div');
    fileSidebar.style.cssText = 'width:160px;border-right:1px solid var(--h7-border);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;';
    const sidebarTitle = document.createElement('div');
    sidebarTitle.style.cssText = 'padding:8px 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);border-bottom:1px solid var(--h7-border);display:flex;justify-content:space-between;align-items:center;';
    sidebarTitle.innerHTML = 'Files ' + Huna7.Glossary.get('folder', 11);
    const fileListEl = document.createElement('div');
    fileListEl.style.cssText = 'flex:1;overflow-y:auto;padding:4px;';
    fileSidebar.append(sidebarTitle, fileListEl);

    // ── Editor ────────────────────────────────────────────
    const editorWrap = document.createElement('div');
    editorWrap.style.cssText = 'flex:1;display:flex;overflow:hidden;';

    const lineNums = document.createElement('div');
    lineNums.style.cssText = `width:40px;padding:10px 0;background:rgba(0,0,0,0.25);font-family:var(--h7-font-mono);
      font-size:13px;line-height:1.6;color:var(--h7-text-muted);text-align:right;padding-right:8px;
      overflow:hidden;flex-shrink:0;user-select:none;`;

    const editorArea = document.createElement('div');
    editorArea.style.cssText = 'flex:1;position:relative;overflow:hidden;';

    const textarea = document.createElement('textarea');
    textarea.style.cssText = `width:100%;height:100%;background:transparent;border:none;outline:none;resize:none;
      font-family:var(--h7-font-mono);font-size:13px;line-height:1.6;color:var(--h7-text);
      padding:10px 14px;tab-size:2;position:absolute;top:0;left:0;z-index:1;caret-color:var(--h7-accent);`;
    textarea.spellcheck = false;
    textarea.placeholder = '# Write VoxScript here...\n\nlet name = "World"\nfn greet(n) {\n  print("Hello, " + n)\n}\ngreet(name)\n';

    editorArea.appendChild(textarea);
    editorWrap.append(lineNums, editorArea);

    // ── Console panel ─────────────────────────────────────
    const consoleWrap = document.createElement('div');
    consoleWrap.style.cssText = 'width:280px;border-left:1px solid var(--h7-border);display:flex;flex-direction:column;flex-shrink:0;';
    const consoleHeader = document.createElement('div');
    consoleHeader.style.cssText = 'padding:6px 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);border-bottom:1px solid var(--h7-border);';
    consoleHeader.textContent = 'Console';
    const consoleEl = document.createElement('div');
    consoleEl.style.cssText = `flex:1;overflow-y:auto;padding:8px;font-family:var(--h7-font-mono);font-size:12px;line-height:1.6;`;

    consoleWrap.append(consoleHeader, consoleEl);
    body.append(fileSidebar, editorWrap, consoleWrap);

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'height:22px;border-top:1px solid var(--h7-border);padding:0 12px;display:flex;align-items:center;font-size:11px;color:var(--h7-text-muted);gap:16px;flex-shrink:0;';

    contentEl.append(toolbar, body, statusBar);

    // ── Console output ────────────────────────────────────
    const consoleLog = (text, type = 'output') => {
      const colors = { output: 'var(--h7-text)', error: '#e05252', info: '#5E7FFF', success: '#4CAF50' };
      const line = document.createElement('div');
      line.style.cssText = `color:${colors[type] || colors.output};white-space:pre-wrap;word-break:break-all;padding:1px 0;`;
      line.textContent = text;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    // ── Editor helpers ────────────────────────────────────
    const updateLineNums = () => {
      const lines = (textarea.value + '\n').split('\n').length;
      lineNums.innerHTML = Array.from({length: lines}, (_,i) => `<div style="line-height:1.6">${i+1}</div>`).join('');
    };

    const updateStatus = () => {
      const t = textarea.value;
      const pos = textarea.selectionStart;
      const lineNum = t.substring(0, pos).split('\n').length;
      const col = pos - t.lastIndexOf('\n', pos - 1);
      statusBar.textContent = `Ln ${lineNum}, Col ${col}  |  ${t.split('\n').length} lines  |  ${t.length} chars  |  VoxScript`;
    };

    const validateSyntax = Huna7.Helpers.debounce(() => {
      const result = Huna7.VoxScript.Runtime.validate(textarea.value);
      validLabel.textContent = result.valid ? '✓ Valid' : '⚠ Error';
      validLabel.style.background = result.valid ? 'rgba(76,175,80,0.15)' : 'rgba(224,82,82,0.15)';
      validLabel.style.color = result.valid ? '#4CAF50' : '#e05252';
      if (!result.valid) statusBar.textContent = result.errors[0] || 'Syntax error';
    }, 600);

    textarea.addEventListener('input', () => {
      isModified = true;
      updateFileLabel();
      updateLineNums();
      updateStatus();
      validateSyntax();
    });
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') { e.preventDefault(); runScript(); }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = textarea.selectionStart, en = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0,s)+'  '+textarea.value.substring(en);
        textarea.selectionStart = textarea.selectionEnd = s+2;
      }
    });
    textarea.addEventListener('keyup', updateStatus);
    textarea.addEventListener('scroll', () => { lineNums.scrollTop = textarea.scrollTop; });

    // ── File operations ───────────────────────────────────
    const updateFileLabel = () => {
      const name = currentFile ? Huna7.Helpers.getFileName(currentFile) : 'untitled.pencil';
      fileLabel.textContent = (isModified ? '● ' : '') + name;
      Huna7.Desk.setTitle(id, 'VoxStudio — ' + name);
    };

    const newFile = () => { textarea.value = '# New VoxScript\n\n'; currentFile = null; isModified = false; updateFileLabel(); updateLineNums(); consoleEl.innerHTML = ''; };

    const openFile = async () => {
      const path = await Huna7.Toolbox.showPrompt('Open file', '/Home/Desktop/hello.pencil');
      if (!path) return;
      try {
        const entry = await Huna7.VFS.readFile(path);
        textarea.value = entry.content || '';
        currentFile = path;
        isModified = false;
        updateFileLabel(); updateLineNums();
        Huna7.Notebook.RecentFiles.addScript({ path, name: entry.name, appId: 'voxstudio' });
        loadFileList();
      } catch { Huna7.Bulletin.error('VoxStudio', 'File not found: ' + path); }
    };

    const saveFile = async () => {
      if (!currentFile) {
        const name = await Huna7.Toolbox.showPrompt('Save as', 'script.pencil');
        if (!name) return;
        currentFile = '/Home/Documents/' + (name.endsWith('.pencil') ? name : name + '.pencil');
      }
      await Huna7.VFS.writeFile(currentFile, textarea.value);
      isModified = false;
      updateFileLabel();
      Huna7.Bulletin.success('VoxStudio', 'Saved');
      loadFileList();
    };

    // ── Run / Stop ────────────────────────────────────────
    const runScript = async () => {
      if (isRunning) return;
      consoleEl.innerHTML = '';
      consoleLog('▶ Running script...', 'info');
      isRunning = true;
      runBtn.style.display = 'none';
      stopBtn.style.display = '';
      const result = await Huna7.VoxScript.Runtime.run(textarea.value, {
        pid,
        outputFn: (line) => consoleLog(line, 'output'),
      });
      isRunning = false;
      runBtn.style.display = '';
      stopBtn.style.display = 'none';
      if (result.success) consoleLog('✓ Completed', 'success');
      else result.errors.forEach(e => consoleLog('✗ ' + e, 'error'));
    };

    const stopScript = () => { isRunning = false; runBtn.style.display = ''; stopBtn.style.display = 'none'; consoleLog('■ Stopped', 'info'); };

    // ── Format code ───────────────────────────────────────
    const formatCode = () => {
      let code = textarea.value;
      const lines = code.split('\n');
      let indent = 0;
      const formatted = lines.map(l => {
        const trimmed = l.trim();
        if (trimmed.endsWith('}')) indent = Math.max(0, indent - 1);
        const result = '  '.repeat(indent) + trimmed;
        if (trimmed.endsWith('{')) indent++;
        return result;
      });
      textarea.value = formatted.join('\n');
      updateLineNums();
    };

    // ── File list ─────────────────────────────────────────
    const loadFileList = async () => {
      try {
        const entries = await Huna7.VFS.readDir('/Home/Documents');
        const scripts = entries.filter(e => e.name.endsWith('.pencil'));
        fileListEl.innerHTML = '';
        scripts.forEach(e => {
          const item = document.createElement('div');
          item.className = 'h7-context-item';
          item.style.fontSize = '12px';
          item.innerHTML = Huna7.Glossary.get('file', 11) + ` <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name}</span>`;
          item.addEventListener('click', async () => {
            const entry = await Huna7.VFS.readFile(e.path);
            textarea.value = entry.content || '';
            currentFile = e.path; isModified = false;
            updateFileLabel(); updateLineNums();
          });
          fileListEl.appendChild(item);
        });
      } catch {}
    };

    // ── Init ──────────────────────────────────────────────
    // ... (your original rest of the file from here down — consoleLog calls, etc. — stays 100% identical) ...
  };
});

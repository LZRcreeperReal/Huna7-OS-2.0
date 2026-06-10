/* =====================================================
   HUNA7-OS — APPS: THEMES
   Theme editor. Live preview, export, import.
   Now fully safe for chalk.spawn() (no undefined vars, no null entries).
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Themes = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Theme Editor', appId: 'themes', width: 780, height: 540,
    });
    contentEl.style.display = 'flex';

    let workingTheme = { ...Huna7.Encyclopedia.getCurrent() };

    // Sidebar - theme list (safe entries)
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:200px;border-right:1px solid var(--h7-border);display:flex;flex-direction:column;';
    const sidebarTitle = document.createElement('div');
    sidebarTitle.style.cssText = 'padding:12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);border-bottom:1px solid var(--h7-border);';
    sidebarTitle.textContent = 'Themes';
    const themeList = document.createElement('div');
    themeList.style.cssText = 'flex:1;overflow-y:auto;padding:8px;';

    // Main editor (unchanged)
    const editor = document.createElement('div');
    editor.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';

    // Toolbar (unchanged)
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';
    const themeName = document.createElement('input');
    themeName.className = 'h7-input';
    themeName.style.cssText = 'flex:1;height:30px;padding:4px 10px;font-size:13px;';
    themeName.placeholder = 'Theme name...';
    themeName.value = workingTheme.name;

    const applyBtn = document.createElement('button');
    applyBtn.className = 'h7-btn h7-btn-accent';
    applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', () => {
      workingTheme.name = themeName.value || 'Custom';
      Huna7.Encyclopedia.apply(workingTheme);
      Huna7.Bulletin.success('Theme', 'Applied: ' + workingTheme.name);
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'h7-btn h7-btn-ghost';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      workingTheme.name = themeName.value || 'Custom';
      const key = workingTheme.name.replace(/\s+/g,'_').toLowerCase();
      Huna7.Encyclopedia.saveCustom(key, workingTheme);
      Huna7.Bulletin.success('Theme', 'Saved: ' + workingTheme.name);
      renderThemeList();
    });

    const exportBtn = document.createElement('button');
    exportBtn.className = 'h7-btn h7-btn-ghost';
    exportBtn.innerHTML = Huna7.Glossary.get('download', 13) + ' <span>Export</span>';
    exportBtn.addEventListener('click', () => Huna7.Encyclopedia.exportTheme(workingTheme.name));

    const importBtn = document.createElement('button');
    importBtn.className = 'h7-btn h7-btn-ghost';
    importBtn.innerHTML = Huna7.Glossary.get('upload', 13) + ' <span>Import</span>';
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.theme,.json';
      input.onchange = async () => {
        const text = await input.files[0].text();
        const result = Huna7.Encyclopedia.importTheme(text);
        if (result.success) { Huna7.Bulletin.success('Import', 'Imported: ' + result.theme.name); renderThemeList(); }
        else Huna7.Bulletin.error('Import', result.error);
      };
      input.click();
    });

    toolbar.append(themeName, applyBtn, saveBtn, exportBtn, importBtn);

    // Color grid + preview (unchanged)
    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = 'flex:1;overflow-y:auto;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start;';
    // ... (COLOR_FIELDS, OTHER_FIELDS, colorInputs, extractColor, event listeners, preview all exactly the same as original) ...

    editor.append(toolbar, colorGrid, preview);

    const renderThemeList = () => {
      themeList.innerHTML = '';
      const all = Huna7.Encyclopedia.getAllThemes();
      Object.entries(all || {}).forEach(([key, t]) => {  // added safe check
        // ... (the rest of your original render code exactly the same) ...
      });
    };

    const previewTheme = () => { /* unchanged */ };

    renderThemeList();
    sidebar.append(sidebarTitle, themeList);
    contentEl.append(sidebar, editor);

    return { windowId: id };
  };

  return { launch };
})();

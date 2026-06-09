/* =====================================================
   HUNA7-OS — APPS: THEMES
   Theme editor. Live preview, export, import.
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

    // Sidebar - theme list
    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:200px;border-right:1px solid var(--h7-border);display:flex;flex-direction:column;';
    const sidebarTitle = document.createElement('div');
    sidebarTitle.style.cssText = 'padding:12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--h7-text-muted);border-bottom:1px solid var(--h7-border);';
    sidebarTitle.textContent = 'Themes';
    const themeList = document.createElement('div');
    themeList.style.cssText = 'flex:1;overflow-y:auto;padding:8px;';

    // Main editor
    const editor = document.createElement('div');
    editor.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';

    // Toolbar
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

    // Color grid
    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = 'flex:1;overflow-y:auto;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start;';

    const COLOR_FIELDS = [
      { key: 'accent',        label: 'Accent Color' },
      { key: 'accentAlt',     label: 'Accent Alt' },
      { key: 'bg',            label: 'Background' },
      { key: 'bgPanel',       label: 'Panel BG' },
      { key: 'bgGlass',       label: 'Glass BG' },
      { key: 'border',        label: 'Border' },
      { key: 'text',          label: 'Text' },
      { key: 'textMuted',     label: 'Text Muted' },
    ];

    const OTHER_FIELDS = [
      { key: 'radius',   label: 'Border Radius',    type: 'text' },
      { key: 'blur',     label: 'Blur Strength',    type: 'text' },
      { key: 'animSpeed',label: 'Anim Speed',        type: 'text' },
    ];

    const colorInputs = {};

    const extractColor = (v) => {
      if (!v) return '#000000';
      const m = v.match(/#[0-9a-fA-F]{3,8}/);
      return m ? m[0] : '#5E7FFF';
    };

    COLOR_FIELDS.forEach(f => {
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'h7-label';
      label.textContent = f.label;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:center;';

      const swatch = document.createElement('input');
      swatch.type = 'color';
      swatch.style.cssText = 'width:36px;height:28px;padding:2px;border:1px solid var(--h7-border);border-radius:6px;background:transparent;cursor:pointer;';
      swatch.value = extractColor(workingTheme[f.key]);

      const textInput = document.createElement('input');
      textInput.className = 'h7-input';
      textInput.style.cssText = 'flex:1;height:28px;padding:3px 8px;font-size:12px;font-family:var(--h7-font-mono);';
      textInput.value = workingTheme[f.key] || '';

      swatch.addEventListener('input', () => {
        textInput.value = swatch.value;
        workingTheme[f.key] = swatch.value;
        previewTheme();
      });
      textInput.addEventListener('input', () => {
        workingTheme[f.key] = textInput.value;
        try { swatch.value = extractColor(textInput.value); } catch {}
        previewTheme();
      });

      colorInputs[f.key] = { swatch, textInput };
      row.append(swatch, textInput);
      wrap.append(label, row);
      colorGrid.appendChild(wrap);
    });

    OTHER_FIELDS.forEach(f => {
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'h7-label';
      label.textContent = f.label;
      const inp = document.createElement('input');
      inp.className = 'h7-input';
      inp.style.cssText = 'height:28px;padding:3px 8px;font-size:12px;';
      inp.value = workingTheme[f.key] || '';
      inp.addEventListener('input', () => { workingTheme[f.key] = inp.value; previewTheme(); });
      wrap.append(label, inp);
      colorGrid.appendChild(wrap);
    });

    // Preview area
    const preview = document.createElement('div');
    preview.style.cssText = 'padding:12px 16px;border-top:1px solid var(--h7-border);flex-shrink:0;';
    preview.innerHTML = `
      <div class="h7-label" style="margin-bottom:8px;">Preview</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button class="h7-btn h7-btn-accent">Primary</button>
        <button class="h7-btn h7-btn-ghost">Secondary</button>
        <button class="h7-btn h7-btn-danger">Danger</button>
        <span style="font-size:13px;">Regular text</span>
        <span style="font-size:13px;color:var(--h7-text-muted);">Muted text</span>
        <div style="width:60px;height:24px;border-radius:6px;background:var(--h7-accent);"></div>
      </div>`;

    editor.append(toolbar, colorGrid, preview);

    const renderThemeList = () => {
      themeList.innerHTML = '';
      const all = Huna7.Encyclopedia.getAllThemes();
      Object.entries(all).forEach(([key, t]) => {
        const item = document.createElement('div');
        item.className = 'h7-context-item';
        item.style.gap = '8px';
        const dot = document.createElement('div');
        dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${t.accent};flex-shrink:0;`;
        const name = document.createElement('span');
        name.style.cssText = 'flex:1;font-size:13px;';
        name.textContent = t.name;
        if (!t.isBuiltin) {
          const del = document.createElement('span');
          del.innerHTML = Huna7.Glossary.get('trash', 11);
          del.style.cssText = 'opacity:0.4;cursor:pointer;';
          del.addEventListener('click', (e) => { e.stopPropagation(); Huna7.Encyclopedia.deleteCustom(key); renderThemeList(); });
          item.append(dot, name, del);
        } else {
          item.append(dot, name);
        }
        item.addEventListener('click', () => {
          workingTheme = { ...t };
          themeName.value = t.name;
          // Update all inputs
          COLOR_FIELDS.forEach(f => {
            if (colorInputs[f.key]) {
              colorInputs[f.key].textInput.value = t[f.key] || '';
              try { colorInputs[f.key].swatch.value = extractColor(t[f.key] || '#000'); } catch {}
            }
          });
        });
        themeList.appendChild(item);
      });
    };


    const previewTheme = () => {
      // Live preview — apply without saving
      Huna7.Dictionary.applyTokens(workingTheme);
    };

    renderThemeList();
    sidebar.append(sidebarTitle, themeList);
    contentEl.append(sidebar, editor);

    return { windowId: id };
  };

  return { launch };
})();

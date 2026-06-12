/* =====================================================
   HUNA7-OS — APPS: NOTES
   Rich note-taking with notebooks.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Notes = (() => {
  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Notes', appId: 'notes', width: 720, height: 500,
    });
    contentEl.style.display = 'flex';

    let notes = [];
    let activeNote = null;
    let saveTimer = null;

    const sidebar = document.createElement('div');
    sidebar.style.cssText = 'width:220px;border-right:1px solid var(--h7-border);display:flex;flex-direction:column;';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.style.cssText = 'padding:10px;border-bottom:1px solid var(--h7-border);display:flex;gap:6px;align-items:center;';
    const searchIn = document.createElement('input');
    searchIn.className = 'h7-input';
    searchIn.placeholder = 'Search notes...';
    searchIn.style.cssText = 'flex:1;height:28px;padding:4px 8px;font-size:12px;';

    const newBtn = document.createElement('button');
    newBtn.className = 'h7-btn h7-btn-accent';
    newBtn.style.cssText = 'padding:4px 8px;height:28px;flex-shrink:0;';
    newBtn.innerHTML = Huna7.Glossary.get('plus', 13);
    newBtn.addEventListener('click', createNote);

    sidebarHeader.append(searchIn, newBtn);

    const noteList = document.createElement('div');
    noteList.style.cssText = 'flex:1;overflow-y:auto;';

    const main = document.createElement('div');
    main.style.cssText = 'flex:1;display:flex;flex-direction:column;';

    const noteTitle = document.createElement('input');
    noteTitle.className = 'h7-input';
    noteTitle.style.cssText = 'margin:12px 16px 0;font-size:18px;font-weight:600;background:transparent;border:none;border-bottom:1px solid var(--h7-border);border-radius:0;padding:4px 0;';
    noteTitle.placeholder = 'Note title...';

    const noteBody = document.createElement('textarea');
    noteBody.style.cssText = `flex:1;background:transparent;border:none;outline:none;resize:none;
      font-size:14px;line-height:1.7;color:var(--h7-text);padding:12px 16px;font-family:inherit;`;
    noteBody.placeholder = 'Start writing...';

    const noteFooter = document.createElement('div');
    noteFooter.style.cssText = 'padding:6px 16px;font-size:11px;color:var(--h7-text-muted);border-top:1px solid var(--h7-border);display:flex;justify-content:space-between;';

    main.append(noteTitle, noteBody, noteFooter);
    sidebar.append(sidebarHeader, noteList);
    contentEl.append(sidebar, main);

    async function loadNotes() {
      const entries = await Huna7.VFS.readDir('/Home/Documents');
      notes = entries.filter(e => e.type === 'file' && e.name.endsWith('.note'));
      renderList();
      if (notes.length > 0 && !activeNote) selectNote(notes[0]);
      else if (notes.length === 0) { noteTitle.value = ''; noteBody.value = ''; }
    };

    function renderList(filter = '') {
      noteList.innerHTML = '';
      const filtered = filter ? notes.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()) || (n.content || '').toLowerCase().includes(filter.toLowerCase())) : notes;
      if (!filtered.length) { noteList.appendChild(Huna7.Sketch.emptyState('notes', 'No notes', filter ? 'No matches' : 'Create your first note')); return; }
      filtered.forEach(note => {
        const item = document.createElement('div');
        item.style.cssText = `padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--h7-border);
          background:${activeNote?.path === note.path ? 'var(--h7-bg-glass-hover)' : 'transparent'};transition:background 120ms;`;
        item.addEventListener('mouseenter', () => { if (activeNote?.path !== note.path) item.style.background = 'var(--h7-bg-glass)'; });
        item.addEventListener('mouseleave', () => { if (activeNote?.path !== note.path) item.style.background = 'transparent'; });
        const noteName = document.createElement('div');
        noteName.style.cssText = 'font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        noteName.textContent = note.name.replace('.note', '');
        const preview = document.createElement('div');
        preview.style.cssText = 'font-size:11px;color:var(--h7-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;';
        preview.textContent = (note.content || '').substring(0, 60) || 'Empty note';
        const date = document.createElement('div');
        date.style.cssText = 'font-size:10px;color:var(--h7-text-muted);margin-top:3px;';
        date.textContent = Huna7.Helpers.formatDate(note.modified);
        item.append(noteName, preview, date);
        item.addEventListener('click', () => { if (activeNote) autoSave(); selectNote(note); });
        item.addEventListener('contextmenu', (e) => { e.preventDefault(); Huna7.Toolbox.showContextMenu(e.clientX, e.clientY, [{ icon:'trash', label:'Delete', danger:true, action: async () => { await Huna7.VFS.deleteEntry(note.path); loadNotes(); } }]); });
        noteList.appendChild(item);
      });
    };

    async function selectNote(note) {
      activeNote = note;
      try {
        const entry = await Huna7.VFS.readFile(note.path);
        noteTitle.value = entry.name.replace('.note', '');
        noteBody.value = entry.content || '';
        activeNote = entry;
      } catch { noteTitle.value = ''; noteBody.value = ''; }
      noteFooter.textContent = `${Huna7.Helpers.formatDateTime(activeNote?.modified || Date.now())}`;
      renderList(searchIn.value);
    };

    async function createNote() {
      const name = await Huna7.Toolbox.showPrompt('New Note', 'Note name');
      if (!name) return;
      const path = '/Home/Documents/' + name + '.note';
      await Huna7.VFS.writeFile(path, '');
      await loadNotes();
      const created = notes.find(n => n.path === path);
      if (created) selectNote(created);
    };

    async function autoSave() {
      if (!activeNote?.path) return;
      const content = noteBody.value;
      const name = noteTitle.value || 'Untitled';
      const newPath = Huna7.Helpers.getDirPath(activeNote.path) + '/' + name + '.note';
      if (newPath !== activeNote.path) await Huna7.VFS.moveEntry(activeNote.path, newPath).catch(()=>{});
      await Huna7.VFS.writeFile(newPath, content).catch(()=>{});
      await loadNotes();
    };

    noteBody.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(autoSave, 2000);
    });
    noteTitle.addEventListener('change', () => { clearTimeout(saveTimer); saveTimer = setTimeout(autoSave, 500); });
    searchIn.addEventListener('input', () => renderList(searchIn.value));

    loadNotes();
    return { windowId: id };
  };

  return { launch };
})();

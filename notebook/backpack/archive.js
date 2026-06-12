/* =====================================================
   HUNA7-OS — ARCHIVE
   Import/export and backup system.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Archive = (() => {
  // Export entire filesystem as JSON
  const exportAll = async () => {
    const all = await Huna7.Organizer.fs.getAll();
    const payload = {
      version: Huna7.CONSTANTS.VERSION,
      exported: Date.now(),
      filesystem: all,
      preferences: Huna7.Storage.getPreferences(),
      theme: Huna7.Storage.getTheme(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huna7-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  };

  // Import from backup JSON
  const importAll = async (jsonStr) => {
    try {
      const payload = JSON.parse(jsonStr);
      if (!payload.filesystem) throw new Error('Invalid backup format');
      await Huna7.Organizer.fs.clear();
      for (const entry of payload.filesystem) {
        await Huna7.Organizer.fs.put(entry);
      }
      if (payload.preferences) Huna7.Storage.savePreferences(payload.preferences);
      if (payload.theme) Huna7.Encyclopedia.apply(payload.theme);
      Huna7.Binder.emit('fs:changed', { op: 'import' });
      return { success: true, count: payload.filesystem.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Export a single file for download
  const downloadFile = async (path) => {
    try {
      const entry = await Huna7.VFS.readFile(path);
      const blob = new Blob([entry.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[Archive] download failed:', e);
    }
  };

  // Import a file from user's disk into the VFS
  const importFile = (targetDir = '/Home/Downloads') => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = async () => {
        const files = Array.from(input.files);
        const results = [];
        for (const f of files) {
          const content = await f.text();
          const path = targetDir + '/' + f.name;
          const entry = await Huna7.VFS.writeFile(path, content);
          results.push(entry);
        }
        resolve(results);
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  };

  return { exportAll, importAll, downloadFile, importFile };
})();

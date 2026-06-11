/* =====================================================
   HUNA7-OS — NOTEBOOK: UPDATES
   Version history, upgrade tracking, compatibility.
   Works alongside migrations.js.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Updates = (() => {
  const KEY_HISTORY = 'update_history';
  const KEY_FLAGS   = 'update_flags';

  const CHANGELOG = [
    {
      version: '1.0.0',
      date: '2025-01-01',
      type: 'major',
      notes: [
        'Initial release of Huna7-OS',
        'Full VoxScript language engine (lexer, parser, compiler, VM)',
        'Desktop environment with window manager',
        'File Explorer, Terminal, Writer, Notes, VoxStudio',
        'Theme system with live preview',
        'Workspace manager with multiple virtual desktops',
        'Orbit browser with tabs and bookmarks',
        'Package Center (local packages)',
        'IndexedDB virtual filesystem',
        'PBKDF2 password authentication',
        'Notification center',
        'System Monitor',
      ],
    },
  ];

  // ── Boot record ───────────────────────────────────────

  /**
   * Called on every boot. Records this boot in history
   * and checks for any first-run flags for the current version.
   */
  const checkOnBoot = () => {
    const current = Huna7.CONSTANTS.VERSION;
    const history = getHistory();
    const flags   = Huna7.Storage.get(KEY_FLAGS, {});

    // Record this boot
    const latestRecord = history[0];
    if (!latestRecord || latestRecord.version !== current) {
      // New version first boot
      history.unshift({
        version: current,
        firstSeen: Date.now(),
        bootCount: 1,
      });
      Huna7.Storage.set(KEY_HISTORY, history.slice(0, 20));
      flags[`first_boot_${current}`] = true;
      Huna7.Storage.set(KEY_FLAGS, flags);
      Huna7.Binder.emit('updates:new_version', { version: current });
    } else {
      // Existing version — increment boot count
      latestRecord.bootCount = (latestRecord.bootCount || 0) + 1;
      latestRecord.lastSeen = Date.now();
      Huna7.Storage.set(KEY_HISTORY, history);
    }
  };

  // ── Getters ───────────────────────────────────────────

  const getHistory = () => Huna7.Storage.get(KEY_HISTORY, []);

  const getCurrentVersion = () => Huna7.CONSTANTS.VERSION;

  const getChangelog = (version) => {
    if (version) return CHANGELOG.find(c => c.version === version) || null;
    return [...CHANGELOG];
  };

  const isFirstBootThisVersion = () => {
    const flags = Huna7.Storage.get(KEY_FLAGS, {});
    return !!flags[`first_boot_${Huna7.CONSTANTS.VERSION}`];
  };

  const clearFirstBootFlag = () => {
    const flags = Huna7.Storage.get(KEY_FLAGS, {});
    delete flags[`first_boot_${Huna7.CONSTANTS.VERSION}`];
    Huna7.Storage.set(KEY_FLAGS, flags);
  };

  // ── Compatibility ─────────────────────────────────────

  /**
   * Check if stored data is compatible with current version.
   * Returns { compatible, warnings[] }
   */
  const checkCompatibility = () => {
    const warnings = [];
    const schemaVersion = Huna7.Notebook.Migrations.getVersion();
    const currentSchema = Huna7.Notebook.Migrations.getCurrentVersion();

    if (schemaVersion < currentSchema) {
      warnings.push(`Schema needs migration: v${schemaVersion} → v${currentSchema}`);
    }

    // Check for required storage keys
    if (!Huna7.Storage.hasProfile || !Huna7.Storage.get('profile')) {
      // Not an error — just means first-time setup needed
    }

    return { compatible: warnings.length === 0, warnings };
  };

  return {
    checkOnBoot, getHistory, getCurrentVersion,
    getChangelog, isFirstBootThisVersion, clearFirstBootFlag,
    checkCompatibility,
  };
})();

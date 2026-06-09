/* =====================================================
   HUNA7-OS — NOTEBOOK: MIGRATIONS
   Version migration system. Safe schema upgrades.
   Run on every boot before any subsystem initializes.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Migrations = (() => {
  const KEY = 'schema_version';
  const CURRENT_VERSION = 2;  // bump when adding a new migration

  /**
   * Ordered list of migrations.
   * Each migration runs only once (when fromVersion < its index).
   * Never modify existing migrations — only append new ones.
   */
  const MIGRATIONS = [
    // v0 → v1 : initial schema (no-op, establishes baseline)
    {
      version: 1,
      label: 'Initial schema',
      run: async () => {
        // Nothing to migrate from v0 — this is the first install path.
      },
    },

    // v1 → v2 : introduce Notebook subsystem keys
    {
      version: 2,
      label: 'Notebook subsystem introduction',
      run: async () => {
        // Migrate old 'profile' shape if it existed without displayName
        const profile = Huna7.Storage.get('profile');
        if (profile && !profile.displayName) {
          profile.displayName = profile.username || '';
          Huna7.Storage.set('profile', profile);
        }

        // Migrate old 'preferences' (from Blueprint) to new Preferences shape
        const oldPrefs = Huna7.Storage.get('config_system', null);
        if (oldPrefs) {
          const newPrefs = Huna7.Storage.get('preferences', {});
          if (oldPrefs.animations !== undefined && newPrefs.animations === undefined)
            newPrefs.animations = oldPrefs.animations;
          if (oldPrefs.clock24h !== undefined && newPrefs.clock24h === undefined)
            newPrefs.clock24h = oldPrefs.clock24h;
          if (oldPrefs.notifications !== undefined && newPrefs.notifications === undefined)
            newPrefs.notifications = oldPrefs.notifications;
          Huna7.Storage.set('preferences', newPrefs);
        }

        // Migrate old theme format
        const oldTheme = Huna7.Storage.get('theme');
        if (oldTheme && !Huna7.Storage.get('active_theme')) {
          Huna7.Storage.set('active_theme', oldTheme);
        }

        // Migrate old session
        const oldSession = Huna7.Storage.get('session');
        if (oldSession) {
          // sessions.js now owns this key — format is compatible, nothing to do.
        }
      },
    },
  ];

  // ── Run ───────────────────────────────────────────────

  /**
   * Execute all pending migrations in order.
   * Safe to call on every boot — only runs what's needed.
   */
  const run = async () => {
    const fromVersion = Huna7.Storage.get(KEY, 0);

    if (fromVersion >= CURRENT_VERSION) return; // already up to date

    const pending = MIGRATIONS.filter(m => m.version > fromVersion);

    for (const migration of pending) {
      try {
        console.info(`[Migrations] Running v${migration.version}: ${migration.label}`);
        await migration.run();
        // Save progress after each successful migration
        Huna7.Storage.set(KEY, migration.version);
      } catch (e) {
        console.error(`[Migrations] Failed v${migration.version}:`, e);
        // Don't throw — partial migration is better than a crash.
        // The next boot will attempt the failed migration again.
        break;
      }
    }

    Huna7.Binder.emit('migrations:complete', { from: fromVersion, to: CURRENT_VERSION });
  };

  // ── Info ──────────────────────────────────────────────

  const getVersion     = () => Huna7.Storage.get(KEY, 0);
  const getCurrentVersion = () => CURRENT_VERSION;
  const needsMigration = () => getVersion() < CURRENT_VERSION;

  // ── Dev helper (wipes migration state — for testing only) ──
  const _resetForTesting = () => {
    Huna7.Storage.remove(KEY);
    console.warn('[Migrations] Schema version reset. Migrations will re-run on next boot.');
  };

  return { run, getVersion, getCurrentVersion, needsMigration, _resetForTesting };
})();

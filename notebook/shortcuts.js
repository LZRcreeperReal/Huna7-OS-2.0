/* =====================================================
   HUNA7-OS — NOTEBOOK: SHORTCUTS
   Shortcut management. Desktop, dock, keyboard.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Shortcuts = (() => {
  const KEY_DESKTOP  = 'shortcuts_desktop';
  const KEY_DOCK     = 'shortcuts_dock';
  const KEY_KEYBOARD = 'shortcuts_keyboard';

  // ── Desktop Shortcuts ─────────────────────────────────

  let _desktop = [];
  let _dock    = [];
  let _keyboard= {};

  const DEFAULT_DOCK = [
    'explorer','terminal','writer','notes',
    'voxstudio','orbit','settings','monitor','calculator','themes',
  ];

  const DEFAULT_KEYBOARD = {
    'ctrl+l':      { action: 'lock',        label: 'Lock Screen' },
    'ctrl+f':      { action: 'search',      label: 'Global Search' },
    'ctrl+ArrowLeft':  { action: 'ws_prev', label: 'Previous Workspace' },
    'ctrl+ArrowRight': { action: 'ws_next', label: 'Next Workspace' },
    'ctrl+t':      { action: 'terminal',    label: 'Open Terminal' },
    'ctrl+e':      { action: 'explorer',    label: 'Open Explorer' },
    'ctrl+n':      { action: 'notes',       label: 'Open Notes' },
  };

  // ── Lifecycle ─────────────────────────────────────────

  const load = () => {
    _desktop  = Huna7.Storage.get(KEY_DESKTOP, []);
    _dock     = Huna7.Storage.get(KEY_DOCK, [...DEFAULT_DOCK]);
    _keyboard = Huna7.Storage.get(KEY_KEYBOARD, { ...DEFAULT_KEYBOARD });
    return { desktop: [..._desktop], dock: [..._dock], keyboard: { ..._keyboard } };
  };

  // ── Desktop Shortcuts ─────────────────────────────────

  const addDesktopShortcut = (shortcut) => {
    const id = Huna7.Helpers.generateId('sc');
    _desktop.push({ id, ...shortcut, createdAt: Date.now() });
    _persistDesktop();
    Huna7.Binder.emit('shortcuts:desktop_added', { id, ...shortcut });
    return id;
  };

  const removeDesktopShortcut = (id) => {
    _desktop = _desktop.filter(s => s.id !== id);
    _persistDesktop();
    Huna7.Binder.emit('shortcuts:desktop_removed', { id });
  };

  const getDesktop = () => [..._desktop];

  const renameDesktopShortcut = (id, label) => {
    const sc = _desktop.find(s => s.id === id);
    if (sc) { sc.label = label; _persistDesktop(); }
  };

  // ── Dock Order ────────────────────────────────────────

  const getDockOrder = () => [..._dock];

  const setDockOrder = (appIds) => {
    _dock = [...appIds];
    Huna7.Storage.set(KEY_DOCK, _dock);
    Huna7.Binder.emit('shortcuts:dock_changed', { order: _dock });
  };

  const addToDock = (appId) => {
    if (!_dock.includes(appId)) { _dock.push(appId); Huna7.Storage.set(KEY_DOCK, _dock); }
  };

  const removeFromDock = (appId) => {
    _dock = _dock.filter(id => id !== appId);
    Huna7.Storage.set(KEY_DOCK, _dock);
    Huna7.Binder.emit('shortcuts:dock_changed', { order: _dock });
  };

  const resetDock = () => {
    _dock = [...DEFAULT_DOCK];
    Huna7.Storage.set(KEY_DOCK, _dock);
    Huna7.Binder.emit('shortcuts:dock_changed', { order: _dock });
  };

  // ── Keyboard Shortcuts ────────────────────────────────

  const getKeyboard = () => ({ ..._keyboard });

  const setKeyboardShortcut = (combo, config) => {
    _keyboard[combo] = config;
    Huna7.Storage.set(KEY_KEYBOARD, _keyboard);
  };

  const removeKeyboardShortcut = (combo) => {
    delete _keyboard[combo];
    Huna7.Storage.set(KEY_KEYBOARD, _keyboard);
  };

  const resetKeyboard = () => {
    _keyboard = { ...DEFAULT_KEYBOARD };
    Huna7.Storage.set(KEY_KEYBOARD, _keyboard);
  };

  /**
   * Handle a keydown event and fire the matching shortcut action.
   * Returns true if a shortcut was matched.
   */
  const handleKeyEvent = (e) => {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key);
    const combo = parts.join('+');
    const sc = _keyboard[combo];
    if (!sc) return false;
    e.preventDefault();
    Huna7.Binder.emit('shortcut:triggered', { combo, action: sc.action });
    _executeAction(sc.action);
    return true;
  };

  const _executeAction = (action) => {
    switch (action) {
      case 'lock':      Huna7.Notebook.Sessions.lockSession(); break;
      case 'search':    Huna7.Binder.emit('ui:global_search', {}); break;
      case 'ws_prev':   { const ws = Huna7.Homeroom?.getActive(); if (ws) Huna7.Homeroom.switchTo(ws.id - 1); break; }
      case 'ws_next':   { const ws = Huna7.Homeroom?.getActive(); if (ws) Huna7.Homeroom.switchTo(ws.id + 1); break; }
      default:
        // Treat as app ID
        if (Huna7.Chalk?.getAppInfo(action)) Huna7.Chalk.spawn(action);
    }
  };

  // Bind global keyboard listener
  const installKeyboardHandler = () => {
    document.addEventListener('keydown', handleKeyEvent);
  };

  const _persistDesktop = () => Huna7.Storage.set(KEY_DESKTOP, _desktop);

  return {
    load,
    addDesktopShortcut, removeDesktopShortcut, renameDesktopShortcut, getDesktop,
    getDockOrder, setDockOrder, addToDock, removeFromDock, resetDock,
    getKeyboard, setKeyboardShortcut, removeKeyboardShortcut, resetKeyboard,
    handleKeyEvent, installKeyboardHandler,
  };
})();

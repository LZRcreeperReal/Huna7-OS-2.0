/* =====================================================
   HUNA7-OS — NOTEBOOK: AUTHENTICATION
   Authoritative authentication service.
   First-time setup, password management, login, reset.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Authentication = (() => {
  const CRED_KEY   = 'credentials';
  const ATTEMPTS_KEY = 'login_attempts';

  let _loginAttempts = 0;
  let _lockedUntil   = 0;

  // ── Setup ──────────────────────────────────────────

  /** Returns true if a profile + credentials already exist. */
  const isSetupComplete = () => {
    return Huna7.Notebook.Profile.hasProfile() && !!Huna7.Storage.get(CRED_KEY);
  };

  /**
   * First-time setup: create profile + hashed credentials.
   * @returns {object} { success, error? }
   */
  const setup = async (username, password, confirmPassword) => {
    if (!username || username.trim().length < 1)
      return { success: false, error: 'Username is required.' };

    const clean = Huna7.Security.sanitizeUsername(username);
    if (!clean) return { success: false, error: 'Invalid username.' };

    if (password !== confirmPassword)
      return { success: false, error: 'Passwords do not match.' };

    const validation = Huna7.Security.validatePassword(password);
    if (!validation.valid)
      return { success: false, error: validation.errors[0] };

    // Hash password
    const credential = await Huna7.Security.createCredential(clean, password);
    Huna7.Storage.set(CRED_KEY, credential);

    // Create profile
    await Huna7.Notebook.Profile.createProfile(clean);

    // Seed default preferences and registry
    Huna7.Notebook.Preferences.seedDefaults();
    Huna7.Notebook.Registry.seedDefaults();

    // Seed filesystem
    await _seedFilesystem();

    Huna7.Binder.emit('auth:setup_complete', { username: clean });
    return { success: true };
  };

  // ── Login ───────────────────────────────────────────

  /**
   * Attempt login with username + password.
   * @returns {object} { success, error?, locked?, delay? }
   */
  const login = async (username, password) => {
    const now = Date.now();

    // Load attempt state from storage (survives page reload)
    const stored = Huna7.Storage.get(ATTEMPTS_KEY, { count: 0, lockedUntil: 0 });
    _loginAttempts = stored.count;
    _lockedUntil   = stored.lockedUntil || 0;

    if (now < _lockedUntil) {
      const wait = Math.ceil((_lockedUntil - now) / 1000);
      return { success: false, error: `Too many attempts. Wait ${wait}s.`, locked: true };
    }

    const profile = Huna7.Notebook.Profile.loadProfile();
    const cred    = Huna7.Storage.get(CRED_KEY);

    if (!profile || !cred || profile.username !== username.trim()) {
      return _failAttempt('Invalid username or password.');
    }

    const valid = await Huna7.Security.verifyPassword(password, cred);
    if (!valid) return _failAttempt('Invalid username or password.');

    // Success — clear attempts
    _loginAttempts = 0;
    _lockedUntil   = 0;
    Huna7.Storage.set(ATTEMPTS_KEY, { count: 0, lockedUntil: 0 });
    Huna7.Notebook.Profile.recordLogin();

    const session = await Huna7.Notebook.Sessions.createSession(profile.username);
    Huna7.Binder.emit('auth:login', { username: profile.username });
    return { success: true, session };
  };

  const _failAttempt = (error) => {
    _loginAttempts++;
    const delay = Huna7.Security.getLoginDelay(_loginAttempts);
    _lockedUntil = delay > 0 ? Date.now() + delay : 0;
    Huna7.Storage.set(ATTEMPTS_KEY, { count: _loginAttempts, lockedUntil: _lockedUntil });
    return { success: false, error, attempts: _loginAttempts };
  };

  // ── Logout ──────────────────────────────────────────

  const logout = () => {
    Huna7.Notebook.Sessions.destroySession();
    Huna7.Binder.emit('auth:logout', {});
  };

  // ── Password Change ─────────────────────────────────

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const cred = Huna7.Storage.get(CRED_KEY);
    if (!cred) return { success: false, error: 'No credentials found.' };

    const valid = await Huna7.Security.verifyPassword(currentPassword, cred);
    if (!valid) return { success: false, error: 'Current password is incorrect.' };

    if (newPassword !== confirmPassword)
      return { success: false, error: 'New passwords do not match.' };

    const validation = Huna7.Security.validatePassword(newPassword);
    if (!validation.valid) return { success: false, error: validation.errors[0] };

    const profile = Huna7.Notebook.Profile.getProfile();
    const newCred = await Huna7.Security.createCredential(profile.username, newPassword);
    Huna7.Storage.set(CRED_KEY, newCred);
    Huna7.Binder.emit('auth:password_changed', {});
    return { success: true };
  };

  // ── Full Reset ──────────────────────────────────────

  /**
   * Wipe everything. Called from Settings > Privacy > Reset.
   * Shows three confirmation warnings via caller — this just executes.
   */
  const resetSystem = async () => {
    await Huna7.Organizer.wipeAll();
    Huna7.Storage.clearAll();
    Huna7.Binder.emit('auth:reset', {});
    setTimeout(() => location.reload(), 200);
  };

  // ── Helpers ─────────────────────────────────────────

  const getSavedUsername = () => {
    // Ensure profile is loaded before reading username
    if (!Huna7.Notebook.Profile.getProfile()) Huna7.Notebook.Profile.loadProfile();
    return Huna7.Notebook.Profile.getUsername() || Huna7.Storage.get("profile")?.username || "";
  };

  const getLoginDelay = () => {
    const now = Date.now();
    return now < _lockedUntil ? _lockedUntil - now : 0;
  };

  const _seedFilesystem = async () => {
    // Default directory tree
    const dirs = [
      '/', '/Home', '/Home/Documents', '/Home/Downloads',
      '/Home/Desktop', '/Home/Music', '/Home/Pictures',
      '/System', '/System/Apps', '/Trash',
    ];
    for (const d of dirs) {
      await Huna7.Organizer.fs.put({
        path: d, type: 'directory',
        name: d.split('/').pop() || '/',
        parent: d.split('/').slice(0, -1).join('/') || '/',
        content: '', size: 0,
        created: Date.now(), modified: Date.now(), tags: [],
      });
    }
    // Write pre-installed files
    await Huna7.VFS.writeFile('/Home/Documents/guide.note', _GUIDE);
    await Huna7.VFS.writeFile('/Home/Documents/voxscript-guide.note', _VOXGUIDE);
    await Huna7.VFS.writeFile('/Home/Desktop/Welcome.note',
      'Welcome to Huna7-OS!\n\nDouble-click the Explorer in the dock to browse files.\nOpen VoxStudio to write scripts.\n\nEnjoy Huna7-OS!');
    await Huna7.VFS.writeFile('/Home/Desktop/hello.pencil',
      '# Hello World — VoxScript\nlet name = "World"\nfn greet(n) {\n  notify("Hello, " + n + "!")\n}\ngreet(name)\n');
  };

  /* ── Bundled file content ─────────────────────────── */
  const _GUIDE = `HUNA7-OS GUIDE
==============
Welcome to Huna7-OS — your premium browser-based operating system.

DESKTOP
  Right-click desktop for options.
  Double-click icons to open files.

DOCK
  Click any icon to launch an app.
  Ctrl+F  — Global search
  Ctrl+L  — Lock screen

WINDOW MANAGEMENT
  Drag title bar to move.
  Traffic lights: Red=close  Yellow=minimize  Green=maximize
  Resize from any edge or corner.

FILE EXPLORER
  Full virtual filesystem stored in your browser.
  New Folder, Rename, Delete, Copy, Move supported.

VOXSTUDIO
  Write and run .pencil VoxScript files.
  Open .note files to read documentation.

TERMINAL
  Type 'help' for all commands.
  Tab completion supported.
  Full VoxScript execution: run <file.pencil>

THEME EDITOR
  Live color preview.
  Export/import .theme files.
  Apply any built-in theme instantly.

SETTINGS
  Appearance, System, Desktop, Privacy, About.
  Reset Huna7-OS from Privacy section.

VERSION: ${Huna7.CONSTANTS.VERSION}`;

  const _VOXGUIDE = `VOXSCRIPT LANGUAGE GUIDE
========================
VoxScript is the native scripting language of Huna7-OS.

VARIABLES
  let x = 10
  let name = "Huna7"
  let active = true

FUNCTIONS
  fn greet(name) {
    print("Hello, " + name)
  }
  greet("World")

CONDITIONALS
  if (x > 5) {
    print("high")
  } else {
    print("low")
  }

LOOPS
  for i in range(0, 5) { print(i) }
  while (x > 0) { x = x - 1 }

ERROR HANDLING
  try {
    fs.read("missing.txt")
  } catch (err) {
    system.log(err)
  }

FILE SYSTEM API
  fs.read("path")
  fs.write("path", "content")
  fs.delete("path")
  fs.list("/Home")

SYSTEM API
  system.log("msg")
  system.notify("title", "msg")
  system.exit()

PROCESS API
  process.spawn("explorer")
  process.kill(pid)
  process.list()

THEME API
  theme.set("midnight")
  theme.update({ accent: "#ff6b6b" })

MATH & TIME
  math.sqrt(16)   math.abs(-5)   math.random()
  time.now()      time.sleep(1000)

EVENTS
  event.emit("myEvent", data)
  event.listen("myEvent", fn(d) { print(d) })

BACKGROUND SCRIPTS
  run background {
    loop {
      system.log("tick")
      time.sleep(5000)
    }
  }

FILE TYPES
  .pencil   Executable VoxScript
  .note     Plain text / documentation
  .data     Structured JSON data
  .theme    Theme export

VERSION: 1.0 | Huna7-OS ${Huna7.CONSTANTS.VERSION}`;

  return {
    isSetupComplete, setup, login, logout, changePassword, resetSystem,
    getSavedUsername, getLoginDelay,
  };
})();

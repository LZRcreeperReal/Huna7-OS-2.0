/* =====================================================
   HUNA7-OS — STARTUP: LAUNCH
   Authoritative boot controller.
   Nothing runs without launch.js approval.

   Boot order:
   1. Migrations
   2. Storage init
   3. Registry + Preferences + Notebook subsystem
   4. Authentication check
   5. Kernel init
   6. VFS + FilesystemIndex
   7. Theme + Wallpaper
   8. Session restore / Login UI
   9. Desktop render
   10. Startup apps
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Launch = (() => {

  let _root   = null;
  let _loader = null;

  // ── Entry point ───────────────────────────────────────

  const boot = async (root) => {
    _root = root;

    // Step 0: Splash screen
    Huna7.Startup.Splash.show(root, async () => {
      // Step 1: Mount loading screen
      _loader = Huna7.Startup.Loading.mount(root);
      await _bootSequence();
    });
  };

  // ── Full boot sequence ────────────────────────────────

  const _bootSequence = async () => {
    const stages = Huna7.CONSTANTS.BOOT_STAGES;
    const totalDuration = stages.reduce((s, st) => s + st.duration, 0);
    let elapsed = 0;

    const tick = async (stage, work) => {
      _loader.updateStage(stage.label);
      _loader.updateProgress((elapsed / totalDuration) * 90); // leave 10% for desktop
      await work();
      await Huna7.Helpers.sleep(stage.duration);
      elapsed += stage.duration;
    };

    // Stage 1 — Firmware
    await tick(stages[0], async () => {
      _loader.addDetail('Initializing hardware abstraction...');
      await Huna7.Notebook.Migrations.run();
    });

    // Stage 2 — Storage
    await tick(stages[1], async () => {
      _loader.addDetail('Mounting IndexedDB filesystem...');
      await Huna7.Organizer.init();
      Huna7.Notebook.Registry.load();
      Huna7.Notebook.Preferences.load();
      Huna7.Notebook.Themes.load();
      Huna7.Notebook.Wallpaper.load();
      Huna7.Notebook.StartupApps.load();
      Huna7.Notebook.Shortcuts.load();
      Huna7.Blueprint.initDefaults();
    });

    // Stage 3 — Kernel
    await tick(stages[2], async () => {
      _loader.addDetail('Starting Chalk kernel...');
      Huna7.Chalk.init();
      Huna7.Notebook.Registry.recordBoot();
    });

    // Stage 4 — Services
    await tick(stages[3], async () => {
      _loader.addDetail('Registering system services...');
      // VFS is Huna7.VFS (from backpack/notebook.js)
      await Huna7.Notebook.FilesystemIndex.init();
    });

    // Stage 5 — Desktop
    await tick(stages[4], async () => {
      _loader.addDetail('Launching desktop environment...');
      // Apply saved theme
      const savedTheme = Huna7.Notebook.Themes.getActive() || Huna7.Storage.getTheme();
      if (savedTheme) Huna7.Encyclopedia.apply(savedTheme);
      else Huna7.Encyclopedia.init();
    });

    _loader.updateProgress(90);

    // ── Auth gate ─────────────────────────────────────────
    const isSetup = Huna7.Notebook.Authentication.isSetupComplete();
    if (!isSetup) {
      _loader.dismiss(() => _showSetupWizard());
    } else {
      // Try session restore
      const session = Huna7.Notebook.Sessions.restoreSession();
      if (session && Huna7.Notebook.Sessions.isLoggedIn()) {
        _loader.dismiss(() => _launchDesktop());
      } else {
        _loader.dismiss(() => _showLoginScreen());
      }
    }
  };

  // ── Setup Wizard ─────────────────────────────────────

  const _showSetupWizard = () => {
    const ui = _buildScreen();
    let step = 1;
    let username = '', password = '', confirm = '';

    const render = () => {
      ui.body.innerHTML = '';

      if (step === 1) {
        ui.title.textContent = 'Create your profile';
        ui.subtitle.textContent = 'Step 1 of 3 — Choose a username';
        const inp = _mkInput('Username', 'text', 'e.g. alex');
        inp.input.value = username;
        const next = _mkBtn('Continue', 'accent', () => {
          username = inp.input.value.trim();
          if (!username) { _shake(inp.input); return; }
          step = 2; render();
        });
        inp.input.addEventListener('keydown', e => { if (e.key === 'Enter') next.click(); });
        ui.body.append(inp.wrap, next);
        setTimeout(() => inp.input.focus(), 80);

      } else if (step === 2) {
        ui.title.textContent = 'Set a password';
        ui.subtitle.textContent = 'Step 2 of 3 — Must be at least 6 characters';
        const p = _mkInput('Password', 'password', 'Enter password');
        p.input.value = password;
        const next = _mkBtn('Continue', 'accent', () => {
          password = p.input.value;
          const v = Huna7.Security.validatePassword(password);
          if (!v.valid) { _showError(ui, v.errors[0]); _shake(p.input); return; }
          step = 3; render();
        });
        p.input.addEventListener('keydown', e => { if (e.key === 'Enter') next.click(); });
        const back = _mkBtn('Back', 'ghost', () => { step = 1; render(); });
        ui.body.append(p.wrap, _mkRow(back, next));
        setTimeout(() => p.input.focus(), 80);

      } else if (step === 3) {
        ui.title.textContent = 'Confirm password';
        ui.subtitle.textContent = 'Step 3 of 3 — Re-enter your password';
        const c = _mkInput('Confirm Password', 'password', 'Re-enter password');
        c.input.value = confirm;
        const errEl = document.createElement('div');
        errEl.style.cssText = 'color:#e05252;font-size:12px;min-height:16px;';
        const finish = _mkBtn('Create Profile', 'accent', async () => {
          confirm = c.input.value;
          finish.disabled = true;
          finish.textContent = 'Creating...';
          const result = await Huna7.Notebook.Authentication.setup(username, password, confirm);
          if (!result.success) {
            errEl.textContent = result.error;
            _shake(c.input);
            finish.disabled = false;
            finish.textContent = 'Create Profile';
            return;
          }
          // Seed FS already done in setup(). Launch desktop.
          await Huna7.Notebook.FilesystemIndex.build();
          Huna7.Animations.fadeOut(ui.container, 300, () => {
            ui.container.remove();
            _launchDesktop();
          });
        });
        c.input.addEventListener('keydown', e => { if (e.key === 'Enter') finish.click(); });
        const back = _mkBtn('Back', 'ghost', () => { step = 2; render(); });
        ui.body.append(c.wrap, errEl, _mkRow(back, finish));
        setTimeout(() => c.input.focus(), 80);
      }
    };

    render();
    Huna7.Animations.fadeIn(ui.container, 350);
  };

  // ── Login Screen ──────────────────────────────────────

  const _showLoginScreen = () => {
    const ui = _buildScreen();
    const username = Huna7.Notebook.Authentication.getSavedUsername();

    ui.title.textContent = 'Welcome back';
    ui.subtitle.textContent = `Sign in as ${username}`;

    // Logo
    const logoWrap = document.createElement('div');
    logoWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:8px;';
    Huna7.Startup.Logo.render(logoWrap, { size: 72, animated: true });
    ui.body.appendChild(logoWrap);

    const pwInp = _mkInput('Password', 'password', 'Enter password');
    const errEl = document.createElement('div');
    errEl.style.cssText = 'color:#e05252;font-size:12px;min-height:16px;text-align:center;';

    const loginBtn = _mkBtn('Sign In', 'accent', async () => {
      const delay = Huna7.Notebook.Authentication.getLoginDelay();
      if (delay > 0) { errEl.textContent = `Wait ${Math.ceil(delay/1000)}s...`; return; }
      loginBtn.disabled = true; loginBtn.textContent = 'Signing in...';
      const result = await Huna7.Notebook.Authentication.login(username, pwInp.input.value);
      if (!result.success) {
        errEl.textContent = result.error;
        _shake(pwInp.input);
        loginBtn.disabled = false; loginBtn.textContent = 'Sign In';
        pwInp.input.value = '';
        pwInp.input.focus();
        return;
      }
      Huna7.Animations.fadeOut(ui.container, 300, () => {
        ui.container.remove();
        _launchDesktop();
      });
    });

    pwInp.input.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

    // Reset link
    const resetLink = document.createElement('div');
    resetLink.style.cssText = 'font-size:12px;color:var(--h7-text-muted);cursor:pointer;text-align:center;margin-top:4px;text-decoration:underline;text-underline-offset:3px;';
    resetLink.textContent = 'Reset Huna7-OS';
    resetLink.addEventListener('click', _showResetFlow);

    ui.body.append(pwInp.wrap, errEl, loginBtn, resetLink);
    Huna7.Animations.fadeIn(ui.container, 350);
    setTimeout(() => pwInp.input.focus(), 80);

    // Re-render on lock event
    Huna7.Binder.on('session:locked', () => {
      ui.container.remove();
      _showLoginScreen();
    });
  };

  // ── Reset Flow ────────────────────────────────────────

  const _showResetFlow = async () => {
    const w1 = await Huna7.Toolbox.showModal(
      '⚠️ Reset Huna7-OS',
      'ALL files will be permanently deleted. ALL settings will be erased. This cannot be undone.',
      [{ label: 'Cancel', type: 'ghost', value: false }, { label: 'Continue', type: 'danger', value: true }]
    );
    if (!w1) return;
    const w2 = await Huna7.Toolbox.showModal(
      'Are you absolutely sure?',
      'Your profile, every file, and all preferences will be wiped. Huna7-OS will restart fresh.',
      [{ label: 'Go Back', type: 'ghost', value: false }, { label: 'Delete Everything', type: 'danger', value: true }]
    );
    if (!w2) return;
    const w3 = await Huna7.Toolbox.showModal(
      'Final confirmation',
      'Click "Reset Now" to permanently wipe Huna7-OS.',
      [{ label: 'Cancel', type: 'ghost', value: false }, { label: 'Reset Now', type: 'danger', value: true }]
    );
    if (!w3) return;
    await Huna7.Notebook.Authentication.resetSystem();
  };

  // ── Desktop Launch ────────────────────────────────────

  const _launchDesktop = () => {
    // Init subsystems that need the desktop
    Huna7.Homeroom.init();
    Huna7.Notebook.Shortcuts.installKeyboardHandler();

    // Wire lock screen
    Huna7.Binder.on('session:locked', () => {
      // Dim the root, show login overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH-1};backdrop-filter:blur(16px);`;
      _root.appendChild(overlay);
      Huna7.Binder.once('session:unlocked', () => overlay.remove());

      // Show login screen on top
      _showLoginScreen();
    });

    // Apply wallpaper from persistent store
    const wp = Huna7.Notebook.Wallpaper.getCurrent();
    if (wp?.value) {
      // Will be consumed by Blackboard.render()
    }

    // Render desktop
    Huna7.Blackboard.render(_root);

    // Launch startup apps (after short delay for desktop to settle)
    setTimeout(() => {
      Huna7.Notebook.StartupApps.launchAll();
      Huna7.Binder.emit('desktop:ready', {});
    }, 400);

    Huna7.Prototype.init();
    Huna7.Launcher?.init?.();
  };

  // ── UI helpers ────────────────────────────────────────

  const _buildScreen = () => {
    const container = document.createElement('div');
    container.style.cssText = `
      position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH - 2};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:radial-gradient(ellipse at 50% 30%,rgba(94,127,255,0.08) 0%,transparent 60%),#07070e;
      padding:24px;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width:100%;max-width:360px;
      background:rgba(18,18,28,0.92);
      border:1px solid rgba(255,255,255,0.10);
      border-radius:20px;padding:32px;
      box-shadow:0 24px 64px rgba(0,0,0,0.6);
      display:flex;flex-direction:column;gap:14px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:22px;font-weight:700;letter-spacing:-0.02em;';

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:13px;color:var(--h7-text-muted);margin-top:-6px;margin-bottom:4px;';

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:12px;';

    card.append(title, subtitle, body);
    container.appendChild(card);
    _root.appendChild(container);

    return { container, card, title, subtitle, body };
  };

  const _mkInput = (label, type, placeholder) => {
    const wrap = document.createElement('div');
    const lbl  = document.createElement('label');
    lbl.className = 'h7-label';
    lbl.textContent = label;
    const input = document.createElement('input');
    input.className = 'h7-input';
    input.type = type;
    input.placeholder = placeholder || '';
    input.style.marginTop = '4px';
    wrap.append(lbl, input);
    return { wrap, input };
  };

  const _mkBtn = (label, cls, action) => {
    const b = document.createElement('button');
    b.className = `h7-btn h7-btn-${cls}`;
    b.style.cssText = 'width:100%;padding:11px;font-size:14px;';
    b.textContent = label;
    b.addEventListener('click', action);
    return b;
  };

  const _mkRow = (...btns) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;';
    btns.forEach(b => { b.style.flex = '1'; row.appendChild(b); });
    return row;
  };

  const _showError = (ui, msg) => {
    let err = ui.body.querySelector('.h7-setup-err');
    if (!err) { err = document.createElement('div'); err.className = 'h7-setup-err'; err.style.cssText = 'color:#e05252;font-size:12px;'; ui.body.prepend(err); }
    err.textContent = msg;
  };

  const _shake = (el) => Huna7.Animations.shake(el);

  return { boot };
})();

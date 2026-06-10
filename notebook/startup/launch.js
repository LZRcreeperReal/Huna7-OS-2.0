/* =====================================================
   HUNA7-OS — STARTUP: LAUNCH
   Authoritative boot controller.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Startup = Huna7.Startup || {};

Huna7.Startup.Launch = (() => {

  let _root   = null;
  let _loader = null;

  // ── Entry point ───────────────────────────────────────
  const boot = async (root) => {
    _root = root;
    // Apply default theme immediately so CSS vars exist
    Huna7.Dictionary.applyTokens(Huna7.CONSTANTS.DEFAULT_THEME);
    Huna7.Startup.Splash.show(root, async () => {
      _loader = Huna7.Startup.Loading.mount(root);
      await _bootSequence();
    });
  };

  // ── Boot sequence ─────────────────────────────────────
  const _bootSequence = async () => {
    const stages = Huna7.CONSTANTS.BOOT_STAGES;
    let stageIdx = 0;

    const tick = async (work) => {
      const stage = stages[stageIdx++];
      _loader.updateStage(stage.label);
      _loader.updateProgress(((stageIdx - 1) / stages.length) * 88);
      try { await work(); } catch(e) { console.error('[Boot]', e); }
      await Huna7.Helpers.sleep(stage.duration);
    };

    // 1 — Firmware / Migrations
    await tick(async () => {
      _loader.addDetail('Running migrations...');
      await Huna7.Notebook.Migrations.run();
    });

    // 2 — Storage
    await tick(async () => {
      _loader.addDetail('Mounting filesystem...');
      await Huna7.Organizer.init();
      Huna7.Notebook.Registry.load();
      Huna7.Notebook.Preferences.load();
      Huna7.Notebook.Themes.load();
      Huna7.Notebook.Wallpaper.load();
      Huna7.Notebook.StartupApps.load();
      Huna7.Notebook.Shortcuts.load();
      Huna7.Blueprint.initDefaults();
    });

    // 3 — Kernel
    await tick(async () => {
      _loader.addDetail('Starting kernel...');
      Huna7.Chalk.init();
      Huna7.Notebook.Registry.recordBoot();
    });

    // 4 — Services / FilesystemIndex
    await tick(async () => {
      _loader.addDetail('Indexing filesystem...');
      await Huna7.Notebook.FilesystemIndex.init();
    });

    // 5 — Desktop / Theme
    await tick(async () => {
      _loader.addDetail('Applying theme...');
      const savedTheme = Huna7.Notebook.Themes.getActive() || Huna7.Storage.getTheme();
      if (savedTheme) Huna7.Encyclopedia.apply(savedTheme);
      else Huna7.Encyclopedia.init();
    });

    _loader.updateProgress(92);

    // ── Auth gate ─────────────────────────────────────────
    const isSetup = Huna7.Notebook.Authentication.isSetupComplete();
    if (!isSetup) {
      _loader.dismiss(() => _showSetupWizard());
    } else {
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
    let username = '', password = '';

    const render = () => {
      ui.body.innerHTML = '';

      if (step === 1) {
        ui.title.textContent = 'Welcome to Huna7-OS';
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
        ui.subtitle.textContent = 'Step 2 of 3 — At least 6 characters';
        const p = _mkInput('Password', 'password', 'Enter password');
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
        const errEl = document.createElement('div');
        errEl.style.cssText = 'color:#e05252;font-size:12px;min-height:16px;';
        const finish = _mkBtn('Create Profile', 'accent', async () => {
          const confirm = c.input.value;
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
          await Huna7.Notebook.FilesystemIndex.build();
          ui.container.remove();
          _launchDesktop();
        });
        c.input.addEventListener('keydown', e => { if (e.key === 'Enter') finish.click(); });
        const back = _mkBtn('Back', 'ghost', () => { step = 2; render(); });
        ui.body.append(c.wrap, errEl, _mkRow(back, finish));
        setTimeout(() => c.input.focus(), 80);
      }
    };

    render();
  };

  // ── Login Screen ──────────────────────────────────────
  const _showLoginScreen = () => {
    // Remove any previous login screen
    const existing = document.getElementById('h7-login-screen');
    if (existing) existing.remove();

    const ui = _buildScreen('h7-login-screen');
    const username = Huna7.Notebook.Authentication.getSavedUsername();

    // Logo
    const logoWrap = document.createElement('div');
    logoWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:4px;';
    Huna7.Startup.Logo.render(logoWrap, { size: 64, animated: true });
    ui.body.appendChild(logoWrap);

    ui.title.textContent = 'Welcome back';
    ui.subtitle.textContent = username ? `Signing in as ${username}` : 'Sign in to Huna7-OS';

    const pwInp = _mkInput('Password', 'password', 'Enter your password');
    const errEl = document.createElement('div');
    errEl.style.cssText = 'color:#e05252;font-size:12px;min-height:16px;text-align:center;';

    const loginBtn = _mkBtn('Sign In', 'accent', async () => {
      const delay = Huna7.Notebook.Authentication.getLoginDelay();
      if (delay > 0) { errEl.textContent = `Too many attempts. Wait ${Math.ceil(delay/1000)}s.`; return; }
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
      errEl.textContent = '';
      const result = await Huna7.Notebook.Authentication.login(username, pwInp.input.value);
      if (!result.success) {
        errEl.textContent = result.error;
        _shake(pwInp.input);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
        pwInp.input.value = '';
        pwInp.input.focus();
        return;
      }
      ui.container.remove();
      _launchDesktop();
    });

    pwInp.input.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

    // Reset link
    const resetLink = document.createElement('div');
    resetLink.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.35);cursor:pointer;text-align:center;margin-top:4px;';
    resetLink.textContent = 'Forgot password / Reset Huna7-OS';
    resetLink.addEventListener('mouseenter', () => resetLink.style.color = 'rgba(255,255,255,0.7)');
    resetLink.addEventListener('mouseleave', () => resetLink.style.color = 'rgba(255,255,255,0.35)');
    resetLink.addEventListener('click', () => _showResetFlow(ui.container));

    ui.body.append(pwInp.wrap, errEl, loginBtn, resetLink);
    setTimeout(() => pwInp.input.focus(), 100);
  };

  // ── Reset Flow (inline — no Toolbox needed) ───────────
  const _showResetFlow = (loginContainer) => {
    const ui = _buildScreen('h7-reset-screen');

    const steps = [
      { title: '⚠️ Reset Huna7-OS', text: 'ALL files will be permanently deleted. ALL settings will be erased. This cannot be undone.' },
      { title: 'Are you sure?', text: 'Your profile, every file, and all preferences will be wiped. Huna7-OS will restart completely fresh.' },
      { title: 'Final confirmation', text: 'This is your last chance. Once you click "Reset Now" there is no going back.' },
    ];
    let step = 0;

    const render = () => {
      ui.body.innerHTML = '';
      ui.title.textContent = steps[step].title;
      ui.subtitle.textContent = '';

      const text = document.createElement('div');
      text.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;padding:4px 0;';
      text.textContent = steps[step].text;

      const confirmBtn = _mkBtn(step < 2 ? 'I understand, continue' : 'Reset Now', 'danger', async () => {
        if (step < 2) { step++; render(); return; }
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Resetting...';
        await Huna7.Notebook.Authentication.resetSystem();
      });

      const cancelBtn = _mkBtn('Cancel', 'ghost', () => {
        ui.container.remove();
        if (loginContainer) loginContainer.style.display = '';
      });

      ui.body.append(text, confirmBtn, cancelBtn);
    };

    if (loginContainer) loginContainer.style.display = 'none';
    render();
  };

  // ── Desktop Launch ────────────────────────────────────
  const _launchDesktop = () => {
    Huna7.Homeroom.init();
    Huna7.Notebook.Shortcuts.installKeyboardHandler();

    // Wire lock screen
    Huna7.Binder.on('session:locked', () => {
      const overlay = document.createElement('div');
      overlay.id = 'h7-lock-overlay';
      overlay.style.cssText = `position:absolute;inset:0;z-index:${Huna7.CONSTANTS.Z.SPLASH-1};backdrop-filter:blur(20px);background:rgba(0,0,0,0.4);`;
      _root.appendChild(overlay);
      Huna7.Binder.once('session:unlocked', () => overlay.remove());
      _showLoginScreen();
    });

    Huna7.Blackboard.render(_root);

    setTimeout(() => {
      Huna7.Notebook.StartupApps.launchAll();
      Huna7.Binder.emit('desktop:ready', {});
    }, 300);

    Huna7.Prototype.init();
    Huna7.Launcher?.init?.();
  };

  // ── UI helpers ────────────────────────────────────────
  const _buildScreen = (id) => {
    const container = document.createElement('div');
    if (id) container.id = id;
    container.style.cssText = `
      position:absolute;inset:0;
      z-index:${Huna7.CONSTANTS.Z.SPLASH - 2};
      display:flex;align-items:center;justify-content:center;
      background:radial-gradient(ellipse at 50% 40%, rgba(94,127,255,0.10) 0%, transparent 65%), #07070e;
      padding:20px;
      font-family:-apple-system,'Segoe UI',sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width:100%;max-width:380px;
      background:rgba(16,16,26,0.95);
      border:1px solid rgba(255,255,255,0.10);
      border-radius:20px;
      padding:32px 28px;
      box-shadow:0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
      display:flex;flex-direction:column;gap:10px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#F0F0F8;';

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:13px;color:rgba(240,240,248,0.45);margin-bottom:6px;';

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
    lbl.style.cssText = 'display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(240,240,248,0.5);margin-bottom:6px;';
    lbl.textContent = label;
    const input = document.createElement('input');
    input.style.cssText = `
      width:100%;padding:10px 13px;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:10px;
      color:#F0F0F8;font-size:14px;outline:none;
      font-family:-apple-system,'Segoe UI',sans-serif;
      transition:border-color 200ms;
    `;
    input.type = type;
    input.placeholder = placeholder || '';
    input.addEventListener('focus', () => input.style.borderColor = '#5E7FFF');
    input.addEventListener('blur',  () => input.style.borderColor = 'rgba(255,255,255,0.12)');
    wrap.append(lbl, input);
    return { wrap, input };
  };

  const _mkBtn = (label, cls, action) => {
    const colors = {
      accent: { bg: '#5E7FFF', hover: '#7a96ff', text: '#fff' },
      ghost:  { bg: 'rgba(255,255,255,0.07)', hover: 'rgba(255,255,255,0.12)', text: '#F0F0F8' },
      danger: { bg: '#c94040', hover: '#e05252', text: '#fff' },
    };
    const c = colors[cls] || colors.ghost;
    const b = document.createElement('button');
    b.style.cssText = `
      width:100%;padding:11px;font-size:14px;font-weight:500;
      border:none;border-radius:10px;cursor:pointer;
      background:${c.bg};color:${c.text};
      font-family:-apple-system,'Segoe UI',sans-serif;
      transition:background 150ms,transform 80ms;
    `;
    b.textContent = label;
    b.addEventListener('mouseenter', () => b.style.background = c.hover);
    b.addEventListener('mouseleave', () => b.style.background = c.bg);
    b.addEventListener('mousedown',  () => b.style.transform = 'scale(0.98)');
    b.addEventListener('mouseup',    () => b.style.transform = '');
    b.addEventListener('click', action);
    return b;
  };

  const _mkRow = (...btns) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;';
    btns.forEach(b => { b.style.width = ''; b.style.flex = '1'; row.appendChild(b); });
    return row;
  };

  const _showError = (ui, msg) => {
    let err = ui.body.querySelector('.h7-setup-err');
    if (!err) {
      err = document.createElement('div');
      err.className = 'h7-setup-err';
      err.style.cssText = 'color:#e05252;font-size:12px;padding:4px 0;';
      ui.body.prepend(err);
    }
    err.textContent = msg;
  };

  const _shake = (el) => Huna7.Animations.shake(el);

  return { boot };
})();

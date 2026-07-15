/* =====================================================
   HUNA7-OS — APPS: TERMINAL
   Command terminal. History, tab completion, VoxScript.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Terminal = (() => {
  function launch(pid, options = {}) {
    let cwd = '/Home';
    let history = [];
    let histIdx = -1;
    let inputBuffer = '';

    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Terminal', appId: 'terminal', width: 720, height: 460,
    });

    contentEl.style.cssText += 'display:flex;flex-direction:column;background:#0d0d0d;';

    const output = document.createElement('div');
    output.style.cssText = `flex:1;overflow-y:auto;padding:12px 14px;font-family:var(--h7-font-mono);
      font-size:13px;line-height:1.6;color:#d0d0d0;`;

    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;align-items:center;padding:6px 14px 10px;gap:6px;flex-shrink:0;border-top:1px solid rgba(255,255,255,0.08);';

    const prompt = document.createElement('span');
    prompt.style.cssText = 'font-family:var(--h7-font-mono);font-size:13px;color:#5E7FFF;white-space:nowrap;flex-shrink:0;';
    prompt.textContent = `${Huna7.Attendance.getUsername()}@huna7:~$`;

    const input = document.createElement('input');
    input.style.cssText = `flex:1;background:transparent;border:none;outline:none;
      font-family:var(--h7-font-mono);font-size:13px;color:#d0d0d0;caret-color:#5E7FFF;`;
    input.spellcheck = false;
    input.autocomplete = 'off';

    inputRow.append(prompt, input);
    contentEl.append(output, inputRow);

    function print(text, color = '') {
      const line = document.createElement('div');
      line.style.cssText = `white-space:pre-wrap;word-break:break-all;${color ? `color:${color};` : ''}`;
      line.textContent = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    function printHtml(html) {
      const line = document.createElement('div');
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    function printPrompt(cmd) {
      printHtml(`<span style="color:#5E7FFF">${Huna7.Helpers.escapeHtml(prompt.textContent)}</span> <span>${Huna7.Helpers.escapeHtml(cmd)}</span>`);
    };

    function updatePrompt() {
      const rel = cwd.replace('/Home', '~');
      prompt.textContent = `${Huna7.Attendance.getUsername()}@huna7:${rel}$`;
    };

    const COMMANDS = {
      help: () => {
        print(`Huna7-OS Terminal v${Huna7.CONSTANTS.VERSION}
Commands:
  ls [path]         List directory contents
  cd <path>         Change directory
  pwd               Print working directory
  mkdir <name>      Create directory
  touch <name>      Create empty file
  cat <file>        Show file contents
  rm <path>         Remove file or directory
  cp <src> <dest>   Copy file
  mv <src> <dest>   Move/rename file
  echo <text>       Print text
  clear             Clear terminal
  run <file.pencil> Run VoxScript file
  vox "<code>"      Execute inline VoxScript
  open <appid>      Open an application
  ps                List processes
  kill <pid>        Kill a process
  uptime            Show system uptime
  whoami            Show current user
  date              Show current date/time
  theme <name>      Change theme
  history           Show command history
  neofetch          System info`, '#aaa');
      },

      ls: async (args) => {
        const path = args[0] ? Huna7.Helpers.normalizePath(cwd + '/' + args[0]) : cwd;
        const entries = await Huna7.VFS.readDir(path);
        if (!entries.length) { print('(empty)'); return; }
        const cols = entries.map(e => {
          const isDir = e.type === 'directory';
          return `<span style="color:${isDir ? '#5E7FFF' : '#d0d0d0'}">${Huna7.Helpers.escapeHtml(e.name)}${isDir ? '/' : ''}</span>`;
        });
        printHtml(cols.join('  '));
      },

      cd: async (args) => {
        const target = args[0] || '/Home';
        const newPath = target.startsWith('/') ? target : Huna7.Helpers.normalizePath(cwd + '/' + target);
        const entry = await Huna7.Organizer.fs.get(newPath);
        if (!entry || entry.type !== 'directory') { print(`cd: no such directory: ${target}`, '#e05252'); return; }
        cwd = newPath;
        updatePrompt();
      },

      pwd: () => print(cwd),

      mkdir: async (args) => {
        if (!args[0]) { print('Usage: mkdir <name>', '#e05252'); return; }
        await Huna7.VFS.mkdir(cwd + '/' + args[0]);
        print(`Created: ${args[0]}`);
      },

      touch: async (args) => {
        if (!args[0]) { print('Usage: touch <name>', '#e05252'); return; }
        await Huna7.VFS.writeFile(cwd + '/' + args[0], '');
        print(`Created: ${args[0]}`);
      },

      cat: async (args) => {
        if (!args[0]) { print('Usage: cat <file>', '#e05252'); return; }
        const path = args[0].startsWith('/') ? args[0] : cwd + '/' + args[0];
        try {
          const entry = await Huna7.VFS.readFile(path);
          print(entry.content || '(empty file)');
        } catch { print(`cat: ${args[0]}: No such file`, '#e05252'); }
      },

      rm: async (args) => {
        if (!args[0]) { print('Usage: rm <path>', '#e05252'); return; }
        const path = args[0].startsWith('/') ? args[0] : cwd + '/' + args[0];
        await Huna7.VFS.deleteEntry(path);
        print(`Removed: ${args[0]}`);
      },

      cp: async (args) => {
        if (!args[1]) { print('Usage: cp <src> <dest>', '#e05252'); return; }
        const src = args[0].startsWith('/') ? args[0] : cwd + '/' + args[0];
        const dest = args[1].startsWith('/') ? args[1] : cwd + '/' + args[1];
        await Huna7.VFS.copyEntry(src, dest);
        print(`Copied: ${args[0]} → ${args[1]}`);
      },

      mv: async (args) => {
        if (!args[1]) { print('Usage: mv <src> <dest>', '#e05252'); return; }
        const src = args[0].startsWith('/') ? args[0] : cwd + '/' + args[0];
        const dest = args[1].startsWith('/') ? args[1] : cwd + '/' + args[1];
        await Huna7.VFS.moveEntry(src, dest);
        print(`Moved: ${args[0]} → ${args[1]}`);
      },

      echo: (args) => print(args.join(' ')),

      clear: () => { output.innerHTML = ''; },

      run: async (args) => {
        if (!args[0]) { print('Usage: run <file.pencil>', '#e05252'); return; }
        const path = args[0].startsWith('/') ? args[0] : cwd + '/' + args[0];
        print(`Running: ${args[0]}`, '#5E7FFF');
        const result = await Huna7.VoxScript.Runtime.runFile(path, { pid, outputFn: (l) => print(l, '#98c379') });
        if (!result.success) result.errors.forEach(e => print('[Error] ' + e, '#e05252'));
        print(`Exit: ${result.success ? 'OK' : 'Error'}`, result.success ? '#4CAF50' : '#e05252');
      },

      vox: async (args) => {
        const code = args.join(' ').replace(/^["']|["']$/g, '');
        const result = await Huna7.VoxScript.Runtime.run(code, { pid, outputFn: (l) => print(l, '#98c379') });
        if (!result.success) result.errors.forEach(e => print('[Error] ' + e, '#e05252'));
      },

      open: (args) => {
        if (!args[0]) { print('Usage: open <appid>', '#e05252'); return; }
        const p = Huna7.Chalk.spawn(args[0]);
        if (p) print(`Launched: ${args[0]} (pid ${p})`, '#4CAF50');
        else print(`Unknown app: ${args[0]}`, '#e05252');
      },

      ps: () => {
        const procs = Huna7.Chalk.getAllProcesses();
        print('PID    STATUS   NAME');
        procs.forEach(p => print(`${String(p.pid).padEnd(7)}${p.status.padEnd(9)}${p.name}`));
        print(`${procs.length} process(es)`);
      },

      kill: (args) => {
        const pid2 = parseInt(args[0]);
        if (!pid2) { print('Usage: kill <pid>', '#e05252'); return; }
        Huna7.Eraser.terminate(pid2);
        print(`Killed: ${pid2}`);
      },

      uptime: () => print(`Uptime: ${Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime())}`),

      whoami: () => print(Huna7.Attendance.getUsername()),

      date: () => print(new Date().toString()),

      theme: (args) => {
        if (!args[0]) {
          const themes = Object.keys(Huna7.Encyclopedia.getAllThemes());
          print('Available themes: ' + themes.join(', '));
          return;
        }
        Huna7.Encyclopedia.applyByName(args[0]);
        print(`Theme applied: ${args[0]}`, '#4CAF50');
      },

      history: () => history.forEach((h, i) => print(`${String(i+1).padStart(4)}  ${h}`)),

      neofetch: () => {
        const profile = Huna7.Storage.getProfile();
        const theme = Huna7.Encyclopedia.getCurrent();
        printHtml(`<span style="color:#5E7FFF">
   _   _                       ___     ___  ____
  | | | |_   _ _ __   __ _   /   |   / _ \|  _ \\
  | |_| | | | | '_ \\ / _\` | | | |  | | | | |_) |
  |  _  | |_| | | | | (_| | | |_|  | |_| |  __/
  |_| |_|\\__,_|_| |_|\\__,_|  \\___/  \\___/|_|
</span>
<span style="color:#aaa">OS:</span>      Huna7-OS v${Huna7.CONSTANTS.VERSION}
<span style="color:#aaa">User:</span>    ${profile?.username || 'unknown'}
<span style="color:#aaa">Theme:</span>   ${theme?.name || 'Midnight'}
<span style="color:#aaa">Uptime:</span>  ${Huna7.Helpers.formatUptime(Huna7.Chalk.getUptime())}
<span style="color:#aaa">Shell:</span>   VoxScript ${Huna7.CONSTANTS.VERSION}
<span style="color:#aaa">Engine:</span>  Huna7 Kernel`);
      },
    };

    async function execute(raw) {
      const cmd = raw.trim();
      if (!cmd) return;

      history.unshift(cmd);
      if (history.length > 500) history.pop();
      histIdx = -1;
      inputBuffer = '';

      printPrompt(cmd);

      const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
      const name = parts[0];
      const args = parts.slice(1).map(a => a.replace(/^["']|["']$/g, ''));

      if (COMMANDS[name]) {
        try { await COMMANDS[name](args); }
        catch (e) { print(`Error: ${e.message}`, '#e05252'); }
      } else {
        print(`Command not found: ${name}. Type 'help' for commands.`, '#e05252');
      }
    };

    // Tab completion
    async function complete() {
      const val = input.value;
      const parts = val.split(' ');
      const last = parts[parts.length - 1];
      if (parts.length === 1) {
        const matches = Object.keys(COMMANDS).filter(c => c.startsWith(last));
        if (matches.length === 1) { input.value = matches[0] + ' '; }
        else if (matches.length > 1) print(matches.join('  '), '#aaa');
      } else {
        const base = last.startsWith('/') ? Huna7.Helpers.getDirPath(last) : cwd;
        const prefix = Huna7.Helpers.getFileName(last);
        const entries = await Huna7.VFS.readDir(base).catch(() => []);
        const matches = entries.map(e => e.name).filter(n => n.startsWith(prefix));
        if (matches.length === 1) { parts[parts.length-1] = (last.startsWith('/') ? base + '/' : '') + matches[0]; input.value = parts.join(' '); }
        else if (matches.length > 1) print(matches.join('  '), '#aaa');
      }
    };

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') { const cmd = input.value; input.value = ''; await execute(cmd); }
      else if (e.key === 'ArrowUp') {
        if (histIdx < history.length - 1) {
          if (histIdx === -1) inputBuffer = input.value;
          histIdx++;
          input.value = history[histIdx];
        }
      }
      else if (e.key === 'ArrowDown') {
        if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
        else if (histIdx === 0) { histIdx = -1; input.value = inputBuffer; }
      }
      else if (e.key === 'Tab') { e.preventDefault(); await complete(); }
      else if (e.key === 'c' && e.ctrlKey) { input.value = ''; print('^C', '#e05252'); }
    });

    // Welcome message
    print(`Huna7-OS Terminal v${Huna7.CONSTANTS.VERSION}`, '#5E7FFF');
    print(`Type 'help' for available commands.\n`);
    setTimeout(() => input.focus(), 100);

    return { windowId: id };
  };

  return { launch };
})();

# Huna7-OS

A premium browser-based operating system. Fully frontend-only. Deployable on Vercel.

---

## Project Layout

This project is deployment-ready for Vercel. Browser files live in `public/`:

```
public/
├── index.html
└── notebook/
```

`vercel.json` serves `public/` as the deployment output directory.

---

## Architecture

Huna7-OS is organized as a modular multi-file project. All code lives under `notebook/`, mirroring an OS layer cake:

```
index.html                  Bootstrap only — the power button
vercel.json                 Static Vercel deployment config
notebook/
├── utilities/              Core utilities (load first, no deps)
│   ├── constants.js        System-wide constants and defaults
│   ├── helpers.js          Shared utility functions
│   ├── storage.js          localStorage abstraction
│   ├── security.js         PBKDF2 password hashing (Web Crypto)
│   ├── animations.js       Animation engine primitives
│   └── errors.js           Centralized error management
│
├── pencil/                 Kernel subsystem
│   ├── binder.js           Global event bus (all inter-module comms)
│   ├── compass.js          Service registry
│   ├── ruler.js            Permission manager
│   ├── schedule.js         Task scheduler and timers
│   ├── eraser.js           Process cleanup / garbage collection
│   └── chalk.js            Main kernel — process creation and routing
│
├── backpack/               Storage subsystem
│   ├── organizer.js        IndexedDB abstraction layer
│   ├── notebook.js         Virtual File System (exports Huna7.VFS)
│   ├── folder.js           Directory manager and navigation
│   └── archive.js          Import/export and backup
│
├── library/                UI framework
│   ├── dictionary.js       Design token registry (CSS variables)
│   ├── glossary.js         SVG icon system
│   ├── encyclopedia.js     Theme engine (applies themes; storage in notebook/themes.js)
│   └── indexer.js          UI animation and motion orchestration
│
├── classroom/              Desktop environment
│   ├── attendance.js       Session UI facade → delegates to notebook/sessions.js
│   ├── homeroom.js         Workspace / virtual desktop manager
│   ├── bulletin.js         Notification center
│   ├── desk.js             Window manager (drag, resize, snap, z-order)
│   └── blackboard.js       Desktop renderer (wallpaper, dock, status bar)
│
├── workshop/               Shared UI tools
│   ├── toolbox.js          Context menus, modals, prompts, tables
│   ├── sketch.js           Common UI patterns (icons, spinners, tabs)
│   ├── blueprint.js        Configuration management
│   ├── drafting.js         Debug helpers
│   └── prototype.js        Dev diagnostics (disable in production)
│
├── voxscript/              VoxScript language engine
│   ├── sentence.js         AST node type definitions
│   ├── alphabet.js         Lexer — source → tokens
│   ├── grammar.js          Parser — tokens → AST
│   ├── translator.js       Compiler — AST → bytecode
│   ├── machine.js          VM — bytecode executor
│   ├── standardbook.js     Standard library (fs, system, theme, etc.)
│   ├── runtime.js          Execution environment and pipeline entry
│   └── debugger.js         Breakpoints, syntax highlighting, inspection
│
├── applications/           All apps (each exports Huna7.Apps.<Name>)
│   ├── explorer.js         File explorer
│   ├── terminal.js         Command terminal
│   ├── writer.js           Text editor
│   ├── themes.js           Theme editor
│   ├── settings.js         System settings
│   ├── calculator.js       Scientific calculator
│   ├── clock.js            Clock / stopwatch / timer
│   ├── media.js            Video/audio media player
│   ├── browser.js          Orbit browser (tabs, bookmarks)
│   ├── voxstudio.js        VoxScript IDE
│   ├── monitor.js          System monitor
│   ├── notes.js            Note-taking app
│   ├── images.js           Image viewer
│   ├── audio.js            Music player with playlists
│   ├── workspace.js        Workspace control panel
│   └── packagecenter.js    Local package manager
│
├── startup/                Boot sequence
│   ├── logo.js             SVG logo renderer and animation
│   ├── splash.js           Splash screen with logo reveal
│   ├── loading.js          Staged boot loader with progress
│   └── launch.js           Authoritative boot controller
│
├── launcher.js             Spotlight-style application launcher
│
└── [notebook subsystem]    User environment layer
    ├── profile.js          User identity management
    ├── authentication.js   Auth service (setup, login, reset)
    ├── sessions.js         Session lifecycle
    ├── preferences.js      User preferences with live propagation
    ├── registry.js         Central configuration registry
    ├── filesystem-index.js Fast file lookup and search index
    ├── themes.js           Theme persistence layer
    ├── wallpaper.js        Wallpaper persistence
    ├── startup-apps.js     Startup application manager
    ├── recent-files.js     Recent activity tracking
    ├── shortcuts.js        Desktop/dock/keyboard shortcut management
    ├── migrations.js       Schema version migration system
    └── updates.js          Version history and compatibility checks
```

---

## Key Namespaces

| Namespace | Source | Purpose |
|---|---|---|
| `Huna7.VFS` | `backpack/notebook.js` | Virtual filesystem (readFile, writeFile, etc.) |
| `Huna7.Notebook.*` | `notebook/*.js` | User environment subsystem |
| `Huna7.Apps.*` | `applications/*.js` | Application modules |
| `Huna7.VoxScript.*` | `voxscript/*.js` | Language engine |
| `Huna7.Startup.*` | `startup/*.js` | Boot sequence |

---

## Login Flow

**First visit:**
1. Setup Wizard shown (3 steps: username → password → confirm)
2. `Notebook.Authentication.setup()` hashes password with PBKDF2
3. Profile created, filesystem seeded with default files
4. Desktop launches

**Returning visit:**
1. Session restore attempted via `Notebook.Sessions.restoreSession()`
2. If valid session found → desktop launches directly
3. Otherwise → login screen with username pre-filled
4. Wrong password → progressive delay (1s → 3s → 30s lockout)

**Lock screen:**
- `Ctrl+L` or power menu → `Notebook.Sessions.lockSession()`
- Login overlay appears over the running desktop

**Reset:**
- Settings → Privacy → Reset Huna7-OS (three confirmation dialogs)
- `Notebook.Authentication.resetSystem()` wipes IndexedDB + localStorage
- Page reloads into setup wizard

---

## Storage Architecture

| Layer | Technology | Used for |
|---|---|---|
| `Huna7.Organizer` | IndexedDB | Virtual filesystem (files, folders, metadata) |
| `Huna7.Storage` | localStorage | Profile, session, preferences, theme, registry |

All IndexedDB access goes through `backpack/organizer.js`.
All localStorage access goes through `utilities/storage.js`.
No module accesses storage APIs directly.

---

## Theme System

Three separate responsibilities:

- **`notebook/themes.js`** — Persistence: save, load, import, export theme data
- **`library/encyclopedia.js`** — Rendering: apply tokens to CSS variables via `dictionary.js`
- **`applications/themes.js`** — Editing: live-preview theme editor UI

Calling `Encyclopedia.apply(theme)` updates CSS variables instantly OS-wide and persists via `Notebook.Themes.setActive()`.

---

## VoxScript

VoxScript is Huna7-OS's sandboxed scripting language. It is NOT JavaScript.

**Pipeline:**
```
Source (.pencil file)
  → Lexer (alphabet.js)       tokens
  → Parser (grammar.js)       AST
  → Compiler (translator.js)  bytecode
  → VM (machine.js)           execution
  → Runtime (runtime.js)      OS API access via standardbook.js
```

**File types:**
- `.pencil` — Executable VoxScript
- `.note` — Editable text / documentation
- `.data` — Structured JSON data
- `.theme` — Theme export file
- `.hpkg` — Package file

**Quick example:**
```
let name = "World"
fn greet(n) {
  system.notify("Hello", "Hello, " + n + "!")
}
greet(name)
```

---

## Applications

| App | ID | Description |
|---|---|---|
| Explorer | `explorer` | File manager with drag/drop, search, sort |
| Terminal | `terminal` | Full CLI with history, tab-completion, VoxScript |
| Writer | `writer` | Multi-tab text editor with autosave |
| Theme Editor | `themes` | Live theme editing with export/import |
| Settings | `settings` | System preferences panel |
| Calculator | `calculator` | Scientific calculator with history |
| Clock | `clock` | Clock, stopwatch, and countdown timer |
| Media | `media` | Video and audio player |
| Orbit | `orbit` | Browser with tabs and bookmarks |
| VoxStudio | `voxstudio` | VoxScript IDE with console and file browser |
| Monitor | `monitor` | Process, memory, and storage monitor |
| Notes | `notes` | Note-taking with auto-save |
| Images | `images` | Image viewer with zoom and rotate |
| Audio | `audio` | Music player with playlists |
| Workspace | `workspace` | Virtual desktop manager |
| Package Center | `packagecenter` | Local package installer |

---

## Deployment

**Vercel (static):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel --prod
```

`vercel.json` is configured for static frontend-only deployment. No server required.

**Local development:**
```bash
# Any static server works
npx serve .
# or
python3 -m http.server 3000
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Space` | Open application launcher |
| `Ctrl+F` | Global search |
| `Ctrl+L` | Lock screen |
| `Ctrl+←` | Previous workspace |
| `Ctrl+→` | Next workspace |
| `Ctrl+T` | Open Terminal |
| `Ctrl+E` | Open Explorer |

---

## Future Expansion

- **Online package repository** — `packagecenter.js` is future-ready
- **Animated wallpapers** — `wallpaper.js` has `TYPES.ANIMATED` defined
- **VoxScript modules** — `import` keyword is in the grammar
- **Multi-user** — `registry.js` supports per-user namespacing
- **PWA / offline** — Service worker can be added to `index.html`
- **Custom app installation** — Package Center + Registry already wired

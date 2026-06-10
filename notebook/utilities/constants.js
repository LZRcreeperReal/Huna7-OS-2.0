/* =====================================================
   HUNA7-OS — CONSTANTS
   System-wide constants. Single source of truth.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.CONSTANTS = {
  VERSION: '1.0.0',
  OS_NAME: 'Huna7-OS',
  STORAGE_PREFIX: 'huna7_',
  DB_NAME: 'Huna7FileSystem',
  DB_VERSION: 1,

  // Auth
  MIN_PASSWORD_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30000, // 30s

  // Boot timing (ms)
  BOOT_STAGES: [
    { id: 'firmware',  label: 'Firmware Initialization',     duration: 900 },
    { id: 'storage',   label: 'Storage Mount',               duration: 1100 },
    { id: 'kernel',    label: 'Kernel Startup',              duration: 1000 },
    { id: 'services',  label: 'Service Registration',        duration: 900 },
    { id: 'desktop',   label: 'Desktop Environment Launch',  duration: 750 },
  ],

  // Desktop
  TASKBAR_HEIGHT: 48,
  DOCK_HEIGHT: 72,
  STATUS_BAR_HEIGHT: 28,
  MIN_WINDOW_WIDTH: 280,
  MIN_WINDOW_HEIGHT: 180,
  DEFAULT_WINDOW_WIDTH: 760,
  DEFAULT_WINDOW_HEIGHT: 520,

  // Z-index layers
  Z: {
    DESKTOP:      100,
    WINDOWS:      200,
    DOCK:         900,
    STATUS_BAR:   901,
    CONTEXT_MENU: 1000,
    NOTIFICATIONS:1100,
    MODAL:        1200,
    SPLASH:       9999,
  },

  // File types
  FILE_TYPES: {
    PENCIL: '.pencil',   // VoxScript executable
    NOTE: '.note',       // Editable text
    DATA: '.data',       // Structured data
    THEME: '.theme',     // Theme export
    PKG: '.hpkg',        // Package file
  },

  // App IDs
  APPS: {
    EXPLORER:      'explorer',
    TERMINAL:      'terminal',
    WRITER:        'writer',
    THEMES:        'themes',
    SETTINGS:      'settings',
    CALCULATOR:    'calculator',
    CLOCK:         'clock',
    MEDIA:         'media',
    BROWSER:       'orbit',       // Named "Orbit"
    VOXSTUDIO:     'voxstudio',
    MONITOR:       'monitor',
    NOTES:         'notes',
    IMAGES:        'images',
    AUDIO:         'audio',
    WORKSPACE:     'workspace',
    PACKAGECENTER: 'packagecenter',
  },

  // Default wallpapers
  WALLPAPERS: [
    'gradient-aurora',
    'gradient-midnight',
    'gradient-dusk',
    'gradient-forest',
    'gradient-ocean',
  ],

  // Default theme
  DEFAULT_THEME: {
    name: 'Midnight',
    accent: '#5E7FFF',
    accentAlt: '#A78BFA',
    bg: '#0a0a0f',
    bgPanel: 'rgba(18,18,28,0.85)',
    bgGlass: 'rgba(255,255,255,0.06)',
    bgGlassHover: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.10)',
    text: '#F0F0F8',
    textMuted: 'rgba(240,240,248,0.55)',
    radius: '12px',
    radiusSm: '8px',
    radiusLg: '18px',
    blur: '24px',
    shadow: '0 8px 32px rgba(0,0,0,0.45)',
    shadowSm: '0 2px 12px rgba(0,0,0,0.35)',
    fontDisplay: "'SF Pro Display', -apple-system, 'Segoe UI', sans-serif",
    fontMono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    animSpeed: '220ms',
    wallpaper: 'gradient-aurora',
  },
};

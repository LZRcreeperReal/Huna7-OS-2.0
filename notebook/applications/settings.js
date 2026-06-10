/* =====================================================
   HUNA7-OS — APPS: SETTINGS
   System settings. Appearance etc.
   Now fully safe for chalk.spawn() (safe Object.entries).
 ===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Settings = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Settings', appId: 'settings', width: 700, height: 520,
    });
    contentEl.style.cssText = 'display:flex;';

    const SECTIONS = [ /* exact same as original */ ];

    let activeSection = 'appearance';

    // Sidebar + renderSidebar (unchanged)
    const sidebar = document.createElement('div');
    // ... (sidebar code exact same) ...

    const content = document.createElement('div');
    content.style.cssText = 'flex:1;overflow-y:auto;padding:20px 24px;';

    // ... (mkSection, mkRow, mkToggle, mkSelect all unchanged) ...

    const renderContent = () => {
      content.innerHTML = '';

      if (activeSection === 'appearance') {
        const sec = mkSection('Appearance');
        const theme = Huna7.Encyclopedia.getCurrent();
        const themesObj = Huna7.Encyclopedia.getAllThemes() || {};  // safe
        const themes = Object.entries(themesObj);  // now safe

        const themeGrid = document.createElement('div');
        // ... (theme cards exactly the same) ...

        // wallpaper section (unchanged)
        const wallpaperSec = document.createElement('div');
        // ... (buttons exact same) ...

        sec.append(themeGrid, wallpaperSec, btn);
        content.appendChild(sec);
      } else if (/* other sections */ ) {
        // ... (all other if/else blocks exactly the same) ...
      }
    };

    renderSidebar();
    renderContent();
    contentEl.append(sidebar, content);

    return { windowId: id };
  };

  return { launch };
})();

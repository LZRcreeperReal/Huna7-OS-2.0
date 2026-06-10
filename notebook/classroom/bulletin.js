/* =====================================================
   HUNA7-OS — BULLETIN
   Notification center. System notifications, history.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Bulletin = (() => {
  let _container = null;
  const _history = [];
  const MAX_HISTORY = 50;
  const MAX_VISIBLE = 4;
  let _active = [];

  const init = (root) => {
    _container = document.createElement('div');
    _container.style.cssText = `position:fixed;right:16px;top:44px;
      z-index:${Huna7.CONSTANTS.Z.NOTIFICATIONS};
      display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;`;
    root.appendChild(_container);
  };

  const show = (title, message = '', type = 'info', duration = 4000) => {
    const id = Huna7.Helpers.generateId('notif');
    const entry = { id, title, message, type, time: Date.now() };
    _history.unshift(entry);
    if (_history.length > MAX_HISTORY) _history.pop();
    Huna7.Binder.emit('notification', entry);

    if (_active.length >= MAX_VISIBLE) {
      const oldest = _active.shift();
      _dismiss(oldest);
    }

    const el = _buildNotif(entry);
    _container.appendChild(el);
    _active.push(id);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });

    if (duration > 0) {
      Huna7.Schedule.delay(() => _dismiss(id), duration);
    }

    return id;
  };

  const _buildNotif = (entry) => {
    const colors = { info: 'var(--h7-accent)', success: '#4CAF50', warning: '#FF9800', error: '#F44336' };
    const icons = { info: 'info', success: 'check', warning: 'warning', error: 'warning' };
    const el = document.createElement('div');
    el.id = 'notif-' + entry.id;
    el.style.cssText = `
      min-width:280px;max-width:340px;padding:12px 14px;
      background:var(--h7-bg-panel);
      backdrop-filter:blur(var(--h7-blur));-webkit-backdrop-filter:blur(var(--h7-blur));
      border:1px solid var(--h7-border);border-left:3px solid ${colors[entry.type] || colors.info};
      border-radius:var(--h7-radius);box-shadow:var(--h7-shadow);
      pointer-events:all;cursor:pointer;
      opacity:0;transform:translateX(20px);
      transition:opacity 250ms ease,transform 250ms cubic-bezier(0.2,0.8,0.3,1);
    `;
    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="color:${colors[entry.type]||colors.info};flex-shrink:0;margin-top:1px;">
          ${Huna7.Glossary.get(icons[entry.type]||'info', 14)}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;margin-bottom:2px;">${Huna7.Helpers.escapeHtml(entry.title)}</div>
          ${entry.message ? `<div style="font-size:12px;color:var(--h7-text-muted);line-height:1.4;">${Huna7.Helpers.escapeHtml(entry.message)}</div>` : ''}
        </div>
        <div style="color:var(--h7-text-muted);flex-shrink:0;">${Huna7.Glossary.get('close', 12)}</div>
      </div>
    `;
    el.addEventListener('click', () => _dismiss(entry.id));
    return el;
  };

  const _dismiss = (id) => {
    const el = document.getElementById('notif-' + id);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => { el.remove(); _active = _active.filter(a => a !== id); }, 250);
  };

  const getHistory = () => [..._history];
  const clearHistory = () => { _history.length = 0; };

  // Convenience methods
  const info    = (title, msg, dur) => show(title, msg, 'info', dur);
  const success = (title, msg, dur) => show(title, msg, 'success', dur);
  const warning = (title, msg, dur) => show(title, msg, 'warning', dur);
  const error   = (title, msg, dur) => show(title, msg, 'error', dur);

  return { init, show, info, success, warning, error, getHistory, clearHistory };
})();

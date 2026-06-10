/* =====================================================
   HUNA7-OS — APPS: CALCULATOR
   Scientific calculator with history.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.Calculator = (() => {
  const launch = (pid, options = {}) => {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Calculator', appId: 'calculator', width: 320, height: 520, resizable: false,
    });

    let expr = '';
    let result = '0';
    let lastResult = null;
    let history = [];

    contentEl.style.cssText = 'display:flex;flex-direction:column;background:#111118;';

    // Display
    const display = document.createElement('div');
    display.style.cssText = 'padding:16px 18px 8px;text-align:right;flex-shrink:0;';
    const exprEl = document.createElement('div');
    exprEl.style.cssText = 'font-size:13px;color:var(--h7-text-muted);min-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    const resultEl = document.createElement('div');
    resultEl.style.cssText = 'font-size:36px;font-weight:300;color:var(--h7-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.02em;';
    resultEl.textContent = '0';
    display.append(exprEl, resultEl);

    // History panel
    const histPanel = document.createElement('div');
    histPanel.style.cssText = 'max-height:80px;overflow-y:auto;padding:0 14px 4px;flex-shrink:0;';

    // Buttons
    const pad = document.createElement('div');
    pad.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:8px;flex:1;';

    const BUTTONS = [
      { label: 'AC',   type: 'fn',   action: clear },
      { label: '+/-',  type: 'fn',   action: () => append('(-1)*') },
      { label: '%',    type: 'fn',   action: () => append('%') },
      { label: '÷',    type: 'op',   action: () => append('/') },
      { label: '7',    type: 'num',  action: () => append('7') },
      { label: '8',    type: 'num',  action: () => append('8') },
      { label: '9',    type: 'num',  action: () => append('9') },
      { label: '×',    type: 'op',   action: () => append('*') },
      { label: '4',    type: 'num',  action: () => append('4') },
      { label: '5',    type: 'num',  action: () => append('5') },
      { label: '6',    type: 'num',  action: () => append('6') },
      { label: '−',    type: 'op',   action: () => append('-') },
      { label: '1',    type: 'num',  action: () => append('1') },
      { label: '2',    type: 'num',  action: () => append('2') },
      { label: '3',    type: 'num',  action: () => append('3') },
      { label: '+',    type: 'op',   action: () => append('+') },
      { label: '0',    type: 'num',  action: () => append('0'), wide: true },
      { label: '.',    type: 'num',  action: () => append('.') },
      { label: '=',    type: 'eq',   action: calculate },
    ];

    // Scientific row
    const sciRow = document.createElement('div');
    sciRow.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:2px 8px 0;flex-shrink:0;';
    const SCI_BTNS = [
      { label: 'sin', action: () => append('Math.sin(') },
      { label: 'cos', action: () => append('Math.cos(') },
      { label: 'tan', action: () => append('Math.tan(') },
      { label: '√',   action: () => append('Math.sqrt(') },
      { label: 'π',   action: () => append('Math.PI') },
      { label: 'x²',  action: () => append('**2') },
      { label: 'x³',  action: () => append('**3') },
      { label: 'log', action: () => append('Math.log10(') },
      { label: 'ln',  action: () => append('Math.log(') },
      { label: '(',   action: () => append('(') },
    ];
    SCI_BTNS.forEach(b => {
      const btn = mkBtn(b.label, 'sci', b.action);
      btn.style.fontSize = '11px';
      sciRow.appendChild(btn);
    });

    function mkBtn(label, type, action) {
      const colors = { num: 'rgba(255,255,255,0.08)', op: '#5E7FFF', eq: '#5E7FFF', fn: 'rgba(255,255,255,0.14)', sci: 'rgba(255,255,255,0.05)' };
      const hov = { num: 'rgba(255,255,255,0.14)', op: '#7a9aff', eq: '#7a9aff', fn: 'rgba(255,255,255,0.2)', sci: 'rgba(255,255,255,0.10)' };
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `padding:0;height:56px;border:none;border-radius:8px;cursor:pointer;
        font-size:18px;font-weight:400;color:var(--h7-text);background:${colors[type] || colors.num};
        transition:background 120ms,transform 80ms;`;
      btn.addEventListener('mouseenter', () => btn.style.background = hov[type] || hov.num);
      btn.addEventListener('mouseleave', () => btn.style.background = colors[type] || colors.num);
      btn.addEventListener('pointerdown', () => btn.style.transform = 'scale(0.93)');
      btn.addEventListener('pointerup', () => { btn.style.transform = ''; action(); });
      return btn;
    }

    BUTTONS.forEach(b => {
      const btn = mkBtn(b.label, b.type, b.action);
      if (b.wide) { btn.style.gridColumn = 'span 2'; }
      pad.appendChild(btn);
    });

    contentEl.append(display, histPanel, sciRow, pad);

    function append(val) {
      if (lastResult !== null && /[0-9]/.test(val)) { expr = ''; lastResult = null; }
      expr += val;
      exprEl.textContent = expr;
      try {
        const v = evaluate(expr);
        if (isFinite(v)) resultEl.textContent = formatNum(v);
      } catch {}
    }

    function clear() {
      expr = ''; result = '0'; lastResult = null;
      resultEl.textContent = '0'; exprEl.textContent = '';
    }

    function calculate() {
      if (!expr) return;
      try {
        const val = evaluate(expr);
        if (!isFinite(val)) { resultEl.textContent = 'Error'; return; }
        const formatted = formatNum(val);
        history.unshift({ expr, result: formatted });
        if (history.length > 10) history.pop();
        renderHistory();
        resultEl.textContent = formatted;
        exprEl.textContent = expr + ' =';
        lastResult = val;
        expr = formatted;
      } catch { resultEl.textContent = 'Error'; }
    }

    function evaluate(e) {
      // Safe math eval - only allow math operations
      const safe = e.replace(/[^0-9+\-*/().%,\s]/g, (m) => {
        const allowed = ['Math.sin(','Math.cos(','Math.tan(','Math.sqrt(','Math.log(','Math.log10(','Math.PI','Math.E','Math.abs(','**'];
        return allowed.some(a => e.includes(a)) ? m : '';
      });
      // eslint-disable-next-line no-new-func
      return Function('"use strict"; return (' + safe + ')')();
    }

    function formatNum(n) {
      if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6);
      const s = parseFloat(n.toFixed(10)).toString();
      return s.length > 14 ? parseFloat(n.toPrecision(10)).toString() : s;
    }

    function renderHistory() {
      histPanel.innerHTML = history.slice(0, 4).map(h =>
        `<div style="font-size:11px;color:var(--h7-text-muted);text-align:right;padding:1px 0;cursor:pointer;"
          onclick="this.closest('div[style]')._result='${h.result}'"
        >${h.expr} = <span style="color:var(--h7-text);">${h.result}</span></div>`
      ).join('');
      histPanel.querySelectorAll('div').forEach((el, i) => {
        el.addEventListener('click', () => { expr = history[i].result; exprEl.textContent = history[i].expr + ' ='; resultEl.textContent = history[i].result; lastResult = parseFloat(history[i].result); });
      });
    }

    // Keyboard input
    const onKey = (e) => {
      if (!document.getElementById(id)) { document.removeEventListener('keydown', onKey); return; }
      const key = e.key;
      if (/[0-9+\-*/.()]/.test(key)) append(key);
      else if (key === 'Enter' || key === '=') calculate();
      else if (key === 'Escape' || key === 'c') clear();
      else if (key === 'Backspace') { expr = expr.slice(0, -1); exprEl.textContent = expr; if (!expr) resultEl.textContent = '0'; }
    };
    document.addEventListener('keydown', onKey);

    return { windowId: id };
  };

  return { launch };
})();

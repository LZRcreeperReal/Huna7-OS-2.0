/* =====================================================
   HUNA7-OS — VOXSCRIPT: DEBUGGER
   Breakpoints, stack traces, variable inspection.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Debugger = (() => {
  let _breakpoints = new Set();
  let _watchVars = new Set();
  let _log = [];
  let _onBreak = null;
  let _onOutput = null;
  const MAX_LOG = 500;

  const setBreakpoint = (line) => { _breakpoints.add(line); };
  const clearBreakpoint = (line) => { _breakpoints.delete(line); };
  const clearAllBreakpoints = () => { _breakpoints.clear(); };
  const getBreakpoints = () => Array.from(_breakpoints);
  const hasBreakpoint = (line) => _breakpoints.has(line);

  const watchVariable = (name) => { _watchVars.add(name); };
  const unwatchVariable = (name) => { _watchVars.delete(name); };
  const getWatched = () => Array.from(_watchVars);

  const log = (entry) => {
    _log.push({ ...entry, timestamp: Date.now() });
    if (_log.length > MAX_LOG) _log.shift();
    if (_onOutput) _onOutput(entry);
  };

  const getLogs = (limit = 100) => _log.slice(-limit);
  const clearLogs = () => { _log = []; };

  const onBreak = (fn) => { _onBreak = fn; };
  const onOutput = (fn) => { _onOutput = fn; };

  // Run with debug mode
  const runDebug = async (source, outputFn) => {
    clearLogs();
    const capturedOutput = [];

    const debugOutput = (line) => {
      const entry = { type: 'output', text: line };
      log(entry);
      capturedOutput.push(line);
      if (outputFn) outputFn(line);
    };

    // Validate first
    const validation = Huna7.VoxScript.Runtime.validate(source);
    if (!validation.valid) {
      validation.errors.forEach(e => log({ type: 'error', text: e }));
      return { success: false, output: capturedOutput, errors: validation.errors };
    }

    log({ type: 'info', text: 'Debug session started' });
    const result = await Huna7.VoxScript.Runtime.run(source, { outputFn: debugOutput });
    log({ type: 'info', text: result.success ? 'Execution complete' : 'Execution failed' });
    result.errors.forEach(e => log({ type: 'error', text: e }));
    return result;
  };

  // Format stack trace from error
  const formatTrace = (err) => {
    if (!err) return '';
    const lines = [`Error: ${err.message || err}`];
    if (err.stack) {
      const relevant = err.stack.split('\n').filter(l => l.includes('VoxScript') || l.includes('machine'));
      lines.push(...relevant.slice(0, 5));
    }
    return lines.join('\n');
  };

  // Inspect a value (pretty print)
  const inspect = (val, depth = 2) => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'function') return `[fn ${val.name || 'anon'}]`;
    if (typeof val !== 'object') return JSON.stringify(val);
    if (depth === 0) return '[Object]';
    if (Array.isArray(val)) {
      const items = val.slice(0, 10).map(v => inspect(v, depth - 1));
      const suffix = val.length > 10 ? `, ...+${val.length-10}` : '';
      return `[${items.join(', ')}${suffix}]`;
    }
    const entries = Object.entries(val).slice(0, 10).map(([k, v]) => `${k}: ${inspect(v, depth - 1)}`);
    return `{ ${entries.join(', ')} }`;
  };

  // Syntax-highlight VoxScript source (returns HTML)
  const highlight = (source) => {
    const keywords = ['let','fn','if','else','while','for','in','return','break','continue','try','catch','throw','run','background','loop','true','false','null','import'];
    const builtins = ['print','log','notify','range','len','type','fs','system','process','event','theme','math','time','str','json'];

    let html = Huna7.Helpers.escapeHtml(source);
    // Strings
    html = html.replace(/(&#039;|&quot;)(.*?)\1/g, '<span class="vox-string">$1$2$1</span>');
    html = html.replace(/(&quot;.*?&quot;)/g, '<span class="vox-string">$1</span>');
    // Numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="vox-number">$1</span>');
    // Comments
    html = html.replace(/(#[^\n]*)/g, '<span class="vox-comment">$1</span>');
    // Keywords
    keywords.forEach(kw => {
      html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="vox-keyword">$1</span>');
    });
    // Builtins
    builtins.forEach(b => {
      html = html.replace(new RegExp(`\\b(${b})\\b`, 'g'), '<span class="vox-builtin">$1</span>');
    });
    return html;
  };

  const getHighlightCSS = () => `
    .vox-keyword { color: var(--h7-accent-alt); font-weight: 600; }
    .vox-string  { color: #98c379; }
    .vox-number  { color: #d19a66; }
    .vox-comment { color: var(--h7-text-muted); font-style: italic; }
    .vox-builtin { color: var(--h7-accent); }
  `;

  return {
    setBreakpoint, clearBreakpoint, clearAllBreakpoints, getBreakpoints, hasBreakpoint,
    watchVariable, unwatchVariable, getWatched,
    log, getLogs, clearLogs, onBreak, onOutput,
    runDebug, formatTrace, inspect, highlight, getHighlightCSS,
  };
})();

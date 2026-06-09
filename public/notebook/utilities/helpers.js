/* =====================================================
   HUNA7-OS — HELPERS
   Shared utility functions across all modules.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Helpers = (() => {

  const generateId = (prefix = 'h7') => {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateTime = (ts) => `${formatDate(ts)}, ${formatTime(ts)}`;

  const formatUptime = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const lerp = (a, b, t) => a + (b - a) * t;

  const debounce = (fn, delay) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  };

  const throttle = (fn, limit) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= limit) { lastCall = now; fn(...args); }
    };
  };

  const escapeHtml = (str) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const createElement = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('data-')) el.setAttribute(k, v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el[k] = v;
    });
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c instanceof Node) el.appendChild(c);
    });
    return el;
  };

  const removeElement = (el) => { if (el && el.parentNode) el.parentNode.removeChild(el); };

  const getFileExtension = (name) => {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i) : '';
  };

  const getFileName = (path) => path.split('/').pop();

  const getDirPath = (path) => {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  };

  const normalizePath = (path) => {
    const parts = path.replace(/\/+/g, '/').split('/').filter(Boolean);
    const resolved = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else if (p !== '.') resolved.push(p);
    }
    return '/' + resolved.join('/');
  };

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  const deepMerge = (target, source) => {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  };

  const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  };

  return {
    generateId, formatBytes, formatDate, formatTime, formatDateTime, formatUptime,
    clamp, lerp, debounce, throttle, escapeHtml, createElement, removeElement,
    getFileExtension, getFileName, getDirPath, normalizePath,
    deepClone, deepMerge, isObject, sleep, randomBetween, hexToRgba, copyToClipboard,
  };
})();

/* =====================================================
   HUNA7-OS — SECURITY
   Password hashing (PBKDF2), auth utilities.
===================================================== */
window.Huna7 = window.Huna7 || {};

Huna7.Security = (() => {

  // Generate a random salt (hex string)
  const generateSalt = () => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // PBKDF2 hash via Web Crypto API
  const hashPassword = async (password, salt) => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const saltBytes = encoder.encode(salt);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
      keyMaterial, 256
    );
    return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Create new credential record
  const createCredential = async (username, password) => {
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    return { username, salt, hash, createdAt: Date.now() };
  };

  // Verify password against stored credential
  const verifyPassword = async (password, credential) => {
    const hash = await hashPassword(password, credential.salt);
    return hash === credential.hash;
  };

  // Validate password strength
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < Huna7.CONSTANTS.MIN_PASSWORD_LENGTH)
      errors.push(`Must be at least ${Huna7.CONSTANTS.MIN_PASSWORD_LENGTH} characters`);
    return { valid: errors.length === 0, errors };
  };

  // Progressive login delay (returns ms to wait based on attempt count)
  const getLoginDelay = (attempts) => {
    if (attempts <= 1) return 0;
    if (attempts <= 3) return 1000;
    if (attempts <= 5) return 3000;
    return Huna7.CONSTANTS.LOCKOUT_DURATION;
  };

  // Sanitize username
  const sanitizeUsername = (name) => {
    return name.trim().replace(/[^a-zA-Z0-9_\-. ]/g, '').slice(0, 32);
  };

  // Generate session token
  const generateSessionToken = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return {
    generateSalt, hashPassword, createCredential, verifyPassword,
    validatePassword, getLoginDelay, sanitizeUsername, generateSessionToken,
  };
})();

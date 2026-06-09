/* =====================================================
   HUNA7-OS — NOTEBOOK: PROFILE
   User identity management. Single source of truth
   for all user-specific identity data.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Notebook = Huna7.Notebook || {};

Huna7.Notebook.Profile = (() => {
  const STORAGE_KEY = 'profile';

  let _profile = null;

  const DEFAULT_PROFILE = {
    username: '',
    displayName: '',
    avatar: null,           // base64 or null
    createdAt: null,
    lastLogin: null,
    loginCount: 0,
    bio: '',
    preferences: {},
  };

  // Create a new profile (first-time setup)
  const createProfile = async (username, extra = {}) => {
    _profile = {
      ...DEFAULT_PROFILE,
      username: Huna7.Security.sanitizeUsername(username),
      displayName: username,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      loginCount: 1,
      ...extra,
    };
    _persist();
    Huna7.Binder.emit('profile:created', { username: _profile.username });
    return { ..._profile };
  };

  // Load profile from storage
  const loadProfile = () => {
    const stored = Huna7.Storage.get(STORAGE_KEY);
    if (!stored) return null;
    _profile = { ...DEFAULT_PROFILE, ...stored };
    return { ..._profile };
  };

  // Update profile fields
  const updateProfile = (updates = {}) => {
    if (!_profile) return null;
    _profile = { ..._profile, ...updates, username: _profile.username }; // username immutable
    _persist();
    Huna7.Binder.emit('profile:updated', { ..._profile });
    return { ..._profile };
  };

  // Record a login
  const recordLogin = () => {
    if (!_profile) return;
    _profile.lastLogin = Date.now();
    _profile.loginCount = (_profile.loginCount || 0) + 1;
    _persist();
  };

  // Delete profile entirely
  const deleteProfile = () => {
    _profile = null;
    Huna7.Storage.remove(STORAGE_KEY);
    Huna7.Binder.emit('profile:deleted', {});
  };

  // Get current profile (read-only copy)
  const getProfile = () => _profile ? { ..._profile } : null;

  const hasProfile = () => !!Huna7.Storage.get(STORAGE_KEY);

  const getUsername = () => _profile?.username || '';

  const getDisplayName = () => _profile?.displayName || _profile?.username || '';

  // Set avatar (base64 string)
  const setAvatar = (base64) => updateProfile({ avatar: base64 });

  const _persist = () => {
    if (_profile) Huna7.Storage.set(STORAGE_KEY, _profile);
  };

  return {
    createProfile, loadProfile, updateProfile, deleteProfile,
    recordLogin, getProfile, hasProfile, getUsername, getDisplayName, setAvatar,
  };
})();

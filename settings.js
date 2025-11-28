(function () {
  const STORAGE_KEYS = {
    profile: 'settings.profile',
    privacy: 'settings.privacy',
    appearance: 'settings.appearance',
    security: 'settings.security',
    offline: 'settings.offline'
  };

  const ui = {
    profileForm: document.getElementById('profileForm'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileStatus: document.getElementById('profileStatus'),
    profileNote: document.getElementById('profileNote'),

    privacyForm: document.getElementById('privacyForm'),
    privacyDiscoverable: document.getElementById('privacyDiscoverable'),
    privacyPublicFeed: document.getElementById('privacyPublicFeed'),
    privacyRoomInvites: document.getElementById('privacyRoomInvites'),
    privacyNote: document.getElementById('privacyNote'),

    appearanceForm: document.getElementById('appearanceForm'),
    themeChoice: document.getElementById('themeChoice'),
    appearanceAnimations: document.getElementById('appearanceAnimations'),
    appearanceHighContrast: document.getElementById('appearanceHighContrast'),
    appearanceNote: document.getElementById('appearanceNote'),

    securityForm: document.getElementById('securityForm'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    securityNote: document.getElementById('securityNote'),

    refreshOffline: document.getElementById('refreshOffline'),
    clearOffline: document.getElementById('clearOffline'),
    exportData: document.getElementById('exportData'),
    storageNote: document.getElementById('storageNote'),
    offlineUpdated: document.getElementById('offlineUpdated')
  };

  const profileData = load(STORAGE_KEYS.profile, {
    name: '',
    email: '',
    status: ''
  });

  const privacyData = load(STORAGE_KEYS.privacy, {
    discoverable: true,
    publicFeed: true,
    allowInvites: true
  });

  const appearanceData = load(STORAGE_KEYS.appearance, {
    theme: 'ocean',
    animations: true,
    highContrast: false
  });

  const securityData = load(STORAGE_KEYS.security, {
    password: '',
    updatedAt: null
  });

  const offlineData = load(STORAGE_KEYS.offline, {
    lastRefresh: null
  });

  hydrateProfile();
  hydratePrivacy();
  hydrateAppearance();
  hydrateOffline();

  if (ui.profileForm) {
    ui.profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextProfile = {
        name: (ui.profileName.value || '').trim(),
        email: (ui.profileEmail.value || '').trim(),
        status: (ui.profileStatus.value || '').trim()
      };
      save(STORAGE_KEYS.profile, nextProfile);
      setNote(ui.profileNote, 'Profile saved.');
      trySyncAccount(nextProfile);
    });
  }

  if (ui.privacyForm) {
    ui.privacyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextPrivacy = {
        discoverable: Boolean(ui.privacyDiscoverable.checked),
        publicFeed: Boolean(ui.privacyPublicFeed.checked),
        allowInvites: Boolean(ui.privacyRoomInvites.checked)
      };
      save(STORAGE_KEYS.privacy, nextPrivacy);
      setNote(ui.privacyNote, 'Privacy settings updated.');
    });
  }

  if (ui.appearanceForm) {
    ui.appearanceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextAppearance = {
        theme: ui.themeChoice.value || 'ocean',
        animations: Boolean(ui.appearanceAnimations.checked),
        highContrast: Boolean(ui.appearanceHighContrast.checked)
      };
      save(STORAGE_KEYS.appearance, nextAppearance);
      applyAppearance(nextAppearance);
      setNote(ui.appearanceNote, 'Appearance saved.');
    });
  }

  if (ui.securityForm) {
    ui.securityForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const current = ui.currentPassword.value;
      const next = ui.newPassword.value;
      const confirm = ui.confirmPassword.value;
      if (!next || next.length < 6) {
        setNote(ui.securityNote, 'Password must be at least 6 characters.');
        return;
      }
      if (next !== confirm) {
        setNote(ui.securityNote, 'Passwords do not match.');
        return;
      }
      if (securityData.password) {
        const match = comparePasswords(current, securityData.password);
        if (!match) {
          setNote(ui.securityNote, 'Current password is incorrect.');
          return;
        }
      }
      const encoded = encodePassword(next);
      securityData.password = encoded;
      securityData.updatedAt = Date.now();
      save(STORAGE_KEYS.security, securityData);
      ui.currentPassword.value = '';
      ui.newPassword.value = '';
      ui.confirmPassword.value = '';
      setNote(ui.securityNote, 'Password updated successfully.');
    });
  }

  if (ui.refreshOffline) {
    ui.refreshOffline.addEventListener('click', async () => {
      setNote(ui.storageNote, 'Refreshing offline cache…');
      try {
        await updateServiceWorker();
        offlineData.lastRefresh = Date.now();
        save(STORAGE_KEYS.offline, offlineData);
        hydrateOffline();
        setNote(ui.storageNote, 'Offline cache refreshed.');
      } catch (err) {
        console.error(err);
        setNote(ui.storageNote, 'Could not refresh cache.');
      }
    });
  }

  if (ui.clearOffline) {
    ui.clearOffline.addEventListener('click', async () => {
      setNote(ui.storageNote, 'Clearing cached data…');
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        offlineData.lastRefresh = null;
        save(STORAGE_KEYS.offline, offlineData);
        hydrateOffline();
        setNote(ui.storageNote, 'Offline cache cleared.');
      } catch (err) {
        console.error(err);
        setNote(ui.storageNote, 'Failed to clear cache.');
      }
    });
  }

  if (ui.exportData) {
    ui.exportData.addEventListener('click', () => {
      const payload = {
        profile: load(STORAGE_KEYS.profile, {}),
        privacy: load(STORAGE_KEYS.privacy, {}),
        appearance: load(STORAGE_KEYS.appearance, {}),
        security: { updatedAt: securityData.updatedAt ? new Date(securityData.updatedAt).toISOString() : null },
        offline: load(STORAGE_KEYS.offline, {})
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'carp-settings-export.json';
      document.body.appendChild(link);
      link.click();
      requestAnimationFrame(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      setNote(ui.storageNote, 'Export file downloaded.');
    });
  }

  function hydrateProfile() {
    if (!ui.profileName) return;
    ui.profileName.value = profileData.name || '';
    ui.profileEmail.value = profileData.email || '';
    ui.profileStatus.value = profileData.status || '';
  }

  function hydratePrivacy() {
    if (!ui.privacyForm) return;
    ui.privacyDiscoverable.checked = Boolean(privacyData.discoverable);
    ui.privacyPublicFeed.checked = Boolean(privacyData.publicFeed);
    ui.privacyRoomInvites.checked = Boolean(privacyData.allowInvites);
  }

  function hydrateAppearance() {
    if (!ui.appearanceForm) return;
    ui.themeChoice.value = appearanceData.theme || 'ocean';
    ui.appearanceAnimations.checked = Boolean(appearanceData.animations);
    ui.appearanceHighContrast.checked = Boolean(appearanceData.highContrast);
    applyAppearance(appearanceData);
  }

  function hydrateOffline() {
    if (!ui.offlineUpdated) return;
    ui.offlineUpdated.textContent = offlineData.lastRefresh
      ? new Date(offlineData.lastRefresh).toLocaleString()
      : 'never';
  }

  function applyAppearance(prefs) {
    const body = document.body;
    if (!body) return;
    body.dataset.theme = prefs.theme || 'ocean';
    body.dataset.animations = prefs.animations ? 'on' : 'off';
    body.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
  }

  function updateServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve();
    return navigator.serviceWorker.getRegistration()
      .then((registration) => {
        if (!registration) return navigator.serviceWorker.register('sw.js');
        return registration.update();
      });
  }

  function trySyncAccount(profile) {
    try {
      const storage = localStorage.getItem('social.account');
      if (!storage) return;
      const data = JSON.parse(storage);
      if (profile.name) data.username = profile.name;
      if (profile.email) data.email = profile.email;
      localStorage.setItem('social.account', JSON.stringify(data));
    } catch (err) {
      console.warn('Unable to sync account', err);
    }
  }

  function setNote(element, message) {
    if (!element) return;
    element.textContent = message;
    element.classList.add('flash');
    setTimeout(() => element.classList.remove('flash'), 1200);
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error('settings load failed', key, err);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('settings save failed', key, err);
    }
  }

  function encodePassword(raw) {
    return btoa(unescape(encodeURIComponent(raw)));
  }

  function comparePasswords(raw, encoded) {
    if (!encoded) return false;
    return encodePassword(raw) === encoded;
  }
})();

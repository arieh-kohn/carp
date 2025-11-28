(function () {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const statusTarget = document.querySelector('[data-offline-status]');

  function updateStatus(message) {
    if (statusTarget) {
      statusTarget.textContent = message;
    }
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        updateStatus('Offline mode ready');
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch((error) => {
        console.error('Service worker registration failed', error);
        updateStatus('Offline mode unavailable');
      });
  });
})();

/* Carp Host Pages manager */
(function () {
  const STORAGE_KEY = 'carp.hostpages';
  const MAX_ITEMS = 12;

  const form = document.getElementById('hostForm');
  const titleInput = document.getElementById('hostTitle');
  const urlInput = document.getElementById('hostUrl');
  const hint = document.getElementById('hostHint');
  const grid = document.getElementById('hostGrid');
  const clearBtn = document.getElementById('clearHostPages');
  const statusLine = document.querySelector('[data-host-status]');
  const emptyState = grid?.querySelector('[data-empty]');

  let entries = loadEntries();

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let list;
      if (!raw) {
        list = seedDefaults();
      } else {
        const parsed = JSON.parse(raw);
        list = Array.isArray(parsed) && parsed.length ? parsed : seedDefaults();
      }
      const cleaned = stripBundledApps(list);
      if (cleaned.length !== list.length) {
        const fallback = cleaned.length ? cleaned : seedDefaults();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback.slice(0, MAX_ITEMS)));
        return fallback;
      }
      return cleaned;
    } catch (err) {
      console.warn('Failed to parse host entries', err);
      return seedDefaults();
    }
  }

  function seedDefaults() {
    return [
      {
        id: crypto.randomUUID(),
        title: 'Drive Mad 3 mirror',
        url: 'https://drivemad3.io',
        timestamp: Date.now()
      }
    ];
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
    } catch (err) {
      console.warn('Failed to save host entries', err);
    }
  }

  function normaliseUrl(input) {
    if (!input) return '';
    let value = input.trim();
    if (!/^https?:\/\//i.test(value)) {
      value = 'https://' + value;
    }
    try {
      const url = new URL(value);
      return url.href;
    } catch {
      return '';
    }
  }

  function render() {
    if (!grid) return;
    grid.innerHTML = '';
    if (!entries.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'Nothing saved yet. Add a link above.';
      grid.appendChild(p);
      toggleClearButton();
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'host-card';
      article.innerHTML = `
        <header>
          <div>
            <h3>${escapeHTML(entry.title || entry.url)}</h3>
            <a href="${entry.url}" target="_blank" rel="noopener">${entry.url}</a>
          </div>
          <div class="host-card__actions">
            <button class="btn ghost" data-open="${entry.id}" type="button">Open</button>
            <button class="btn danger ghost" data-remove="${entry.id}" type="button">Remove</button>
          </div>
        </header>
        <div class="host-frame">
          <iframe src="${entry.url}" title="${escapeHTML(entry.title || 'Host page')}" loading="lazy"></iframe>
        </div>
      `;
      grid.appendChild(article);
    });

    grid.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entry = entries.find((item) => item.id === btn.dataset.open);
        if (!entry) return;
        window.open(entry.url, '_blank', 'noopener');
      });
    });

    grid.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeEntry(btn.dataset.remove));
    });

    toggleClearButton();
  }

  function toggleClearButton() {
    if (!clearBtn) return;
    clearBtn.disabled = entries.length === 0;
  }

  function addEntry(event) {
    event.preventDefault();
    const url = normaliseUrl(urlInput.value);
    if (!url) {
      updateHint('Enter a valid https:// link.', true);
      return;
    }
    if (entries.some((entry) => entry.url === url)) {
      updateHint('Already saved. Loading existing iframe.', true);
      urlInput.value = '';
      render();
      return;
    }

    const entry = {
      id: crypto.randomUUID(),
      title: titleInput.value.trim().slice(0, 60),
      url,
      timestamp: Date.now()
    };
    entries.unshift(entry);
    entries = entries.slice(0, MAX_ITEMS);
    saveEntries();
    render();
    form.reset();
    updateHint('Saved! Scroll down to see it iframe’d.', false);
  }

  function removeEntry(id) {
    entries = entries.filter((entry) => entry.id !== id);
    saveEntries();
    render();
    updateHint('Removed link.', false);
  }

  function clearAll() {
    if (!entries.length) return;
    if (!confirm('Remove all hosted pages?')) return;
    entries = [];
    saveEntries();
    render();
    updateHint('Cleared everything.', false);
  }

  function updateHint(text, isError) {
    if (hint) {
      hint.textContent = text;
      hint.classList.toggle('error', Boolean(isError));
    }
    if (statusLine) {
      statusLine.textContent = text;
    }
  }

  function escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripBundledApps(list) {
    if (!Array.isArray(list)) return [];
    const appsPage = '/carp-apps.html';
    return list.filter((entry) => typeof entry?.url === 'string' && !entry.url.includes(appsPage));
  }

  function init() {
    render();
    form?.addEventListener('submit', addEntry);
    clearBtn?.addEventListener('click', clearAll);
  }

  init();
})();

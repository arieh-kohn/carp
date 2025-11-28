/* Carp Apps gallery + downloader */
(function () {
  const gallery = document.getElementById('appsGallery');
  const statusLine = document.querySelector('[data-app-status]');

  const APPS = [
    {
      id: 'dev-console',
      name: 'Dev Console Mini',
      tagline: 'Lightweight sandbox for testing HTML, CSS, and JS snippets.',
      tags: ['tool', 'dev', 'console'],
      filename: 'carp-dev-console.html',
      content: buildStandaloneHTML({
        title: 'Carp Dev Console',
        body: `
        <main class="shell">
          <header>
            <h1>Carp Dev Console</h1>
            <p>Run JavaScript against a scratchpad. Results show below.</p>
          </header>
          <section class="panel">
            <textarea id="code" spellcheck="false">// type JS here
console.log("hi")</textarea>
            <div class="panel-actions">
              <button id="runBtn">Run ▶</button>
              <button id="clearBtn">Clear</button>
            </div>
          </section>
          <section class="output" id="output" aria-live="polite"></section>
        </main>
      `,
        script: `
        (function(){
          const code = document.getElementById('code');
          const output = document.getElementById('output');
          document.getElementById('runBtn').addEventListener('click', () => {
            const logs = [];
            const log = (...args) => {
              logs.push(args.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(' '));
            };
            try {
              const fn = new Function('console', code.value);
              fn({ log });
              writeLogs(logs, 'success');
            } catch (err) {
              writeLogs([err.message], 'error');
            }
          });
          document.getElementById('clearBtn').addEventListener('click', () => output.innerHTML = '');
          function writeLogs(lines, kind){
            const block = document.createElement('div');
            block.className = 'log ' + kind;
            block.innerHTML = lines.map(line => '<div>' + line + '</div>').join('');
            output.prepend(block);
          }
        })();
      `,
        styles: `
        body{font-family:system-ui,Segoe UI,sans-serif;background:#051423;color:#f4fbff;margin:0;padding:24px;}
        .shell{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
        textarea{width:100%;height:220px;background:#0b223b;border:1px solid rgba(255,255,255,0.1);color:#f4fbff;font-family:ui-monospace,Consolas,monospace;border-radius:12px;padding:16px;box-sizing:border-box;}
        .panel-actions{display:flex;gap:8px;}
        button{border:none;background:#1d9bf0;color:#051423;font-weight:600;padding:10px 18px;border-radius:999px;cursor:pointer;}
        button#clearBtn{background:rgba(255,255,255,0.1);color:#f4fbff;}
        .output{min-height:120px;padding:16px;background:#071a2f;border-radius:16px;border:1px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:12px;}
        .log{padding:12px;border-radius:12px;background:rgba(255,255,255,0.05);}
        .log.success{border-left:4px solid #16db65;}
        .log.error{border-left:4px solid #ff5c8d;}
      `
      })
    },
    {
      id: 'focus-notes',
      name: 'Focus Pad',
      tagline: 'Simple note cards with autosave and timers.',
      tags: ['notes', 'study'],
      filename: 'carp-focus-pad.html',
      content: buildStandaloneHTML({
        title: 'Carp Focus Pad',
        body: `
        <main class="pad">
          <header>
            <h1>Focus Pad</h1>
            <p>Write quick notes, then start a 5-minute timer to stay on-task.</p>
          </header>
          <section class="note-card">
            <textarea id="noteArea" placeholder="Jot your thoughts…"></textarea>
            <div class="note-actions">
              <button id="timerBtn">Start 5 min timer</button>
              <span id="timerStatus">Timer idle</span>
            </div>
          </section>
        </main>
      `,
        script: `
        (function(){
          const area = document.getElementById('noteArea');
          const status = document.getElementById('timerStatus');
          const btn = document.getElementById('timerBtn');
          const KEY = 'carp.focuspad';
          area.value = localStorage.getItem(KEY) || '';
          area.addEventListener('input', () => localStorage.setItem(KEY, area.value));
          let timer = null;
          btn.addEventListener('click', () => {
            if (timer) {
              clearInterval(timer);
              timer = null;
              status.textContent = 'Timer stopped';
              btn.textContent = 'Start 5 min timer';
              return;
            }
            let seconds = 5 * 60;
            btn.textContent = 'Stop timer';
            updateStatus();
            timer = setInterval(() => {
              seconds--;
              updateStatus();
              if (seconds <= 0) {
                clearInterval(timer);
                timer = null;
                status.textContent = 'Time! Take a stretch break.';
                btn.textContent = 'Start 5 min timer';
                alert('Focus block complete!');
              }
            }, 1000);
            function updateStatus(){
              const mins = Math.floor(seconds / 60);
              const secs = String(seconds % 60).padStart(2,'0');
              status.textContent = 'Time left: ' + mins + ':' + secs;
            }
          });
        })();
      `,
        styles: `
        body{font-family:'Inter',system-ui,sans-serif;background:#030f1d;color:#f2fbff;margin:0;padding:32px;}
        .pad{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
        textarea{width:100%;min-height:240px;border-radius:18px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.02);color:#f2fbff;padding:18px;font-size:1rem;}
        button{border:none;border-radius:999px;background:#22d3ee;color:#012638;font-weight:600;padding:10px 20px;cursor:pointer;}
        .note-card{background:#05182b;border-radius:22px;padding:24px;display:flex;flex-direction:column;gap:16px;box-shadow:0 12px 35px rgba(2,15,31,0.6);}
        .note-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;}
      `
      })
    },
    {
      id: 'retro-clicker',
      name: 'Retro Clicker',
      tagline: 'Mini click game with upgrades and score tracking.',
      tags: ['game', 'idle'],
      filename: 'carp-retro-clicker.html',
      content: buildStandaloneHTML({
        title: 'Retro Clicker',
        body: `
        <main class="clicker">
          <header>
            <h1>Retro Clicker</h1>
            <p>Click to earn credits, then buy boosters.</p>
          </header>
          <section class="scoreboard">
            <div>
              <span class="label">Credits</span>
              <span id="credits" class="value">0</span>
            </div>
            <div>
              <span class="label">Power</span>
              <span id="power" class="value">1</span>
            </div>
          </section>
          <button id="clickBtn" class="main-btn">Click me!</button>
          <section class="shop">
            <h2>Shop</h2>
            <button data-cost="50" data-upgrade="power">Upgrade power (50)</button>
            <button data-cost="120" data-upgrade="auto">Hire auto-clicker (120)</button>
          </section>
        </main>
      `,
        script: `
        (function(){
          let credits = 0;
          let power = 1;
          let autoInterval = null;
          const creditsEl = document.getElementById('credits');
          const powerEl = document.getElementById('power');
          document.getElementById('clickBtn').addEventListener('click', () => {
            credits += power;
            update();
          });
          document.querySelectorAll('.shop button').forEach(btn => {
            btn.addEventListener('click', () => {
              const cost = Number(btn.dataset.cost);
              if (credits < cost) return alert('Need ' + (cost - credits) + ' more credits.');
              credits -= cost;
              if (btn.dataset.upgrade === 'power') {
                power++;
                update();
              } else if (btn.dataset.upgrade === 'auto') {
                if (autoInterval) return alert('Auto-clicker already running!');
                autoInterval = setInterval(() => {
                  credits += power;
                  update();
                }, 1500);
              }
              update();
            });
          });
          function update(){
            creditsEl.textContent = credits;
            powerEl.textContent = power;
          }
        })();
      `,
        styles: `
        body{font-family:'Space Grotesk',system-ui,sans-serif;background:radial-gradient(circle at top,#182848,#03080f);color:#fefefe;margin:0;padding:32px;}
        .clicker{max-width:480px;margin:0 auto;background:rgba(2,8,18,0.8);padding:28px;border-radius:24px;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:16px;}
        .scoreboard{display:flex;justify-content:space-between;background:rgba(255,255,255,0.05);padding:12px 16px;border-radius:16px;}
        .label{display:block;font-size:0.85rem;color:#9fb3c8;}
        .value{font-size:1.5rem;font-weight:700;}
        .main-btn{font-size:1.25rem;padding:16px;border:none;border-radius:999px;background:#ff7a18;color:#050505;font-weight:700;cursor:pointer;}
        .shop{display:flex;flex-direction:column;gap:12px;}
        .shop button{border:none;border-radius:12px;padding:12px;background:#0ea5e9;color:#03121a;font-weight:600;cursor:pointer;}
      `
      })
    }
  ];

  function buildStandaloneHTML({ title, body, script, styles }) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>${styles}</style>
</head>
<body>
${body}
<script>${script}<\/script>
</body>
</html>`;
  }

  function renderApps() {
    if (!gallery) return;
    gallery.innerHTML = '';
    APPS.forEach((app) => {
      const card = document.createElement('article');
      card.className = 'app-card card';
      card.innerHTML = `
        <div class="app-card__body">
          <div>
            <h2>${app.name}</h2>
            <p class="muted">${app.tagline}</p>
          </div>
          <div class="app-tags">
            ${app.tags.map((tag) => `<span class="chip mini">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="app-card__actions">
          <button class="btn primary" data-download="${app.id}">Download mini app</button>
          <button class="btn secondary" data-launch="${app.id}">Launch in browser</button>
        </div>
      `;
      gallery.appendChild(card);
    });

    gallery.querySelectorAll('[data-download]').forEach((btn) => {
      const app = APPS.find((item) => item.id === btn.dataset.download);
      btn.addEventListener('click', () => downloadApp(app));
    });
    gallery.querySelectorAll('[data-launch]').forEach((btn) => {
      const app = APPS.find((item) => item.id === btn.dataset.launch);
      btn.addEventListener('click', () => openApp(app));
    });
  }

  function downloadApp(app) {
    if (!app) return;
    const blob = new Blob([app.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = app.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    announce(`Packaging ${app.name}… check your downloads.`);
  }

  function openApp(app) {
    if (!app) return;
    const win = window.open('', '_blank');
    if (!win) {
      announce('Popup blocked — allow popups to preview the app.');
      return;
    }
    win.document.write(app.content);
    win.document.close();
    announce(`Launched ${app.name} in a new tab.`);
  }

  function announce(message) {
    if (statusLine) {
      statusLine.textContent = message;
    }
  }

  renderApps();
})();

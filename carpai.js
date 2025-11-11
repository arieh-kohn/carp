(function () {
  const STORAGE_KEY = 'carpai.conversation';
  const MAX_HISTORY = 30;

  const ui = {
    chatLog: document.getElementById('chatLog'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput'),
    typing: document.getElementById('typingIndicator'),
    promptButtons: document.querySelectorAll('[data-prompt]'),
    resetBtn: document.getElementById('resetChat'),
    suggestBtn: document.getElementById('suggestBtn')
  };

  const KNOWLEDGE = [
    {
      id: 'games',
      keywords: ['game', 'games', 'play', 'arcade', 'carpfish', 'snake', 'breakout', 'memory'],
      responses: [
        'Dive into <strong>CarpFish</strong> for retro fun: Snake, Breakout, Memory Match, and more live there.',
        'Want a challenge? Visit CarpFish from the top navigation — every game is playable in the browser.',
        'High scores await in CarpFish. Look for the “games” button in the header to start playing.'
      ],
      link: 'carpfish.html'
    },
    {
      id: 'social',
      keywords: ['social', 'post', 'carpstream', 'upload', 'share', 'feed', 'comment', 'like'],
      responses: [
        'CarpStream lets you upload mp4, mov, webm, png, jpg, and gif files up to 5MB. Hit “new post” to begin.',
        'Ready to share something? Go to CarpStream and press “new post” — you can pick a file and add a caption.',
        'Looking for reactions and comments? CarpStream is the social hub. Try it from the navigation bar.'
      ],
      link: 'social.html'
    },
    {
      id: 'account',
      keywords: ['account', 'profile', 'settings', 'password', 'privacy', 'email', 'username'],
      responses: [
        'Manage your profile, email, and privacy switches in the <strong>Settings</strong> hub.',
        'Need to update details or switch themes? The Settings page has controls for privacy, appearance, and more.',
        'To change your password, open Settings, scroll to Security, and fill in the update form.'
      ],
      link: 'settings.html'
    },
    {
      id: 'fun',
      keywords: ['fact', 'fun', 'joke', 'fish', 'carp'],
      responses: [
        'Fun fact: Carp can remember feeding spots for months — maybe that’s why our games are so sticky.',
        'Why did the carp go viral? Because it always made a splash on CarpStream!',
        'Carp are natural problem solvers. Ask me anything and we’ll tackle it together.'
      ]
    },
    {
      id: 'help',
      keywords: ['help', 'commands', 'options', 'what can you do', 'confused'],
      responses: [
        'I can point you to games, tracks for posting, account tools, or drop a Carp fact. Try “how do I post?”',
        'Need ideas? Ask about “games”, “posting”, “settings”, or say “give me a fun fact”.'
      ]
    }
  ];

  const FALLBACKS = [
    'I’m not sure about that yet, but I can help with games, social posts, or account tools.',
    'That swims outside my pond. Try asking about games, posting, account settings, or for a fun fact.'
  ];

  const SUGGESTIONS = [
    'How do I reset my password?',
    'What formats can I upload to CarpStream?',
    'Show me where the CarpFish games are.',
    'Give me three ideas for a social post.',
    'How do I keep my account private?',
    'Tell me a fish joke.'
  ];

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
      console.warn('Failed to load Carp AI history', err);
      return null;
    }
  }

  function saveHistory(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch (err) {
      console.warn('Failed to save Carp AI history', err);
    }
  }

  function createMessageElement(message) {
    const item = document.createElement('li');
    item.className = `message ${message.role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = message.html;
    item.appendChild(bubble);
    const time = document.createElement('time');
    time.textContent = message.timestamp || 'just now';
    item.appendChild(time);
    return item;
  }

  function renderMessages(messages) {
    ui.chatLog.innerHTML = '';
    messages.forEach((message) => {
      ui.chatLog.appendChild(createMessageElement(message));
    });
    ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
  }

  function normalise(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function buildLinkHTML(text, link) {
    if (!link) return text;
    return `${text} <a href="${link}" class="chat-link">Open link</a>`;
  }

  function classifyMessage(message) {
    const cleaned = normalise(message);
    for (const topic of KNOWLEDGE) {
      if (topic.keywords.some((keyword) => cleaned.includes(keyword))) {
        return topic;
      }
    }
    return null;
  }

  function generateResponse(message, history) {
    const topic = classifyMessage(message);
    if (topic) {
      const text = pick(topic.responses);
      return buildLinkHTML(text, topic.link);
    }

    // leverage recent history to appear contextual
    const lastUser = history.slice().reverse().find((entry) => entry.role === 'user');
    if (lastUser && lastUser.raw && lastUser.raw !== message) {
      return `I'm still thinking about "${lastUser.raw}". Want to clarify what you need about games, social, or settings?`;
    }

    return pick(FALLBACKS);
  }

  function addMessage(messages, role, html, raw) {
    const entry = {
      role,
      html,
      raw: raw || html,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(entry);
    return entry;
  }

  function showTyping(show) {
    if (!ui.typing) return;
    ui.typing.classList.toggle('hidden', !show);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const value = ui.chatInput.value.trim();
    if (!value) return;

    const history = loadHistory() || [];
    addMessage(history, 'user', escapeHTML(value), value);
    renderMessages(history);
    saveHistory(history);
    ui.chatInput.value = '';
    ui.chatInput.focus();

    showTyping(true);
    setTimeout(() => {
      const answer = generateResponse(value, history);
      addMessage(history, 'bot', answer);
      renderMessages(history);
      saveHistory(history);
      showTyping(false);
    }, 260 + Math.random() * 240);
  }

  function handlePrompt(event) {
    const prompt = event.currentTarget?.dataset?.prompt;
    if (!prompt) return;
    ui.chatInput.value = prompt;
    ui.chatInput.focus();
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    const seed = createSeedConversation();
    saveHistory(seed);
    renderMessages(seed);
    ui.chatInput.focus();
  }

  function handleSuggest() {
    ui.chatInput.value = pick(SUGGESTIONS);
    ui.chatInput.focus();
  }

  function escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createSeedConversation() {
    const seed = [
      addMessage([], 'bot', 'Hey there! I’m <strong>Carp AI</strong>. Ask me about games, posting to CarpStream, polishing your profile, or something fun.'),
      addMessage([], 'bot', 'Tip: tap one of the quick prompts on the left if you need inspiration.')
    ];
    return seed;
  }

  function init() {
    const history = loadHistory() || createSeedConversation();
    renderMessages(history);
    saveHistory(history);

    ui.chatForm.addEventListener('submit', handleSubmit);
    ui.promptButtons.forEach((button) => button.addEventListener('click', handlePrompt));
    if (ui.resetBtn) ui.resetBtn.addEventListener('click', handleReset);
    if (ui.suggestBtn) ui.suggestBtn.addEventListener('click', handleSuggest);
  }

  init();
})();

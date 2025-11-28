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
      title: 'Games & challenges',
      keywords: ['game', 'games', 'play', 'arcade', 'carpfish', 'snake', 'breakout', 'memory'],
      responses: [
        'Dive into <strong>CarpFish</strong> for retro fun: Snake, Breakout, Memory Match, and more live there.',
        'Want a challenge? Visit CarpFish from the top navigation - every game is playable in the browser.',
        'High scores await in CarpFish. Look for the "games" button in the header to start playing.'
      ],
      link: 'carpfish.html'
    },
    {
      id: 'social',
      title: 'CarpStream & social',
      keywords: ['social', 'post', 'carpstream', 'upload', 'share', 'feed', 'comment', 'like'],
      responses: [
        'CarpStream lets you upload mp4, mov, webm, png, jpg, and gif files up to 5MB. Hit "new post" to begin.',
        'Ready to share something? Go to CarpStream and press "new post" - you can pick a file and add a caption.',
        'Looking for reactions and comments? CarpStream is the social hub. Try it from the navigation bar.'
      ],
      link: 'social.html'
    },
    {
      id: 'account',
      title: 'Accounts & privacy',
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
      title: 'Fun facts',
      keywords: ['fact', 'fun', 'joke', 'fish', 'carp'],
      responses: [
        'Fun fact: Carp can remember feeding spots for months - maybe that's why our games are so sticky.',
        'Why did the carp go viral? Because it always made a splash on CarpStream!',
        'Carp are natural problem solvers. Ask me anything and we'll tackle it together.'
      ]
    },
    {
      id: 'help',
      title: 'Helper mode',
      keywords: ['help', 'commands', 'options', 'what can you do', 'confused'],
      responses: [
        'I can point you to games, tracks for posting, account tools, or drop a Carp fact. Try "how do I post?"',
        'Need ideas? Ask about "games", "posting", "settings", or say "give me a fun fact".'
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

  const HOW_TO_LIBRARY = [
    {
      id: 'howto-post',
      title: 'Share to CarpStream',
      keywords: ['post', 'upload', 'share', 'carpstream', 'feed', 'video', 'photo'],
      steps: [
        'Open <strong>Social</strong> and choose <em>CarpStream</em>.',
        'Press <strong>New post</strong> then pick a video or image (mp4, mov, webm, png, jpg, gif up to 5MB).',
        'Write a caption, set who can view it, and hit <strong>Publish</strong>.'
      ],
      link: 'social.html'
    },
    {
      id: 'howto-games',
      title: 'Jump into CarpFish',
      keywords: ['play', 'carpfish', 'games', 'arcade', 'game list', 'high score'],
      steps: [
        'Tap the <strong>Games</strong> link in the header or the home banner.',
        'Scroll until you spot a tile you like, then click it to open the game view.',
        'Use the in-game <strong>Restart</strong> button anytime to reset your run.'
      ],
      link: 'carpfish.html'
    },
    {
      id: 'howto-account',
      title: 'Update account & privacy',
      keywords: ['account', 'settings', 'profile', 'privacy', 'password', 'email'],
      steps: [
        'Navigate to the <strong>Settings</strong> page from the top navigation.',
        'Use the <em>Profile</em> card for names, the <em>Security</em> card for passwords, and <em>Privacy</em> for visibility.',
        'Press <strong>Save</strong> on each section so changes stick.'
      ],
      link: 'settings.html'
    },
    {
      id: 'howto-offline',
      title: 'Install offline pack',
      keywords: ['offline', 'download', 'cache', 'install', 'zip'],
      steps: [
        'Visit the <strong>Offline Setup</strong> page.',
        'Click <strong>Download full site</strong> to grab the latest cached package.',
        'After it finishes, open the zip and launch <code>index.html</code> to browse without internet.'
      ],
      link: 'download.html'
    }
  ];

  const IDEA_LIBRARY = {
    social: [
      'Share a timelapse of you chasing a CarpFish high score.',
      'Post a “day in the life” photo collage using the gallery upload.',
      'Record a short tip for beating a tricky level and tag your friends.',
      'Host a mini challenge: ask followers to beat your score and reply with screenshots.',
      'Create a poll about which CarpFish game deserves a tournament.'
    ],
    games: [
      'Speedrun Snake with a self-imposed no-turn-back rule.',
      'Play Breakout but flip controls (use A/D or arrows reversed) for an extra brain twist.',
      'Try Memory Match blindfolded for the first two flips, relying on audio cues.',
      'Combine Doodle Jump with a timer—see how high you reach in 60 seconds.',
      'Attempt Drive Mad levels using only tap controls on a touchpad.'
    ],
    fun: [
      'Write a fish-themed haiku and challenge friends to top it.',
      'Invent a new Carp superhero and describe their powers.',
      'Sketch your ideal CarpFish level layout and post it.',
      'Make a “starter pack” meme for new Carp students.',
      'List five things you love about the community using emoji only.'
    ]
  };

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

  function classifyTopics(message) {
    const cleaned = normalise(message);
    return KNOWLEDGE.filter((topic) =>
      topic.keywords.some((keyword) => cleaned.includes(keyword))
    );
  }

  function detectHowToIntent(message) {
    const cleaned = normalise(message);
    if (!/(how|steps?|guide|instructions?|teach)/.test(cleaned)) return null;
    return HOW_TO_LIBRARY.find((topic) =>
      topic.keywords.some((keyword) => cleaned.includes(keyword))
    ) || null;
  }

  function formatSteps(topic) {
    const steps = topic.steps
      .map((step) => `<li>${step}</li>`)
      .join('');
    return `
      <div class="howto">
        <div class="howto-title">${topic.title}</div>
        <ol>${steps}</ol>
      </div>
    `;
  }

  function detectIdeaIntent(message) {
    const cleaned = normalise(message);
    if (!/(idea|ideas|suggest|prompt|inspire)/.test(cleaned)) return null;
    if (/(post|share|social|feed)/.test(cleaned)) return 'social';
    if (/(game|play|carpfish|arcade)/.test(cleaned)) return 'games';
    return 'fun';
  }

  function pickMany(options, count) {
    const clone = [...options];
    const picks = [];
    while (clone.length && picks.length < count) {
      const index = Math.floor(Math.random() * clone.length);
      picks.push(clone.splice(index, 1)[0]);
    }
    return picks;
  }

  function detectMathIntent(message) {
    const trimmed = message.trim();
    const mathTrigger = trimmed.match(/(?:calc|calculate|what is|solve)\s+(.+)/i);
    if (mathTrigger) return mathTrigger[1];
    if (/^[0-9+\-*/().\s%]+$/.test(trimmed) && /[+\-*/]/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  function evaluateMathExpression(expression) {
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().\s%]/g, '');
      if (!sanitized.trim()) return null;
      const normalized = sanitized.replace(/%/g, '/100');
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${normalized});`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        return Number.parseFloat(result.toFixed(6));
      }
      return null;
    } catch (err) {
      console.warn('Math evaluation failed', err);
      return null;
    }
  }

  function respondMath(expression) {
    const value = evaluateMathExpression(expression);
    if (value === null) {
      return 'I could not solve that equation, but you can try reformatting it with numbers and + - × ÷ symbols only.';
    }
    return `Result: <strong>${value}</strong>`;
  }

  function getLastTopicMeta(history) {
    const last = [...history].reverse().find(
      (entry) => entry.role === 'bot' && entry.meta?.topic
    );
    return last?.meta?.topic || null;
  }

  function contextualResponse(cleanedMessage, history) {
    if (!/(more|another|else|again)/.test(cleanedMessage)) return null;
    const lastTopicId = getLastTopicMeta(history);
    if (!lastTopicId) return null;
    const topic =
      KNOWLEDGE.find((item) => item.id === lastTopicId) ||
      HOW_TO_LIBRARY.find((item) => item.id === lastTopicId);
    if (!topic) return null;
    const html =
      topic.steps ? formatSteps(topic) : buildLinkHTML(pick(topic.responses), topic.link);
    return { html, meta: { topic: topic.id } };
  }

  function respondTopic(topic) {
    const text = pick(topic.responses);
    return buildLinkHTML(text, topic.link);
  }

  function respondMultiTopic(topics) {
    const pairs = topics.slice(0, 2).map((topic) => {
      const text = buildLinkHTML(pick(topic.responses), topic.link);
      return `<strong>${topic.title || topic.id}:</strong> ${text}`;
    });
    return pairs.join('<br><br>');
  }

  function respondIdeas(kind) {
    const ideas = IDEA_LIBRARY[kind];
    if (!ideas || !ideas.length) return null;
    const picks = pickMany(ideas, 3)
      .map((idea) => `<li>${idea}</li>`)
      .join('');
    return `
      <div class="idea-pack">
        <div class="idea-title">Here are some ${kind === 'games' ? 'game' : kind} ideas:</div>
        <ul>${picks}</ul>
      </div>
    `;
  }

  function generateResponse(message, history) {
    const cleaned = normalise(message);

    const mathExpr = detectMathIntent(message);
    if (mathExpr) {
      return { html: respondMath(mathExpr), meta: { topic: 'utility-math' } };
    }

    const howToTopic = detectHowToIntent(message);
    if (howToTopic) {
      const html = formatSteps(howToTopic) + buildLinkHTML('<span>Open helper link</span>', howToTopic.link);
      return { html, meta: { topic: howToTopic.id } };
    }

    const ideaKind = detectIdeaIntent(message);
    if (ideaKind) {
      const html = respondIdeas(ideaKind);
      return { html, meta: { topic: `ideas-${ideaKind}` } };
    }

    const topics = classifyTopics(message);
    if (topics.length === 1) {
      return { html: respondTopic(topics[0]), meta: { topic: topics[0].id } };
    }
    if (topics.length > 1) {
      return { html: respondMultiTopic(topics), meta: { topic: topics[0].id } };
    }

    const contextual = contextualResponse(cleaned, history);
    if (contextual) return contextual;

    // leverage recent history to appear contextual
    const lastUser = history.slice().reverse().find((entry) => entry.role === 'user');
    if (lastUser && lastUser.raw && lastUser.raw !== message) {
      return {
        html: `I'm still thinking about "${lastUser.raw}". Want to clarify what you need about games, social, settings, or offline mode?`,
        meta: { topic: 'follow-up' }
      };
    }

    return { html: pick(FALLBACKS), meta: { topic: 'fallback' } };
  }

  function addMessage(messages, role, html, raw, meta) {
    const entry = {
      role,
      html,
      raw: raw || html,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      meta: meta || null
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
      addMessage(history, 'bot', answer.html, null, answer.meta);
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

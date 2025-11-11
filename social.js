(function () {
  'use strict';

  const STORAGE_KEY = 'social.feed.posts';
  const VOTE_KEY = 'social.feed.votes';
  const ACCOUNT_KEY = 'social.account';

  const LIMITS = {
    caption: 280,
    fileSize: 5 * 1024 * 1024
  };

  const SAMPLE_POSTS = [
    {
      id: 'sample-1',
      caption: 'Need a chill vibe? Check out this lo-fi beat to keep you coding.',
      author: 'CarpStream Team',
      ownerId: 'carpstream-team',
      createdAt: Date.now() - 1000 * 60 * 45,
      source: { type: 'url', value: 'https://www.youtube.com/watch?v=G1IbRujko-A', kind: 'video' },
      likes: 12,
      dislikes: 1,
      reposts: 4,
      comments: [
        { author: 'Kai', body: 'Love this track!', createdAt: Date.now() - 1000 * 60 * 12 },
        { author: 'Nori', body: 'Saving this for my next coding session.', createdAt: Date.now() - 1000 * 60 * 7 }
      ]
    },
    {
      id: 'sample-2',
      caption: 'Carp spotting on a misty morning.',
      author: 'CarpStream Team',
      ownerId: 'carpstream-team',
      createdAt: Date.now() - 1000 * 60 * 90,
      source: { type: 'url', value: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', kind: 'image' },
      likes: 18,
      dislikes: 0,
      reposts: 5,
      comments: [
        { author: 'Mina', body: 'That reflection is amazing.', createdAt: Date.now() - 1000 * 60 * 70 },
        { author: 'River', body: 'Adding this to my inspiration board.', createdAt: Date.now() - 1000 * 60 * 65 }
      ]
    },
    {
      id: 'sample-3',
      caption: 'Throwback clip that never gets old.',
      author: 'CarpStream Team',
      ownerId: 'carpstream-team',
      createdAt: Date.now() - 1000 * 60 * 160,
      source: { type: 'url', value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', kind: 'video' },
      likes: 22,
      dislikes: 3,
      reposts: 8,
      comments: []
    }
  ];

  const ui = {
    viewerMedia: document.getElementById('viewerMedia'),
    viewerEmpty: document.getElementById('viewerEmpty'),
    viewerAuthor: document.getElementById('viewerAuthor'),
    viewerTime: document.getElementById('viewerTime'),
    viewerCaption: document.getElementById('viewerCaption'),
    likeAction: document.getElementById('likeAction'),
    dislikeAction: document.getElementById('dislikeAction'),
    repostAction: document.getElementById('repostAction'),
    shareAction: document.getElementById('shareAction'),
    deleteAction: document.getElementById('deleteAction'),
    fullscreenAction: document.getElementById('fullscreenAction'),
    likeCount: document.getElementById('likeCount'),
    dislikeCount: document.getElementById('dislikeCount'),
    repostCount: document.getElementById('repostCount'),
    commentCount: document.getElementById('commentCount'),
    commentList: document.getElementById('commentList'),
    commentForm: document.getElementById('commentForm'),
    commentInput: document.getElementById('commentInput'),
    postRail: document.getElementById('postRail'),
    todayCount: document.getElementById('todayCount'),
    totalLikes: document.getElementById('totalLikes'),
    openComposer: document.getElementById('openComposer'),
    openComposerRail: document.getElementById('openComposerRail'),
    composerOverlay: document.getElementById('composerOverlay'),
    closeComposer: document.getElementById('closeComposer'),
    cancelComposer: document.getElementById('cancelComposer'),
    composerForm: document.getElementById('composerForm'),
    composerCaption: document.getElementById('composerCaption'),
    composerFile: document.getElementById('composerFile'),
    composerUrl: document.getElementById('composerUrl'),
    composerPreview: document.getElementById('composerPreview'),
    composerThumb: document.getElementById('composerThumb'),
    composerFileName: document.getElementById('composerFileName'),
    clearComposerFile: document.getElementById('clearComposerFile'),
    composerStatus: document.getElementById('composerStatus')
  };

  const state = {
    posts: [],
    votes: {},
    identity: null,
    currentIndex: 0
  };

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Storage read failed', error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Storage write failed', error);
      return false;
    }
  }

  function loadIdentity() {
    const account = readStorage(ACCOUNT_KEY, null);
    if (!account) return null;
    const id = (account.id || account.email || account.username || '').trim().toLowerCase();
    if (!id) return null;
    const fullName = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
    const label = account.username || fullName || account.email || 'Member';
    return {
      id,
      label,
      avatar: account.avatar || null
    };
  }

  function normalizeSource(source) {
    if (!source) return null;
    const kind = source.kind || detectKindFromUrl(source.value);
    return {
      type: source.type || 'url',
      value: source.value || null,
      kind: kind || null,
      name: source.name || null
    };
  }

  function resolveLegacySource(post) {
    if (!post) return null;
    if (post.videoUrl) return { type: 'url', value: post.videoUrl, kind: 'video' };
    if (post.imageUrl) return { type: 'url', value: post.imageUrl, kind: 'image' };
    if (post.localVideo) return { type: 'data', value: post.localVideo, kind: 'video' };
    if (post.localImage) return { type: 'data', value: post.localImage, kind: 'image' };
    return null;
  }

  function normalizePost(post) {
    const source = normalizeSource(post.source || resolveLegacySource(post));
    return {
      id: post.id || 'post-' + Date.now() + Math.random().toString(16).slice(2),
      caption: typeof post.caption === 'string' ? post.caption : '',
      author: post.author || 'Member',
      ownerId: post.ownerId || null,
      createdAt: typeof post.createdAt === 'number' ? post.createdAt : Date.now(),
      source,
      likes: typeof post.likes === 'number' ? post.likes : 0,
      dislikes: typeof post.dislikes === 'number' ? post.dislikes : 0,
      reposts: typeof post.reposts === 'number' ? post.reposts : 0,
      comments: Array.isArray(post.comments) ? post.comments.slice(0) : []
    };
  }

  function loadPosts() {
    const stored = readStorage(STORAGE_KEY, null);
    if (Array.isArray(stored) && stored.length) {
      state.posts = stored.map(normalizePost);
    } else {
      state.posts = SAMPLE_POSTS.map(normalizePost);
      persistPosts();
    }
  }

  function persistPosts() {
    const ok = writeStorage(STORAGE_KEY, state.posts);
    if (ok) refreshStats();
    return ok;
  }

  function refreshStats() {
    if (!ui.todayCount && !ui.totalLikes) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayStart = startOfDay.getTime();
    let today = 0;
    let totalLikes = 0;
    state.posts.forEach((post) => {
      if (post.createdAt >= dayStart) today += 1;
      totalLikes += post.likes || 0;
    });
    if (ui.todayCount) ui.todayCount.textContent = String(today);
    if (ui.totalLikes) ui.totalLikes.textContent = String(totalLikes);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return 'just now';
    if (diff < hour) return Math.floor(diff / minute) + 'm ago';
    if (diff < day) return Math.floor(diff / hour) + 'h ago';
    if (diff < day * 7) return Math.floor(diff / day) + 'd ago';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function highlightRail() {
    if (!ui.postRail) return;
    const rows = ui.postRail.querySelectorAll('li');
    rows.forEach((row, idx) => {
      row.classList.toggle('active', idx === state.currentIndex);
    });
  }

  function renderQueue() {
    if (!ui.postRail) return;
    ui.postRail.innerHTML = '';
    state.posts.forEach((post, index) => {
      const li = document.createElement('li');
      li.className = 'rail-item' + (index === state.currentIndex ? ' active' : '');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rail-button';
      button.dataset.index = String(index);
      button.addEventListener('click', () => loadPost(index));

      const thumb = document.createElement('div');
      thumb.className = 'rail-thumb';

      if (post.source && post.source.kind === 'image' && post.source.value) {
        const img = document.createElement('img');
        img.src = post.source.value;
        img.alt = post.caption || 'Post image';
        thumb.appendChild(img);
        thumb.classList.add('is-image');
        thumb.setAttribute('aria-label', 'Image post');
      } else if (post.source && post.source.kind === 'video') {
        thumb.textContent = '>';
        thumb.classList.add('is-video');
        thumb.setAttribute('aria-label', 'Video post');
      } else if (post.source && post.source.value) {
        thumb.textContent = '*';
        thumb.classList.add('is-video');
        thumb.setAttribute('aria-label', 'Shared link');
      } else {
        thumb.textContent = 'T';
        thumb.classList.add('is-text');
        thumb.setAttribute('aria-label', 'Text post');
      }

      const body = document.createElement('div');
      body.className = 'rail-body';

      const title = document.createElement('div');
      title.className = 'rail-title';
      title.textContent = post.caption ? post.caption.slice(0, 60) : 'Untitled post';

      const time = document.createElement('div');
      time.className = 'rail-time';
      time.textContent = formatTime(post.createdAt);

      body.appendChild(title);
      body.appendChild(time);
      button.appendChild(thumb);
      button.appendChild(body);
      li.appendChild(button);
      ui.postRail.appendChild(li);
    });
  }

  function setViewerEmpty(message) {
    if (ui.viewerMedia) ui.viewerMedia.innerHTML = '';
    if (ui.viewerEmpty) {
      ui.viewerEmpty.textContent = message;
      ui.viewerEmpty.classList.remove('hidden');
    }
  }

  function hideViewerEmpty() {
    if (ui.viewerEmpty) ui.viewerEmpty.classList.add('hidden');
  }

  function loadPost(index) {
    if (!state.posts.length) {
      setViewerEmpty('No posts yet. Be the first to share something.');
      updateActionButtons(null);
      renderComments(null);
      highlightRail();
      return;
    }

    state.currentIndex = Math.max(0, Math.min(index, state.posts.length - 1));
    const post = state.posts[state.currentIndex];

    if (ui.viewerMedia) {
      ui.viewerMedia.innerHTML = '';
      const media = createMediaElement(post.source);
      if (media) {
        hideViewerEmpty();
        ui.viewerMedia.appendChild(media);
      } else {
        setViewerEmpty('No media attached to this post.');
      }
    }

    if (ui.viewerAuthor) ui.viewerAuthor.textContent = post.author || 'Member';
    if (ui.viewerTime) ui.viewerTime.textContent = formatTime(post.createdAt);
    if (ui.viewerCaption) ui.viewerCaption.textContent = post.caption || '';

    updateActionButtons(post);
    renderComments(post);
    highlightRail();
  }

  function createMediaElement(source) {
    if (!source || !source.value) return null;

    if (source.type === 'data') {
      if (source.kind === 'image') {
        const img = document.createElement('img');
        img.src = source.value;
        img.alt = source.name ? 'Uploaded image ' + source.name : 'Uploaded image';
        img.loading = 'lazy';
        return img;
      }
      if (source.kind === 'video') {
        const video = document.createElement('video');
        video.src = source.value;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        return video;
      }
    }

    if (source.kind === 'image') {
      const img = document.createElement('img');
      img.src = source.value;
      img.alt = 'Shared image';
      img.loading = 'lazy';
      return img;
    }

    if (source.kind === 'video') {
      const youtube = normaliseYouTube(source.value);
      if (youtube) {
        const iframe = document.createElement('iframe');
        iframe.src = youtube;
        iframe.title = 'Shared video';
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        return iframe;
      }
      const video = document.createElement('video');
      video.src = source.value;
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      return video;
    }

    const iframe = document.createElement('iframe');
    iframe.src = source.value;
    iframe.loading = 'lazy';
    iframe.title = 'Shared link';
    iframe.allowFullscreen = true;
    return iframe;
  }

  function normaliseYouTube(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1);
        const query = parsed.searchParams.toString();
        return 'https://www.youtube.com/embed/' + id + (query ? '?' + query : '');
      }
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.searchParams.has('v')) {
          return 'https://www.youtube.com/embed/' + parsed.searchParams.get('v');
        }
        if (parsed.pathname.startsWith('/embed/')) return url;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function detectKindFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const value = url.toLowerCase();
    if (/(\.png|\.jpe?g|\.gif|\.webp)(\?|$)/.test(value)) return 'image';
    if (/(\.mp4|\.mov|\.webm)(\?|$)/.test(value)) return 'video';
    if (/youtu\.be|youtube\.com/.test(value)) return 'video';
    return null;
  }

  function updateActionButtons(post) {
    const likeBtn = ui.likeAction;
    const dislikeBtn = ui.dislikeAction;
    const repostBtn = ui.repostAction;
    const shareBtn = ui.shareAction;
    const deleteBtn = ui.deleteAction;
    const fullscreenBtn = ui.fullscreenAction;

    if (!post) {
      [likeBtn, dislikeBtn, repostBtn, shareBtn, deleteBtn, fullscreenBtn].forEach((btn) => {
        if (btn) {
          btn.disabled = true;
          btn.classList.remove('is-active');
        }
      });
      if (ui.likeCount) ui.likeCount.textContent = '0';
      if (ui.dislikeCount) ui.dislikeCount.textContent = '0';
      if (ui.repostCount) ui.repostCount.textContent = '0';
      if (ui.commentCount) ui.commentCount.textContent = '0';
      if (ui.commentInput) ui.commentInput.disabled = true;
      if (ui.commentForm) {
        const submit = ui.commentForm.querySelector('button[type="submit"]');
        if (submit) submit.disabled = true;
      }
      return;
    }

    [likeBtn, dislikeBtn, repostBtn, shareBtn].forEach((btn) => {
      if (btn) btn.disabled = false;
    });
    if (fullscreenBtn) fullscreenBtn.disabled = !post.source;
    if (deleteBtn) deleteBtn.disabled = !canDelete(post);
    if (ui.commentInput) ui.commentInput.disabled = false;
    if (ui.commentForm) {
      const submit = ui.commentForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = false;
    }

    const currentVote = state.votes[post.id] || null;
    if (ui.likeCount) ui.likeCount.textContent = String(post.likes || 0);
    if (ui.dislikeCount) ui.dislikeCount.textContent = String(post.dislikes || 0);
    if (ui.repostCount) ui.repostCount.textContent = String(post.reposts || 0);
    if (ui.commentCount) ui.commentCount.textContent = String(post.comments ? post.comments.length : 0);

    if (likeBtn) likeBtn.classList.toggle('is-active', currentVote === 'like');
    if (dislikeBtn) dislikeBtn.classList.toggle('is-active', currentVote === 'dislike');
  }

  function renderComments(post) {
    if (!ui.commentList) return;
    ui.commentList.innerHTML = '';

    if (!post || !Array.isArray(post.comments) || post.comments.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'comment-empty';
      empty.textContent = post ? 'No comments yet. Start the thread.' : 'No comments to show.';
      ui.commentList.appendChild(empty);
      if (ui.commentCount) ui.commentCount.textContent = '0';
      return;
    }

    post.comments
      .slice(0)
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((comment) => {
        const li = document.createElement('li');
        li.className = 'comment';

        const meta = document.createElement('div');
        meta.className = 'comment-meta';
        meta.textContent = (comment.author || 'Guest') + ' - ' + formatTime(comment.createdAt);

        const body = document.createElement('p');
        body.className = 'comment-body';
        body.textContent = comment.body || '';

        li.appendChild(meta);
        li.appendChild(body);
        ui.commentList.appendChild(li);
      });

    if (ui.commentCount) ui.commentCount.textContent = String(post.comments.length);
  }

  function showComposer() {
    if (!ui.composerOverlay) return;
    ui.composerOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    resetComposerForm();
    if (ui.composerCaption) ui.composerCaption.focus();
  }

  function hideComposer() {
    if (!ui.composerOverlay) return;
    ui.composerOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function resetComposerForm() {
    if (ui.composerForm) ui.composerForm.reset();
    if (ui.composerPreview) ui.composerPreview.classList.add('hidden');
    if (ui.composerThumb) {
      ui.composerThumb.style.backgroundImage = '';
      ui.composerThumb.textContent = '';
    }
    if (ui.composerFileName) ui.composerFileName.textContent = '';
    setComposerStatus('');
  }

  function setComposerStatus(message, isError) {
    if (!ui.composerStatus) return;
    ui.composerStatus.textContent = message;
    ui.composerStatus.classList.toggle('error', Boolean(isError));
  }

  async function handleComposerSubmit(event) {
    event.preventDefault();
    if (!ui.composerForm) return;

    setComposerStatus('');

    const caption = ui.composerCaption ? ui.composerCaption.value.trim() : '';
    const file = ui.composerFile && ui.composerFile.files && ui.composerFile.files.length ? ui.composerFile.files[0] : null;
    const url = ui.composerUrl ? ui.composerUrl.value.trim() : '';

    const hasCaption = caption.length > 0;
    const hasFile = Boolean(file);
    const hasUrl = Boolean(url);

    if (!hasCaption && !hasFile && !hasUrl) {
      setComposerStatus('Add a caption or attach media before posting.', true);
      return;
    }

    let source = null;

    if (hasFile) {
      const type = (file.type || '').toLowerCase();
      const isImage = type.startsWith('image/');
      const isVideo = type.startsWith('video/');
      if (!isImage && !isVideo) {
        setComposerStatus('File must be a video or an image.', true);
        return;
      }
      if (file.size > LIMITS.fileSize) {
        setComposerStatus('File too large (max 5MB).', true);
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        source = {
          type: 'data',
          value: dataUrl,
          name: file.name,
          kind: isImage ? 'image' : 'video'
        };
      } catch (error) {
        setComposerStatus('Could not read that file.', true);
        return;
      }
    } else if (hasUrl) {
      try {
        new URL(url);
      } catch (error) {
        setComposerStatus('Enter a valid URL.', true);
        return;
      }
      source = {
        type: 'url',
        value: url,
        kind: detectKindFromUrl(url)
      };
    }

    const identity = state.identity;
    const newPost = normalizePost({
      id: 'post-' + Date.now(),
      caption,
      author: identity ? identity.label : 'Guest',
      ownerId: identity ? identity.id : null,
      createdAt: Date.now(),
      source,
      likes: 0,
      dislikes: 0,
      reposts: 0,
      comments: []
    });

    state.posts.unshift(newPost);
    if (!persistPosts()) {
      state.posts.shift();
      setComposerStatus('Could not save that post. Try a smaller file or clear space.', true);
      return;
    }

    renderQueue();
    loadPost(0);
    resetComposerForm();
    hideComposer();
  }

  function handleComposerFileChange() {
    const file = ui.composerFile && ui.composerFile.files && ui.composerFile.files.length ? ui.composerFile.files[0] : null;
    if (!file) {
      if (ui.composerPreview) ui.composerPreview.classList.add('hidden');
      if (ui.composerFileName) ui.composerFileName.textContent = '';
      if (ui.composerThumb) {
        ui.composerThumb.style.backgroundImage = '';
        ui.composerThumb.textContent = '';
      }
      return;
    }

    if (ui.composerPreview) ui.composerPreview.classList.remove('hidden');
    if (ui.composerFileName) ui.composerFileName.textContent = file.name;

    if (!ui.composerThumb) return;

    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        ui.composerThumb.style.backgroundImage = 'url(' + reader.result + ')';
        ui.composerThumb.textContent = '';
      };
      reader.readAsDataURL(file);
    } else {
      ui.composerThumb.style.backgroundImage = '';
      ui.composerThumb.textContent = '>';
    }
  }

  function handleClearComposerFile() {
    if (ui.composerFile) ui.composerFile.value = '';
    if (ui.composerPreview) ui.composerPreview.classList.add('hidden');
    if (ui.composerFileName) ui.composerFileName.textContent = '';
    if (ui.composerThumb) {
      ui.composerThumb.style.backgroundImage = '';
      ui.composerThumb.textContent = '';
    }
    setComposerStatus('');
  }

  function handleCommentSubmit(event) {
    event.preventDefault();
    if (!ui.commentInput) return;
    const post = state.posts[state.currentIndex];
    if (!post) return;
    const value = ui.commentInput.value.trim();
    if (!value) return;
    if (!Array.isArray(post.comments)) post.comments = [];
    post.comments.push({
      author: state.identity ? state.identity.label : 'Guest',
      body: value,
      createdAt: Date.now()
    });
    if (!persistPosts()) {
      post.comments.pop();
      return;
    }
    ui.commentInput.value = '';
    renderComments(post);
    updateActionButtons(post);
  }

  function applyVote(post, type) {
    const current = state.votes[post.id] || null;
    if (current === type) {
      if (type === 'like' && post.likes > 0) post.likes -= 1;
      if (type === 'dislike' && post.dislikes > 0) post.dislikes -= 1;
      delete state.votes[post.id];
    } else {
      if (current === 'like' && post.likes > 0) post.likes -= 1;
      if (current === 'dislike' && post.dislikes > 0) post.dislikes -= 1;
      if (type === 'like') post.likes += 1;
      if (type === 'dislike') post.dislikes += 1;
      state.votes[post.id] = type;
    }
    writeStorage(VOTE_KEY, state.votes);
    persistPosts();
    updateActionButtons(post);
  }

  function handleRepost(post) {
    post.reposts = (post.reposts || 0) + 1;
    persistPosts();
    updateActionButtons(post);
  }

  function handleShare(post) {
    const fragments = [];
    if (post.caption) fragments.push(post.caption);
    if (post.source && post.source.value) fragments.push(post.source.value);
    const payload = fragments.join('\n');

    if (navigator.share) {
      navigator
        .share({
          title: 'CarpStream post',
          text: post.caption || 'Check out this CarpStream post',
          url: post.source && post.source.type === 'url' ? post.source.value : window.location.href
        })
        .catch((error) => {
          if (error && error.name !== 'AbortError') console.warn('Share cancelled', error);
        });
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(
        () => window.alert('Post copied to clipboard.'),
        () => window.prompt('Copy this post link:', payload)
      );
      return;
    }

    window.prompt('Copy this post link:', payload);
  }

  function handleDelete(post) {
    if (!post) return;
    if (!canDelete(post)) {
      window.alert('You can only delete your own posts.');
      return;
    }
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const index = state.posts.findIndex((item) => item.id === post.id);
    if (index === -1) return;
    state.posts.splice(index, 1);
    persistPosts();
    renderQueue();
    const nextIndex = state.posts.length ? Math.min(index, state.posts.length - 1) : 0;
    loadPost(nextIndex);
  }

  function canDelete(post) {
    if (!post) return false;
    if (!state.identity) return false;
    if (!post.ownerId) return false;
    return post.ownerId === state.identity.id;
  }

  function openFullscreen(node) {
    if (!node) return;
    if (node.requestFullscreen) {
      node.requestFullscreen().catch(() => {});
    }
  }

  function handleFullscreen() {
    const post = state.posts[state.currentIndex];
    if (!post || !ui.viewerMedia) return;
    const target = ui.viewerMedia.querySelector('video, img, iframe');
    if (target) openFullscreen(target);
  }

  function bindEvents() {
    if (ui.openComposer) ui.openComposer.addEventListener('click', showComposer);
    if (ui.openComposerRail) ui.openComposerRail.addEventListener('click', showComposer);
    if (ui.closeComposer) ui.closeComposer.addEventListener('click', hideComposer);
    if (ui.cancelComposer) ui.cancelComposer.addEventListener('click', hideComposer);
    if (ui.clearComposerFile) ui.clearComposerFile.addEventListener('click', handleClearComposerFile);
    if (ui.composerFile) ui.composerFile.addEventListener('change', handleComposerFileChange);
    if (ui.composerForm) ui.composerForm.addEventListener('submit', handleComposerSubmit);
    if (ui.commentForm) ui.commentForm.addEventListener('submit', handleCommentSubmit);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && ui.composerOverlay && !ui.composerOverlay.classList.contains('hidden')) {
        hideComposer();
      }
    });

    if (ui.likeAction) ui.likeAction.addEventListener('click', () => {
      const post = state.posts[state.currentIndex];
      if (!post) return;
      applyVote(post, 'like');
    });

    if (ui.dislikeAction) ui.dislikeAction.addEventListener('click', () => {
      const post = state.posts[state.currentIndex];
      if (!post) return;
      applyVote(post, 'dislike');
    });

    if (ui.repostAction) ui.repostAction.addEventListener('click', () => {
      const post = state.posts[state.currentIndex];
      if (!post) return;
      handleRepost(post);
    });

    if (ui.shareAction) ui.shareAction.addEventListener('click', () => {
      const post = state.posts[state.currentIndex];
      if (!post) return;
      handleShare(post);
    });

    if (ui.deleteAction) ui.deleteAction.addEventListener('click', () => {
      const post = state.posts[state.currentIndex];
      if (!post) return;
      handleDelete(post);
    });

    if (ui.fullscreenAction) ui.fullscreenAction.addEventListener('click', handleFullscreen);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function init() {
    state.identity = loadIdentity();
    state.votes = loadVotes();
    loadPosts();
    bindEvents();
    refreshStats();
    renderQueue();
    loadPost(0);
  }

  function loadVotes() {
    const stored = readStorage(VOTE_KEY, {});
    return stored && typeof stored === 'object' ? stored : {};
  }

  init();
})();

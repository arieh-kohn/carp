(function () {
  const STORAGE = {
    rooms: 'chat.rooms',
    members: 'chat.memberships',
    messages: 'chat.messages',
    profile: 'chat.profile'
  };

  const DEFAULT_ROOMS = [
    {
      id: 'public-lounge',
      name: 'Main Dock',
      type: 'public',
      description: 'Welcome everyone! Say hi and drop your latest catch.',
      inviteCode: '',
      createdBy: 'system',
      peers: ['FinMaster', 'RiverRuler', 'TackleBox42']
    },
    {
      id: 'public-gaming',
      name: 'Arcade Bay',
      type: 'public',
      description: 'Looking for players? Talk about CarpFish and other games here.',
      inviteCode: '',
      createdBy: 'system',
      peers: ['PixelPike', 'TurboGill', 'CaptainLag']
    },
    {
      id: 'public-news',
      name: 'Update Buoy',
      type: 'public',
      description: 'Site updates, sneak peeks, and beta chatter.',
      inviteCode: '',
      createdBy: 'system',
      peers: ['Mod-Carp', 'BetaBuddy']
    }
  ];

  const MAX_IMAGE_BYTES = 512 * 1024;

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error('chat storage load failed', key, err);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('chat storage save failed', key, err);
    }
  }

  function resolveUsername() {
    try {
      const account = localStorage.getItem('social.account');
      if (account) {
        const parsed = JSON.parse(account);
        if (parsed && parsed.username) return parsed.username;
      }
    } catch (err) {
      console.warn('Failed to read social account', err);
    }
    const stored = load(STORAGE.profile, null);
    if (stored && stored.name) return stored.name;
    const name = `Guest${Math.floor(Math.random() * 900 + 100)}`;
    save(STORAGE.profile, { name });
    return name;
  }

  let rooms = load(STORAGE.rooms, []);
  const roomMap = new Map();
  rooms.forEach((room) => roomMap.set(room.id, room));

  DEFAULT_ROOMS.forEach((room) => {
    if (!roomMap.has(room.id)) {
      rooms.push(room);
      roomMap.set(room.id, room);
    }
  });

  save(STORAGE.rooms, rooms);

  const membership = new Set(load(STORAGE.members, []));
  DEFAULT_ROOMS.forEach((room) => {
    if (!membership.has(room.id)) {
      membership.add(room.id);
    }
  });
  persistMembership();

  const messages = load(STORAGE.messages, {});
  DEFAULT_ROOMS.forEach((room) => {
    if (!messages[room.id]) {
      messages[room.id] = [
        {
          id: `${room.id}-welcome`,
          author: room.peers?.[0] || 'Mod-Carp',
          text: 'Welcome aboard! Drop a message to keep the chat flowing.',
          ts: Date.now() - 1000 * 60 * 5
        }
      ];
    }
  });
  save(STORAGE.messages, messages);

  const profileName = resolveUsername();
  const state = {
    activeRoomId: null,
    pendingImage: null,
    pendingImageName: ''
  };

  const ui = {
    profileChip: document.getElementById('profileChip'),
    publicRoomList: document.getElementById('publicRoomList'),
    privateRoomList: document.getElementById('privateRoomList'),
    createRoomForm: document.getElementById('createRoomForm'),
    joinForm: document.getElementById('joinRoomForm'),
    codeLabel: document.getElementById('codeLabel'),
    roomTemplate: document.getElementById('roomTemplate'),
    messageTemplate: document.getElementById('messageTemplate'),
    memberTemplate: document.getElementById('memberTemplate'),
    roomTitle: document.getElementById('roomTitle'),
    roomMeta: document.getElementById('roomMeta'),
    roomTypePill: document.getElementById('roomTypePill'),
    chatLog: document.getElementById('chatLog'),
    messageForm: document.getElementById('messageForm'),
    messageInput: document.getElementById('messageInput'),
    pickImage: document.getElementById('pickImage'),
    messageFile: document.getElementById('messageFile'),
    imagePreview: document.getElementById('imagePreview'),
    imagePreviewImg: document.getElementById('imagePreviewImg'),
    imagePreviewName: document.getElementById('imagePreviewName'),
    clearImage: document.getElementById('clearImage'),
    leaveRoomBtn: document.getElementById('leaveRoomBtn'),
    memberList: document.getElementById('memberList'),
    refreshMembers: document.getElementById('refreshMembers'),
    inviteBlock: document.getElementById('inviteCodeBlock'),
    inviteValue: document.getElementById('inviteCodeValue'),
    copyInvite: document.getElementById('copyInvite'),
    activeRoom: document.getElementById('activeRoom')
  };

  if (ui.profileChip) {
    ui.profileChip.textContent = profileName;
  }
  ui.sendButton = ui.messageForm ? ui.messageForm.querySelector('button[type="submit"]') : null;

  if (ui.createRoomForm) {
    ui.createRoomForm.addEventListener('change', (event) => {
      if (event.target && event.target.id === 'newRoomType') {
        const isPrivate = event.target.value === 'private';
        togglePrivateFields(isPrivate);
      }
    });
  }

  if (ui.createRoomForm) {
    ui.createRoomForm.addEventListener('submit', handleCreateRoom);
  }

  if (ui.joinForm) {
    ui.joinForm.addEventListener('submit', handleJoinCode);
  }

  if (ui.messageForm) {
    ui.messageForm.addEventListener('submit', handleSendMessage);
  }

  if (ui.pickImage && ui.messageFile) {
    ui.pickImage.addEventListener('click', () => ui.messageFile.click());
  }

  if (ui.messageFile) {
    ui.messageFile.addEventListener('change', handleImageSelection);
  }

  if (ui.clearImage) {
    ui.clearImage.addEventListener('click', () => {
      clearPendingImage();
      if (ui.messageFile) {
        ui.messageFile.value = '';
      }
    });
  }

  if (ui.leaveRoomBtn) {
    ui.leaveRoomBtn.addEventListener('click', () => {
      if (!state.activeRoomId) return;
      membership.delete(state.activeRoomId);
      persistMembership();
      setActiveRoom(null);
      renderRooms();
    });
  }

  if (ui.refreshMembers) {
    ui.refreshMembers.addEventListener('click', () => {
      if (!state.activeRoomId) return;
      renderMembers(roomMap.get(state.activeRoomId));
    });
  }

  if (ui.copyInvite) {
    ui.copyInvite.addEventListener('click', () => {
      const code = ui.inviteValue?.textContent;
      if (!code) return;
      navigator.clipboard?.writeText(code)
        .then(() => showStatus(`Invite code ${code} copied!`))
        .catch(() => showStatus('Failed to copy invite code.'));
    });
  }

  function showStatus(message) {
    if (!ui.profileChip) return;
    ui.profileChip.textContent = message;
    setTimeout(() => {
      ui.profileChip.textContent = profileName;
    }, 3000);
  }

  function updateImagePreview() {
    if (!ui.imagePreview || !ui.imagePreviewImg || !ui.imagePreviewName) return;
    if (state.pendingImage) {
      ui.imagePreview.classList.remove('hidden');
      ui.imagePreviewImg.src = state.pendingImage;
      ui.imagePreviewName.textContent = state.pendingImageName || 'image';
    } else {
      ui.imagePreview.classList.add('hidden');
      ui.imagePreviewImg.removeAttribute('src');
      ui.imagePreviewName.textContent = '';
    }
  }

  function clearPendingImage() {
    state.pendingImage = null;
    state.pendingImageName = '';
    if (ui.messageFile) {
      ui.messageFile.value = '';
    }
    updateImagePreview();
  }

  function handleImageSelection(event) {
    const files = event.target.files || [];
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showStatus('Only image files are allowed.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showStatus('Image too big. Keep it under 512 KB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.pendingImage = reader.result;
      state.pendingImageName = file.name;
      updateImagePreview();
    };
    reader.onerror = () => {
      showStatus('Could not read that file.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function togglePrivateFields(show) {
    if (!ui.codeLabel) return;
    if (show) {
      ui.codeLabel.classList.remove('hidden');
    } else {
      ui.codeLabel.classList.add('hidden');
    }
  }

  function persistMembership() {
    save(STORAGE.members, Array.from(membership));
  }

  function renderRooms() {
    renderRoomBucket(ui.publicRoomList, rooms.filter((room) => room.type === 'public'), true);
    renderRoomBucket(ui.privateRoomList, rooms.filter((room) => room.type === 'private' && membership.has(room.id)), false);
  }

  function renderRoomBucket(container, roomSet, autoJoin) {
    if (!container) return;
    container.innerHTML = '';
    if (!roomSet.length) {
      const li = document.createElement('li');
      li.className = 'muted tiny';
      li.textContent = autoJoin ? 'No public rooms available yet.' : 'You have not joined any private spaces.';
      container.appendChild(li);
      return;
    }

    roomSet.forEach((room) => {
      const clone = ui.roomTemplate.content.firstElementChild.cloneNode(true);
      const button = clone.querySelector('.room-btn');
      const nameEl = clone.querySelector('.room-name');
      const descEl = clone.querySelector('.room-desc');
      nameEl.textContent = room.name;
      descEl.textContent = room.description || (room.type === 'private' ? 'Private space' : 'Public room');
      if (state.activeRoomId === room.id) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => {
        if (autoJoin && !membership.has(room.id)) {
          membership.add(room.id);
          persistMembership();
        }
        setActiveRoom(room.id);
      });
      container.appendChild(clone);
    });
  }

  function setActiveRoom(roomId) {
    state.activeRoomId = roomId;
    if (!roomId) {
      ui.roomTitle.textContent = 'Pick a room to start chatting';
      ui.roomMeta.textContent = 'No room selected.';
      ui.roomTypePill.textContent = '—';
      ui.chatLog.innerHTML = '<div class="empty-chat"><p>Pick a room on the left to see the conversation.</p></div>';
      if (ui.sendButton) ui.sendButton.disabled = true;
      ui.leaveRoomBtn.disabled = true;
      ui.memberList.innerHTML = '';
      ui.inviteBlock.hidden = true;
      ui.activeRoom.dataset.room = '';
      clearPendingImage();
      renderRooms();
      return;
    }

    const room = roomMap.get(roomId);
    if (!room) return;
    if (!membership.has(roomId)) {
      membership.add(roomId);
      persistMembership();
      renderRooms();
    }
    ui.activeRoom.dataset.room = roomId;
    ui.roomTitle.textContent = room.name;
    ui.roomMeta.textContent = `${room.type === 'private' ? 'Private space' : 'Public lounge'} • Created ${formatRelativeTime(room.createdAt || Date.now())}`;
    ui.roomTypePill.textContent = room.type === 'private' ? 'Private' : 'Public';
    renderMessages(roomId);
    renderMembers(room);
    if (ui.sendButton) ui.sendButton.disabled = false;
    ui.leaveRoomBtn.disabled = room.type === 'public';
    if (room.type === 'private') {
      const code = room.inviteCode || '';
      ui.inviteValue.textContent = code;
      ui.inviteBlock.hidden = !code;
    } else {
      ui.inviteBlock.hidden = true;
    }
    renderRooms();
  }

  function renderMessages(roomId) {
    const list = messages[roomId] || [];
    const ul = document.createElement('ul');
    list.sort((a, b) => a.ts - b.ts);
    list.forEach((entry) => {
      const node = ui.messageTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('.author').textContent = entry.author;
      node.querySelector('time').textContent = formatTime(entry.ts);
      const textEl = node.querySelector('.text');
      if (entry.text) {
        textEl.textContent = entry.text;
        textEl.classList.remove('hidden');
      } else {
        textEl.textContent = '';
        textEl.classList.add('hidden');
      }
      const imageBlock = node.querySelector('.image-block');
      if (imageBlock) {
        if (entry.image) {
          imageBlock.classList.remove('hidden');
          const img = imageBlock.querySelector('img');
          if (img) {
            img.src = entry.image;
            img.alt = entry.imageName || 'Chat attachment';
          }
          const caption = imageBlock.querySelector('.caption');
          if (caption) {
            caption.textContent = entry.imageName || 'Image';
          }
        } else {
          imageBlock.classList.add('hidden');
        }
      }
      ul.appendChild(node);
    });
    ui.chatLog.innerHTML = '';
    ui.chatLog.appendChild(ul);
    ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
  }

  function renderMembers(room) {
    if (!room) return;
    const list = ui.memberList;
    list.innerHTML = '';
    const names = new Set();
    names.add(profileName);
    if (Array.isArray(room.peers)) {
      room.peers.forEach((name) => names.add(name));
    }
    const membershipKey = `members:${room.id}`;
    const extra = load(membershipKey, []);
    extra.forEach((name) => names.add(name));

    names.forEach((name) => {
      const node = ui.memberTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('.name').textContent = name;
      list.appendChild(node);
    });
    if (list.children.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'muted tiny';
      empty.textContent = 'Looks empty. Invite someone!';
      list.appendChild(empty);
    }
  }

  function handleCreateRoom(event) {
    event.preventDefault();
    const nameField = document.getElementById('newRoomName');
    const typeField = document.getElementById('newRoomType');
    const descField = document.getElementById('newRoomDesc');
    const codeField = document.getElementById('newRoomCode');
    const name = (nameField.value || '').trim();
    if (!name) return;
    const type = typeField.value === 'private' ? 'private' : 'public';
    const desc = (descField.value || '').trim();
    let code = (codeField.value || '').trim().toUpperCase();
    if (type === 'private' && !code) {
      code = generateCode();
    }
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const room = {
      id: roomId,
      name,
      type,
      description: desc,
      inviteCode: type === 'private' ? code : '',
      createdBy: profileName,
      createdAt: Date.now(),
      peers: type === 'public' ? [profileName] : []
    };
    rooms.push(room);
    roomMap.set(roomId, room);
    save(STORAGE.rooms, rooms);
    membership.add(roomId);
    persistMembership();
    messages[roomId] = [
      {
        id: `${roomId}-welcome`,
        author: profileName,
        text: desc ? `Room created — ${desc}` : 'New room created. Say hello!',
        ts: Date.now()
      }
    ];
    save(STORAGE.messages, messages);
    showStatus(`${room.name} ready to chat!`);
    ui.createRoomForm.reset();
    togglePrivateFields(false);
    renderRooms();
    setActiveRoom(roomId);
  }

  function handleJoinCode(event) {
    event.preventDefault();
    const input = document.getElementById('joinCode');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) return;
    const room = rooms.find((item) => item.type === 'private' && item.inviteCode && item.inviteCode.toUpperCase() === code);
    if (!room) {
      showStatus('No private space matches that code.');
      return;
    }
    membership.add(room.id);
    persistMembership();
    const membershipKey = `members:${room.id}`;
    const existing = load(membershipKey, []);
    if (!existing.includes(profileName)) {
      existing.push(profileName);
      save(membershipKey, existing);
    }
    showStatus(`Joined ${room.name}!`);
    renderRooms();
    setActiveRoom(room.id);
    input.value = '';
  }

  function handleSendMessage(event) {
    event.preventDefault();
    if (!state.activeRoomId) return;
    const value = (ui.messageInput.value || '').trim();
    const hasImage = Boolean(state.pendingImage);
    if (!value && !hasImage) return;
    const roomMessages = messages[state.activeRoomId] || [];
    roomMessages.push({
      id: `msg_${state.activeRoomId}_${Date.now()}`,
      author: profileName,
      text: value,
      image: hasImage ? state.pendingImage : undefined,
      imageName: hasImage ? (state.pendingImageName || 'image') : undefined,
      ts: Date.now()
    });
    messages[state.activeRoomId] = roomMessages.slice(-200);
    save(STORAGE.messages, messages);
    ui.messageInput.value = '';
    clearPendingImage();
    renderMessages(state.activeRoomId);
  }

  function formatTime(ts) {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatRelativeTime(ts) {
    const delta = Date.now() - ts;
    if (delta < 60 * 1000) return 'just now';
    if (delta < 60 * 60 * 1000) {
      const minutes = Math.floor(delta / (60 * 1000));
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (delta < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(delta / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(delta / (24 * 60 * 60 * 1000));
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  function generateCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i += 1) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  }

  renderRooms();
  if (membership.size) {
    const first = Array.from(membership)[0];
    setActiveRoom(first);
  }
})();

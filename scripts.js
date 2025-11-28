(function () {
    const listView = document.getElementById('listView');
    const gameView = document.getElementById('gameView');
    const gameRoot = document.getElementById('gameRoot');
    const backBtn = document.getElementById('backBtn');
    const restartBtn = document.getElementById('restartBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    const gameTitle = document.getElementById('gameTitle');
    const scorePill = document.getElementById('scorePill');

    // Prevent browser dialogs and messages
    window.addEventListener('error', (e) => {
        e.preventDefault();
        console.error(e.message);
        return true;
    });

    window.onbeforeunload = null;
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
    });

    let current = null; // {cleanup, restart}
    let currentName = null;

    function showList() {
        if (current && current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } current = null; }
        currentName = null;
        gameRoot.innerHTML = '';
        gameView.style.display = 'none';
        listView.style.display = '';
        gameTitle.textContent = '';
        scorePill.textContent = '';
        renderGameList(); // Re-render the game list when returning to it
    }
    function showGame(name, builder) {
        listView.style.display = 'none';
        gameView.style.display = '';
        gameRoot.innerHTML = '';
        gameTitle.textContent = name;
        scorePill.textContent = '';
        if (current && current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } current = null; }

        // Add game over display helper
        const displayGameOver = (message, score) => {
            const overlay = document.createElement('div');
            overlay.className = 'game-over';
            overlay.innerHTML = `
          <div>Game Over!</div>
          <div class="score">${message}: ${score}</div>
          <button class="retry">Play Again</button>
        `;
            gameRoot.appendChild(overlay);
            const retryBtn = overlay.querySelector('.retry');
            retryBtn.addEventListener('click', () => {
                overlay.remove();
                if (current && current.restart) current.restart();
            });
        };

        const res = builder(gameRoot, (txt) => { scorePill.textContent = txt; }, displayGameOver);
        current = res || null;
        currentName = name;

        // Prevent browser from showing "leave page" dialog
        window.onbeforeunload = null;
    }

    // Prevent browser dialogs globally
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
    });

    backBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default behavior
        showList();
    });
    refreshBtn.addEventListener('click', () => location.reload());
    restartBtn.addEventListener('click', () => {
        if (current && current.restart) {
            try {
                current.restart();
            } catch (e) {
                console.error('Error restarting game:', e);
            }
        }
    });
    helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
    closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));

    restartBtn.addEventListener('click', () => { if (current && current.restart) current.restart(); else location.reload(); });

    const PLACEHOLDER_COUNT = 100;

    // Placeholder entries to keep the grid size consistent
    const GAMES = Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => ({
        id: `placeholder-${index + 1}`
    }));

    let placeholderMode = true;

    function registerGame(id, title, desc, builder) {
        if (placeholderMode) return;
        GAMES.push({ id, title, desc, builder });
    }

    // Register all games
    registerGame('2048', '2048', 'Merge tiles to reach 2048', build2048);
    registerGame('snake', 'Snake', 'Classic snake game', buildSnake);
    registerGame('breakout', 'Breakout', 'Break all the bricks', buildBreakout);
    registerGame('memory', 'Memory Match', 'Find matching pairs', buildMemory);
    registerGame('whack', 'Whack-a-Mole', 'Quick reflexes game', buildWhack);
    registerGame('flappy', 'Flappy', 'Navigate through pipes', buildFlappy);
    registerGame('bitlife', 'Life Sim', 'Life simulation game', buildLifeSim);
    registerGame('drive', 'Drive Mad', 'Endless driving game', buildDrive);
    registerGame('drive3', 'Drive Mad 3', 'Community stunt tracks from drivemad3.io', buildDriveMad3);
    registerGame('motox', 'Moto X3M', 'Physics bike trials from moto-x3m.net', buildMotoX3M);
    registerGame('basket', 'Basket Random', 'Chaotic 2v2 basketball duels', buildBasketRandom);
    registerGame('ancient', 'Ancient Beast', 'Creature battle strategy', buildAncient);
    registerGame('craft', 'Block Craft', 'Creative building game', buildCraft);
    registerGame('runner', 'Temple Run', 'Endless runner game', buildRunner);
    registerGame('candy', 'Candy Match', 'Match-3 puzzle game', buildCandy);
    registerGame('pacman', 'Maze Chase', 'Collect dots, avoid ghosts', buildPacman);
    registerGame('tetris', 'Block Drop', 'Classic tetris game', buildTetris);
    registerGame('words', 'Word Quest', 'Word puzzle game', buildWords);
    registerGame('defense', 'Tower Defense', 'Strategic tower placement game', buildDefense);
    registerGame('doodle', 'Doodle Jump', 'Jump your way to the top', buildDoodle);
    registerGame('chess', 'Mini Chess', 'Classic chess game vs AI', buildChess);
    registerGame('solitaire', 'Solitaire', 'Classic card game', buildSolitaire);
    registerGame('racer', 'Speed Racer', '3D racing game with multiple tracks', buildRace);
    registerGame('fruit', 'Fruit Slice', 'Slice fruits, avoid bombs', buildFruit);
    registerGame('tower', 'Tower Stack', 'Stack blocks to build tower', buildTower);
    registerGame('bubble', 'Bubble Shooter', 'Match 3 or more bubbles', buildBubble);
    registerGame('piano', 'Piano Tiles', 'Tap the black tiles', buildPiano);

    // Initialize game list
    function renderGameList() {
        const tiles = GAMES.map(() => `
              <div class="tile tile-empty" aria-hidden="true"></div>
            `).join('');

        listView.innerHTML = `
        <div class="container">
          <div class="grid">
            ${tiles}
          </div>
        </div>
      `;
    }

    // Initial render
    renderGameList();

    // ---------- 1) 2048 (improved) ----------
    function build2048(container, setScore, displayGameOver) {
        container.innerHTML = `
        <div class="g2048-wrapper" style="max-width:640px;margin:0 auto">
          <div class="g2048-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div class="g2048-title" style="font-weight:900;font-size:20px">2048</div>
            <div class="g2048-help" style="color:var(--muted);font-size:13px">Swipe or use arrow keys</div>
          </div>
          <div class="g2048-meta" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div class="g2048-pill" id="g2048-score" style="background:rgba(255,255,255,0.06);padding:6px 12px;border-radius:999px;font-size:13px">Score: 0</div>
            <button class="g2048-new" id="g2048-new" style="padding:6px 16px;border-radius:999px;border:none;background:#1c7ed6;color:#fff;font-weight:600;cursor:pointer">New Game</button>
          </div>
          <div class="g2048-board" id="g2048-board" role="grid" aria-label="2048 board"></div>
        </div>
      `;

        const board = container.querySelector('#g2048-board');
        const scorePill = container.querySelector('#g2048-score');
        const newBtn = container.querySelector('#g2048-new');
        const SIZE = 4;

        let grid = [];
        let score = 0;
        let gameActive = true;
        let pendingWin = false;
        let lastCreated = null;

        const tileColors = {
            0: '#102032',
            2: '#eae0d5',
            4: '#e7d4bc',
            8: '#f4a259',
            16: '#f06b45',
            32: '#f34235',
            64: '#e84a27',
            128: '#cdb24f',
            256: '#c5a63f',
            512: '#bf9932',
            1024: '#b98d24',
            2048: '#b28018'
        };

        const tiles = [];
        for (let r = 0; r < SIZE; r++) {
            const row = [];
            for (let c = 0; c < SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'g2048-cell';
                cell.setAttribute('role', 'gridcell');
                row.push(cell);
                board.appendChild(cell);
            }
            tiles.push(row);
        }

        function formatScore(value) {
            if (value < 1000) return value.toString();
            if (value < 1000000) return (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'K';
            return (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + 'M';
        }

        function updateScore(delta = 0) {
            score += delta;
            scorePill.textContent = 'Score: ' + formatScore(score);
            setScore('Score: ' + score);
        }

        function randomEmptyCell() {
            const empties = [];
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (grid[r][c] === 0) empties.push({ r, c });
                }
            }
            if (!empties.length) return null;
            return empties[Math.floor(Math.random() * empties.length)];
        }

        function spawnTile() {
            const spot = randomEmptyCell();
            if (!spot) return false;
            grid[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
            lastCreated = spot;
            return true;
        }

        function render() {
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    const value = grid[r][c];
                    const tile = tiles[r][c];
                    tile.textContent = value ? value : '';
                    tile.dataset.value = value;
                    tile.style.background = tileColors[value] || '#5d6270';
                    tile.style.color = value <= 4 ? '#1d2330' : '#f6f7fa';
                    tile.classList.toggle('g2048-new', !!lastCreated && lastCreated.r === r && lastCreated.c === c);
                }
            }
            lastCreated = null;
        }

        function cloneGrid() {
            return grid.map(row => row.slice());
        }

        function rotate(times) {
            // rotate grid clockwise `times` times
            for (let t = 0; t < times; t++) {
                const next = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
                for (let r = 0; r < SIZE; r++) {
                    for (let c = 0; c < SIZE; c++) {
                        next[c][SIZE - 1 - r] = grid[r][c];
                    }
                }
                grid = next;
            }
        }

        function compressRow(row) {
            const filtered = row.filter(v => v !== 0);
            for (let i = 0; i < filtered.length - 1; i++) {
                if (filtered[i] === filtered[i + 1]) {
                    filtered[i] *= 2;
                    updateScore(filtered[i]);
                    filtered.splice(i + 1, 1);
                }
            }
            while (filtered.length < SIZE) filtered.push(0);
            return filtered;
        }

        function moveLeft() {
            let moved = false;
            for (let r = 0; r < SIZE; r++) {
                const nextRow = compressRow(grid[r]);
                for (let c = 0; c < SIZE; c++) {
                    if (grid[r][c] !== nextRow[c]) moved = true;
                }
                grid[r] = nextRow;
            }
            return moved;
        }

        function move(direction) {
            if (!gameActive) return;
            const previous = cloneGrid();
            if (direction === 'right') rotate(2);
            if (direction === 'up') rotate(3);
            if (direction === 'down') rotate(1);

            const moved = moveLeft();

            if (direction === 'right') rotate(2);
            if (direction === 'up') rotate(1);
            if (direction === 'down') rotate(3);

            if (!moved) {
                grid = previous;
                return;
            }

            spawnTile();
            render();
            checkGameState();
        }

        function hasMoves() {
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    const value = grid[r][c];
                    if (value === 0) return true;
                    if (c < SIZE - 1 && grid[r][c + 1] === value) return true;
                    if (r < SIZE - 1 && grid[r + 1][c] === value) return true;
                }
            }
            return false;
        }

        function checkGameState() {
            if (!pendingWin && grid.some(row => row.includes(2048))) {
                pendingWin = true;
                gameActive = false;
                if (displayGameOver) displayGameOver('You win', score);
                return;
            }
            if (!hasMoves()) {
                gameActive = false;
                if (displayGameOver) displayGameOver('Score', score);
            }
        }

        function handleKey(e) {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            if (!gameActive) return;
            if (e.key === 'ArrowLeft') move('left');
            if (e.key === 'ArrowRight') move('right');
            if (e.key === 'ArrowUp') move('up');
            if (e.key === 'ArrowDown') move('down');
        }

        let touchStart = null;
        function onTouchStart(e) {
            const touch = e.touches[0];
            touchStart = { x: touch.clientX, y: touch.clientY };
        }

        function onTouchEnd(e) {
            if (!touchStart || !gameActive) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStart.x;
            const dy = touch.clientY - touchStart.y;
            touchStart = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
        }

        function newGame() {
            grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
            score = 0;
            gameActive = true;
            pendingWin = false;
            lastCreated = null;
            updateScore(0);
            spawnTile();
            spawnTile();
            render();
        }

        function handleNewGame() {
            if (displayGameOver) {
                const overlay = container.querySelector('.game-over');
                if (overlay) overlay.remove();
            }
            newGame();
        }

        window.addEventListener('keydown', handleKey);
        board.addEventListener('touchstart', onTouchStart, { passive: true });
        board.addEventListener('touchend', onTouchEnd, { passive: true });
        newBtn.addEventListener('click', handleNewGame);

        newGame();

        return {
            cleanup() {
                window.removeEventListener('keydown', handleKey);
                board.removeEventListener('touchstart', onTouchStart);
                board.removeEventListener('touchend', onTouchEnd);
                newBtn.removeEventListener('click', handleNewGame);
            },
            restart() {
                handleNewGame();
            }
        };
    }

    // ---------- 2) Snake (smoother) ----------
    function buildSnake(container, setScore, displayGameOver) {
        container.innerHTML = `
        <div class="snake-wrapper" style="display:flex;flex-direction:column;align-items:center">
          <div class="snake-header" style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="snake-title" style="font-weight:900;font-size:20px">Neon Snake</div>
            <div class="snake-hint" style="color:var(--muted);font-size:13px">Arrow keys or swipe · Space to pause</div>
          </div>
          <canvas id="snake-canvas" width="420" height="420" class="snake-canvas" style="background:#071827;border-radius:10px;margin-top:12px"></canvas>
        </div>
      `;

        const canvas = container.querySelector('#snake-canvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 18;
        const cols = Math.floor(canvas.width / cellSize);
        const rows = Math.floor(canvas.height / cellSize);

        let snake = [];
        let direction = { x: 1, y: 0 };
        let queuedDirection = { x: 1, y: 0 };
        let apple = null;
        let raf = null;
        let running = false;
        let paused = false;
        let lastTick = 0;
        let tickInterval = 140;
        let score = 0;

        const gradientCache = new Map();

        function gradientFor(segmentIndex) {
            if (gradientCache.has(segmentIndex)) return gradientCache.get(segmentIndex);
            const gradient = ctx.createLinearGradient(0, 0, cellSize, cellSize);
            const t = Math.max(0.2, 1 - segmentIndex * 0.05);
            gradient.addColorStop(0, `rgba(130,255,195,${t})`);
            gradient.addColorStop(1, `rgba(32,220,130,${t})`);
            gradientCache.set(segmentIndex, gradient);
            return gradient;
        }

        function centerPoint() {
            return {
                x: Math.floor(cols / 2),
                y: Math.floor(rows / 2)
            };
        }

        function spawnApple() {
            const available = [];
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if (!snake.some(segment => segment.x === x && segment.y === y)) {
                        available.push({ x, y });
                    }
                }
            }
            if (!available.length) {
                apple = null;
                return;
            }
            apple = available[Math.floor(Math.random() * available.length)];
        }

        function resetState() {
            snake = [centerPoint()];
            direction = { x: 1, y: 0 };
            queuedDirection = { x: 1, y: 0 };
            score = 0;
            tickInterval = 140;
            running = true;
            paused = false;
            lastTick = 0;
            setScore('Score: 0');
            spawnApple();
            draw();
            scheduleLoop();
        }

        function scheduleLoop() {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(loop);
        }

        function loop(timestamp) {
            if (!running) return;
            if (paused) {
                raf = requestAnimationFrame(loop);
                return;
            }

            if (!lastTick) lastTick = timestamp;
            const elapsed = timestamp - lastTick;

            if (elapsed >= tickInterval) {
                lastTick = timestamp;
                step();
                draw();
            }

            raf = requestAnimationFrame(loop);
        }

        function step() {
            direction = queuedDirection;
            const head = {
                x: (snake[0].x + direction.x + cols) % cols,
                y: (snake[0].y + direction.y + rows) % rows
            };

            const eating = apple && apple.x === head.x && apple.y === head.y;
            if (!eating) snake.pop();

            if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                endGame();
                return;
            }

            snake.unshift(head);

            if (eating) {
                score += 10;
                setScore('Score: ' + score);
                if (tickInterval > 70) tickInterval -= 2;
                spawnApple();
                if (!apple && displayGameOver) {
                    running = false;
                    displayGameOver('Perfect score', score);
                }
            }
        }

        function drawBackground() {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#062037');
            gradient.addColorStop(1, '#04101f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= cols; x++) {
                ctx.beginPath();
                ctx.moveTo(x * cellSize, 0);
                ctx.lineTo(x * cellSize, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y <= rows; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * cellSize);
                ctx.lineTo(canvas.width, y * cellSize);
                ctx.stroke();
            }
        }

        function drawRoundedRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function drawSnake() {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(46, 255, 158, 0.4)';
            snake.forEach((segment, idx) => {
                ctx.fillStyle = gradientFor(idx);
                const x = segment.x * cellSize + 2;
                const y = segment.y * cellSize + 2;
                const size = cellSize - 4;
                drawRoundedRect(x, y, size, size, 6);
                ctx.fill();

                if (idx === 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                    ctx.beginPath();
                    ctx.arc(x + size * 0.3, y + size * 0.35, 3, 0, Math.PI * 2);
                    ctx.arc(x + size * 0.7, y + size * 0.35, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        }

        function drawApple() {
            if (!apple) return;
            ctx.save();
            ctx.shadowColor = 'rgba(255,94,91,0.5)';
            ctx.shadowBlur = 18;
            const x = apple.x * cellSize + cellSize / 2;
            const y = apple.y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.fillStyle = '#ff5e5b';
            ctx.arc(x, y, cellSize / 2.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = '#4db06e';
            ctx.ellipse(x + 2, y - cellSize / 2.6, cellSize / 5, cellSize / 8, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawState() {
            if (!running) return;
            ctx.fillStyle = 'rgba(5,12,20,0.6)';
            ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
            ctx.fillStyle = '#9ecff4';
            ctx.font = '14px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Length: ' + snake.length, 12, canvas.height - 10);
            ctx.textAlign = 'right';
            const cellsPerSecond = 1000 / tickInterval;
            const statusText = paused ? 'Paused' : 'Speed: ' + cellsPerSecond.toFixed(1) + ' cells/s';
            ctx.fillText(statusText, canvas.width - 12, canvas.height - 10);
        }

        function draw() {
            drawBackground();
            drawApple();
            drawSnake();
            drawState();
        }

        function endGame() {
            running = false;
            cancelAnimationFrame(raf);
            if (displayGameOver) displayGameOver('Score', score);
        }

        function queueDirection(next) {
            if (!running || paused) return;
            const isOpposite = next.x === -direction.x && next.y === -direction.y;
            if (isOpposite) return;
            queuedDirection = next;
        }

        function handleKey(event) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
                event.preventDefault();
            }
            if (!running) return;
            switch (event.key) {
                case 'ArrowUp': queueDirection({ x: 0, y: -1 }); break;
                case 'ArrowDown': queueDirection({ x: 0, y: 1 }); break;
                case 'ArrowLeft': queueDirection({ x: -1, y: 0 }); break;
                case 'ArrowRight': queueDirection({ x: 1, y: 0 }); break;
                case ' ':
                    paused = !paused;
                    if (!paused) {
                        lastTick = performance.now();
                    }
                    break;
                default:
            }
        }

        let swipeOrigin = null;
        function onTouchStart(event) {
            const touch = event.touches[0];
            swipeOrigin = { x: touch.clientX, y: touch.clientY };
        }

        function onTouchEnd(event) {
            if (!swipeOrigin || !running) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - swipeOrigin.x;
            const dy = touch.clientY - swipeOrigin.y;
            swipeOrigin = null;

            if (Math.abs(dx) < 25 && Math.abs(dy) < 25) {
                paused = !paused;
                if (!paused) lastTick = performance.now();
                return;
            }

            if (Math.abs(dx) > Math.abs(dy)) {
                queueDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
            } else {
                queueDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
            }
        }

        function teardown() {
            cancelAnimationFrame(raf);
            window.removeEventListener('keydown', handleKey);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchend', onTouchEnd);
        }

        window.addEventListener('keydown', handleKey);
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });

        resetState();

        return {
            cleanup: teardown,
            restart() {
                teardown();
                window.addEventListener('keydown', handleKey);
                canvas.addEventListener('touchstart', onTouchStart, { passive: true });
                canvas.addEventListener('touchend', onTouchEnd, { passive: true });
                resetState();
            }
        };
    }

    // ---------- 3) Breakout (improved) ----------
    function buildBreakout(container, setScore, displayGameOver) {
        container.innerHTML = `
        <div class="breakout-wrapper" style="display:flex;flex-direction:column;align-items:center">
          <div class="breakout-header" style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <div class="breakout-title" style="font-weight:900;font-size:20px">Pulse Breakout</div>
            <div class="breakout-hint" style="color:var(--muted);font-size:13px">Mouse, touch or arrow keys to move</div>
          </div>
          <canvas id="breakout-canvas" width="640" height="380" class="breakout-canvas" style="background:#071827;border-radius:10px;margin-top:12px"></canvas>
        </div>
      `;

        const canvas = container.querySelector('#breakout-canvas');
        const ctx = canvas.getContext('2d');

        const paddle = {
            width: 120,
            height: 14,
            speed: 6,
            x: canvas.width / 2 - 60
        };

        const ball = {
            radius: 8,
            x: canvas.width / 2,
            y: canvas.height - 80,
            vx: 4,
            vy: -5,
            launched: false
        };

        const state = {
            level: 1,
            score: 0,
            lives: 3,
            running: true,
            bricks: []
        };

        let raf = null;
        let leftPressed = false;
        let rightPressed = false;

        function updateScorePill() {
            setScore('Score: ' + state.score + ' | Lives: ' + state.lives + ' | Level: ' + state.level);
        }

        function resetBall() {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = canvas.height - 80;
            ball.vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.min(state.level, 3));
            ball.vy = -5 - Math.min(state.level, 4);
            ball.launched = false;
        }

        function createLevel(level) {
            const rows = 4 + Math.min(level, 4);
            const cols = 9;
            const padding = 16;
            const marginTop = 40;
            const brickWidth = (canvas.width - padding * (cols + 1)) / cols;
            const brickHeight = 22;
            const palette = ['#ff6b6b', '#ffd93d', '#6ef6ff', '#8aff80', '#d890ff', '#ffa9e7'];

            state.bricks = [];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    state.bricks.push({
                        x: padding + col * (brickWidth + padding),
                        y: marginTop + row * (brickHeight + 10),
                        width: brickWidth,
                        height: brickHeight,
                        hp: 1 + Math.floor(level / 2),
                        color: palette[(row + level) % palette.length]
                    });
                }
            }

            updateScorePill();
        }

        function launchBall() {
            if (!ball.launched) {
                ball.launched = true;
            }
        }

        function drawBackground() {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#021a2b');
            gradient.addColorStop(1, '#061322');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        function drawRoundedRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function drawPaddle() {
            ctx.save();
            const grad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
            grad.addColorStop(0, '#4dd0e1');
            grad.addColorStop(1, '#00bcd4');
            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(0,188,212,0.4)';
            ctx.shadowBlur = 15;
            drawRoundedRect(paddle.x, canvas.height - paddle.height - 18, paddle.width, paddle.height, 8);
            ctx.fill();
            ctx.restore();
        }

        function drawBall() {
            ctx.save();
            ctx.shadowColor = 'rgba(255,214,79,0.6)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawBricks() {
            state.bricks.forEach(brick => {
                ctx.save();
                ctx.fillStyle = brick.color;
                ctx.shadowColor = 'rgba(0,0,0,0.25)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;
                drawRoundedRect(brick.x, brick.y, brick.width, brick.height, 6);
                ctx.fill();
                ctx.restore();

                if (brick.hp > 1) {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(brick.x + 6, brick.y + 6, brick.width - 12, 6);
                }
            });
        }

        function drawOverlay() {
            if (!state.running || state.bricks.length) return;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#9ac7ff';
            ctx.font = '20px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('All bricks cleared! Press space to continue.', canvas.width / 2, canvas.height / 2);
        }

        function draw() {
            drawBackground();
            drawBricks();
            drawPaddle();
            drawBall();
            drawOverlay();
        }

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function handleWallCollisions() {
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx *= -1;
            }
            if (ball.x + ball.radius > canvas.width) {
                ball.x = canvas.width - ball.radius;
                ball.vx *= -1;
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy *= -1;
            }
        }

        function handlePaddleCollision() {
            const paddleTop = canvas.height - paddle.height - 18;
            if (ball.y + ball.radius >= paddleTop &&
                ball.y + ball.radius <= paddleTop + paddle.height &&
                ball.x >= paddle.x &&
                ball.x <= paddle.x + paddle.width &&
                ball.vy > 0) {
                const collisionPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                const bounceAngle = collisionPoint * (Math.PI / 3); // 60 degrees
                const speed = Math.hypot(ball.vx, ball.vy) * 1.03;
                ball.vx = speed * Math.sin(bounceAngle);
                ball.vy = -Math.abs(speed * Math.cos(bounceAngle));
            }
        }

        function handleBrickCollisions() {
            for (let i = 0; i < state.bricks.length; i++) {
                const brick = state.bricks[i];
                if (ball.x + ball.radius < brick.x ||
                    ball.x - ball.radius > brick.x + brick.width ||
                    ball.y + ball.radius < brick.y ||
                    ball.y - ball.radius > brick.y + brick.height) {
                    continue;
                }

                const prevX = ball.x - ball.vx;
                const prevY = ball.y - ball.vy;
                const collidedFromLeft = prevX + ball.radius <= brick.x;
                const collidedFromRight = prevX - ball.radius >= brick.x + brick.width;
                const collidedFromTop = prevY + ball.radius <= brick.y;
                const collidedFromBottom = prevY - ball.radius >= brick.y + brick.height;

                if (collidedFromLeft || collidedFromRight) {
                    ball.vx *= -1;
                } else if (collidedFromTop || collidedFromBottom) {
                    ball.vy *= -1;
                } else {
                    ball.vy *= -1;
                }

                brick.hp -= 1;
                state.score += 20;
                if (brick.hp <= 0) state.bricks.splice(i, 1);
                updateScorePill();
                break;
            }
        }

        function loseLife() {
            state.lives -= 1;
            updateScorePill();
            if (state.lives <= 0) {
                state.running = false;
                if (displayGameOver) displayGameOver('Score', state.score);
                return;
            }
            resetBall();
        }

        function nextLevel() {
            state.level += 1;
            state.score += 200;
            createLevel(state.level);
            resetBall();
            updateScorePill();
        }

        function update(delta) {
            if (!state.running) return;

            if (!ball.launched) {
                ball.x = paddle.x + paddle.width / 2;
                ball.y = canvas.height - paddle.height - 18 - ball.radius;
            } else {
                ball.x += ball.vx;
                ball.y += ball.vy;
            }

            if (leftPressed) paddle.x -= paddle.speed;
            if (rightPressed) paddle.x += paddle.speed;
            paddle.x = clamp(paddle.x, 12, canvas.width - paddle.width - 12);

            handleWallCollisions();
            handlePaddleCollision();
            handleBrickCollisions();

            if (ball.y - ball.radius > canvas.height + 30) {
                loseLife();
            }

            if (state.bricks.length === 0 && state.running) {
                nextLevel();
            }
        }

        let lastTime = 0;
        function loop(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const delta = timestamp - lastTime;
            lastTime = timestamp;

            update(delta);
            draw();

            if (state.running || state.bricks.length === 0) {
                raf = requestAnimationFrame(loop);
            }
        }

        function handleMouseMove(event) {
            const rect = canvas.getBoundingClientRect();
            const mx = event.clientX - rect.left;
            paddle.x = clamp(mx - paddle.width / 2, 12, canvas.width - paddle.width - 12);
        }

        function handleTouchMove(event) {
            if (!event.touches.length) return;
            const rect = canvas.getBoundingClientRect();
            const mx = event.touches[0].clientX - rect.left;
            paddle.x = clamp(mx - paddle.width / 2, 12, canvas.width - paddle.width - 12);
        }

        function handleKeyDown(event) {
            if (event.key === 'ArrowLeft') {
                leftPressed = true;
                event.preventDefault();
            }
            if (event.key === 'ArrowRight') {
                rightPressed = true;
                event.preventDefault();
            }
            if (event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault();
                launchBall();
            }
        }

        function handleKeyUp(event) {
            if (event.key === 'ArrowLeft') {
                leftPressed = false;
                event.preventDefault();
            }
            if (event.key === 'ArrowRight') {
                rightPressed = false;
                event.preventDefault();
            }
        }

        function handleClick() {
            launchBall();
        }

        function attachEvents() {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
            canvas.addEventListener('click', handleClick);
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }

        function detachEvents() {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }

        function start() {
            state.level = 1;
            state.score = 0;
            state.lives = 3;
            state.running = true;
            leftPressed = false;
            rightPressed = false;
            createLevel(state.level);
            resetBall();
            updateScorePill();
            if (raf) cancelAnimationFrame(raf);
            lastTime = 0;
            raf = requestAnimationFrame(loop);
        }

        attachEvents();
        start();

        return {
            cleanup() {
                state.running = false;
                cancelAnimationFrame(raf);
                detachEvents();
            },
            restart() {
                detachEvents();
                attachEvents();
                start();
            }
        };
    }

    // ---------- 4) Memory Match (polished) ----------
    function buildMemory(container, setScore, displayGameOver) {
        container.innerHTML = `
        <div class="memory-wrapper" style="max-width:840px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
          <div class="memory-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <div class="memory-title" style="font-weight:900;font-size:20px">Aurora Memory</div>
            <div class="memory-meta" style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)">
              <span id="memory-moves">Moves: 0</span>
              <span id="memory-accuracy">Accuracy: 100%</span>
              <button id="memory-reset" class="memory-reset" style="padding:6px 14px;border-radius:999px;border:none;background:#845ef7;color:#fff;font-weight:600;cursor:pointer">Shuffle</button>
            </div>
          </div>
          <div id="mem-board" class="mem-grid" role="grid" aria-label="Memory board"></div>
        </div>
      `;

        const gridEl = container.querySelector('#mem-board');
        const movesEl = container.querySelector('#memory-moves');
        const accuracyEl = container.querySelector('#memory-accuracy');
        const resetBtn = container.querySelector('#memory-reset');

        const symbols = ['🍉', '🍍', '🫐', '🥝', '🍓', '🍋', '🍇', '🥥', '🍒', '🍑'];

        const state = {
            deck: [],
            first: null,
            second: null,
            locked: false,
            moves: 0,
            matches: 0,
            startTime: null
        };

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function buildDeck() {
            const pairs = symbols.slice(0, 8);
            const deck = pairs.concat(pairs).map((symbol, index) => ({
                id: index,
                symbol,
                flipped: false,
                solved: false
            }));
            shuffle(deck);
            state.deck = deck;
        }

        function renderCard(card) {
            const button = document.createElement('button');
            button.className = 'mem-card' + (card.solved ? ' matched' : '');
            button.setAttribute('data-id', card.id);
            button.setAttribute('role', 'gridcell');
            button.setAttribute('aria-pressed', card.flipped || card.solved ? 'true' : 'false');

            const inner = document.createElement('div');
            inner.className = 'mem-inner' + ((card.flipped || card.solved) ? ' revealed' : '');
            const front = document.createElement('div');
            front.className = 'mem-front';
            front.textContent = card.symbol;
            const back = document.createElement('div');
            back.className = 'mem-back';
            back.textContent = '?';
            inner.appendChild(front);
            inner.appendChild(back);
            button.appendChild(inner);

            return button;
        }

        function updateHUD() {
            movesEl.textContent = 'Moves: ' + state.moves;
            const accuracy = state.moves === 0 ? 100 : Math.round((state.matches / state.moves) * 100);
            accuracyEl.textContent = 'Accuracy: ' + accuracy + '%';
            setScore('Score: ' + (state.matches * 25));
        }

        function renderGrid() {
            gridEl.innerHTML = '';
            state.deck.forEach(card => {
                const cardEl = renderCard(card);
                gridEl.appendChild(cardEl);
            });
        }

        function resetGame() {
            state.first = null;
            state.second = null;
            state.locked = false;
            state.moves = 0;
            state.matches = 0;
            state.startTime = performance.now();
            buildDeck();
            renderGrid();
            updateHUD();
        }

        function handleMatch() {
            state.matches += 1;
            const totalPairs = state.deck.length / 2;
            if (state.matches === totalPairs) {
                const elapsed = Math.round((performance.now() - state.startTime) / 1000);
                if (displayGameOver) {
                    displayGameOver('Score', state.matches * 25);
                } else {
                    setTimeout(() => {
                        alert(`You matched all pairs in ${state.moves} moves (${elapsed}s)!`);
                    }, 300);
                }
            }
        }

        function flipCard(card) {
            if (card.flipped || card.solved || state.locked) return;
            card.flipped = true;

            if (!state.first) {
                state.first = card;
            } else if (!state.second) {
                state.second = card;
                state.locked = true;
                state.moves += 1;
                updateHUD();

                if (state.first.symbol === state.second.symbol) {
                    state.first.solved = true;
                    state.second.solved = true;
                    state.locked = false;
                    state.first = null;
                    state.second = null;
                    handleMatch();
                } else {
                    setTimeout(() => {
                        state.first.flipped = false;
                        state.second.flipped = false;
                        state.first = null;
                        state.second = null;
                        state.locked = false;
                        renderGrid();
                    }, 700);
                }
            }

            renderGrid();
        }

        function onGridClick(event) {
            const button = event.target.closest('.memory-card');
            if (!button) return;
            const id = Number(button.dataset.id);
            const card = state.deck.find(entry => entry.id === id);
            if (!card) return;
            flipCard(card);
        }

        function cleanup() {
            gridEl.removeEventListener('click', onGridClick);
            resetBtn.removeEventListener('click', resetGame);
        }

        gridEl.addEventListener('click', onGridClick);
        resetBtn.addEventListener('click', resetGame);

        resetGame();

        return {
            cleanup,
            restart() {
                cleanup();
                gridEl.addEventListener('click', onGridClick);
                resetBtn.addEventListener('click', resetGame);
                resetGame();
            }
        };
    }

    // ---------- 5) Whack-a-Mole ----------
    function buildWhack(container, setScore) {
        container.innerHTML = `<div style="max-width:720px;margin:0 auto"><div style="font-weight:900">Whack-a-Mole</div><div id="whack-board" class="whack-grid" style="margin-top:12px"></div><div style="margin-top:10px;color:var(--muted)">30 second round — tap moles to score</div></div>`;
        const board = container.querySelector('#whack-board');
        const holes = 8;
        let active = -1, score = 0, time = 30;
        setScore('Score: 0');

        for (let i = 0; i < holes; i++) {
            const hole = document.createElement('div'); hole.className = 'hole';
            const mole = document.createElement('div'); mole.className = 'mole'; mole.textContent = '🐹';
            hole.appendChild(mole);
            hole.addEventListener('click', () => {
                if (mole.classList.contains('up')) { score += 1; setScore('Score: ' + score); mole.classList.remove('up'); active = -1; }
            });
            board.appendChild(hole);
        }

        function popRandom() {
            if (active !== -1) return;
            active = Math.floor(Math.random() * holes);
            const mole = board.children[active].querySelector('.mole');
            mole.classList.add('up');
            setTimeout(() => { if (mole.classList.contains('up')) { mole.classList.remove('up'); active = -1; } }, 800 + Math.random() * 600);
        }

        const popInterval = setInterval(() => popRandom(), 700);
        const timerInterval = setInterval(() => {
            time--;
            setScore('Score: ' + score + ' | Time: ' + time + 's');
            if (time <= 0) { clearInterval(popInterval); clearInterval(timerInterval); setScore('Final: ' + score); }
        }, 1000);

        return {
            cleanup() { clearInterval(popInterval); clearInterval(timerInterval); },
            restart() { active = -1; score = 0; time = 30; setScore('Score: 0'); }
        };
    }

    // ---------- 6) Flappy (polished) ----------
    function buildFlappy(container, setScore) {
        container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center">
          <div style="font-weight:900">Flappy</div>
          <canvas id="flappy-canvas" width="420" height="360" style="background:#071827;border-radius:8px;margin-top:10px"></canvas>
          <div style="margin-top:8px;color:var(--muted);font-size:13px">Tap/click or Space to flap</div>
        </div>`;
        const canvas = container.querySelector('#flappy-canvas');
        const ctx = canvas.getContext('2d');
        let bird = { x: 70, y: 180, vy: 0 };
        const gravity = 0.6, flap = -9;
        let pipes = []; let frames = 0; let score = 0; let running = true;
        setScore('Score: 0');

        function spawnPipe() {
            const gap = 120;
            const top = 40 + Math.random() * (canvas.height - gap - 80);
            pipes.push({ x: canvas.width, top, gap, w: 46 });
        }

        function update() {
            frames++;
            bird.vy += gravity; bird.y += bird.vy;
            if (frames % 100 === 0) spawnPipe();
            pipes.forEach(p => p.x -= 2.6);
            // remove offscreen and count
            if (pipes.length && pipes[0].x + pipes[0].w < 0) { pipes.shift(); score++; setScore('Score: ' + score); }
            // collision
            if (bird.y + 12 > canvas.height || bird.y - 12 < 0) gameOver();
            for (const p of pipes) {
                if (bird.x + 12 > p.x && bird.x - 12 < p.x + p.w) {
                    if (bird.y - 12 < p.top || bird.y + 12 > p.top + p.gap) gameOver();
                }
            }
        }
        // Helper for color manipulation
        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);
            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);
            R = (R < 255) ? R : 255;
            G = (G < 255) ? G : 255;
            B = (B < 255) ? B : 255;
            const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
            const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
            const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));
            return "#" + RR + GG + BB;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Add subtle parallax background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#0a4f6a');
            bgGrad.addColorStop(1, '#071827');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bird with 3D effect
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(bird.vy * 0.08); // Tilt based on velocity

            // Bird body glow
            ctx.shadowColor = 'rgba(255,213,79,0.4)';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffd54f';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            // Wing
            ctx.fillStyle = shadeColor('#ffd54f', -20);
            ctx.beginPath();
            ctx.ellipse(-8, 0, 6, 4, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.shadowBlur = 0;

            // Pipes with 3D effect
            pipes.forEach(p => {
                // Top pipe
                const gradTop = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
                gradTop.addColorStop(0, '#43a047');
                gradTop.addColorStop(0.5, '#66bb6a');
                gradTop.addColorStop(1, '#43a047');
                ctx.fillStyle = gradTop;
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 3;
                ctx.fillRect(p.x, 0, p.w, p.top);

                // Bottom pipe
                const gradBottom = ctx.createLinearGradient(p.x, p.top + p.gap, p.x + p.w, p.top + p.gap);
                gradBottom.addColorStop(0, '#43a047');
                gradBottom.addColorStop(0.5, '#66bb6a');
                gradBottom.addColorStop(1, '#43a047');
                ctx.fillStyle = gradBottom;
                ctx.fillRect(p.x, p.top + p.gap, p.w, canvas.height - (p.top + p.gap));
            });
        }

        function flapIt() { bird.vy = flap; }
        function gameOver() { running = false; setScore('Final: ' + score); }
        function loop() { if (running) { update(); draw(); raf = requestAnimationFrame(loop); } }
        let raf = requestAnimationFrame(loop);
        // controls
        function onKey(e) { if (e.code === 'Space') { e.preventDefault(); flapIt(); } }
        canvas.addEventListener('click', flapIt);
        window.addEventListener('keydown', onKey);

        return {
            cleanup() { cancelAnimationFrame(raf); canvas.removeEventListener('click', flapIt); window.removeEventListener('keydown', onKey); },
            restart() { bird = { x: 70, y: 180, vy: 0 }; pipes = []; frames = 0; score = 0; running = true; setScore('Score: 0'); raf = requestAnimationFrame(loop); }
        };
    }

    // ---------- Life Sim (BitLife-style) ----------
    function buildLifeSim(container, setScore) {
        const stats = {
            health: 100,
            happiness: 100,
            money: 0,
            age: 0
        };

        const events = [
            "You got a good grade in school! +10 happiness",
            "You caught a cold. -10 health",
            "You made a new friend! +15 happiness",
            "You found $20 on the street! +20 money",
            "You had a bad day at school. -5 happiness",
            "You exercised and felt great! +10 health",
            "You got in trouble. -10 happiness",
            "Your parents gave you allowance! +50 money",
            "You helped someone and felt good! +5 happiness",
            "You ate healthy food! +5 health"
        ];

        const jobs = [
            { title: "Student", salary: 0 },
            { title: "Part-time Worker", salary: 100 },
            { title: "Office Worker", salary: 500 },
            { title: "Manager", salary: 1000 },
            { title: "CEO", salary: 5000 }
        ];

        let currentJob = jobs[0];
        let log = [];

        container.innerHTML = `
        <div class="life-sim">
          <div class="life-header">
            <h3 style="margin:0">Your Life</h3>
            <div class="score-pill">Age: ${stats.age}</div>
          </div>
          
          <div class="life-stats">
            <div class="life-stat">
              <div class="stat-label">Health</div>
              <div class="stat-value">${stats.health}%</div>
            </div>
            <div class="life-stat">
              <div class="stat-label">Happiness</div>
              <div class="stat-value">${stats.happiness}%</div>
            </div>
            <div class="life-stat">
              <div class="stat-label">Money</div>
              <div class="stat-value">$${stats.money}</div>
            </div>
            <div class="life-stat">
              <div class="stat-label">Job</div>
              <div class="stat-value">${currentJob.title}</div>
            </div>
          </div>

          <div class="life-log" id="lifeLog"></div>

          <div class="life-actions">
            <button class="action-btn" id="ageBtn">Age Up</button>
            <button class="action-btn" id="workBtn">Work</button>
            <button class="action-btn" id="studyBtn">Study</button>
            <button class="action-btn" id="socialBtn">Socialize</button>
          </div>
        </div>
      `;

        function updateStats() {
            const statDivs = container.querySelectorAll('.life-stat');
            statDivs[0].querySelector('.stat-value').textContent = stats.health + '%';
            statDivs[1].querySelector('.stat-value').textContent = stats.happiness + '%';
            statDivs[2].querySelector('.stat-value').textContent = '$' + stats.money;
            statDivs[3].querySelector('.stat-value').textContent = currentJob.title;
            setScore(`Age: ${stats.age} | Money: $${stats.money}`);
        }

        function addLogEntry(text) {
            log.unshift({ age: stats.age, text });
            const logDiv = container.querySelector('#lifeLog');
            logDiv.innerHTML = log.slice(0, 10).map(entry => `
          <div class="log-entry">
            <span class="entry-age">Age ${entry.age}:</span>
            ${entry.text}
          </div>
        `).join('');
        }

        function randomEvent() {
            const event = events[Math.floor(Math.random() * events.length)];
            if (event.includes('health')) stats.health = Math.min(100, Math.max(0, stats.health + parseInt(event.match(/-?\d+/)[0])));
            if (event.includes('happiness')) stats.happiness = Math.min(100, Math.max(0, stats.happiness + parseInt(event.match(/-?\d+/)[0])));
            if (event.includes('money')) stats.money += parseInt(event.match(/-?\d+/)[0]);
            addLogEntry(event);
        }

        container.querySelector('#ageBtn').addEventListener('click', () => {
            stats.age++;
            stats.money += currentJob.salary;
            stats.health = Math.max(0, stats.health - 5);
            stats.happiness = Math.max(0, stats.happiness - 5);
            randomEvent();
            if (stats.age % 5 === 0 && currentJob.title !== "CEO") {
                const nextJob = jobs[jobs.indexOf(currentJob) + 1];
                if (nextJob) {
                    currentJob = nextJob;
                    addLogEntry(`You got promoted to ${currentJob.title}!`);
                }
            }
            updateStats();
            if (stats.health <= 0) {
                addLogEntry("Game Over - You ran out of health!");
                container.querySelector('#ageBtn').disabled = true;
            }
        });

        container.querySelector('#workBtn').addEventListener('click', () => {
            stats.money += currentJob.salary / 2;
            stats.happiness = Math.max(0, stats.happiness - 10);
            addLogEntry(`You worked extra hours and earned $${currentJob.salary / 2}!`);
            updateStats();
        });

        container.querySelector('#studyBtn').addEventListener('click', () => {
            stats.happiness = Math.max(0, stats.happiness - 5);
            addLogEntry("You studied hard and gained knowledge!");
            updateStats();
        });

        container.querySelector('#socialBtn').addEventListener('click', () => {
            stats.happiness = Math.min(100, stats.happiness + 15);
            stats.money = Math.max(0, stats.money - 20);
            addLogEntry("You went out with friends! +15 happiness, -$20");
            updateStats();
        });

        return {
            cleanup() { /* Nothing to clean up */ },
            restart() {
                stats.health = 100;
                stats.happiness = 100;
                stats.money = 0;
                stats.age = 0;
                currentJob = jobs[0];
                log = [];
                updateStats();
                container.querySelector('#ageBtn').disabled = false;
                container.querySelector('#lifeLog').innerHTML = '';
            }
        };
    }

    // ---------- Drive Rush (Drive Mad-style) ----------
    function buildDrive(container, setScore) {
        container.innerHTML = `
        <div class="drive-wrapper">
          <iframe
            src="Drive-Mad-main/index.html"
            class="drive-frame"
            title="Drive Mad"
            allow="fullscreen"
          ></iframe>
          <div class="drive-help">Use arrow keys or WASD. Press Restart to reload the level.</div>
        </div>
      `;

        const frame = container.querySelector('.drive-frame');
        setScore('Drive Mad');

        function reloadFrame() {
            try {
                // Reload via same-origin access when available
                frame.contentWindow.location.reload();
            } catch (err) {
                // Fallback for any load issues
                const url = frame.getAttribute('src');
                frame.src = '';
                frame.src = url;
            }
        }

        return {
            cleanup() {
                frame.src = 'about:blank';
            },
            restart() {
                reloadFrame();
            }
        };
    }

    // ---------- Drive Mad 3 (external host) ----------
    function buildDriveMad3(container, setScore) {
        container.innerHTML = `
        <div class="drive-wrapper">
          <iframe
            src="https://drivemad3.io/"
            class="drive-frame"
            title="Drive Mad 3"
            allow="fullscreen"
          ></iframe>
          <div class="drive-help">
            This loads directly from drivemad3.io, so you need internet access. Use Restart if the iframe hangs.
          </div>
        </div>
      `;

        const frame = container.querySelector('.drive-frame');
        setScore('Drive Mad 3');

        function reloadFrame() {
            const url = frame.getAttribute('src');
            frame.src = '';
            frame.src = url;
        }

        return {
            cleanup() {
                frame.src = 'about:blank';
            },
            restart() {
                reloadFrame();
            }
        };
    }

    // ---------- Moto X3M ----------
    function buildMotoX3M(container, setScore) {
        container.innerHTML = `
        <div class="drive-wrapper">
          <iframe
            src="https://moto-x3m.net/"
            class="drive-frame"
            title="Moto X3M"
            allow="fullscreen"
          ></iframe>
          <div class="drive-help">
            Loads the official Moto X3M site. Needs internet; use Restart if it freezes.
          </div>
        </div>
      `;

        const frame = container.querySelector('.drive-frame');
        setScore('Moto X3M');

        function reloadFrame() {
            const url = frame.getAttribute('src');
            frame.src = '';
            frame.src = url;
        }

        return {
            cleanup() {
                frame.src = 'about:blank';
            },
            restart() {
                reloadFrame();
            }
        };
    }

    // ---------- Basket Random ----------
    function buildBasketRandom(container, setScore) {
        container.innerHTML = `
        <div class="basket-wrapper">
          <iframe
            src="https://ubg98.github.io/BasketRandom/"
            class="basket-frame"
            title="Basket Random"
            allow="fullscreen"
          ></iframe>
          <div class="basket-help">
            Basket Random plays best with keyboard controls (W or ↑ to jump). This loads from the UBG mirror, so you’ll need an internet connection.
          </div>
        </div>
      `;

        const frame = container.querySelector('.basket-frame');
        setScore('Basket Random');

        function reloadFrame() {
            const url = frame.getAttribute('src');
            frame.src = '';
            frame.src = url;
        }

        return {
            cleanup() {
                frame.src = 'about:blank';
            },
            restart() {
                reloadFrame();
            }
        };
    }

    // ---------- Ancient Beast ----------
    function buildAncient(container, setScore) {
        container.innerHTML = `
        <div class="ancient-wrapper">
          <iframe
            src="https://ancientbeast.com/play"
            class="ancient-frame"
            title="Ancient Beast"
            allow="fullscreen"
          ></iframe>
          <div class="ancient-help">
            Ancient Beast is a turn-based strategy game. If you have a local build, replace the iframe source with your hosted path.
          </div>
        </div>
      `;

        const frame = container.querySelector('.ancient-frame');
        setScore('Ancient Beast');

        function reloadFrame() {
            const url = frame.getAttribute('src');
            frame.src = '';
            frame.src = url;
        }

        return {
            cleanup() {
                frame.src = 'about:blank';
            },
            restart() {
                reloadFrame();
            }
        };
    }

    // ---------- Block Craft ----------
    function buildCraft(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="font-weight:900;margin-bottom:10px">Block Craft</div>
          <div class="craft-world" id="craftWorld"></div>
          <div class="craft-inventory" id="inventory">
            <div class="inv-item" style="background:#4a6b82">🟦</div>
            <div class="inv-item" style="background:#388e3c">🟩</div>
            <div class="inv-item" style="background:#ffa000">🟨</div>
            <div class="inv-item" style="background:#d32f2f">🟥</div>
          </div>
        </div>
      `;

        const world = container.querySelector('#craftWorld');
        const blockSize = 30;
        let selectedBlock = '#4a6b82';
        let blocks = [];

        // Create ground
        for (let x = 0; x < world.offsetWidth; x += blockSize) {
            createBlock(x, world.offsetHeight - blockSize, '#388e3c');
        }

        function createBlock(x, y, color) {
            const block = document.createElement('div');
            block.className = 'craft-block';
            block.style.left = x + 'px';
            block.style.top = y + 'px';
            block.style.background = color;
            world.appendChild(block);
            blocks.push(block);

            block.addEventListener('contextmenu', e => {
                e.preventDefault();
                block.remove();
                blocks = blocks.filter(b => b !== block);
            });
        }

        world.addEventListener('click', e => {
            const rect = world.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / blockSize) * blockSize;
            const y = Math.floor((e.clientY - rect.top) / blockSize) * blockSize;

            // Check if block exists at position
            const existing = blocks.find(b => {
                const bRect = b.getBoundingClientRect();
                return bRect.left === x + rect.left && bRect.top === y + rect.top;
            });

            if (!existing) {
                createBlock(x, y, selectedBlock);
            }
        });

        container.querySelector('#inventory').addEventListener('click', e => {
            if (e.target.classList.contains('inv-item')) {
                selectedBlock = getComputedStyle(e.target).backgroundColor;
                document.querySelectorAll('.inv-item').forEach(item => item.style.border = '');
                e.target.style.border = '2px solid #39c5ff';
            }
        });

        return {
            cleanup() { },
            restart() {
                blocks.forEach(b => b.remove());
                blocks = [];
                for (let x = 0; x < world.offsetWidth; x += blockSize) {
                    createBlock(x, world.offsetHeight - blockSize, '#388e3c');
                }
            }
        };
    }

    // ---------- attach tiles to builders ----------
    document.getElementById('tile-2048').addEventListener('click', () => showGame('2048', build2048));
    document.getElementById('tile-snake').addEventListener('click', () => showGame('Snake', buildSnake));
    document.getElementById('tile-breakout').addEventListener('click', () => showGame('Breakout', buildBreakout));
    document.getElementById('tile-memory').addEventListener('click', () => showGame('Memory', buildMemory));
    document.getElementById('tile-whack').addEventListener('click', () => showGame('Whack-a-Mole', buildWhack));
    document.getElementById('tile-flappy').addEventListener('click', () => showGame('Flappy', buildFlappy));
    document.getElementById('tile-bitlife').addEventListener('click', () => showGame('Life Sim', buildLifeSim));
    document.getElementById('tile-drive').addEventListener('click', () => showGame('Drive Mad', buildDrive));
    document.getElementById('tile-drive3').addEventListener('click', () => showGame('Drive Mad 3', buildDriveMad3));
    document.getElementById('tile-motox').addEventListener('click', () => showGame('Moto X3M', buildMotoX3M));
    document.getElementById('tile-ancient').addEventListener('click', () => showGame('Ancient Beast', buildAncient));
    document.getElementById('tile-craft').addEventListener('click', () => showGame('Block Craft', buildCraft));
    document.getElementById('tile-runner').addEventListener('click', () => showGame('Temple Run', buildRunner));
    document.getElementById('tile-candy').addEventListener('click', () => showGame('Candy Match', buildCandy));
    document.getElementById('tile-pacman').addEventListener('click', () => showGame('Maze Chase', buildPacman));
    document.getElementById('tile-tetris').addEventListener('click', () => showGame('Block Drop', buildTetris));
    document.getElementById('tile-words').addEventListener('click', () => showGame('Word Quest', buildWords));
    document.getElementById('tile-piano').addEventListener('click', () => showGame('Piano Tiles', buildPiano));
    document.getElementById('tile-bubble').addEventListener('click', () => showGame('Bubble Pop', buildBubble));
    document.getElementById('tile-tower').addEventListener('click', () => showGame('Tower Stack', buildTower));
    document.getElementById('tile-race').addEventListener('click', () => showGame('Speed Racer', buildRace));

    // ---------- Temple Runner ----------
    function buildRunner(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="font-weight:900;margin-bottom:10px">Temple Run</div>
          <div class="runner-game">
            <div class="runner-track">
              <div id="runner-player" class="runner-player"></div>
            </div>
          </div>
        </div>
      `;

        const game = container.querySelector('.runner-game');
        const track = container.querySelector('.runner-track');
        const player = document.getElementById('runner-player');

        let score = 0;
        let speed = 5;
        let lane = 1; // 0=left, 1=center, 2=right
        let jumping = false;
        let obstacles = [];
        let gameActive = true;

        function updateScore(n) {
            score = n;
            setScore('Score: ' + score);
        }

        function createObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'runner-obstacle';
            const lane = Math.floor(Math.random() * 3);
            const width = 40;
            const height = 40;
            obstacle.style.width = width + 'px';
            obstacle.style.height = height + 'px';
            obstacle.style.left = (lane * 150 + 80) + 'px';
            obstacle.style.top = '-50px';
            track.appendChild(obstacle);
            return { el: obstacle, lane };
        }

        function movePlayer(newLane) {
            if (newLane >= 0 && newLane <= 2) {
                lane = newLane;
                player.style.transform = `translateX(${lane * 150}px)`;
            }
        }

        function jump() {
            if (!jumping) {
                jumping = true;
                player.style.bottom = '100px';
                setTimeout(() => {
                    player.style.bottom = '20px';
                    jumping = false;
                }, 500);
            }
        }

        function update() {
            if (!gameActive) return;

            // Create obstacles
            if (Math.random() < 0.02) {
                obstacles.push(createObstacle());
            }

            // Move obstacles
            obstacles.forEach((obs, i) => {
                const top = parseFloat(obs.el.style.top) || 0;
                obs.el.style.top = (top + speed) + 'px';

                // Check collision
                if (top > 300 && top < 360 && obs.lane === lane && !jumping) {
                    gameOver();
                }

                // Remove if off screen
                if (top > 400) {
                    obs.el.remove();
                    obstacles.splice(i, 1);
                    updateScore(score + 1);
                    speed = Math.min(15, 5 + Math.floor(score / 20));
                }
            });

            if (gameActive) requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Score', score);
        }

        // Controls
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') movePlayer(Math.max(0, lane - 1));
            if (e.key === 'ArrowRight') movePlayer(Math.min(2, lane + 1));
            if (e.key === 'ArrowUp' || e.key === ' ') jump();
        });

        // Touch controls
        let touchStartX = 0;
        game.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        });

        game.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 30) {
                if (diff > 0) movePlayer(Math.min(2, lane + 1));
                else movePlayer(Math.max(0, lane - 1));
            } else {
                jump();
            }
        });

        // Initial setup
        player.style.bottom = '20px';
        player.style.left = '80px';
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                window.removeEventListener('keydown', movePlayer);
            },
            restart() {
                obstacles.forEach(obs => obs.el.remove());
                obstacles = [];
                score = 0;
                speed = 5;
                lane = 1;
                jumping = false;
                gameActive = true;
                movePlayer(1);
                updateScore(0);
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Candy Match ----------
    function buildCandy(container, setScore) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Candy Match</div>
            <div class="score-pill">Score: 0</div>
          </div>
          <div class="candy-board"></div>
        </div>
      `;

        const board = container.querySelector('.candy-board');
        const size = 8;
        const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#ffeb3b'];
        let grid = [];
        let score = 0;
        let selected = null;

        function createGrid() {
            board.style.gridTemplateColumns = `repeat(${size}, 50px)`;
            grid = [];
            for (let i = 0; i < size; i++) {
                grid[i] = [];
                for (let j = 0; j < size; j++) {
                    const candy = document.createElement('div');
                    candy.className = 'candy';
                    candy.style.background = colors[Math.floor(Math.random() * colors.length)];
                    candy.dataset.row = i;
                    candy.dataset.col = j;
                    candy.addEventListener('click', () => selectCandy(i, j, candy));
                    board.appendChild(candy);
                    grid[i][j] = candy;
                }
            }
        }

        function selectCandy(row, col, candy) {
            if (selected) {
                if (selected.candy === candy) {
                    selected.candy.classList.remove('selected');
                    selected = null;
                } else if (isAdjacent(selected.row, selected.col, row, col)) {
                    swap(selected.row, selected.col, row, col);
                    selected.candy.classList.remove('selected');
                    selected = null;
                } else {
                    selected.candy.classList.remove('selected');
                    candy.classList.add('selected');
                    selected = { row, col, candy };
                }
            } else {
                candy.classList.add('selected');
                selected = { row, col, candy };
            }
        }

        function isAdjacent(r1, c1, r2, c2) {
            return (Math.abs(r1 - r2) === 1 && c1 === c2) ||
                (Math.abs(c1 - c2) === 1 && r1 === r2);
        }

        function swap(r1, c1, r2, c2) {
            const color1 = grid[r1][c1].style.background;
            const color2 = grid[r2][c2].style.background;
            grid[r1][c1].style.background = color2;
            grid[r2][c2].style.background = color1;
            checkMatches();
        }

        function checkMatches() {
            let matches = new Set();

            // Check rows
            for (let i = 0; i < size; i++) {
                let count = 1;
                let color = grid[i][0].style.background;
                for (let j = 1; j < size; j++) {
                    if (grid[i][j].style.background === color) {
                        count++;
                        if (count >= 3) {
                            for (let k = j; k > j - count; k--) {
                                matches.add(grid[i][k]);
                            }
                        }
                    } else {
                        count = 1;
                        color = grid[i][j].style.background;
                    }
                }
            }

            // Check columns
            for (let j = 0; j < size; j++) {
                let count = 1;
                let color = grid[0][j].style.background;
                for (let i = 1; i < size; i++) {
                    if (grid[i][j].style.background === color) {
                        count++;
                        if (count >= 3) {
                            for (let k = i; k > i - count; k--) {
                                matches.add(grid[k][j]);
                            }
                        }
                    } else {
                        count = 1;
                        color = grid[i][j].style.background;
                    }
                }
            }

            if (matches.size > 0) {
                score += matches.size * 10;
                setScore('Score: ' + score);
                matches.forEach(candy => {
                    candy.style.background = colors[Math.floor(Math.random() * colors.length)];
                    candy.classList.add('matched');
                    setTimeout(() => candy.classList.remove('matched'), 300);
                });
            }
        }

        createGrid();

        return {
            cleanup() { },
            restart() {
                score = 0;
                selected = null;
                setScore('Score: 0');
                board.innerHTML = '';
                createGrid();
            }
        };
    }

    // ---------- Maze Chase (Pac-Man style) ----------
    function buildPacman(container, setScore) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
          <div style="font-weight:900;margin-bottom:10px">Maze Chase</div>
          <div class="maze-game" style="width:600px;height:400px">
            <div id="maze-player" class="maze-player"></div>
          </div>
        </div>
      `;

        const game = container.querySelector('.maze-game');
        const player = document.getElementById('maze-player');
        const cellSize = 20;
        const cols = Math.floor(game.offsetWidth / cellSize);
        const rows = Math.floor(game.offsetHeight / cellSize);
        let score = 0;
        let ghosts = [];
        let dots = [];
        let walls = [];
        let playerPos = { x: 1, y: 1 };
        let gameActive = true;

        // Create maze using recursive backtracking
        const maze = Array(rows).fill().map(() => Array(cols).fill(1));

        function carve(x, y) {
            maze[y][x] = 0;
            const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]].sort(() => Math.random() - 0.5);

            for (let [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                if (newX > 0 && newX < cols - 1 && newY > 0 && newY < rows - 1 && maze[newY][newX] === 1) {
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(newX, newY);
                }
            }
        }

        function initMaze() {
            carve(1, 1);

            // Create walls
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (maze[y][x] === 1) {
                        const wall = document.createElement('div');
                        wall.className = 'maze-wall';
                        wall.style.left = (x * cellSize) + 'px';
                        wall.style.top = (y * cellSize) + 'px';
                        wall.style.width = cellSize + 'px';
                        wall.style.height = cellSize + 'px';
                        game.appendChild(wall);
                        walls.push({ x, y, el: wall });
                    } else if (x > 1 || y > 1) { // Don't place dots near start
                        const dot = document.createElement('div');
                        dot.className = 'maze-dot';
                        dot.style.left = (x * cellSize + cellSize / 2) + 'px';
                        dot.style.top = (y * cellSize + cellSize / 2) + 'px';
                        dot.style.width = '4px';
                        dot.style.height = '4px';
                        game.appendChild(dot);
                        dots.push({ x, y, el: dot });
                    }
                }
            }

            // Create ghosts
            for (let i = 0; i < 4; i++) {
                const ghost = document.createElement('div');
                ghost.className = 'maze-ghost';
                ghost.style.width = (cellSize - 4) + 'px';
                ghost.style.height = (cellSize - 4) + 'px';
                ghost.style.left = ((cols - 2) * cellSize) + 'px';
                ghost.style.top = ((rows - 2) * cellSize) + 'px';
                game.appendChild(ghost);
                ghosts.push({
                    x: cols - 2,
                    y: rows - 2,
                    el: ghost,
                    dir: { x: 0, y: 0 }
                });
            }
        }

        function movePlayer(dx, dy) {
            const newX = playerPos.x + dx;
            const newY = playerPos.y + dy;

            if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
                playerPos.x = newX;
                playerPos.y = newY;
                player.style.left = (newX * cellSize) + 'px';
                player.style.top = (newY * cellSize) + 'px';

                // Collect dots
                dots = dots.filter(dot => {
                    if (Math.abs(dot.x - playerPos.x) < 0.5 && Math.abs(dot.y - playerPos.y) < 0.5) {
                        dot.el.remove();
                        score += 10;
                        setScore('Score: ' + score);
                        return false;
                    }
                    return true;
                });

                // Check win
                if (dots.length === 0) {
                    gameActive = false;
                    alert('You Win! Score: ' + score);
                }
            }
        }

        function moveGhosts() {
            ghosts.forEach(ghost => {
                if (Math.random() < 0.1) { // Change direction occasionally
                    const possible = [[0, 1], [1, 0], [0, -1], [-1, 0]].filter(([dx, dy]) => {
                        const newX = ghost.x + dx;
                        const newY = ghost.y + dy;
                        return newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0;
                    });
                    if (possible.length) {
                        const [dx, dy] = possible[Math.floor(Math.random() * possible.length)];
                        ghost.dir = { x: dx, y: dy };
                    }
                }

                const newX = ghost.x + ghost.dir.x;
                const newY = ghost.y + ghost.dir.y;
                if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
                    ghost.x = newX;
                    ghost.y = newY;
                    ghost.el.style.left = (newX * cellSize) + 'px';
                    ghost.el.style.top = (newY * cellSize) + 'px';

                    // Check collision with player
                    if (Math.abs(ghost.x - playerPos.x) < 0.5 && Math.abs(ghost.y - playerPos.y) < 0.5) {
                        gameActive = false;
                        displayGameOver('Score', score);
                    }
                }
            });
        }

        function update() {
            if (gameActive) {
                moveGhosts();
                requestAnimationFrame(update);
            }
        }

        // Controls
        window.addEventListener('keydown', e => {
            if (!gameActive) return;
            if (e.key === 'ArrowLeft') movePlayer(-1, 0);
            if (e.key === 'ArrowRight') movePlayer(1, 0);
            if (e.key === 'ArrowUp') movePlayer(0, -1);
            if (e.key === 'ArrowDown') movePlayer(0, 1);
        });

        // Touch controls
        let touchStartX = 0, touchStartY = 0;
        game.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        game.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                movePlayer(dx > 0 ? 1 : -1, 0);
            } else {
                movePlayer(0, dy > 0 ? 1 : -1);
            }
        });

        // Initial setup
        player.style.width = (cellSize - 4) + 'px';
        player.style.height = (cellSize - 4) + 'px';
        player.style.left = cellSize + 'px';
        player.style.top = cellSize + 'px';

        initMaze();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                window.removeEventListener('keydown', movePlayer);
            },
            restart() {
                gameActive = false;
                game.innerHTML = '<div id="maze-player" class="maze-player"></div>';
                player = document.getElementById('maze-player');
                player.style.width = (cellSize - 4) + 'px';
                player.style.height = (cellSize - 4) + 'px';
                player.style.left = cellSize + 'px';
                player.style.top = cellSize + 'px';
                playerPos = { x: 1, y: 1 };
                score = 0;
                ghosts = [];
                dots = [];
                walls = [];
                initMaze();
                gameActive = true;
                setScore('Score: 0');
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Block Drop (Tetris style) ----------
    function buildTetris(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;gap:20px;align-items:start">
            <div>
              <div style="font-weight:900;margin-bottom:10px">Block Drop</div>
              <div class="tetris-board"></div>
            </div>
            <div>
              <div style="margin-bottom:10px">Next:</div>
              <div class="tetris-next"></div>
            </div>
          </div>
        </div>
      `;

        const board = container.querySelector('.tetris-board');
        const nextDisplay = container.querySelector('.tetris-next');
        const rows = 20, cols = 10;
        let score = 0;
        let currentPiece = null;
        let nextPiece = null;
        let grid = [];
        let gameActive = true;

        const pieces = [
            { shape: [[1, 1, 1, 1]], color: '#00bcd4' },    // I
            { shape: [[1, 1, 1], [0, 1, 0]], color: '#9c27b0' },  // T
            { shape: [[1, 1, 1], [1, 0, 0]], color: '#ff9800' },  // L
            { shape: [[1, 1, 1], [0, 0, 1]], color: '#2196f3' },  // J
            { shape: [[1, 1], [1, 1]], color: '#ffeb3b' },    // O
            { shape: [[1, 1, 0], [0, 1, 1]], color: '#4caf50' }, // S
            { shape: [[0, 1, 1], [1, 1, 0]], color: '#f44336' }  // Z
        ];

        function createGrid() {
            board.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
            nextDisplay.style.gridTemplateColumns = 'repeat(4, 25px)';

            grid = [];
            board.innerHTML = '';
            for (let i = 0; i < rows; i++) {
                grid[i] = [];
                for (let j = 0; j < cols; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'tetris-cell';
                    board.appendChild(cell);
                    grid[i][j] = cell;
                }
            }

            // Next piece display
            nextDisplay.innerHTML = '';
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'tetris-cell';
                    nextDisplay.appendChild(cell);
                }
            }
        }

        function createPiece() {
            const piece = pieces[Math.floor(Math.random() * pieces.length)];
            return {
                shape: piece.shape,
                color: piece.color,
                x: Math.floor((cols - piece.shape[0].length) / 2),
                y: 0
            };
        }

        function drawPiece(piece, erase = false) {
            const color = erase ? '' : piece.color;
            piece.shape.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (cell && piece.y + i >= 0) {
                        grid[piece.y + i][piece.x + j].style.background = color;
                    }
                });
            });
        }

        function drawNextPiece(piece) {
            const cells = nextDisplay.children;
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    cells[i * 4 + j].style.background = '';
                }
            }

            piece.shape.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (cell) {
                        cells[i * 4 + j].style.background = piece.color;
                    }
                });
            });
        }

        function canMove(piece, dx, dy) {
            return piece.shape.every((row, i) => {
                return row.every((cell, j) => {
                    if (!cell) return true;
                    const newX = piece.x + j + dx;
                    const newY = piece.y + i + dy;
                    return newX >= 0 && newX < cols && newY < rows &&
                        (newY < 0 || !grid[newY][newX].style.background);
                });
            });
        }

        function rotatePiece(piece) {
            const newShape = piece.shape[0].map((_, i) =>
                piece.shape.map(row => row[i]).reverse()
            );
            const newPiece = { ...piece, shape: newShape };
            if (canMove(newPiece, 0, 0)) {
                drawPiece(piece, true);
                piece.shape = newShape;
                drawPiece(piece);
            }
        }

        function checkLines() {
            for (let i = rows - 1; i >= 0; i--) {
                if (grid[i].every(cell => cell.style.background)) {
                    // Remove line
                    for (let j = i; j > 0; j--) {
                        for (let k = 0; k < cols; k++) {
                            grid[j][k].style.background = grid[j - 1][k].style.background;
                        }
                    }
                    // Clear top line
                    for (let k = 0; k < cols; k++) {
                        grid[0][k].style.background = '';
                    }
                    score += 100;
                    setScore('Score: ' + score);
                    i++; // Check the same line again
                }
            }
        }

        function update() {
            if (!gameActive) return;

            if (currentPiece) {
                if (canMove(currentPiece, 0, 1)) {
                    drawPiece(currentPiece, true);
                    currentPiece.y++;
                    drawPiece(currentPiece);
                } else {
                    checkLines();
                    currentPiece = nextPiece;
                    nextPiece = createPiece();
                    drawNextPiece(nextPiece);
                    if (!canMove(currentPiece, 0, 0)) {
                        gameActive = false;
                        displayGameOver('Score', score);
                        return;
                    }
                }
            } else {
                currentPiece = createPiece();
                nextPiece = createPiece();
                drawNextPiece(nextPiece);
            }

            setTimeout(update, 500 - Math.min(300, Math.floor(score / 1000) * 50));
        }

        // Controls
        window.addEventListener('keydown', e => {
            if (!gameActive || !currentPiece) return;
            if (e.key === 'ArrowLeft' && canMove(currentPiece, -1, 0)) {
                drawPiece(currentPiece, true);
                currentPiece.x--;
                drawPiece(currentPiece);
            }
            if (e.key === 'ArrowRight' && canMove(currentPiece, 1, 0)) {
                drawPiece(currentPiece, true);
                currentPiece.x++;
                drawPiece(currentPiece);
            }
            if (e.key === 'ArrowDown' && canMove(currentPiece, 0, 1)) {
                drawPiece(currentPiece, true);
                currentPiece.y++;
                drawPiece(currentPiece);
            }
            if (e.key === 'ArrowUp') {
                rotatePiece(currentPiece);
            }
        });

        createGrid();
        update();

        return {
            cleanup() {
                gameActive = false;
            },
            restart() {
                gameActive = false;
                score = 0;
                currentPiece = null;
                nextPiece = null;
                setScore('Score: 0');
                createGrid();
                gameActive = true;
                update();
            }
        };
    }

    // ---------- Word Quest ----------
    function buildWords(container, setScore) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Word Quest</div>
            <div class="score-pill">Found: 0/10</div>
          </div>
          <div class="word-grid"></div>
          <div class="word-list"></div>
        </div>
      `;

        const grid = container.querySelector('.word-grid');
        const wordList = container.querySelector('.word-list');
        const size = 12;
        const words = ['JAVASCRIPT', 'PYTHON', 'RUBY', 'JAVA', 'HTML', 'CSS', 'PHP', 'SQL', 'RUST', 'SWIFT'];
        let board = [];
        let foundWords = new Set();
        let selectedCells = [];

        function createGrid() {
            grid.style.gridTemplateColumns = `repeat(${size}, 40px)`;
            board = Array(size).fill().map(() => Array(size).fill(''));

            // Place words
            words.forEach(word => {
                let placed = false;
                while (!placed) {
                    const horizontal = Math.random() < 0.5;
                    const reverse = Math.random() < 0.3;
                    const w = reverse ? word.split('').reverse().join('') : word;

                    if (horizontal) {
                        const y = Math.floor(Math.random() * size);
                        const x = Math.floor(Math.random() * (size - word.length + 1));
                        if (canPlace(w, x, y, 1, 0)) {
                            placeWord(w, x, y, 1, 0);
                            placed = true;
                        }
                    } else {
                        const x = Math.floor(Math.random() * size);
                        const y = Math.floor(Math.random() * (size - word.length + 1));
                        if (canPlace(w, x, y, 0, 1)) {
                            placeWord(w, x, y, 0, 1);
                            placed = true;
                        }
                    }
                }
            });

            // Fill empty cells
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (!board[y][x]) {
                        board[y][x] = letters[Math.floor(Math.random() * letters.length)];
                    }
                }
            }

            // Create DOM elements
            grid.innerHTML = '';
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'word-cell';
                    cell.textContent = board[y][x];
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.addEventListener('mousedown', () => startSelection(cell));
                    cell.addEventListener('mouseover', () => continueSelection(cell));
                    grid.appendChild(cell);
                }
            }

            // Create word list
            wordList.innerHTML = words.map(word =>
                `<div class="word-item" data-word="${word}">${word}</div>`
            ).join('');
        }

        function canPlace(word, x, y, dx, dy) {
            for (let i = 0; i < word.length; i++) {
                const cx = x + i * dx;
                const cy = y + i * dy;
                if (board[cy][cx] && board[cy][cx] !== word[i]) return false;
            }
            return true;
        }

        function placeWord(word, x, y, dx, dy) {
            for (let i = 0; i < word.length; i++) {
                board[y + i * dy][x + i * dx] = word[i];
            }
        }

        function startSelection(cell) {
            selectedCells = [cell];
            cell.classList.add('selected');

            document.addEventListener('mouseup', checkWord);
        }

        function continueSelection(cell) {
            if (selectedCells.length && !selectedCells.includes(cell)) {
                const first = selectedCells[0];
                const dx = Math.abs(cell.dataset.x - first.dataset.x);
                const dy = Math.abs(cell.dataset.y - first.dataset.y);

                if (dx === selectedCells.length - 1 && dy === 0 ||
                    dy === selectedCells.length - 1 && dx === 0) {
                    cell.classList.add('selected');
                    selectedCells.push(cell);
                }
            }
        }

        function checkWord() {
            document.removeEventListener('mouseup', checkWord);

            const word = selectedCells.map(cell => cell.textContent).join('');
            const reverseWord = word.split('').reverse().join('');

            if (words.includes(word) || words.includes(reverseWord)) {
                if (!foundWords.has(word) && !foundWords.has(reverseWord)) {
                    foundWords.add(word);
                    selectedCells.forEach(cell => cell.style.background = '#4caf50');
                    wordList.querySelector(`[data-word="${word}"]`).style.opacity = '0.5';
                    setScore(`Found: ${foundWords.size}/10`);

                    if (foundWords.size === words.length) {
                        alert('Congratulations! You found all words!');
                    }
                }
            }

            selectedCells.forEach(cell => cell.classList.remove('selected'));
            selectedCells = [];
        }

        createGrid();

        return {
            cleanup() { },
            restart() {
                foundWords.clear();
                setScore('Found: 0/10');
                createGrid();
            }
        };
    }

    // ---------- Piano Tiles ----------
    function buildPiano(container, setScore) {
        container.innerHTML = `
        <div style="max-width:400px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Piano Tiles</div>
            <div class="score-pill">Score: 0</div>
          </div>
          <div class="piano-game"></div>
        </div>
      `;

        const game = container.querySelector('.piano-game');
        const lanes = 4;
        const laneWidth = game.offsetWidth / lanes;
        let tiles = [];
        let score = 0;
        let speed = 2;
        let gameActive = true;
        let lastTileTime = 0;
        let missedTile = false;

        function createLanes() {
            for (let i = 0; i < lanes; i++) {
                const lane = document.createElement('div');
                lane.className = 'piano-lane';
                lane.style.left = (i * laneWidth) + 'px';
                lane.style.width = laneWidth + 'px';
                game.appendChild(lane);
            }
        }

        function createTile() {
            const lane = Math.floor(Math.random() * lanes);
            const tile = document.createElement('div');
            tile.className = 'piano-tile';
            tile.style.left = (lane * laneWidth) + 'px';
            tile.style.width = laneWidth + 'px';
            tile.style.height = '80px';
            tile.style.top = '-80px';
            game.appendChild(tile);

            tile.addEventListener('click', () => {
                if (parseFloat(tile.style.top) < game.offsetHeight - 100) {
                    missedTile = true;
                    gameOver();
                } else {
                    score += 1;
                    setScore('Score: ' + score);
                    tile.remove();
                    tiles = tiles.filter(t => t !== tile);
                    speed = Math.min(8, 2 + score / 50);
                    playNote(lane);
                }
            });

            tiles.push(tile);
        }

        function playNote(lane) {
            const notes = [261.63, 293.66, 329.63, 349.23]; // C4, D4, E4, F4
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(notes[lane], audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        function update(timestamp) {
            if (!gameActive) return;

            // Create new tiles
            if (timestamp - lastTileTime > 1500 - score * 10) {
                createTile();
                lastTileTime = timestamp;
            }

            // Move tiles
            tiles.forEach(tile => {
                const top = parseFloat(tile.style.top) || 0;
                tile.style.top = (top + speed) + 'px';

                if (top > game.offsetHeight) {
                    missedTile = true;
                    gameOver();
                }
            });

            requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Score', score);
        }

        // Touch/mouse handling for mobile
        game.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            const lane = Math.floor(touch.clientX / laneWidth);
            const tiles = Array.from(game.querySelectorAll('.piano-tile'));
            const laneTiles = tiles.filter(tile =>
                parseInt(tile.style.left) === lane * laneWidth
            );

            if (laneTiles.length) {
                const bottomTile = laneTiles.reduce((a, b) =>
                    parseFloat(a.style.top) > parseFloat(b.style.top) ? a : b
                );
                bottomTile.click();
            }
        });

        createLanes();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
            },
            restart() {
                tiles.forEach(tile => tile.remove());
                tiles = [];
                score = 0;
                speed = 2;
                missedTile = false;
                lastTileTime = 0;
                setScore('Score: 0');
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Bubble Pop ----------
    function buildBubble(container, setScore) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Bubble Pop</div>
            <div class="score-pill">Score: 0</div>
          </div>
          <div class="bubble-game">
            <div class="bubble-shooter"></div>
          </div>
        </div>
      `;

        const game = container.querySelector('.bubble-game');
        const shooter = game.querySelector('.bubble-shooter');
        const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
        let bubbles = [];
        let score = 0;
        let gameActive = true;
        let angle = 0;
        let currentBubble = null;

        function createBubble(x, y, color = null) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.style.left = x + 'px';
            bubble.style.top = y + 'px';
            bubble.style.background = color || colors[Math.floor(Math.random() * colors.length)];
            game.appendChild(bubble);
            return bubble;
        }

        function initGrid() {
            const rows = 5;
            const cols = 10;
            const size = 40;

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const x = j * (size + 2) + (i % 2) * (size / 2);
                    const y = i * (size - 10);
                    const bubble = createBubble(x, y);
                    bubbles.push({
                        el: bubble,
                        x: x,
                        y: y,
                        color: bubble.style.background
                    });
                }
            }
        }

        function updateShooter() {
            shooter.style.transform = `rotate(${angle}deg)`;
        }

        function shootBubble() {
            if (currentBubble) return;

            const shooterRect = shooter.getBoundingClientRect();
            const gameRect = game.getBoundingClientRect();
            const startX = shooterRect.left - gameRect.left + shooter.offsetWidth / 2 - 20;
            const startY = game.offsetHeight - 40;

            const bubble = createBubble(startX, startY, colors[Math.floor(Math.random() * colors.length)]);
            const radians = angle * Math.PI / 180;
            const speed = 10;
            const velocity = {
                x: Math.sin(radians) * speed,
                y: -Math.cos(radians) * speed
            };

            currentBubble = { el: bubble, x: startX, y: startY, velocity, color: bubble.style.background };
        }

        function findMatchingBubbles(bubble) {
            const matches = new Set([bubble]);
            const toCheck = [bubble];

            while (toCheck.length) {
                const current = toCheck.pop();
                const neighbors = bubbles.filter(b =>
                    b !== current &&
                    !matches.has(b) &&
                    b.color === current.color &&
                    Math.hypot(b.x - current.x, b.y - current.y) < 50
                );

                neighbors.forEach(n => {
                    matches.add(n);
                    toCheck.push(n);
                });
            }

            return matches;
        }

        function update() {
            if (!gameActive) return;

            if (currentBubble) {
                currentBubble.x += currentBubble.velocity.x;
                currentBubble.y += currentBubble.velocity.y;

                // Bounce off walls
                if (currentBubble.x < 0 || currentBubble.x > game.offsetWidth - 40) {
                    currentBubble.velocity.x *= -1;
                }

                // Check collision with existing bubbles
                for (const bubble of bubbles) {
                    const dx = bubble.x - currentBubble.x;
                    const dy = bubble.y - currentBubble.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < 40) {
                        // Snap to grid
                        const snapY = Math.round(currentBubble.y / 30) * 30;
                        currentBubble.y = snapY;
                        currentBubble.x = Math.round(currentBubble.x / 40) * 40;

                        bubbles.push({
                            el: currentBubble.el,
                            x: currentBubble.x,
                            y: currentBubble.y,
                            color: currentBubble.color
                        });

                        // Check for matches
                        const matches = findMatchingBubbles(bubbles[bubbles.length - 1]);
                        if (matches.size >= 3) {
                            matches.forEach(bubble => {
                                bubble.el.remove();
                                bubbles = bubbles.filter(b => b !== bubble);
                            });
                            score += matches.size * 10;
                            setScore('Score: ' + score);
                        }

                        currentBubble = null;
                        break;
                    }
                }

                // Update position
                if (currentBubble) {
                    currentBubble.el.style.left = currentBubble.x + 'px';
                    currentBubble.el.style.top = currentBubble.y + 'px';

                    // Check top collision
                    if (currentBubble.y < 0) {
                        bubbles.push({
                            el: currentBubble.el,
                            x: currentBubble.x,
                            y: 0,
                            color: currentBubble.color
                        });
                        currentBubble = null;
                    }
                }
            }

            requestAnimationFrame(update);
        }

        // Controls
        game.addEventListener('mousemove', e => {
            const rect = game.getBoundingClientRect();
            const x = e.clientX - rect.left - game.offsetWidth / 2;
            const y = rect.bottom - e.clientY;
            angle = Math.atan2(x, y) * 180 / Math.PI;
            angle = Math.max(-80, Math.min(80, angle));
            updateShooter();
        });

        game.addEventListener('click', shootBubble);

        // Touch controls
        game.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = game.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left - game.offsetWidth / 2;
            const y = rect.bottom - e.touches[0].clientY;
            angle = Math.atan2(x, y) * 180 / Math.PI;
            angle = Math.max(-80, Math.min(80, angle));
            updateShooter();
        });

        game.addEventListener('touchend', shootBubble);

        // Setup
        shooter.style.width = '40px';
        shooter.style.height = '40px';
        shooter.style.background = '#2196f3';
        shooter.style.borderRadius = '50% 50% 0 0';

        initGrid();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
            },
            restart() {
                bubbles.forEach(b => b.el.remove());
                bubbles = [];
                if (currentBubble) {
                    currentBubble.el.remove();
                    currentBubble = null;
                }
                score = 0;
                setScore('Score: 0');
                initGrid();
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Tower Stack ----------
    function buildTower(container, setScore) {
        container.innerHTML = `
        <div style="max-width:600px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Tower Stack</div>
            <div class="score-pill">Height: 0</div>
          </div>
          <div class="tower-game">
            <div id="tower-base" style="position:absolute;bottom:0;width:100%;height:60px;background:#1a3c4d"></div>
          </div>
        </div>
      `;

        const game = container.querySelector('.tower-game');
        const baseWidth = 200;
        const blockHeight = 40;
        let blocks = [];
        let currentBlock = null;
        let direction = 1;
        let speed = 3;
        let score = 0;
        let gameActive = true;

        function createBlock(width, y) {
            const block = document.createElement('div');
            block.className = 'tower-block';
            block.style.width = width + 'px';
            block.style.height = blockHeight + 'px';
            block.style.bottom = y + 'px';
            game.appendChild(block);
            return block;
        }

        function spawnBlock() {
            const lastBlock = blocks[blocks.length - 1];
            const width = lastBlock ? lastBlock.width : baseWidth;
            const y = blocks.length * blockHeight;
            const x = -width;

            const block = createBlock(width, y);
            currentBlock = {
                el: block,
                width,
                x,
                y
            };
        }

        function dropBlock() {
            if (!currentBlock) return;

            const lastBlock = blocks[blocks.length - 1];
            const lastX = lastBlock ? lastBlock.x : (game.offsetWidth - baseWidth) / 2;
            const overhang = Math.abs(currentBlock.x - lastX);

            if (overhang >= currentBlock.width) {
                // Missed completely
                gameOver();
                return;
            }

            // Calculate new width
            const newWidth = currentBlock.width - overhang;
            currentBlock.el.style.width = newWidth + 'px';
            currentBlock.width = newWidth;
            currentBlock.x = lastX + (currentBlock.x > lastX ? overhang : 0);
            currentBlock.el.style.left = currentBlock.x + 'px';

            blocks.push(currentBlock);
            score++;
            setScore('Height: ' + score);

            // Increase difficulty
            speed = Math.min(8, 3 + score / 10);

            spawnBlock();
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Height', score);
        }

        function update() {
            if (!gameActive || !currentBlock) return;

            currentBlock.x += speed * direction;
            currentBlock.el.style.left = currentBlock.x + 'px';

            if (currentBlock.x + currentBlock.width > game.offsetWidth) {
                direction = -1;
            } else if (currentBlock.x < 0) {
                direction = 1;
            }

            requestAnimationFrame(update);
        }

        // Controls
        game.addEventListener('click', dropBlock);
        game.addEventListener('touchend', dropBlock);

        // Start game
        const base = document.getElementById('tower-base');
        base.style.left = (game.offsetWidth - baseWidth) / 2 + 'px';
        base.style.width = baseWidth + 'px';
        spawnBlock();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
            },
            restart() {
                blocks.forEach(b => b.el.remove());
                blocks = [];
                if (currentBlock) {
                    currentBlock.el.remove();
                    currentBlock = null;
                }
                score = 0;
                speed = 3;
                direction = 1;
                setScore('Height: 0');
                spawnBlock();
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Solitaire ----------
    function buildSolitaire(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Solitaire</div>
            <div class="score-pill">Moves: 0</div>
          </div>
          <div class="solitaire-table"></div>
        </div>
      `;

        const table = container.querySelector('.solitaire-table');
        let moves = 0;
        let gameActive = true;
        let selectedCard = null;
        let deck = [];
        let drawPile = [];
        let wastePile = [];
        let foundations = [[], [], [], []];
        let tableaus = [[], [], [], [], [], [], []];

        const SUITS = ['♠', '♥', '♦', '♣'];
        const COLORS = {
            '♠': 'black',
            '♥': 'red',
            '♦': 'red',
            '♣': 'black'
        };

        function createDeck() {
            const deck = [];
            for (const suit of SUITS) {
                for (let value = 1; value <= 13; value++) {
                    deck.push({ suit, value, faceUp: false });
                }
            }
            return shuffle(deck);
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function createCardElement(card, draggable = true) {
            const el = document.createElement('div');
            el.className = 'solitaire-card';
            if (!card.faceUp) {
                el.classList.add('face-down');
                el.textContent = '🂠';
                return el;
            }

            el.dataset.suit = card.suit;
            el.dataset.value = card.value;
            el.draggable = draggable;

            const value = card.value === 1 ? 'A' :
                card.value === 11 ? 'J' :
                    card.value === 12 ? 'Q' :
                        card.value === 13 ? 'K' : card.value;

            el.innerHTML = `
          <div class="card-value top">${value}</div>
          <div class="card-suit ${COLORS[card.suit]}">${card.suit}</div>
          <div class="card-value bottom">${value}</div>
        `;
            return el;
        }

        function setupGame() {
            // Create deck area
            const deckArea = document.createElement('div');
            deckArea.className = 'solitaire-deck-area';
            table.appendChild(deckArea);

            // Create draw pile
            const drawPileEl = document.createElement('div');
            drawPileEl.className = 'solitaire-pile draw-pile';
            drawPileEl.addEventListener('click', drawCard);
            deckArea.appendChild(drawPileEl);

            // Create waste pile
            const wastePileEl = document.createElement('div');
            wastePileEl.className = 'solitaire-pile waste-pile';
            deckArea.appendChild(wastePileEl);

            // Create foundation piles
            for (let i = 0; i < 4; i++) {
                const foundationEl = document.createElement('div');
                foundationEl.className = 'solitaire-pile foundation';
                foundationEl.dataset.index = i;
                foundationEl.addEventListener('dragover', e => e.preventDefault());
                foundationEl.addEventListener('drop', dropOnFoundation);
                deckArea.appendChild(foundationEl);
            }

            // Create tableau
            const tableauArea = document.createElement('div');
            tableauArea.className = 'solitaire-tableau';
            table.appendChild(tableauArea);

            for (let i = 0; i < 7; i++) {
                const pileEl = document.createElement('div');
                pileEl.className = 'solitaire-tableau-pile';
                pileEl.dataset.index = i;
                pileEl.addEventListener('dragover', e => e.preventDefault());
                pileEl.addEventListener('drop', dropOnTableau);
                tableauArea.appendChild(pileEl);
            }

            // Deal cards
            deck = createDeck();
            for (let i = 0; i < 7; i++) {
                for (let j = i; j < 7; j++) {
                    const card = deck.pop();
                    if (i === j) card.faceUp = true;
                    tableaus[j].push(card);
                }
            }

            drawPile = deck;
            updateBoard();
        }

        function updateBoard() {
            // Update draw pile
            const drawPileEl = table.querySelector('.draw-pile');
            drawPileEl.innerHTML = '';
            if (drawPile.length > 0) {
                drawPileEl.appendChild(createCardElement({ faceUp: false }));
            }

            // Update waste pile
            const wastePileEl = table.querySelector('.waste-pile');
            wastePileEl.innerHTML = '';
            if (wastePile.length > 0) {
                const card = wastePile[wastePile.length - 1];
                const el = createCardElement(card);
                el.addEventListener('dragstart', dragStart);
                wastePileEl.appendChild(el);
            }

            // Update foundations
            const foundationEls = table.querySelectorAll('.foundation');
            foundationEls.forEach((el, i) => {
                el.innerHTML = '';
                if (foundations[i].length > 0) {
                    const card = foundations[i][foundations[i].length - 1];
                    const cardEl = createCardElement(card);
                    cardEl.addEventListener('dragstart', dragStart);
                    el.appendChild(cardEl);
                }
            });

            // Update tableaus
            const pileEls = table.querySelectorAll('.solitaire-tableau-pile');
            pileEls.forEach((el, i) => {
                el.innerHTML = '';
                tableaus[i].forEach((card, j) => {
                    const cardEl = createCardElement(card);
                    cardEl.style.top = (j * 30) + 'px';
                    if (card.faceUp) {
                        cardEl.addEventListener('dragstart', dragStart);
                    }
                    el.appendChild(cardEl);
                });
            });
        }

        function drawCard() {
            if (!gameActive) return;

            if (drawPile.length === 0) {
                drawPile = wastePile.reverse().map(card => ({ ...card, faceUp: false }));
                wastePile = [];
            } else {
                const card = drawPile.pop();
                card.faceUp = true;
                wastePile.push(card);
                moves++;
                setScore('Moves: ' + moves);
            }

            updateBoard();
        }

        function dragStart(e) {
            if (!gameActive) return;

            const cardEl = e.target.closest('.solitaire-card');
            const pileEl = cardEl.parentElement;

            // Store drag data
            const suit = cardEl.dataset.suit;
            const value = parseInt(cardEl.dataset.value);
            const source = pileEl.classList.contains('waste-pile') ? 'waste' :
                pileEl.classList.contains('foundation') ? 'foundation' :
                    'tableau';
            const pileIndex = pileEl.dataset.index;

            e.dataTransfer.setData('text/plain',
                JSON.stringify({ suit, value, source, pileIndex })
            );
        }

        function canMoveToFoundation(card, foundation) {
            if (foundation.length === 0) {
                return card.value === 1;
            }
            const topCard = foundation[foundation.length - 1];
            return card.suit === topCard.suit && card.value === topCard.value + 1;
        }

        function canMoveToTableau(card, tableau) {
            if (tableau.length === 0) {
                return card.value === 13;
            }
            const topCard = tableau[tableau.length - 1];
            return COLORS[card.suit] !== COLORS[topCard.suit] &&
                card.value === topCard.value - 1;
        }

        function dropOnFoundation(e) {
            e.preventDefault();
            if (!gameActive) return;

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const foundationIndex = parseInt(e.target.closest('.foundation').dataset.index);
            const foundation = foundations[foundationIndex];

            let card;
            if (data.source === 'waste') {
                card = wastePile.pop();
            } else if (data.source === 'tableau') {
                const tableau = tableaus[data.pileIndex];
                if (tableau[tableau.length - 1].value === data.value) {
                    card = tableau.pop();
                }
            } else if (data.source === 'foundation') {
                const sourceFoundation = foundations[data.pileIndex];
                card = sourceFoundation.pop();
            }

            if (card && canMoveToFoundation(card, foundation)) {
                foundations[foundationIndex].push(card);
                moves++;
                setScore('Moves: ' + moves);

                // Check for win
                if (foundations.every(f => f.length === 13)) {
                    gameActive = false;
                    setTimeout(() => alert('Congratulations! You won in ' + moves + ' moves!'), 100);
                }
            } else if (card) {
                // Return card to source
                if (data.source === 'waste') wastePile.push(card);
                else if (data.source === 'tableau') tableaus[data.pileIndex].push(card);
                else if (data.source === 'foundation') foundations[data.pileIndex].push(card);
            }

            updateBoard();
        }

        function dropOnTableau(e) {
            e.preventDefault();
            if (!gameActive) return;

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const tableauIndex = parseInt(e.target.closest('.solitaire-tableau-pile').dataset.index);
            const tableau = tableaus[tableauIndex];

            let card;
            if (data.source === 'waste') {
                card = wastePile.pop();
            } else if (data.source === 'tableau') {
                const sourceTableau = tableaus[data.pileIndex];
                if (sourceTableau[sourceTableau.length - 1].value === data.value) {
                    card = sourceTableau.pop();
                    if (sourceTableau.length > 0 && !sourceTableau[sourceTableau.length - 1].faceUp) {
                        sourceTableau[sourceTableau.length - 1].faceUp = true;
                    }
                }
            } else if (data.source === 'foundation') {
                const foundation = foundations[data.pileIndex];
                card = foundation.pop();
            }

            if (card && canMoveToTableau(card, tableau)) {
                tableaus[tableauIndex].push(card);
                moves++;
                setScore('Moves: ' + moves);
            } else if (card) {
                // Return card to source
                if (data.source === 'waste') wastePile.push(card);
                else if (data.source === 'tableau') tableaus[data.pileIndex].push(card);
                else if (data.source === 'foundation') foundations[data.pileIndex].push(card);
            }

            updateBoard();
        }

        setupGame();

        return {
            cleanup() {
                gameActive = false;
            },
            restart() {
                gameActive = false;
                deck = [];
                drawPile = [];
                wastePile = [];
                foundations = [[], [], [], []];
                tableaus = [[], [], [], [], [], [], []];
                moves = 0;
                setScore('Moves: 0');
                setupGame();
                gameActive = true;
            }
        };
    }

    // ---------- Mini Chess ----------
    function buildChess(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Mini Chess</div>
            <div class="score-pill">Turn: White</div>
          </div>
          <div class="chess-board"></div>
          <div style="margin-top:10px;text-align:center;color:#90a4ae" id="chess-status"></div>
        </div>
      `;

        const board = container.querySelector('.chess-board');
        const statusEl = document.getElementById('chess-status');
        let selectedPiece = null;
        let gameActive = true;
        let isWhiteTurn = true;
        let pieces = new Map();

        const PIECE_CHARS = {
            'w_king': '♔', 'w_queen': '♕', 'w_rook': '♖',
            'w_bishop': '♗', 'w_knight': '♘', 'w_pawn': '♙',
            'b_king': '♚', 'b_queen': '♛', 'b_rook': '♜',
            'b_bishop': '♝', 'b_knight': '♞', 'b_pawn': '♟'
        };

        function createBoard() {
            const squares = [];
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = 'chess-square';
                    square.dataset.row = row;
                    square.dataset.col = col;
                    if ((row + col) % 2 === 0) {
                        square.classList.add('light');
                    } else {
                        square.classList.add('dark');
                    }
                    board.appendChild(square);
                    squares.push(square);
                }
            }
            return squares;
        }

        function addPiece(type, color, row, col) {
            const piece = document.createElement('div');
            piece.className = 'chess-piece';
            piece.textContent = PIECE_CHARS[color + '_' + type];
            piece.dataset.type = type;
            piece.dataset.color = color;

            const square = getSquare(row, col);
            square.appendChild(piece);
            pieces.set(piece, { type, color, row, col });

            return piece;
        }

        function setupPieces() {
            // Setup pawns
            for (let col = 0; col < 8; col++) {
                addPiece('pawn', 'w', 6, col);
                addPiece('pawn', 'b', 1, col);
            }

            // Setup other pieces
            const backrow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
            for (let col = 0; col < 8; col++) {
                addPiece(backrow[col], 'w', 7, col);
                addPiece(backrow[col], 'b', 0, col);
            }
        }

        function getSquare(row, col) {
            return board.children[row * 8 + col];
        }

        function getPieceAt(row, col) {
            const square = getSquare(row, col);
            return square.querySelector('.chess-piece');
        }

        function isValidMove(piece, toRow, toCol) {
            const pieceData = pieces.get(piece);
            if (!pieceData) return false;

            const { type, color, row, col } = pieceData;
            const targetPiece = getPieceAt(toRow, toCol);

            if (targetPiece && pieces.get(targetPiece).color === color) {
                return false;
            }

            const rowDiff = Math.abs(toRow - row);
            const colDiff = Math.abs(toCol - col);

            switch (type) {
                case 'pawn':
                    const direction = color === 'w' ? -1 : 1;
                    const startRow = color === 'w' ? 6 : 1;

                    // Normal move
                    if (colDiff === 0 && !targetPiece) {
                        if (toRow - row === direction) return true;
                        // First move can be 2 squares
                        if (row === startRow && toRow - row === direction * 2) {
                            const midPiece = getPieceAt(row + direction, col);
                            return !midPiece;
                        }
                    }
                    // Capture
                    if (colDiff === 1 && toRow - row === direction && targetPiece) {
                        return true;
                    }
                    return false;

                case 'rook':
                    if (rowDiff === 0 || colDiff === 0) {
                        const dr = Math.sign(toRow - row);
                        const dc = Math.sign(toCol - col);
                        let r = row + dr, c = col + dc;
                        while (r !== toRow || c !== toCol) {
                            if (getPieceAt(r, c)) return false;
                            r += dr;
                            c += dc;
                        }
                        return true;
                    }
                    return false;

                case 'knight':
                    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

                case 'bishop':
                    if (rowDiff === colDiff) {
                        const dr = Math.sign(toRow - row);
                        const dc = Math.sign(toCol - col);
                        let r = row + dr, c = col + dc;
                        while (r !== toRow) {
                            if (getPieceAt(r, c)) return false;
                            r += dr;
                            c += dc;
                        }
                        return true;
                    }
                    return false;

                case 'queen':
                    if (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) {
                        const dr = Math.sign(toRow - row);
                        const dc = Math.sign(toCol - col);
                        let r = row + dr, c = col + dc;
                        while (r !== toRow || c !== toCol) {
                            if (getPieceAt(r, c)) return false;
                            r += dr;
                            c += dc;
                        }
                        return true;
                    }
                    return false;

                case 'king':
                    return rowDiff <= 1 && colDiff <= 1;
            }

            return false;
        }

        function isKingInCheck(color) {
            let kingPos;
            for (const [piece, data] of pieces) {
                if (data.type === 'king' && data.color === color) {
                    kingPos = { row: data.row, col: data.col };
                    break;
                }
            }

            for (const [piece, data] of pieces) {
                if (data.color !== color && isValidMove(piece, kingPos.row, kingPos.col)) {
                    return true;
                }
            }
            return false;
        }

        function makeAIMove() {
            setTimeout(() => {
                if (!gameActive) return;

                let bestMove = null;
                let bestScore = -Infinity;

                // Simple AI: Evaluate each possible move
                for (const [piece, data] of pieces) {
                    if (data.color === 'b') {
                        for (let row = 0; row < 8; row++) {
                            for (let col = 0; col < 8; col++) {
                                if (isValidMove(piece, row, col)) {
                                    // Score the move
                                    const targetPiece = getPieceAt(row, col);
                                    let score = Math.random() * 0.2; // Add randomness

                                    if (targetPiece) {
                                        const targetType = pieces.get(targetPiece).type;
                                        score += {
                                            'pawn': 1,
                                            'knight': 3,
                                            'bishop': 3,
                                            'rook': 5,
                                            'queen': 9,
                                            'king': 0
                                        }[targetType];
                                    }

                                    if (score > bestScore) {
                                        bestScore = score;
                                        bestMove = { piece, row, col };
                                    }
                                }
                            }
                        }
                    }
                }

                if (bestMove) {
                    const target = getPieceAt(bestMove.row, bestMove.col);
                    if (target) target.remove();

                    const pieceData = pieces.get(bestMove.piece);
                    pieces.set(bestMove.piece, {
                        ...pieceData,
                        row: bestMove.row,
                        col: bestMove.col
                    });

                    getSquare(bestMove.row, bestMove.col).appendChild(bestMove.piece);
                    isWhiteTurn = true;
                    setScore('Turn: White');

                    if (isKingInCheck('w')) {
                        statusEl.textContent = 'Check!';
                    } else {
                        statusEl.textContent = '';
                    }
                }
            }, 500);
        }

        function onSquareClick(e) {
            if (!gameActive || !isWhiteTurn) return;

            const square = e.target.closest('.chess-square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = getPieceAt(row, col);

            if (selectedPiece) {
                const pieceData = pieces.get(selectedPiece);

                if (isValidMove(selectedPiece, row, col)) {
                    // Make the move
                    if (piece) piece.remove();

                    pieces.set(selectedPiece, {
                        ...pieceData,
                        row,
                        col
                    });

                    square.appendChild(selectedPiece);
                    selectedPiece.classList.remove('selected');
                    selectedPiece = null;

                    // Switch turns
                    isWhiteTurn = false;
                    setScore('Turn: Black');

                    if (isKingInCheck('b')) {
                        statusEl.textContent = 'Check!';
                    } else {
                        statusEl.textContent = '';
                    }

                    makeAIMove();
                } else if (piece && pieces.get(piece).color === 'w') {
                    selectedPiece.classList.remove('selected');
                    piece.classList.add('selected');
                    selectedPiece = piece;
                } else {
                    selectedPiece.classList.remove('selected');
                    selectedPiece = null;
                }
            } else if (piece && pieces.get(piece).color === 'w') {
                piece.classList.add('selected');
                selectedPiece = piece;
            }
        }

        const squares = createBoard();
        setupPieces();
        board.addEventListener('click', onSquareClick);

        return {
            cleanup() {
                gameActive = false;
                board.removeEventListener('click', onSquareClick);
            },
            restart() {
                gameActive = false;
                board.innerHTML = '';
                pieces.clear();
                selectedPiece = null;
                isWhiteTurn = true;
                setScore('Turn: White');
                statusEl.textContent = '';
                createBoard();
                setupPieces();
                gameActive = true;
            }
        };
    }

    // ---------- Doodle Jump ----------
    function buildDoodle(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Doodle Jump</div>
            <div class="score-pill">Height: 0</div>
          </div>
          <div class="doodle-game"></div>
        </div>
      `;

        const game = container.querySelector('.doodle-game');
        const GRAVITY = 0.4;
        const JUMP_FORCE = -12;
        const PLATFORM_COUNT = 8;

        let score = 0;
        let gameActive = true;
        let platforms = [];
        let player = null;
        let cameraY = 0;

        function createPlatform(x, y) {
            const platform = document.createElement('div');
            platform.className = 'doodle-platform';
            platform.style.left = x + 'px';
            platform.style.top = y + 'px';
            game.appendChild(platform);
            return { el: platform, x, y, width: 60, height: 12 };
        }

        function createPlayer(x, y) {
            const el = document.createElement('div');
            el.className = 'doodle-player';
            game.appendChild(el);
            return {
                el,
                x,
                y,
                width: 40,
                height: 40,
                velocity: { x: 0, y: 0 },
                direction: 1
            };
        }

        function initGame() {
            // Create initial platforms
            for (let i = 0; i < PLATFORM_COUNT; i++) {
                const x = Math.random() * (game.offsetWidth - 60);
                const y = (game.offsetHeight / PLATFORM_COUNT) * i;
                platforms.push(createPlatform(x, y));
            }

            // Create player
            const startPlatform = platforms[0];
            player = createPlayer(
                startPlatform.x + (startPlatform.width - 40) / 2,
                startPlatform.y - 40
            );
        }

        function checkCollisions() {
            if (player.velocity.y > 0) { // Only check when falling
                for (const platform of platforms) {
                    if (player.x + player.width > platform.x &&
                        player.x < platform.x + platform.width &&
                        player.y + player.height > platform.y &&
                        player.y + player.height < platform.y + platform.height) {
                        player.velocity.y = JUMP_FORCE;
                        break;
                    }
                }
            }
        }

        function updatePlayer() {
            // Apply gravity
            player.velocity.y += GRAVITY;

            // Update position
            player.x += player.velocity.x;
            player.y += player.velocity.y;

            // Screen wrapping
            if (player.x + player.width < 0) {
                player.x = game.offsetWidth;
            } else if (player.x > game.offsetWidth) {
                player.x = -player.width;
            }

            // Camera follow
            if (player.y < game.offsetHeight / 2) {
                const diff = game.offsetHeight / 2 - player.y;
                cameraY += diff;
                player.y += diff;

                // Move platforms down
                platforms.forEach(platform => {
                    platform.y += diff;
                    platform.el.style.top = platform.y + 'px';
                });

                // Remove platforms that are too low and create new ones at the top
                platforms = platforms.filter(platform => {
                    if (platform.y > game.offsetHeight) {
                        platform.el.remove();
                        return false;
                    }
                    return true;
                });

                while (platforms.length < PLATFORM_COUNT) {
                    const x = Math.random() * (game.offsetWidth - 60);
                    const y = platforms[0].y - Math.random() * 100 - 50;
                    platforms.unshift(createPlatform(x, y));
                }

                // Update score
                score = Math.floor(cameraY / 100);
                setScore('Height: ' + score);
            }

            // Update player element
            player.el.style.left = player.x + 'px';
            player.el.style.top = player.y + 'px';
            player.el.style.transform = `scaleX(${player.direction})`;

            // Game over if player falls below screen
            if (player.y > game.offsetHeight) {
                gameOver();
            }
        }

        function update() {
            if (!gameActive) return;
            checkCollisions();
            updatePlayer();
            requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Height', score);
        }

        // Controls
        let leftPressed = false;
        let rightPressed = false;

        function updateMovement() {
            player.velocity.x = (rightPressed ? 5 : 0) + (leftPressed ? -5 : 0);
            player.direction = player.velocity.x > 0 ? 1 : (player.velocity.x < 0 ? -1 : player.direction);
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') {
                leftPressed = true;
                updateMovement();
            } else if (e.key === 'ArrowRight') {
                rightPressed = true;
                updateMovement();
            }
        });

        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowLeft') {
                leftPressed = false;
                updateMovement();
            } else if (e.key === 'ArrowRight') {
                rightPressed = false;
                updateMovement();
            }
        });

        // Touch controls
        let touchStart = null;
        game.addEventListener('touchstart', e => {
            touchStart = e.touches[0].clientX;
        });

        game.addEventListener('touchmove', e => {
            if (touchStart === null) return;
            const diff = e.touches[0].clientX - touchStart;
            player.velocity.x = diff * 0.1;
            player.direction = player.velocity.x > 0 ? 1 : -1;
        });

        game.addEventListener('touchend', () => {
            touchStart = null;
            player.velocity.x = 0;
        });

        initGame();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                if (player) player.el.remove();
                platforms.forEach(p => p.el.remove());
            },
            restart() {
                gameActive = false;
                if (player) player.el.remove();
                platforms.forEach(p => p.el.remove());
                platforms = [];
                player = null;
                score = 0;
                cameraY = 0;
                setScore('Height: 0');
                initGame();
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Speed Racer ----------
    function buildRace(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Speed Racer</div>
            <div class="score-pill">Score: 0</div>
          </div>
          <div class="race-game">
            <div id="race-car" class="race-car"></div>
          </div>
        </div>
      `;

        const game = container.querySelector('.race-game');
        const car = document.getElementById('race-car');
        let score = 0;
        let speed = 5;
        let carX = game.offsetWidth / 2;
        let carY = game.offsetHeight - 80;
        let obstacles = [];
        let gameActive = true;
        let turning = 0;

        function createObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'race-car';
            obstacle.style.background = '#455a64';
            obstacle.style.width = '30px';
            obstacle.style.height = '50px';

            const lane = Math.floor(Math.random() * 3);
            const x = lane * (game.offsetWidth / 3) + game.offsetWidth / 6;
            obstacle.style.left = x + 'px';
            obstacle.style.top = '-50px';

            game.appendChild(obstacle);
            return { el: obstacle, x, y: -50, speed: 3 + Math.random() * 2 };
        }

        function updateCar() {
            carX = Math.max(0, Math.min(game.offsetWidth - 30, carX + turning * 5));
            car.style.left = carX + 'px';
            car.style.transform = `rotate(${turning * 3}deg)`;
        }

        function update() {
            if (!gameActive) return;

            // Create new obstacles
            if (Math.random() < 0.02) {
                obstacles.push(createObstacle());
            }

            // Update obstacles
            obstacles.forEach((obs, i) => {
                obs.y += obs.speed;
                obs.el.style.top = obs.y + 'px';

                // Check collision
                if (obs.y + 50 > carY && obs.y < carY + 50 &&
                    Math.abs(obs.x - carX) < 30) {
                    gameOver();
                }

                // Remove if off screen
                if (obs.y > game.offsetHeight) {
                    obs.el.remove();
                    obstacles.splice(i, 1);
                    score++;
                    setScore('Score: ' + score);
                    speed = Math.min(10, 5 + score / 20);
                }
            });

            updateCar();
            requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Score', score);
        }

        // Controls
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') turning = -1;
            if (e.key === 'ArrowRight') turning = 1;
        });

        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowLeft' && turning === -1) turning = 0;
            if (e.key === 'ArrowRight' && turning === 1) turning = 0;
        });

        // Touch controls
        let touchStartX = 0;
        game.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        });

        game.addEventListener('touchmove', e => {
            const touchX = e.touches[0].clientX;
            turning = touchX > touchStartX ? 1 : -1;
        });

        game.addEventListener('touchend', () => {
            turning = 0;
        });

        // Initial position
        car.style.left = carX + 'px';
        car.style.top = carY + 'px';
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                window.removeEventListener('keydown', () => { });
                window.removeEventListener('keyup', () => { });
            },
            restart() {
                obstacles.forEach(obs => obs.el.remove());
                obstacles = [];
                score = 0;
                speed = 5;
                carX = game.offsetWidth / 2;
                turning = 0;
                car.style.left = carX + 'px';
                setScore('Score: 0');
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Fruit Slice ----------
    function buildFruit(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Fruit Slice</div>
            <div class="score-pill">Score: 0</div>
          </div>
          <div class="fruit-game"></div>
        </div>
      `;

        const game = container.querySelector('.fruit-game');
        const fruits = [
            { emoji: '🍎', points: 10, color: '#e53935' },
            { emoji: '🍌', points: 15, color: '#fdd835' },
            { emoji: '🍊', points: 20, color: '#fb8c00' },
            { emoji: '🍇', points: 25, color: '#8e24aa' },
            { emoji: '🍉', points: 30, color: '#43a047' },
            { emoji: '💣', points: -50, color: '#000000' }
        ];

        let score = 0;
        let gameActive = true;
        let mouseTrail = [];
        let lastTrailTime = 0;
        let activeFruits = [];

        function createFruit() {
            const fruit = fruits[Math.floor(Math.random() * (fruits.length - 1))]; // Exclude bomb from random selection
            const el = document.createElement('div');
            el.className = 'fruit';
            el.style.fontSize = '40px';
            el.textContent = fruit.emoji;

            const startX = Math.random() * (game.offsetWidth - 40);
            const startY = game.offsetHeight + 40;

            el.style.left = startX + 'px';
            el.style.top = startY + 'px';

            game.appendChild(el);

            return {
                el,
                x: startX,
                y: startY,
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: -15 - Math.random() * 5
                },
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 10,
                points: fruit.points,
                color: fruit.color,
                sliced: false
            };
        }

        function createBomb() {
            const bomb = fruits[fruits.length - 1];
            const el = document.createElement('div');
            el.className = 'fruit';
            el.style.fontSize = '40px';
            el.textContent = bomb.emoji;

            const startX = Math.random() * (game.offsetWidth - 40);
            const startY = game.offsetHeight + 40;

            el.style.left = startX + 'px';
            el.style.top = startY + 'px';

            game.appendChild(el);

            return {
                el,
                x: startX,
                y: startY,
                velocity: {
                    x: (Math.random() - 0.5) * 6,
                    y: -12 - Math.random() * 4
                },
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 8,
                points: bomb.points,
                color: bomb.color,
                sliced: false
            };
        }

        function addTrailPoint(x, y) {
            const now = Date.now();
            if (now - lastTrailTime > 50) { // Limit trail point creation
                const trail = document.createElement('div');
                trail.className = 'fruit-trail';
                trail.style.left = x + 'px';
                trail.style.top = y + 'px';
                game.appendChild(trail);
                mouseTrail.push({ el: trail, time: now });
                lastTrailTime = now;
            }
        }

        function updateTrail() {
            const now = Date.now();
            mouseTrail = mouseTrail.filter(point => {
                if (now - point.time > 200) {
                    point.el.remove();
                    return false;
                }
                point.el.style.opacity = 1 - (now - point.time) / 200;
                return true;
            });
        }

        function checkSlice(fruit, x1, y1, x2, y2) {
            if (fruit.sliced) return false;

            const fruitX = fruit.x + 20;
            const fruitY = fruit.y + 20;

            // Line segment intersection check
            const d = ((fruitX - x1) * (y2 - y1) - (fruitY - y1) * (x2 - x1)) /
                Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

            return Math.abs(d) < 30;
        }

        function update() {
            if (!gameActive) return;

            // Create new fruits
            if (Math.random() < 0.03) {
                activeFruits.push(Math.random() < 0.15 ? createBomb() : createFruit());
            }

            // Update fruits
            activeFruits = activeFruits.filter(fruit => {
                fruit.velocity.y += 0.5; // Gravity
                fruit.x += fruit.velocity.x;
                fruit.y += fruit.velocity.y;
                fruit.rotation += fruit.rotationSpeed;

                fruit.el.style.left = fruit.x + 'px';
                fruit.el.style.top = fruit.y + 'px';
                fruit.el.style.transform = `rotate(${fruit.rotation}deg)`;

                if (fruit.y > game.offsetHeight + 100) {
                    fruit.el.remove();
                    return false;
                }
                return true;
            });

            updateTrail();
            requestAnimationFrame(update);
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Score', score);
        }

        // Mouse/Touch controls
        let lastX = 0, lastY = 0;
        let isSlicing = false;

        function startSlice(x, y) {
            isSlicing = true;
            lastX = x;
            lastY = y;
        }

        function continueSlice(x, y) {
            if (!isSlicing) return;

            addTrailPoint(x, y);

            activeFruits.forEach(fruit => {
                if (checkSlice(fruit, lastX, lastY, x, y)) {
                    fruit.sliced = true;
                    fruit.el.style.opacity = '0.5';
                    score += fruit.points;
                    if (fruit.points < 0) gameOver();
                    setScore('Score: ' + score);
                }
            });

            lastX = x;
            lastY = y;
        }

        function endSlice() {
            isSlicing = false;
        }

        // Mouse events
        game.addEventListener('mousedown', e => {
            const rect = game.getBoundingClientRect();
            startSlice(e.clientX - rect.left, e.clientY - rect.top);
        });

        game.addEventListener('mousemove', e => {
            const rect = game.getBoundingClientRect();
            continueSlice(e.clientX - rect.left, e.clientY - rect.top);
        });

        game.addEventListener('mouseup', endSlice);
        game.addEventListener('mouseleave', endSlice);

        // Touch events
        game.addEventListener('touchstart', e => {
            const rect = game.getBoundingClientRect();
            const touch = e.touches[0];
            startSlice(touch.clientX - rect.left, touch.clientY - rect.top);
        });

        game.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = game.getBoundingClientRect();
            const touch = e.touches[0];
            continueSlice(touch.clientX - rect.left, touch.clientY - rect.top);
        });

        game.addEventListener('touchend', endSlice);

        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                activeFruits.forEach(f => f.el.remove());
                mouseTrail.forEach(t => t.el.remove());
            },
            restart() {
                activeFruits.forEach(f => f.el.remove());
                mouseTrail.forEach(t => t.el.remove());
                activeFruits = [];
                mouseTrail = [];
                score = 0;
                setScore('Score: 0');
                gameActive = true;
                requestAnimationFrame(update);
            }
        };
    }

    // ---------- Tower Defense ----------
    function buildDefense(container, setScore) {
        container.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-weight:900">Tower Defense</div>
            <div style="display:flex;gap:10px">
              <div class="score-pill">Wave: 1</div>
              <div class="score-pill">Gold: 100</div>
            </div>
          </div>
          <div class="defense-game"></div>
          <div style="margin-top:10px;display:flex;gap:10px;justify-content:center">
            <button class="action-btn" id="buildTower">Build Tower (50g)</button>
            <button class="action-btn" id="upgradeTower">Upgrade Selected (100g)</button>
          </div>
        </div>
      `;

        const game = container.querySelector('.defense-game');
        const buildBtn = document.getElementById('buildTower');
        const upgradeBtn = document.getElementById('upgradeTower');

        let towers = [];
        let enemies = [];
        let bullets = [];
        let gold = 100;
        let wave = 1;
        let gameActive = true;
        let selectedTower = null;
        let path = [];

        // Generate path points
        function generatePath() {
            path = [
                { x: -20, y: 100 },
                { x: 150, y: 100 },
                { x: 150, y: 200 },
                { x: 400, y: 200 },
                { x: 400, y: 100 },
                { x: game.offsetWidth + 20, y: 100 }
            ];
        }

        function createTower(x, y) {
            const tower = document.createElement('div');
            tower.className = 'defense-tower';
            tower.style.left = (x - 20) + 'px';
            tower.style.top = (y - 20) + 'px';
            game.appendChild(tower);

            const newTower = {
                el: tower,
                x: x,
                y: y,
                range: 100,
                damage: 20,
                fireRate: 1,
                lastShot: 0,
                level: 1
            };

            tower.addEventListener('click', () => {
                if (selectedTower) selectedTower.el.style.border = '';
                selectedTower = newTower;
                tower.style.border = '2px solid #fff';
            });

            return newTower;
        }

        function spawnEnemy() {
            const enemy = document.createElement('div');
            enemy.className = 'defense-enemy';
            enemy.style.left = path[0].x + 'px';
            enemy.style.top = path[0].y + 'px';
            game.appendChild(enemy);

            return {
                el: enemy,
                x: path[0].x,
                y: path[0].y,
                health: 100 * (1 + wave * 0.5),
                maxHealth: 100 * (1 + wave * 0.5),
                speed: 1,
                pathIndex: 0,
                value: 10 + wave * 5
            };
        }

        function createBullet(tower, enemy) {
            const bullet = document.createElement('div');
            bullet.className = 'defense-bullet';
            bullet.style.left = tower.x + 'px';
            bullet.style.top = tower.y + 'px';
            game.appendChild(bullet);

            return {
                el: bullet,
                x: tower.x,
                y: tower.y,
                target: enemy,
                speed: 8,
                damage: tower.damage
            };
        }

        function updateBullets() {
            bullets = bullets.filter(bullet => {
                if (!bullet.target.health) {
                    bullet.el.remove();
                    return false;
                }

                const dx = bullet.target.x - bullet.x;
                const dy = bullet.target.y - bullet.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 5) {
                    bullet.target.health -= bullet.damage;
                    bullet.el.remove();
                    return false;
                }

                bullet.x += (dx / dist) * bullet.speed;
                bullet.y += (dy / dist) * bullet.speed;
                bullet.el.style.left = bullet.x + 'px';
                bullet.el.style.top = bullet.y + 'px';

                return true;
            });
        }

        function updateTowers() {
            const now = Date.now();
            towers.forEach(tower => {
                if (now - tower.lastShot > 1000 / tower.fireRate) {
                    enemies.some(enemy => {
                        const dx = enemy.x - tower.x;
                        const dy = enemy.y - tower.y;
                        if (Math.hypot(dx, dy) <= tower.range) {
                            bullets.push(createBullet(tower, enemy));
                            tower.lastShot = now;
                            return true;
                        }
                    });
                }
            });
        }

        function updateEnemies() {
            enemies = enemies.filter(enemy => {
                if (enemy.health <= 0) {
                    enemy.el.remove();
                    gold += enemy.value;
                    updateUI();
                    return false;
                }

                const targetPoint = path[enemy.pathIndex];
                const dx = targetPoint.x - enemy.x;
                const dy = targetPoint.y - enemy.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 2) {
                    enemy.pathIndex++;
                    if (enemy.pathIndex >= path.length) {
                        gameOver();
                        return false;
                    }
                }

                const speed = enemy.speed;
                enemy.x += (dx / dist) * speed;
                enemy.y += (dy / dist) * speed;
                enemy.el.style.left = enemy.x + 'px';
                enemy.el.style.top = enemy.y + 'px';

                // Update health bar
                const healthPercent = (enemy.health / enemy.maxHealth) * 100;
                enemy.el.style.background = `linear-gradient(90deg, #f44336 ${healthPercent}%, #455a64 ${healthPercent}%)`;

                return true;
            });
        }

        function spawnWave() {
            const count = 5 + wave * 2;
            let spawned = 0;

            const spawnInterval = setInterval(() => {
                if (spawned < count && gameActive) {
                    enemies.push(spawnEnemy());
                    spawned++;
                } else {
                    clearInterval(spawnInterval);
                    if (spawned >= count) {
                        setTimeout(() => {
                            if (enemies.length === 0 && gameActive) {
                                wave++;
                                updateUI();
                                spawnWave();
                            }
                        }, 5000);
                    }
                }
            }, 1000);
        }

        function update() {
            if (!gameActive) return;
            updateTowers();
            updateEnemies();
            updateBullets();
            requestAnimationFrame(update);
        }

        function updateUI() {
            const pills = container.querySelectorAll('.score-pill');
            pills[0].textContent = 'Wave: ' + wave;
            pills[1].textContent = 'Gold: ' + gold;
            buildBtn.disabled = gold < 50;
            upgradeBtn.disabled = !selectedTower || gold < 100;
        }

        function gameOver() {
            gameActive = false;
            displayGameOver('Wave', wave);
        }

        // Place tower on click
        game.addEventListener('click', e => {
            const rect = game.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicking existing tower
            const clickedTower = towers.find(t =>
                Math.hypot(t.x - x, t.y - y) < 20
            );

            if (clickedTower) {
                if (selectedTower) selectedTower.el.style.border = '';
                selectedTower = clickedTower;
                clickedTower.el.style.border = '2px solid #fff';
            }
        });

        buildBtn.addEventListener('click', () => {
            if (gold >= 50) {
                const rect = game.getBoundingClientRect();
                const placeHandler = e => {
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // Check if too close to path or other towers
                    const tooClose = path.some(point =>
                        Math.hypot(point.x - x, point.y - y) < 50
                    ) || towers.some(tower =>
                        Math.hypot(tower.x - x, tower.y - y) < 50
                    );

                    if (!tooClose) {
                        towers.push(createTower(x, y));
                        gold -= 50;
                        updateUI();
                    }

                    game.removeEventListener('click', placeHandler);
                    buildBtn.disabled = false;
                };

                buildBtn.disabled = true;
                game.addEventListener('click', placeHandler);
            }
        });

        upgradeBtn.addEventListener('click', () => {
            if (selectedTower && gold >= 100) {
                gold -= 100;
                selectedTower.damage *= 1.5;
                selectedTower.range *= 1.2;
                selectedTower.fireRate *= 1.2;
                selectedTower.level++;
                selectedTower.el.style.transform = `scale(${1 + selectedTower.level * 0.1})`;
                updateUI();
            }
        });

        generatePath();
        spawnWave();
        requestAnimationFrame(update);

        return {
            cleanup() {
                gameActive = false;
                towers.forEach(t => t.el.remove());
                enemies.forEach(e => e.el.remove());
                bullets.forEach(b => b.el.remove());
            },
            restart() {
                gameActive = false;
                towers.forEach(t => t.el.remove());
                enemies.forEach(e => e.el.remove());
                bullets.forEach(b => b.el.remove());
                towers = [];
                enemies = [];
                bullets = [];
                gold = 100;
                wave = 1;
                selectedTower = null;
                updateUI();
                gameActive = true;
                spawnWave();
                requestAnimationFrame(update);
            }
        };
    }

    // Show list by default
    showList();

    // cleanup when leaving page
    window.addEventListener('beforeunload', () => { if (current && current.cleanup) current.cleanup(); });

})();

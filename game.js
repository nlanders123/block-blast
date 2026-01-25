/**
 * BLOCK BLAST - Game Engine
 * A puzzle game with drag-and-drop mechanics
 * Enhanced with: High Score, Sound Effects, Particle Explosions, Improved Touch
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    play(type) {
        if (!this.enabled || !this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        switch (type) {
            case 'place':
                this.playTone(220, 0.1, 'sine', 0.3);
                break;
            case 'clear':
                this.playChord([392, 523, 659], 0.3, 'sine', 0.25);
                break;
            case 'combo':
                this.playArpeggio([523, 659, 784, 1047], 0.1, 'sine', 0.3);
                break;
            case 'gameOver':
                this.playDescending([392, 330, 262, 196], 0.15, 'triangle', 0.3);
                break;
            case 'newHighScore':
                this.playArpeggio([523, 659, 784, 1047, 1319], 0.12, 'sine', 0.35);
                break;
            case 'button':
                this.playTone(440, 0.05, 'sine', 0.15);
                break;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playChord(frequencies, duration, type = 'sine', volume = 0.2) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume / frequencies.length);
        });
    }

    playArpeggio(frequencies, noteLength, type = 'sine', volume = 0.3) {
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, noteLength * 2, type, volume);
            }, i * noteLength * 1000);
        });
    }

    playDescending(frequencies, noteLength, type = 'triangle', volume = 0.3) {
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, noteLength * 2, type, volume * (1 - i * 0.2));
            }, i * noteLength * 1000);
        });
    }
}

/**
 * Leaderboard Manager - Stores top 10 scores locally
 */
class LeaderboardManager {
    constructor() {
        this.storageKey = 'blockBlastLeaderboard';
        this.maxEntries = 10;
    }

    getScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Could not load leaderboard');
            return [];
        }
    }

    addScore(score) {
        if (score <= 0) return false;

        const scores = this.getScores();
        const entry = {
            score: score,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);

        const trimmed = scores.slice(0, this.maxEntries);

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Could not save leaderboard');
        }

        // Return rank (1-indexed), or 0 if not in top 10
        const rank = trimmed.findIndex(s => s.timestamp === entry.timestamp);
        return rank >= 0 ? rank + 1 : 0;
    }

    clearScores() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('Could not clear leaderboard');
        }
    }

    isTopScore(score) {
        const scores = this.getScores();
        if (scores.length < this.maxEntries) return score > 0;
        return score > scores[scores.length - 1].score;
    }
}

/**
 * Theme Manager - Light/Dark/System theme support
 */
class ThemeManager {
    constructor() {
        this.storageKey = 'blockBlastTheme';
        this.currentTheme = 'system';
        this.init();
    }

    init() {
        const saved = this.getSavedTheme();
        this.setTheme(saved || 'system');

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            if (this.currentTheme === 'system') {
                this.applyTheme();
            }
        });
    }

    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (e) {
            return null;
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            console.warn('Could not save theme preference');
        }
        this.applyTheme();
    }

    applyTheme() {
        let effectiveTheme = this.currentTheme;

        if (effectiveTheme === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);
    }

    toggle() {
        const themes = ['dark', 'light', 'system'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
        return themes[nextIndex];
    }

    getThemeName() {
        return this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1);
    }
}

class BlockBlast {
    constructor() {
        // Game state
        this.board = [];
        this.boardSize = 8;
        this.score = 0;
        this.highScore = 0;
        this.pieces = [null, null, null];
        this.history = [];
        this.maxHistory = 1;
        this.isPaused = false;
        this.isGameOver = false;

        // Drag state - improved for mobile
        this.draggingPiece = null;
        this.draggingPieceElement = null;
        this.draggingSlotIndex = null;
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.currentHighlight = [];
        this.lastValidPosition = null;

        // Touch offset - piece appears above finger on mobile
        this.touchOffset = 120;

        // Colors with hex values for particles
        this.colors = ['purple', 'cyan', 'orange', 'blue', 'red', 'green'];
        this.colorHex = {
            purple: '#a855f7',
            cyan: '#22d3ee',
            orange: '#f97316',
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#22c55e'
        };

        // Sound Manager
        this.sound = new SoundManager();

        // Leaderboard Manager
        this.leaderboard = new LeaderboardManager();

        // Theme Manager
        this.theme = new ThemeManager();

        // Level Manager (New)
        this.levelManager = new LevelManager();

        // Piece shapes
        this.shapes = [
            { shape: [[1]], name: '1x1' },
            { shape: [[1, 1]], name: '1x2' },
            { shape: [[1], [1]], name: '2x1' },
            { shape: [[1, 1, 1]], name: '1x3' },
            { shape: [[1], [1], [1]], name: '3x1' },
            { shape: [[1, 1, 1, 1]], name: '1x4' },
            { shape: [[1], [1], [1], [1]], name: '4x1' },
            { shape: [[1, 1], [1, 1]], name: '2x2' },
            { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], name: '3x3' },
            { shape: [[1, 0], [1, 0], [1, 1]], name: 'L1' },
            { shape: [[1, 1, 1], [1, 0, 0]], name: 'L2' },
            { shape: [[1, 1], [0, 1], [0, 1]], name: 'L3' },
            { shape: [[0, 0, 1], [1, 1, 1]], name: 'L4' },
            { shape: [[1, 1, 1], [0, 1, 0]], name: 'T1' },
            { shape: [[1, 0], [1, 1], [1, 0]], name: 'T2' },
            { shape: [[0, 1, 0], [1, 1, 1]], name: 'T3' },
            { shape: [[0, 1], [1, 1], [0, 1]], name: 'T4' },
            { shape: [[1, 1, 0], [0, 1, 1]], name: 'Z1' },
            { shape: [[0, 1, 1], [1, 1, 0]], name: 'Z2' },
        ];

        // DOM elements
        this.boardElement = document.getElementById('gameBoard');
        this.pieceSlotsElement = document.getElementById('pieceSlots');
        this.scoreElement = document.getElementById('scoreValue');
        this.highScoreElement = document.getElementById('highScoreValue');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.pauseModal = document.getElementById('pauseModal');
        this.finalScoreElement = document.getElementById('finalScore');
        this.modalHighScoreElement = document.getElementById('modalHighScore');
        this.newHighScoreElement = document.getElementById('newHighScore');
        this.effectsContainer = document.getElementById('effectsContainer');
        this.ghostPreview = document.getElementById('ghostPreview');

        // Leaderboard elements
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.themeBtn = document.getElementById('themeBtn');
        this.themeBtnLabel = document.getElementById('themeBtnLabel');

        this.init();
    }

    init() {
        this.loadHighScore();
        this.createBoard();
        this.createParticles();
        this.bindEvents();
        this.generateNewPieces();
        this.updateScore();
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('blockBlastHighScore');
            this.highScore = saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            this.highScore = 0;
        }
        this.updateHighScoreDisplay();
    }

    saveHighScore() {
        try {
            localStorage.setItem('blockBlastHighScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score');
        }
    }

    updateHighScoreDisplay() {
        if (this.highScoreElement) {
            this.highScoreElement.textContent = this.highScore.toLocaleString();
        }
    }

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
            return true;
        }
        return false;
    }

    createBoard() {
        this.board = [];
        this.boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = null;

                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.boardElement.appendChild(cell);
            }
        }
    }

    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.animationDuration = `${8 + Math.random() * 6}s`;

            const colors = ['#22D3EE', '#A855F7', '#FB923C', '#3B82F6'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            container.appendChild(particle);
        }
    }

    bindEvents() {
        // Initialize sound on first interaction
        const initSound = () => {
            this.sound.init();
            document.removeEventListener('touchstart', initSound);
            document.removeEventListener('mousedown', initSound);
        };
        document.addEventListener('touchstart', initSound, { once: true });
        document.addEventListener('mousedown', initSound, { once: true });

        // Piece drag events - attach to document for better tracking
        this.pieceSlotsElement.addEventListener('mousedown', this.handleDragStart.bind(this));
        this.pieceSlotsElement.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: false });

        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });

        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        document.addEventListener('touchend', this.handleDragEnd.bind(this));
        document.addEventListener('touchcancel', this.handleDragEnd.bind(this));

        // Prevent context menu on long press
        this.pieceSlotsElement.addEventListener('contextmenu', e => e.preventDefault());

        // Button events
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.sound.play('button');
            this.togglePause();
        });
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.sound.play('button');
            this.undo();
        });
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.sound.play('button');
            this.togglePause();
        });
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.sound.play('button');
            this.newGame();
        });

        // Game Over Modal Buttons
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.newGame();
            });
        }

        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.gameOverModal.classList.remove('active');
                this.newGame(); // Basically reset to start
            });
        }

        // Level Complete Next Button
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.loadNextLevel();
            });
        }

        // Leaderboard button
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.showLeaderboard();
            });
        }

        // Close leaderboard button
        const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
        if (closeLeaderboardBtn) {
            closeLeaderboardBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.hideLeaderboard();
            });
        }

        // Theme toggle button
        if (this.themeBtn) {
            this.themeBtn.addEventListener('click', () => {
                this.sound.play('button');
                this.theme.toggle();
                this.updateThemeButtonLabel();
            });
        }
    }

    getEventPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    handleDragStart(e) {
        if (this.isPaused || this.isGameOver) return;

        const pos = this.getEventPosition(e);
        const target = document.elementFromPoint(pos.x, pos.y);
        const pieceElement = target?.closest('.piece');

        if (!pieceElement) return;

        e.preventDefault();

        const slotElement = pieceElement.closest('.piece-slot');
        const slotIndex = parseInt(slotElement.dataset.slot);

        if (!this.pieces[slotIndex]) return;

        this.isDragging = true;
        this.draggingPiece = this.pieces[slotIndex];
        this.draggingPieceElement = pieceElement;
        this.draggingSlotIndex = slotIndex;
        this.dragStartPos = pos;

        // Clone the piece for dragging
        const clone = pieceElement.cloneNode(true);
        clone.classList.add('dragging');
        clone.id = 'dragging-piece';
        document.body.appendChild(clone);

        // Fade original
        pieceElement.classList.add('faded');

        // Position the clone
        this.updateDragPosition(pos.x, pos.y);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(15);
    }

    handleDragMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        const pos = this.getEventPosition(e);
        this.updateDragPosition(pos.x, pos.y);
        this.updateHighlight(pos.x, pos.y);
    }

    handleDragEnd(e) {
        if (!this.isDragging) return;

        const pos = this.getEventPosition(e);

        // Try to place the piece
        if (this.lastValidPosition) {
            const { row, col } = this.lastValidPosition;
            if (this.canPlacePiece(this.draggingPiece, row, col)) {
                this.placePiece(this.draggingPiece, row, col, this.draggingSlotIndex);
            }
        }

        // Cleanup
        const clone = document.getElementById('dragging-piece');
        if (clone) clone.remove();

        if (this.draggingPieceElement) {
            this.draggingPieceElement.classList.remove('faded');
        }

        this.clearHighlight();
        this.hideGhostPreview();

        this.isDragging = false;
        this.draggingPiece = null;
        this.draggingPieceElement = null;
        this.draggingSlotIndex = null;
        this.lastValidPosition = null;
    }

    updateDragPosition(x, y) {
        const clone = document.getElementById('dragging-piece');
        if (!clone) return;

        const rect = clone.getBoundingClientRect();

        // Calculate offset dynamically based on cell size to be roughly 2.8 blocks up
        let offsetY = 30;
        if (window.matchMedia('(pointer: coarse)').matches) {
            const boardRect = this.boardElement.getBoundingClientRect();
            const cellSize = boardRect.width / this.boardSize;
            this.touchOffset = cellSize * 4; // User requested MORE space
            offsetY = this.touchOffset;
        }

        clone.style.left = `${x}px`;
        clone.style.top = `${y - offsetY}px`;
        clone.style.transform = 'translate(-50%, -50%) scale(1.15)';
    }

    updateHighlight(x, y) {
        this.clearHighlight();

        if (!this.draggingPiece) return;

        const boardRect = this.boardElement.getBoundingClientRect();
        const cellSize = boardRect.width / this.boardSize;

        // Calculate offset dynamically based on cell size to be roughly 2.8 blocks up
        let offsetY = 30;
        if (window.matchMedia('(pointer: coarse)').matches) {
            const boardRect = this.boardElement.getBoundingClientRect();
            const cellSize = boardRect.width / this.boardSize;
            this.touchOffset = cellSize * 4;
            offsetY = this.touchOffset;
        }
        const targetY = y - offsetY;

        const col = Math.floor((x - boardRect.left) / cellSize);
        const row = Math.floor((targetY - boardRect.top) / cellSize);

        if (row < 0 || col < 0 || row >= this.boardSize || col >= this.boardSize) {
            this.hideGhostPreview();
            this.lastValidPosition = null;
            return;
        }

        const canPlace = this.canPlacePiece(this.draggingPiece, row, col);

        if (canPlace) {
            // Haptic feedback when snapping to a new valid position
            const isNewPos = !this.lastValidPosition ||
                this.lastValidPosition.row !== row ||
                this.lastValidPosition.col !== col;

            if (isNewPos && navigator.vibrate) {
                navigator.vibrate(10);
            }

            this.lastValidPosition = { row, col };
            this.showGhostPreview(row, col);

            // Add valid class for green shadow
            if (this.ghostPreview) this.ghostPreview.classList.add('valid');

            // Preview Line Clears
            this.previewLineClears(this.draggingPiece, row, col);
        } else {
            this.lastValidPosition = null;
            if (this.ghostPreview) this.ghostPreview.classList.remove('valid');
            this.hideGhostPreview();
        }

        // Highlight cells on the board
        const shape = this.draggingPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const cellRow = row + r;
                    const cellCol = col + c;

                    if (cellRow >= 0 && cellRow < this.boardSize &&
                        cellCol >= 0 && cellCol < this.boardSize) {
                        const cell = this.getCellElement(cellRow, cellCol);
                        cell.classList.add(canPlace ? 'highlight' : 'invalid');
                        this.currentHighlight.push(cell);
                    }
                }
            }
        }
    }

    showGhostPreview(row, col) {
        if (!this.ghostPreview || !this.draggingPiece) return;

        // Get target anchoring cell for exact positioning
        const targetCell = this.getCellElement(row, col);
        if (!targetCell) return;

        const cellRect = targetCell.getBoundingClientRect();
        const cellSize = cellRect.width;
        const shape = this.draggingPiece.shape;
        const gap = 4; // Matches --cell-gap in CSS

        this.ghostPreview.innerHTML = '';
        this.ghostPreview.style.display = 'grid';
        this.ghostPreview.style.gridTemplateColumns = `repeat(${shape[0].length}, ${cellSize}px)`;
        this.ghostPreview.style.gap = `${gap}px`;
        this.ghostPreview.style.left = `${cellRect.left}px`;
        this.ghostPreview.style.top = `${cellRect.top}px`;
        this.ghostPreview.classList.add('visible');

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                const cell = document.createElement('div');
                if (shape[r][c] === 1) {
                    cell.className = 'ghost-cell';
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                } else {
                    cell.style.visibility = 'hidden';
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                }
                this.ghostPreview.appendChild(cell);
            }
        }
    }

    hideGhostPreview() {
        if (this.ghostPreview) {
            this.ghostPreview.classList.remove('visible');
            this.ghostPreview.classList.remove('valid');
            this.ghostPreview.innerHTML = '';
            this.ghostPreview.style.display = 'none';
        }
    }

    clearHighlight() {
        this.currentHighlight.forEach(cell => {
            cell.classList.remove('highlight', 'invalid');
        });
        this.currentHighlight = [];

        // Clear preview highlights
        document.querySelectorAll('.preview-clear').forEach(el => el.classList.remove('preview-clear'));
    }

    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    canPlacePiece(piece, startRow, startCol) {
        const shape = piece.shape;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const row = startRow + r;
                    const col = startCol + c;

                    if (row < 0 || row >= this.boardSize ||
                        col < 0 || col >= this.boardSize) {
                        return false;
                    }

                    if (this.board[row][col] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(piece, startRow, startCol, pieceIndex) {
        this.saveState();
        this.sound.play('place');

        const shape = piece.shape;
        const color = piece.color;
        let blockCount = 0;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const row = startRow + r;
                    const col = startCol + c;

                    this.board[row][col] = color;
                    const cell = this.getCellElement(row, col);
                    cell.classList.add('filled', `color-${color}`);
                    blockCount++;
                }
            }
        }

        this.addScore(blockCount);
        this.pieces[pieceIndex] = null;
        this.renderPieces();

        setTimeout(() => {
            this.checkAndClearLines();

            if (this.pieces.every(p => p === null)) {
                this.generateNewPieces();
            }

            this.checkGameOver();
        }, 50);
    }

    checkAndClearLines() {
        const rowsToClear = [];
        const colsToClear = [];

        for (let row = 0; row < this.boardSize; row++) {
            if (this.board[row].every(cell => cell !== null)) {
                rowsToClear.push(row);
            }
        }

        for (let col = 0; col < this.boardSize; col++) {
            let fullColumn = true;
            for (let row = 0; row < this.boardSize; row++) {
                if (this.board[row][col] === null) {
                    fullColumn = false;
                    break;
                }
            }
            if (fullColumn) {
                colsToClear.push(col);
            }
        }

        const totalLines = rowsToClear.length + colsToClear.length;

        if (totalLines > 0) {
            if (totalLines > 1) {
                this.sound.play('combo');
            } else {
                this.sound.play('clear');
            }

            const cellsToClear = new Set();
            const cellColors = new Map();

            rowsToClear.forEach(row => {
                for (let col = 0; col < this.boardSize; col++) {
                    const key = `${row}-${col}`;
                    cellsToClear.add(key);
                    cellColors.set(key, this.board[row][col]);
                }
            });

            colsToClear.forEach(col => {
                for (let row = 0; row < this.boardSize; row++) {
                    const key = `${row}-${col}`;
                    cellsToClear.add(key);
                    cellColors.set(key, this.board[row][col]);
                }
            });

            cellsToClear.forEach(key => {
                const [row, col] = key.split('-').map(Number);
                const cell = this.getCellElement(row, col);
                const color = cellColors.get(key);

                cell.classList.add('clearing');
                this.spawnParticleExplosion(cell, color);
            });

            const baseScore = cellsToClear.size * 10;
            const comboBonus = totalLines > 1 ? totalLines * 50 : 0;
            const totalScore = baseScore + comboBonus;

            this.addScore(totalScore);

            if (totalLines > 1) {
                this.showComboText(totalLines);
            }

            this.showScorePopup(totalScore);

            setTimeout(() => {
                cellsToClear.forEach(key => {
                    const [row, col] = key.split('-').map(Number);
                    this.board[row][col] = null;
                    const cell = this.getCellElement(row, col);
                    cell.className = 'cell flash';

                    setTimeout(() => cell.classList.remove('flash'), 250);
                });
            }, 400);
        }
    }

    spawnParticleExplosion(cell, colorName) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const color = this.colorHex[colorName] || '#FFFFFF';

        const particleCount = 6;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'clear-particle';

            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
            const distance = 35 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.background = color;
            particle.style.boxShadow = `0 0 8px ${color}`;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            this.effectsContainer.appendChild(particle);

            setTimeout(() => particle.remove(), 700);
        }

        for (let i = 0; i < 3; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${centerX + (Math.random() - 0.5) * 25}px`;
            sparkle.style.top = `${centerY + (Math.random() - 0.5) * 25}px`;
            sparkle.style.color = color;
            sparkle.style.animationDelay = `${Math.random() * 0.15}s`;

            this.effectsContainer.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 500);
        }
    }

    generateNewPieces() {
        // Difficulty Tuning: Easier pieces in early levels or lower scores
        // Simple heuristic: If level < 5, reduce complex shapes
        const isEasy = this.levelManager && this.levelManager.currentLevel <= 5;

        for (let i = 0; i < 3; i++) {
            this.pieces[i] = this.getRandomPiece(isEasy);
        }
        this.renderPieces();
    }

    getRandomPiece(isEasy = false) {
        const shapes = this.getShapes(isEasy);
        const shapeData = shapes[Math.floor(Math.random() * shapes.length)];
        const colors = this.colors;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return {
            shape: shapeData.shape,
            name: 'piece',
            color: color
        };
    }

    getShapes(isEasy) {
        // Basic shapes
        const easyShapes = [
            { shape: [[1]], name: '1x1' },
            { shape: [[1, 1]], name: '1x2_h' },
            { shape: [[1], [1]], name: '1x2_v' },
            { shape: [[1, 1], [1, 1]], name: '2x2' },
            { shape: [[1, 1, 1]], name: '1x3_h' },
            { shape: [[1], [1], [1]], name: '1x3_v' },
            { shape: [[1, 1], [1, 0]], name: 'L_small' }
        ];

        const hardShapes = [
            { shape: [[1, 1, 1, 1]], name: '1x4_h' },
            { shape: [[1], [1], [1], [1]], name: '1x4_v' },
            { shape: [[1, 1, 1], [0, 1, 0]], name: 'T_up' },
            { shape: [[1, 0], [1, 1], [1, 0]], name: 'T_left' },
            { shape: [[1, 1, 1], [1, 0, 0]], name: 'L_large' },
            { shape: [[1, 1, 0], [0, 1, 1]], name: 'Z_shape' },
            { shape: [[1, 1, 1], [1, 1, 1]], name: '2x3' }
        ];

        if (isEasy) return [...easyShapes, ...easyShapes, ...hardShapes]; // Weigh easy shapes higher
        return [...easyShapes, ...hardShapes];
    }

    renderPieces() {
        const slots = this.pieceSlotsElement.querySelectorAll('.piece-slot');

        slots.forEach((slot, index) => {
            slot.innerHTML = '';

            const piece = this.pieces[index];
            if (!piece) return;

            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 30px)`;
            pieceElement.style.gridTemplateRows = `repeat(${piece.shape.length}, 30px)`;

            for (let r = 0; r < piece.shape.length; r++) {
                for (let c = 0; c < piece.shape[r].length; c++) {
                    const cell = document.createElement('div');
                    if (piece.shape[r][c] === 1) {
                        cell.className = `piece-cell color-${piece.color}`;
                    } else {
                        cell.style.visibility = 'hidden';
                    }
                    pieceElement.appendChild(cell);
                }
            }

            slot.appendChild(pieceElement);
        });
    }

    addScore(points) {
        this.score += points;
        this.updateScore();
        // Levels disabled for debugging
        // this.checkLevelProgress();
    }

    checkLevelProgress() {
        const currentLevel = this.levelManager.getCurrentLevelData();
        if (this.score >= currentLevel.targetScore) {
            // Level Complete!
            this.sound.play('newHighScore'); // Use positive sound
            document.getElementById('levelScore').textContent = this.score;
            this.levelCompleteModal.classList.add('active');
        }
    }

    loadNextLevel() {
        this.levelCompleteModal.classList.remove('active');
        if (this.levelManager.nextLevel()) {
            this.newGame(true); // Keep score? Or reset? Usually puzzle games reset board but keep score accumulation?
            // Actually, "50 levels" implies clearing board. Let's clear board but maybe keep score or reset target.
            // Let's reset board but keep total score for "Endless" feel with stages. 
            // Wait, newGame() resets pieces.
            // Let's just call startLevel() logic.
        } else {
            // All levels done? Loop or endless.
            alert("You beat all 50 levels! Restarting at 1.");
            this.levelManager.currentLevel = 1;
            this.newGame();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score.toLocaleString();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScoreDisplay();
        }
    }

    showScorePopup(score) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;

        const boardRect = this.boardElement.getBoundingClientRect();
        popup.style.left = `${boardRect.left + boardRect.width / 2}px`;
        popup.style.top = `${boardRect.top + boardRect.height / 2}px`;

        this.effectsContainer.appendChild(popup);

        setTimeout(() => popup.remove(), 800);
    }

    showComboText(lines) {
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';

        if (lines === 2) {
            comboText.textContent = 'DOUBLE!';
        } else if (lines === 3) {
            comboText.textContent = 'TRIPLE!';
        } else {
            comboText.textContent = `${lines}x COMBO!`;
        }

        this.effectsContainer.appendChild(comboText);

        setTimeout(() => comboText.remove(), 700);
    }

    checkGameOver() {
        const availablePieces = this.pieces.filter(p => p !== null);

        for (const piece of availablePieces) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    if (this.canPlacePiece(piece, row, col)) {
                        return;
                    }
                }
            }
        }

        if (availablePieces.length > 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;

        const isNewHighScore = this.checkHighScore();

        // Add score to leaderboard
        const rank = this.leaderboard.addScore(this.score);

        this.finalScoreElement.textContent = this.score.toLocaleString();
        this.modalHighScoreElement.textContent = this.highScore.toLocaleString();

        if (isNewHighScore) {
            this.newHighScoreElement.classList.add('show');
            this.sound.play('newHighScore');
        } else {
            this.newHighScoreElement.classList.remove('show');
            this.sound.play('gameOver');
        }

        this.gameOverModal.classList.add('active');
    }

    showLeaderboard() {
        if (!this.leaderboardModal || !this.leaderboardList) return;

        const scores = this.leaderboard.getScores();
        this.leaderboardList.innerHTML = '';

        if (scores.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'leaderboard-empty';
            emptyMsg.textContent = 'No scores yet! Play a game to get on the board.';
            this.leaderboardList.appendChild(emptyMsg);
        } else {
            scores.forEach((entry, index) => {
                const row = document.createElement('div');
                row.className = 'leaderboard-row';
                if (index === 0) row.classList.add('top-score');

                const rankEl = document.createElement('span');
                rankEl.className = 'leaderboard-rank';
                rankEl.textContent = index === 0 ? '🏆' : `#${index + 1}`;

                const scoreEl = document.createElement('span');
                scoreEl.className = 'leaderboard-score';
                scoreEl.textContent = entry.score.toLocaleString();

                const dateEl = document.createElement('span');
                dateEl.className = 'leaderboard-date';
                dateEl.textContent = entry.date;

                row.appendChild(rankEl);
                row.appendChild(scoreEl);
                row.appendChild(dateEl);
                this.leaderboardList.appendChild(row);
            });
        }

        this.leaderboardModal.classList.add('active');
    }

    hideLeaderboard() {
        if (this.leaderboardModal) {
            this.leaderboardModal.classList.remove('active');
        }
    }

    updateThemeButtonLabel() {
        if (this.themeBtnLabel) {
            this.themeBtnLabel.textContent = this.theme.getThemeName();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseModal.classList.toggle('active', this.isPaused);
    }

    saveState() {
        const state = {
            board: this.board.map(row => [...row]),
            score: this.score,
            pieces: this.pieces.map(p => p ? { ...p, shape: p.shape.map(r => [...r]) } : null)
        };

        this.history = [state];
    }

    undo() {
        if (this.history.length === 0) return;

        const state = this.history.pop();
        this.board = state.board;
        this.score = state.score;
        this.pieces = state.pieces;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.getCellElement(row, col);
                cell.className = 'cell';

                if (this.board[row][col]) {
                    cell.classList.add('filled', `color-${this.board[row][col]}`);
                }
            }
        }

        this.updateScore();
        this.renderPieces();
    }

    newGame(keepScore = false) {
        this.board = [];
        if (!keepScore) this.score = 0;
        this.pieces = [null, null, null];
        this.history = [];
        this.isGameOver = false;
        this.isPaused = false;

        this.gameOverModal.classList.remove('active');
        this.pauseModal.classList.remove('active');
        this.newHighScoreElement.classList.remove('show');
        this.levelCompleteModal.classList.remove('active');

        this.createBoard();

        // Levels disabled for debugging - no obstacles placed
        // const levelData = this.levelManager.getCurrentLevelData();
        // if (levelData && levelData.obstaclePattern) {
        //     levelData.obstaclePattern.forEach(pos => {
        //         if (pos.r < this.boardSize && pos.c < this.boardSize) {
        //             this.board[pos.r][pos.c] = 'grey'; // Obstacle color
        //             const cell = this.getCellElement(pos.r, pos.c);
        //             if (cell) cell.classList.add('filled', 'obstacle');
        //         }
        //     });
        // }

        this.generateNewPieces();
        this.updateScore();

        // Show Level Toast/Indicator (Optional)
        // console.log("Started Level " + levelData.id);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new BlockBlast();

    const splashScreen = document.getElementById('splashScreen');
    const gameContainer = document.getElementById('gameContainer');
    const tapToStart = document.querySelector('.tap-to-start');

    // Resume audio context on splash click (important for mobile)
    const startApp = () => {
        if (window.game && window.game.sound && window.game.sound.context) {
            window.game.sound.context.resume().catch(e => console.log('Audio resume failed', e));
        }

        splashScreen.classList.add('hidden');
        gameContainer.style.opacity = '1';

        // Remove splash after transition
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    };

    if (tapToStart) {
        tapToStart.addEventListener('click', startApp);
        tapToStart.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double firing
            startApp();
        }, { passive: false });
    }
});

/**
 * BLOCK ROYALE — Game Engine
 * A neon block puzzle game with drag-and-drop mechanics
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

        // Drag state
        this.draggingPiece = null;
        this.draggingPieceElement = null;
        this.draggingSlotIndex = null;
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragConfirmed = false;
        this.currentHighlight = [];
        this.lastValidPosition = null;
        this.lastPointerPos = null;
        this.lastDragTime = 0;
        this.dragClone = null;
        this.dragCache = null; // Cached layout values for drag session
        this.lastSnapRow = -1;
        this.lastSnapCol = -1;

        // Settings
        this.hapticsEnabled = true;

        // Colors with hex values for particles
        this.colors = ['purple', 'cyan', 'orange', 'blue', 'red', 'green', 'yellow'];
        this.colorHex = {
            purple: '#a855f7',
            cyan: '#2dd4bf',
            orange: '#fb923c',
            blue: '#3b82f6',
            red: '#f43f5e',
            green: '#10b981',
            yellow: '#facc15'
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

        // Leaderboard elements
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.themeBtn = document.getElementById('themeBtn');
        this.themeBtnLabel = document.getElementById('themeBtnLabel');

        // Level Complete Modal
        this.levelCompleteModal = document.getElementById('levelCompleteModal');

        this.init();
    }

    init() {
        this.loadHighScore();
        this.createBoard();
        this.createParticles();
        this.bindEvents();
        this.generateNewPieces();
        this.updateScore();
        this.prewarmAnimations();
    }

    /**
     * Pre-warm CSS animations so iOS Safari compiles keyframes before first use.
     * Without this, the first line clear stutters while the browser parses
     * particle-explode, sparkle-fade, jelly-squish-pop for the first time.
     */
    prewarmAnimations() {
        const container = this.effectsContainer;
        if (!container) return;

        // Create off-screen elements (not opacity:0 — Safari skips animations on invisible elements)
        const particle = document.createElement('div');
        particle.className = 'clear-particle';
        particle.style.cssText = 'position:fixed;left:-100px;top:-100px;--tx:10px;--ty:10px;background:red;';

        const cell = document.createElement('div');
        cell.className = 'cell clearing';
        cell.style.cssText = 'position:fixed;left:-100px;top:-100px;width:30px;height:30px;';

        container.appendChild(particle);
        container.appendChild(cell);

        // Force style + layout computation so the browser compiles keyframes NOW
        getComputedStyle(particle).transform;
        getComputedStyle(cell).transform;

        // Remove after animation would have started
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                particle.remove();
                cell.remove();
            });
        });
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
        this.board = createEmptyBoard(this.boardSize);
        this.boardElement.innerHTML = '';
        this.cellElements = []; // Cache cell DOM refs — avoids querySelector per access

        for (let row = 0; row < this.boardSize; row++) {
            this.cellElements[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.boardElement.appendChild(cell);
                this.cellElements[row][col] = cell;
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

        // Reset drag state if user switches tabs or loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isDragging) {
                this.resetDragState();
            }
        });
        window.addEventListener('blur', () => {
            if (this.isDragging) {
                this.resetDragState();
            }
        });

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

        // Home button is handled by the start screen controller in the DOMContentLoaded block

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

    // =====================================================
    // DRAG SYSTEM
    // Floating clone follows finger at board cell size.
    // Board cells show coloured preview at snap position.
    // Y offset on mobile so thumb doesn't cover the piece.
    // =====================================================

    handleDragStart(e) {
        if (this.isPaused || this.isGameOver) return;

        if (this.isDragging) this.resetDragState();

        try {
            const pos = this.getEventPosition(e);
            const target = document.elementFromPoint(pos.x, pos.y);

            // Try direct hit on piece first, then fall back to piece inside the slot
            let pieceElement = target?.closest('.piece');
            let slotElement;

            if (pieceElement) {
                slotElement = pieceElement.closest('.piece-slot');
            } else {
                // Touch landed on slot padding — grab the piece inside
                slotElement = target?.closest('.piece-slot');
                if (slotElement) {
                    pieceElement = slotElement.querySelector('.piece');
                }
            }

            if (!pieceElement || !slotElement || !slotElement.dataset.slot) return;

            e.preventDefault();

            const slotIndex = parseInt(slotElement.dataset.slot);
            if (isNaN(slotIndex) || !this.pieces[slotIndex]) return;

            this.isDragging = true;
            this.dragConfirmed = false;
            this.draggingPiece = this.pieces[slotIndex];
            this.draggingPieceElement = pieceElement;
            this.draggingSlotIndex = slotIndex;
            this.dragStartPos = pos;
            this.lastValidPosition = null;
            this.lastSnapRow = -1;
            this.lastSnapCol = -1;

            // Cache layout values once — avoids getComputedStyle on every frame
            const boardRect = this.boardElement.getBoundingClientRect();
            const gap = parseFloat(getComputedStyle(this.boardElement).gap) || 6;
            const cellSize = (boardRect.width - gap * (this.boardSize - 1)) / this.boardSize;
            const stride = cellSize + gap;
            const isMobile = window.matchMedia('(pointer: coarse)').matches;
            this.dragCache = { boardRect, gap, cellSize, stride, isMobile };
        } catch (error) {
            console.warn('Drag start error:', error);
            this.resetDragState();
        }
    }

    /**
     * Create a floating clone of the piece at board cell size.
     * Called once when drag is confirmed (past dead zone).
     */
    createDragClone(piece) {
        const clone = document.createElement('div');
        clone.className = 'drag-clone';

        const { cellSize, gap } = this.dragCache;
        const cols = piece.shape[0].length;
        const rows = piece.shape.length;

        clone.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        clone.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        clone.style.gap = `${gap}px`;

        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                const cell = document.createElement('div');
                if (piece.shape[r][c] === 1) {
                    cell.className = `drag-cell color-${piece.color}`;
                } else {
                    cell.style.visibility = 'hidden';
                }
                clone.appendChild(cell);
            }
        }

        document.body.appendChild(clone);
        this.dragClone = clone;
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const pos = this.getEventPosition(e);

        // Dead zone: require 8px movement before starting drag
        if (!this.dragConfirmed) {
            const dx = pos.x - this.dragStartPos.x;
            const dy = pos.y - this.dragStartPos.y;
            if (dx * dx + dy * dy < 64) return;

            this.dragConfirmed = true;
            // Hide tray piece, create floating clone
            this.draggingPieceElement.classList.add('dragging-hidden');
            this.createDragClone(this.draggingPiece);
            if (this.hapticsEnabled && navigator.vibrate) navigator.vibrate(15);
        }

        // Throttle to ~60fps
        const now = Date.now();
        if (now - this.lastDragTime < 16) return;
        this.lastDragTime = now;

        // Move the floating clone to follow finger
        this.updateClonePosition(pos.x, pos.y);

        // Update board grid preview
        this.updateGridSnap(pos.x, pos.y);
    }

    /**
     * Position the drag clone centered on the finger with Y offset.
     */
    updateClonePosition(x, y) {
        if (!this.dragClone || !this.draggingPiece || !this.dragCache) return;

        const { cellSize, gap, stride, isMobile } = this.dragCache;
        const piece = this.draggingPiece;
        const cols = piece.shape[0].length;
        const rows = piece.shape.length;

        const cloneW = cols * cellSize + (cols - 1) * gap;
        const cloneH = rows * cellSize + (rows - 1) * gap;
        const offsetY = isMobile ? stride * 1.5 : 0;

        this.dragClone.style.left = `${x - cloneW / 2}px`;
        this.dragClone.style.top = `${y - offsetY - cloneH / 2}px`;
    }

    handleDragEnd(e) {
        if (!this.isDragging) return;

        try {
            if (!this.dragConfirmed) {
                this.resetDragState();
                return;
            }

            // Clear preview highlights BEFORE placing so they don't strip the colour
            this.clearHighlight();

            // Place piece if we have a valid snap position
            if (this.lastValidPosition && this.draggingPiece) {
                const { row, col } = this.lastValidPosition;
                if (this.canPlacePiece(this.draggingPiece, row, col)) {
                    this.placePiece(this.draggingPiece, row, col, this.draggingSlotIndex);
                }
            }
        } catch (error) {
            console.warn('Drag end error:', error);
        }

        this.resetDragState();
    }

    resetDragState() {
        // Remove drag clone
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }

        // Restore tray piece visibility
        document.querySelectorAll('.piece.dragging-hidden').forEach(el => {
            el.classList.remove('dragging-hidden');
        });

        // Clear board preview
        this.clearHighlight();

        // Reset state
        this.isDragging = false;
        this.dragConfirmed = false;
        this.draggingPiece = null;
        this.draggingPieceElement = null;
        this.draggingSlotIndex = null;
        this.lastValidPosition = null;
        this.dragCache = null;
        this.lastSnapRow = -1;
        this.lastSnapCol = -1;
    }

    /**
     * Core drag system.
     * Maps finger position to board grid with a small Y offset so the
     * player can see the piece above their thumb.
     * Clamps to board edges when finger is near/off the board.
     */
    updateGridSnap(x, y) {
        if (!this.draggingPiece || !this.dragCache) return;

        const { boardRect, stride, isMobile } = this.dragCache;
        const offsetY = isMobile ? stride * 1.5 : 0;

        const shape = this.draggingPiece.shape;
        const pieceW = shape[0].length;
        const pieceH = shape.length;

        // Map finger position (with offset) to grid
        const centerCol = (x - boardRect.left) / stride;
        const centerRow = (y - offsetY - boardRect.top) / stride;

        // Convert to top-left cell of piece
        let col = Math.floor(centerCol - pieceW / 2 + 0.5);
        let row = Math.floor(centerRow - pieceH / 2 + 0.5);

        // Clamp to board edges — keeps preview visible when finger drifts off
        col = Math.max(0, Math.min(col, this.boardSize - pieceW));
        row = Math.max(0, Math.min(row, this.boardSize - pieceH));

        // Skip DOM work if snap position hasn't changed
        if (row === this.lastSnapRow && col === this.lastSnapCol) return;
        this.lastSnapRow = row;
        this.lastSnapCol = col;

        // Now clear previous highlight and rebuild
        this.clearHighlight();

        const canPlace = this.canPlacePiece(this.draggingPiece, row, col);

        if (canPlace) {
            const isNewPos = !this.lastValidPosition ||
                this.lastValidPosition.row !== row ||
                this.lastValidPosition.col !== col;

            if (isNewPos && this.hapticsEnabled && navigator.vibrate) {
                navigator.vibrate(10);
            }

            this.lastValidPosition = { row, col };
        } else {
            this.lastValidPosition = null;
        }

        // Show coloured preview on the board cells
        const color = this.draggingPiece.color;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const cellRow = row + r;
                    const cellCol = col + c;

                    if (cellRow >= 0 && cellRow < this.boardSize &&
                        cellCol >= 0 && cellCol < this.boardSize) {
                        const cell = this.getCellElement(cellRow, cellCol);
                        if (cell) {
                            const colorClass = `color-${color}`;
                            if (canPlace) {
                                cell.classList.add('preview-piece', colorClass);
                                this.currentHighlight.push({ cell, addedClass: colorClass });
                            } else {
                                cell.classList.add('invalid');
                                this.currentHighlight.push({ cell, addedClass: null });
                            }
                        }
                    }
                }
            }
        }
    }

    clearHighlight() {
        for (let i = 0; i < this.currentHighlight.length; i++) {
            const { cell, addedClass } = this.currentHighlight[i];
            cell.classList.remove('highlight', 'invalid', 'preview-piece');
            // Only remove color from non-placed cells — placed blocks keep their color
            if (addedClass && !cell.classList.contains('filled')) {
                cell.classList.remove(addedClass);
            }
        }
        this.currentHighlight = [];
    }

    getCellElement(row, col) {
        return this.cellElements[row]?.[col];
    }

    canPlacePiece(piece, startRow, startCol) {
        return canPlacePiece(this.board, piece, startRow, startCol);
    }

    placePiece(piece, startRow, startCol, pieceIndex) {
        this.saveState();
        this.sound.play('place');

        const blockCount = placePieceOnBoard(this.board, piece, startRow, startCol);

        // Update DOM to reflect board state
        const shape = piece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const cell = this.getCellElement(startRow + r, startCol + c);
                    cell.classList.add('filled', `color-${piece.color}`);
                }
            }
        }

        this.addScore(blockCount);
        this.pieces[pieceIndex] = null;
        this.renderPieces();

        this.checkAndClearLines();

        if (this.pieces.every(p => p === null)) {
            this.generateNewPieces();
        }

        this.checkGameOver();
    }

    checkAndClearLines() {
        const { rows, cols, cellsToClear } = findLinesToClear(this.board);
        const totalLines = rows.length + cols.length;

        if (totalLines > 0) {
            if (totalLines > 1) {
                this.sound.play('combo');
            } else {
                this.sound.play('clear');
            }

            // Read all positions BEFORE any DOM writes
            const clearData = [];
            cellsToClear.forEach(key => {
                const [row, col] = key.split('-').map(Number);
                const cell = this.getCellElement(row, col);
                const color = this.board[row][col];
                const rect = cell.getBoundingClientRect();
                clearData.push({ cell, color, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 });
            });

            // Update board data
            clearCells(this.board, cellsToClear);

            // Write — add clearing class + particles
            const container = this.effectsContainer;
            for (const { cell, color, centerX, centerY } of clearData) {
                cell.classList.add('clearing');
                const hex = this.colorHex[color] || '#FFFFFF';
                for (let i = 0; i < 2; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'clear-particle';
                    const angle = Math.PI * i + (Math.random() - 0.5);
                    const dist = 30 + Math.random() * 40;
                    particle.style.cssText = `left:${centerX}px;top:${centerY}px;background:${hex};box-shadow:0 0 8px ${hex};--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px`;
                    container.appendChild(particle);
                    setTimeout(() => particle.remove(), 700);
                }
            }

            // Score + UI
            const totalScore = calculateClearScore(cellsToClear.size, totalLines);
            this.addScore(totalScore);

            if (totalLines > 1) {
                this.showComboText(totalLines);
            }

            this.showScorePopup(totalScore);

            // Visual cleanup after animation (matches 200ms clear-flash)
            setTimeout(() => {
                for (const { cell } of clearData) {
                    cell.className = 'cell';
                }
            }, 200);
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
            pieceElement.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
            pieceElement.style.gridTemplateRows = `repeat(${piece.shape.length}, 1fr)`;

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
        // Levels disabled - endless mode only
        // this.checkLevelProgress();
    }

    checkLevelProgress() {
        if (!this.levelCompleteModal) return; // Guard against missing element

        const currentLevel = this.levelManager.getCurrentLevelData();
        if (this.score >= currentLevel.targetScore) {
            // Level Complete!
            this.sound.play('newHighScore'); // Use positive sound
            const levelScoreEl = document.getElementById('levelScore');
            if (levelScoreEl) levelScoreEl.textContent = this.score;
            this.levelCompleteModal.classList.add('active');
        }
    }

    loadNextLevel() {
        if (this.levelCompleteModal) {
            this.levelCompleteModal.classList.remove('active');
        }
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

        if (availablePieces.length > 0 && !hasValidMove(this.board, availablePieces)) {
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
        if (this.levelCompleteModal) {
            this.levelCompleteModal.classList.remove('active');
        }

        // Clear any orphaned particle effects
        if (this.effectsContainer) {
            this.effectsContainer.innerHTML = '';
        }

        this.createBoard();

        // Levels disabled - no obstacles placed (endless mode)
        // const levelData = this.levelManager.getCurrentLevelData();
        // if (levelData && levelData.obstaclePattern) {
        //     levelData.obstaclePattern.forEach(pos => {
        //         if (pos.r < this.boardSize && pos.c < this.boardSize) {
        //             this.board[pos.r][pos.c] = 'grey';
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
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    const startHighScore = document.getElementById('startHighScore');

    // Load high score for start screen display
    try {
        const saved = localStorage.getItem('blockBlastHighScore');
        if (saved && startHighScore) startHighScore.textContent = parseInt(saved, 10).toLocaleString();
    } catch (e) {}

    // Settings state
    const settings = {
        sound: localStorage.getItem('blockRoyaleSound') !== 'false',
        haptics: localStorage.getItem('blockRoyaleHaptics') !== 'false',
    };

    function showStartScreen() {
        startScreen.classList.remove('hidden');
        gameContainer.style.display = 'none';

        // Update high score on start screen
        try {
            const saved = localStorage.getItem('blockBlastHighScore');
            if (saved && startHighScore) startHighScore.textContent = parseInt(saved, 10).toLocaleString();
        } catch (e) {}
    }

    function startGame() {
        // Init and unlock audio on this user gesture (must happen synchronously within tap)
        if (window.game && window.game.sound) {
            window.game.sound.init();
            if (window.game.sound.audioContext) {
                // Resume must be called synchronously in the gesture, not in a .then()
                window.game.sound.audioContext.resume();
                // Play an audible "start" tone to unlock iOS audio AND give feedback
                window.game.sound.play('button');
            }
        }

        startScreen.classList.add('hidden');
        gameContainer.style.display = 'flex';

        // Force a synchronous layout so getBoundingClientRect() works immediately
        // This is cheaper than double-rAF and doesn't delay interaction
        gameContainer.offsetHeight; // eslint-disable-line no-unused-expressions

        if (window.game) {
            window.game.newGame();
        }

        // Show tutorial on first visit
        if (!localStorage.getItem('blockRoyaleTutorialDone')) {
            showTutorial();
        }
    }

    // Create game instance
    window.game = new BlockBlast();

    // Apply saved settings
    window.game.sound.enabled = settings.sound;
    window.game.hapticsEnabled = settings.haptics;

    // Hide game container on load (start screen is visible)
    gameContainer.style.display = 'none';

    // Play button
    document.getElementById('playBtn').addEventListener('click', startGame);

    // Home button → back to start screen
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.removeEventListener('click', homeBtn._handler);
        homeBtn._handler = () => {
            window.game.sound.play('button');
            window.game.gameOverModal.classList.remove('active');
            window.game.isGameOver = false;
            showStartScreen();
        };
        homeBtn.addEventListener('click', homeBtn._handler);
    }

    // Leaderboard from start screen
    document.getElementById('startLeaderboardBtn').addEventListener('click', () => {
        window.game.showLeaderboard();
    });

    // Settings from start screen
    document.getElementById('startSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });

    // Settings from pause menu
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.game.sound.play('button');
            window.game.pauseModal.classList.remove('active');
            document.getElementById('settingsModal').classList.add('active');
        });
    }

    // Close settings
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (!settings.sound) soundToggle.classList.remove('active');
    soundToggle.addEventListener('click', () => {
        settings.sound = !settings.sound;
        soundToggle.classList.toggle('active', settings.sound);
        window.game.sound.enabled = settings.sound;
        localStorage.setItem('blockRoyaleSound', settings.sound);
    });

    // Haptics toggle
    const hapticsToggle = document.getElementById('hapticsToggle');
    if (!settings.haptics) hapticsToggle.classList.remove('active');
    hapticsToggle.addEventListener('click', () => {
        settings.haptics = !settings.haptics;
        hapticsToggle.classList.toggle('active', settings.haptics);
        window.game.hapticsEnabled = settings.haptics;
        localStorage.setItem('blockRoyaleHaptics', settings.haptics);
    });

    // Theme toggle (light/dark)
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('blockRoyaleTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
        themeToggle.classList.add('active');
    }
    themeToggle.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.classList.toggle('active', newTheme === 'light');
        localStorage.setItem('blockRoyaleTheme', newTheme);

        // Re-render board to apply new theme colours to filled cells
        if (window.game && window.game.board) {
            for (let r = 0; r < window.game.boardSize; r++) {
                for (let c = 0; c < window.game.boardSize; c++) {
                    const cell = window.game.getCellElement(r, c);
                    if (cell) {
                        // Force CSS recalculation by removing and re-adding filled state
                        if (window.game.board[r][c]) {
                            const color = window.game.board[r][c];
                            cell.className = 'cell filled color-' + color;
                        } else {
                            cell.className = 'cell';
                        }
                    }
                }
            }
        }
    });

    // Clear data
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('Clear all scores and settings?')) {
            localStorage.removeItem('blockBlastHighScore');
            localStorage.removeItem('blockBlastLeaderboard');
            localStorage.removeItem('blockRoyaleTutorialDone');
            localStorage.removeItem('blockRoyaleSound');
            localStorage.removeItem('blockRoyaleHaptics');
            localStorage.removeItem('blockRoyaleTheme');
            document.documentElement.removeAttribute('data-theme');
            themeToggle.classList.remove('active');
            window.game.highScore = 0;
            window.game.updateHighScoreDisplay();
            window.game.leaderboard.clearScores();
            if (startHighScore) startHighScore.textContent = '0';
            document.getElementById('settingsModal').classList.remove('active');
        }
    });

    // =====================================================
    // TUTORIAL
    // =====================================================
    const tutorialSteps = [
        {
            icon: 'drag_pan',
            title: 'Drag & Place',
            desc: 'Drag pieces from the tray onto the board. Position them anywhere they fit.',
        },
        {
            icon: 'align_horizontal_center',
            title: 'Fill Lines',
            desc: 'Complete a full row or column to clear it and score points.',
        },
        {
            icon: 'trophy',
            title: 'Keep Going',
            desc: 'Clear lines to make room. The game ends when no pieces can be placed.',
        },
    ];

    let tutorialStep = 0;
    let tutorialEl = null;

    function showTutorial() {
        tutorialStep = 0;
        tutorialEl = document.createElement('div');
        tutorialEl.className = 'tutorial-overlay';
        tutorialEl.innerHTML = buildTutorialHTML(0);
        document.body.appendChild(tutorialEl);

        requestAnimationFrame(() => tutorialEl.classList.add('visible'));

        tutorialEl.querySelector('.btn-tutorial').addEventListener('click', advanceTutorial);
    }

    function buildTutorialHTML(step) {
        const s = tutorialSteps[step];
        const isLast = step === tutorialSteps.length - 1;
        const dots = tutorialSteps.map((_, i) =>
            `<div class="tutorial-dot ${i === step ? 'active' : ''}"></div>`
        ).join('');

        return `
            <div class="tutorial-card">
                <span class="material-symbols-outlined tutorial-icon">${s.icon}</span>
                <h3 class="tutorial-title">${s.title}</h3>
                <p class="tutorial-desc">${s.desc}</p>
                <div class="tutorial-dots">${dots}</div>
                <button class="btn-tutorial">${isLast ? 'Got it!' : 'Next'}</button>
            </div>
        `;
    }

    function advanceTutorial() {
        tutorialStep++;
        if (tutorialStep >= tutorialSteps.length) {
            localStorage.setItem('blockRoyaleTutorialDone', 'true');
            tutorialEl.classList.remove('visible');
            setTimeout(() => tutorialEl.remove(), 300);
            return;
        }
        tutorialEl.innerHTML = buildTutorialHTML(tutorialStep);
        tutorialEl.querySelector('.btn-tutorial').addEventListener('click', advanceTutorial);
    }
});

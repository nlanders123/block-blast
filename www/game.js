/**
 * BLOCK ROYALE — Game Engine
 * A neon block puzzle game with drag-and-drop mechanics
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
        this.unlocked = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            // Immediately attempt resume — this must run inside a user gesture
            // handler for iOS Safari to unlock the AudioContext.
            this._unlock();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * Unlock iOS Safari audio by resuming the context and playing a silent
     * buffer. iOS requires both resume() AND an audible buffer-source start
     * within the same user gesture call stack to fully unlock audio.
     */
    _unlock() {
        if (this.unlocked || !this.audioContext) return;
        const ctx = this.audioContext;
        // Resume returns a promise; we don't await it but it begins the unlock
        const p = ctx.resume();
        // Play a silent buffer to fully unlock on iOS Safari
        const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        source.onended = () => {
            this.unlocked = true;
        };
        if (p) p.then(() => { this.unlocked = true; });
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
        this.storageKey = 'blockRoyaleLeaderboard';
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

class BlockRoyale {
    constructor() {
        // Game state
        this.board = [];
        this.boardSize = 8;
        this.score = 0;
        this.highScore = 0;
        this.pieces = [null, null, null];
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
        this.pieceMode = 'tray';

        // Colors with hex values for particles
        this.colors = ['purple', 'cyan', 'orange', 'blue', 'red', 'green', 'yellow'];
        this.colorHex = {
            purple: '#B593D8',
            cyan:   '#8DD4B6',
            orange: '#F09568',
            blue:   '#8DBCEA',
            red:    '#F08978',
            green:  '#A8D67F',
            yellow: '#F2C44E'
        };

        // Sound Manager
        this.sound = new SoundManager();

        // Leaderboard Manager
        this.leaderboard = new LeaderboardManager();

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
        this.trayLabelElement = document.getElementById('trayLabel');
        this.trayHelpElement = document.getElementById('trayHelp');
        this.trayBadgeElement = document.getElementById('trayBadge');

        // Leaderboard elements
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardList = document.getElementById('leaderboardList');

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
        // Pre-create ALL effect elements so iOS Safari compiles CSS animations
        // and allocates compositor layers BEFORE gameplay starts.
        // Creating new animated DOM elements during gameplay causes a multi-second
        // compositor stall on first use.
        if (this._prewarmed) return; // idempotent — don't duplicate on newGame
        this._prewarmed = true;
        const container = this.effectsContainer;

        // --- Score popup (reusable) ---
        this._scorePopup = document.createElement('div');
        container.appendChild(this._scorePopup);

        // --- Combo/event text (reusable) ---
        this._comboText = document.createElement('div');
        container.appendChild(this._comboText);

        // --- Flash overlay for big clears (reusable) ---
        this._flashOverlay = document.createElement('div');
        container.appendChild(this._flashOverlay);

        // --- Particle pool (reusable, no DOM creation during gameplay) ---
        this._particlePool = [];
        const POOL_SIZE = 24;
        for (let i = 0; i < POOL_SIZE; i++) {
            const p = document.createElement('div');
            p.style.cssText = 'visibility:hidden;';
            container.appendChild(p);
            this._particlePool.push(p);
        }
        this._particleIndex = 0;

        // Force browser to compile all animation keyframes by briefly applying classes
        this._scorePopup.className = 'score-popup';
        this._scorePopup.textContent = '+0';
        this._comboText.className = 'combo-text';
        this._comboText.textContent = 'DOUBLE!';
        this._flashOverlay.className = 'clear-flash-overlay';
        this._particlePool.forEach(p => {
            p.className = 'clear-particle';
            p.style.cssText = 'left:-50px;top:-50px;--tx:10px;--ty:10px;background:red;';
        });

        // Read computed styles to force compilation
        getComputedStyle(this._scorePopup).opacity;
        getComputedStyle(this._comboText).opacity;
        getComputedStyle(this._flashOverlay).opacity;
        if (this._particlePool[0]) getComputedStyle(this._particlePool[0]).opacity;

        // Hide everything after compilation
        requestAnimationFrame(() => {
            this._scorePopup.className = '';
            this._scorePopup.style.cssText = 'visibility:hidden;';
            this._comboText.className = '';
            this._comboText.style.cssText = 'visibility:hidden;';
            this._flashOverlay.className = '';
            this._flashOverlay.style.cssText = 'visibility:hidden;';
            this._particlePool.forEach(p => {
                p.className = '';
                p.style.cssText = 'visibility:hidden;';
            });
        });
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('blockRoyaleHighScore');
            this.highScore = saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            this.highScore = 0;
        }
        this.updateHighScoreDisplay();
    }

    saveHighScore() {
        try {
            localStorage.setItem('blockRoyaleHighScore', this.highScore.toString());
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

    setPieceMode(mode) {
        this.pieceMode = mode === 'single' ? 'single' : 'tray';
        this.fillPieceQueue();
        this.updatePieceTrayUi();
        this.renderPieces();
        this.checkGameOver();
    }

    fillPieceQueue() {
        const queue = this.pieces.filter(Boolean);
        while (queue.length < 3) {
            queue.push(this.getRandomPiece());
        }
        this.pieces = queue.slice(0, 3);
    }

    getVisiblePieces() {
        if (this.pieceMode === 'single') {
            return this.pieces[0] ? [this.pieces[0]] : [];
        }
        return this.pieces.filter(Boolean);
    }

    updatePieceTrayUi() {
        const isSinglePieceMode = this.pieceMode === 'single';

        this.pieceSlotsElement?.classList.toggle('single-piece-mode', isSinglePieceMode);

        if (this.trayLabelElement) {
            this.trayLabelElement.textContent = isSinglePieceMode ? 'Current Piece' : 'Next Pieces';
        }

        if (this.trayHelpElement) {
            this.trayHelpElement.textContent = isSinglePieceMode
                ? 'Place it to reveal the next shape.'
                : 'Place all three to draw a fresh set.';
        }

        if (this.trayBadgeElement) {
            this.trayBadgeElement.textContent = isSinglePieceMode ? '1 at a time' : '3 at a time';
        }
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

        // Cache layout values for line clear particle positioning.
        // This runs BEFORE any game DOM writes, so no layout flush penalty.
        requestAnimationFrame(() => {
            const boardRect = this.boardElement.getBoundingClientRect();
            const gap = parseFloat(getComputedStyle(this.boardElement).gap) || 6;
            const cellSize = (boardRect.width - gap * (this.boardSize - 1)) / this.boardSize;
            this._layoutCache = { boardRect, cellSize, stride: cellSize + gap };
        });
    }

    createParticles() {
        // Disabled — 15 continuously animated elements burn compositor resources
        // on iOS Safari, contributing to first-interaction jank. Re-enable when
        // performance budget allows.
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
        document.addEventListener('touchend', this.handleDragEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.handleDragEnd.bind(this), { passive: false });

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
        const offsetY = isMobile ? stride * 3 : 0;

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
        const offsetY = isMobile ? stride * 3 : 0;

        const shape = this.draggingPiece.shape;
        const pieceW = shape[0].length;
        const pieceH = shape.length;

        // Map finger position (with offset) to grid
        const centerCol = (x - boardRect.left) / stride;
        const centerRow = (y - offsetY - boardRect.top) / stride;

        // If finger is well below the board (back near the tray), cancel placement.
        // Must account for the mobile Y offset (stride * 3) — targeting the bottom
        // row puts the finger well below the board edge.
        const boardBottom = boardRect.top + boardRect.height;
        if (y > boardBottom + stride * 3) {
            this.clearHighlight();
            this.lastValidPosition = null;
            this.lastSnapRow = -1;
            this.lastSnapCol = -1;
            return;
        }

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

        // Line-clear preview: highlight rows/cols that would complete
        if (canPlace) {
            const { rows: clearRows, cols: clearCols } = previewLinesToClear(
                this.board, this.draggingPiece, row, col
            );

            for (const clearRow of clearRows) {
                for (let c = 0; c < this.boardSize; c++) {
                    const cell = this.getCellElement(clearRow, c);
                    if (cell && !cell.classList.contains('preview-piece')) {
                        cell.classList.add('line-clear-preview');
                        this.currentHighlight.push({ cell, addedClass: 'line-clear-preview' });
                    } else if (cell && cell.classList.contains('preview-piece')) {
                        cell.classList.add('line-clear-preview');
                    }
                }
            }

            for (const clearCol of clearCols) {
                for (let r = 0; r < this.boardSize; r++) {
                    const cell = this.getCellElement(r, clearCol);
                    if (cell && !cell.classList.contains('preview-piece')) {
                        cell.classList.add('line-clear-preview');
                        this.currentHighlight.push({ cell, addedClass: 'line-clear-preview' });
                    } else if (cell && cell.classList.contains('preview-piece')) {
                        cell.classList.add('line-clear-preview');
                    }
                }
            }
        }
    }

    clearHighlight() {
        for (let i = 0; i < this.currentHighlight.length; i++) {
            const { cell, addedClass } = this.currentHighlight[i];
            cell.classList.remove('highlight', 'invalid', 'preview-piece', 'line-clear-preview');
            // Only remove color from non-placed cells — placed blocks keep their color
            if (addedClass && addedClass !== 'line-clear-preview' && !cell.classList.contains('filled')) {
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
        if (this.pieceMode === 'single') {
            this.fillPieceQueue();
            this.renderPieces();
        } else if (this.pieces.every(p => p === null)) {
            this.generateNewPieces();
        } else {
            this.renderPieces();
        }

        this.checkAndClearLines();
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

            // Use cached layout values — NO DOM reads allowed here.
            // Any getBoundingClientRect/getComputedStyle after placePiece's DOM writes
            // forces iOS Safari to flush a synchronous paint, showing the complete row
            // before the clearing animation starts (multi-second stall on first clear).
            const cache = this.dragCache || this._layoutCache;
            const boardRect = cache.boardRect;
            const cellSize = cache.cellSize;
            const stride = cache.stride;

            const clearData = [];
            cellsToClear.forEach(key => {
                const [row, col] = key.split('-').map(Number);
                const cell = this.getCellElement(row, col);
                const color = this.board[row][col];
                const centerX = boardRect.left + col * stride + cellSize / 2;
                const centerY = boardRect.top + row * stride + cellSize / 2;
                clearData.push({ cell, color, centerX, centerY });
            });

            // Update board data
            clearCells(this.board, cellsToClear);

            // Cell clearing animation
            for (const { cell } of clearData) {
                cell.classList.add('clearing');
            }

            // Emit particles from pool (no DOM creation)
            for (const { centerX, centerY, color } of clearData) {
                const hex = this.colorHex[color] || '#FFFFFF';
                this.emitParticles(centerX, centerY, hex, 2);
            }

            // Score
            const totalScore = calculateClearScore(cellsToClear.size, totalLines);
            this.addScore(totalScore);
            this.showScorePopup(totalScore);

            // Tiered effects based on clear size
            const isCross = rows.length > 0 && cols.length > 0;

            if (isCross) {
                // Row + column cleared in same move
                this.showComboText('CROSS!');
                this.shakeBoard(5, 250);
                this.showFlashOverlay('var(--accent-teal)', 250);
            } else if (totalLines >= 4) {
                this.showComboText('MEGA!');
                this.shakeBoard(8, 350);
                this.showFlashOverlay('var(--accent-orange)', 350);
            } else if (totalLines === 3) {
                this.showComboText('TRIPLE!');
                this.shakeBoard(5, 250);
            } else if (totalLines === 2) {
                this.showComboText('DOUBLE!');
                this.shakeBoard(3, 150);
            }
            // Single line: just the cell flash + particles, no combo text

            // Check for board clear (all cells empty after this clear)
            const boardEmpty = this.board.every(row => row.every(cell => !cell));
            if (boardEmpty) {
                this.showComboText('PERFECT!');
                this.shakeBoard(10, 500);
                this.showFlashOverlay('white', 400);
            }

            // Visual cleanup after animation
            setTimeout(() => {
                for (const { cell } of clearData) {
                    cell.className = 'cell';
                }
            }, 200);
        }
    }

    generateNewPieces() {
        this.pieces = [this.getRandomPiece(), this.getRandomPiece(), this.getRandomPiece()];
        this.renderPieces();
    }

    getRandomPiece() {
        const shapes = this.getShapes();
        const shapeData = shapes[Math.floor(Math.random() * shapes.length)];
        const colors = this.colors;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return {
            shape: shapeData.shape,
            name: 'piece',
            color: color
        };
    }

    getShapes() {
        return [
            // Singles & lines
            { shape: [[1]], name: '1x1' },
            { shape: [[1, 1]], name: '1x2_h' },
            { shape: [[1], [1]], name: '1x2_v' },
            { shape: [[1, 1, 1]], name: '1x3_h' },
            { shape: [[1], [1], [1]], name: '1x3_v' },
            { shape: [[1, 1, 1, 1]], name: '1x4_h' },
            { shape: [[1], [1], [1], [1]], name: '1x4_v' },
            { shape: [[1, 1, 1, 1, 1]], name: '1x5_h' },
            { shape: [[1], [1], [1], [1], [1]], name: '1x5_v' },

            // Squares
            { shape: [[1, 1], [1, 1]], name: '2x2' },
            { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], name: '3x3' },

            // Rectangles
            { shape: [[1, 1, 1], [1, 1, 1]], name: '2x3_h' },
            { shape: [[1, 1], [1, 1], [1, 1]], name: '2x3_v' },

            // L-shapes (small — 2x2, all 4 orientations)
            { shape: [[1, 1], [1, 0]], name: 'L2_a' },
            { shape: [[1, 0], [1, 1]], name: 'L2_b' },
            { shape: [[0, 1], [1, 1]], name: 'L2_c' },
            { shape: [[1, 1], [0, 1]], name: 'L2_d' },

            // L-shapes (large — 3 cells long, all 4 orientations)
            { shape: [[1, 1, 1], [1, 0, 0]], name: 'L3_a' },
            { shape: [[1, 1, 1], [0, 0, 1]], name: 'L3_b' },
            { shape: [[1, 0], [1, 0], [1, 1]], name: 'L3_c' },
            { shape: [[0, 1], [0, 1], [1, 1]], name: 'L3_d' },
            { shape: [[1, 0, 0], [1, 1, 1]], name: 'L3_e' },
            { shape: [[0, 0, 1], [1, 1, 1]], name: 'L3_f' },
            { shape: [[1, 1], [0, 1], [0, 1]], name: 'L3_g' },
            { shape: [[1, 1], [1, 0], [1, 0]], name: 'L3_h' },

            // T-shapes (all 4 orientations)
            { shape: [[1, 1, 1], [0, 1, 0]], name: 'T_up' },
            { shape: [[0, 1, 0], [1, 1, 1]], name: 'T_down' },
            { shape: [[1, 0], [1, 1], [1, 0]], name: 'T_right' },
            { shape: [[0, 1], [1, 1], [0, 1]], name: 'T_left' },

            // S/Z shapes (both orientations)
            { shape: [[1, 1, 0], [0, 1, 1]], name: 'S_h' },
            { shape: [[0, 1, 1], [1, 1, 0]], name: 'Z_h' },
            { shape: [[0, 1], [1, 1], [1, 0]], name: 'S_v' },
            { shape: [[1, 0], [1, 1], [0, 1]], name: 'Z_v' },
        ];
    }

    renderPieces() {
        const slots = this.pieceSlotsElement.querySelectorAll('.piece-slot');
        const isSinglePieceMode = this.pieceMode === 'single';

        slots.forEach((slot, index) => {
            const hideSlot = isSinglePieceMode && index > 0;
            slot.classList.toggle('is-hidden-slot', hideSlot);
            slot.classList.toggle('is-primary-slot', isSinglePieceMode && index === 0);
            slot.setAttribute('aria-hidden', hideSlot ? 'true' : 'false');
            slot.innerHTML = '';

            if (hideSlot) return;

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
    }

    updateScore() {
        this.scoreElement.textContent = this.score.toLocaleString();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScoreDisplay();
        }
    }

    // Get a particle from the pool (cycles through, reusing oldest)
    _getParticle() {
        const p = this._particlePool[this._particleIndex];
        this._particleIndex = (this._particleIndex + 1) % this._particlePool.length;
        return p;
    }

    // Emit particles at a position using the pre-created pool
    emitParticles(centerX, centerY, hex, count = 2) {
        for (let i = 0; i < count; i++) {
            const p = this._getParticle();
            if (!p) continue;
            const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5);
            const dist = 25 + Math.random() * 35;
            p.className = '';
            p.offsetWidth; // force reflow to restart animation
            p.style.cssText = `left:${centerX}px;top:${centerY}px;background:${hex};--tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;`;
            p.className = 'clear-particle';
            setTimeout(() => {
                p.style.cssText = 'visibility:hidden;';
                p.className = '';
            }, 700);
        }
    }

    // Screen shake effect
    shakeBoard(intensity = 4, duration = 200) {
        const board = this.boardElement.parentElement; // board-frame
        const start = performance.now();
        const shake = () => {
            const elapsed = performance.now() - start;
            if (elapsed > duration) {
                board.style.transform = '';
                return;
            }
            const decay = 1 - elapsed / duration;
            const x = (Math.random() - 0.5) * intensity * decay;
            const y = (Math.random() - 0.5) * intensity * decay;
            board.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };
        requestAnimationFrame(shake);
    }

    // Flash overlay for big clears
    showFlashOverlay(color = 'white', duration = 300) {
        const el = this._flashOverlay;
        if (!el) return;
        el.className = '';
        el.offsetWidth;
        el.style.cssText = `--flash-color:${color};--flash-duration:${duration}ms;`;
        el.className = 'clear-flash-overlay';
        setTimeout(() => {
            el.style.cssText = 'visibility:hidden;';
            el.className = '';
        }, duration);
    }

    showScorePopup(score) {
        const el = this._scorePopup;
        if (!el) return;
        const cache = this.dragCache || this._layoutCache;
        if (!cache) return;

        // Reset animation by removing class, forcing reflow, re-adding
        el.className = '';
        el.offsetWidth; // force reflow to restart animation
        el.textContent = `+${score}`;
        el.style.cssText = `left:${cache.boardRect.left + cache.boardRect.width / 2}px;top:${cache.boardRect.top + cache.boardRect.height / 2}px;`;
        el.className = 'score-popup';

        // Hide after animation completes
        setTimeout(() => {
            el.style.cssText = 'visibility:hidden;';
            el.className = '';
        }, 800);
    }

    showComboText(text) {
        const el = this._comboText;
        if (!el) return;

        el.className = '';
        el.offsetWidth; // force reflow to restart animation
        el.textContent = String(text);
        el.style.cssText = '';
        el.className = 'combo-text';

        setTimeout(() => {
            el.style.cssText = 'visibility:hidden;';
            el.className = '';
        }, 700);
    }

    checkGameOver() {
        const availablePieces = this.getVisiblePieces();

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

        // Switch to game over screen colours
        document.documentElement.classList.remove('screen-game');
        document.documentElement.classList.add('screen-gameover');
        const cBg = document.querySelector('.cosmic-bg');
        if (cBg) { cBg.classList.remove('bg-game'); cBg.classList.add('bg-gameover'); }
        const m1 = document.querySelector('meta[name="theme-color"]');
        if (m1) m1.remove();
        const m1n = document.createElement('meta');
        m1n.name = 'theme-color'; m1n.content = '#F3E3C5';
        document.head.appendChild(m1n);
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
                if (index === 0) {
                    rankEl.innerHTML = '<span class="icon" style="color: #facc15;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9A6 6 0 0018 9V4H6V9z"/><path d="M6 5H4a1 1 0 00-1 1v1.5A3.5 3.5 0 006.5 11H7"/><path d="M18 5h2a1 1 0 011 1v1.5A3.5 3.5 0 0117.5 11H17"/><line x1="12" y1="15" x2="12" y2="18"/><path d="M8 21h8"/><path d="M8 21l1-3h6l1 3"/></svg></span>';
                } else {
                    rankEl.textContent = `#${index + 1}`;
                }

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

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseModal.classList.toggle('active', this.isPaused);
    }

    newGame(keepScore = false) {
        this.board = [];
        if (!keepScore) this.score = 0;
        this.pieces = [null, null, null];
        this.isGameOver = false;
        this.isPaused = false;

        this.gameOverModal.classList.remove('active');
        this.pauseModal.classList.remove('active');
        this.newHighScoreElement.classList.remove('show');

        // Restore game screen colours
        document.documentElement.classList.remove('screen-gameover');
        document.documentElement.classList.add('screen-game');
        const cBg2 = document.querySelector('.cosmic-bg');
        if (cBg2) { cBg2.classList.remove('bg-gameover'); cBg2.classList.add('bg-game'); }
        const m2 = document.querySelector('meta[name="theme-color"]');
        if (m2) m2.remove();
        const m2n = document.createElement('meta');
        m2n.name = 'theme-color'; m2n.content = '#F3E3C5';
        document.head.appendChild(m2n);

        this.createBoard();
        this.generateNewPieces();
        this.updateScore();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    const startHighScore = document.getElementById('startHighScore');
    const privacyModal = document.getElementById('privacyModal');

    // Load high score for start screen display
    try {
        const saved = localStorage.getItem('blockRoyaleHighScore');
        if (saved && startHighScore) startHighScore.textContent = parseInt(saved, 10).toLocaleString();
    } catch (e) {}

    // Settings state
    const settings = {
        sound: localStorage.getItem('blockRoyaleSound') !== 'false',
        haptics: localStorage.getItem('blockRoyaleHaptics') !== 'false',
        pieceMode: localStorage.getItem('blockRoyalePieceMode') === 'single' ? 'single' : 'tray',
    };

    const cosmicBg = document.querySelector('.cosmic-bg');
    const themeMetaTag = document.querySelector('meta[name="theme-color"]');

    function setScreenBg(screen) {
        const root = document.documentElement;
        root.classList.remove('screen-game', 'screen-gameover');
        cosmicBg.classList.remove('bg-game', 'bg-gameover');

        let color = '#F3E3C5';
        if (screen === 'game') {
            root.classList.add('screen-game');
            cosmicBg.classList.add('bg-game');
        } else if (screen === 'gameover') {
            root.classList.add('screen-gameover');
            cosmicBg.classList.add('bg-gameover');
        }

        // Force Safari to update browser chrome by removing and re-inserting theme-color
        const old = document.querySelector('meta[name="theme-color"]');
        if (old) old.remove();
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = color;
        document.head.appendChild(meta);
    }

    function showStartScreen() {
        startScreen.classList.remove('hidden');
        gameContainer.style.display = 'none';
        setScreenBg('start');

        // Update high score on start screen
        try {
            const saved = localStorage.getItem('blockRoyaleHighScore');
            if (saved && startHighScore) startHighScore.textContent = parseInt(saved, 10).toLocaleString();
        } catch (e) {}
    }

    function startGame() {
        // Init and unlock audio on this user gesture (must happen synchronously within tap)
        if (window.game && window.game.sound) {
            window.game.sound.init();
            // _unlock() was called by init(), now play feedback tone
            window.game.sound.play('button');
        }

        startScreen.classList.add('hidden');
        gameContainer.style.display = 'flex';
        setScreenBg('game');

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
    window.game = new BlockRoyale();

    // Lightweight hooks for smoke testing and release verification.
    window.render_game_to_text = () => {
        const visiblePieces = window.game?.getVisiblePieces?.() ?? [];
        const totalQueuedPieces = window.game?.pieces?.filter(Boolean).length ?? 0;

        return JSON.stringify({
            screen: startScreen.classList.contains('hidden') ? 'game' : 'start',
            score: window.game?.score ?? 0,
            highScore: window.game?.highScore ?? 0,
            pieceMode: window.game?.pieceMode ?? 'tray',
            piecesRemaining: visiblePieces.length,
            hiddenQueueCount: Math.max(0, totalQueuedPieces - visiblePieces.length),
            pieces: visiblePieces.map(piece => piece ? {
                color: piece.color,
                rows: piece.shape.length,
                cols: piece.shape[0].length
            } : null),
            boardTopRows: (window.game?.board ?? []).slice(0, 3).map(row => row.map(cell => cell ? cell[0] : '.').join('')),
            modals: {
                pause: window.game?.pauseModal?.classList.contains('active') ?? false,
                gameOver: window.game?.gameOverModal?.classList.contains('active') ?? false,
                leaderboard: window.game?.leaderboardModal?.classList.contains('active') ?? false,
                settings: document.getElementById('settingsModal')?.classList.contains('active') ?? false,
                privacy: privacyModal?.classList.contains('active') ?? false,
            }
        });
    };
    window.advanceTime = (ms = 16) => new Promise(resolve => setTimeout(resolve, ms));

    // Apply saved settings
    window.game.sound.enabled = settings.sound;
    window.game.hapticsEnabled = settings.haptics;
    window.game.setPieceMode(settings.pieceMode);

    // Hide game container on load (start screen is visible)
    gameContainer.style.display = 'none';

    // Play button
    document.getElementById('playBtn').addEventListener('click', startGame);

    // Home button → back to start screen
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.game.sound.play('button');
            window.game.gameOverModal.classList.remove('active');
            window.game.isGameOver = false;
            showStartScreen();
        });
    }

    // Leaderboard from start screen
    document.getElementById('startLeaderboardBtn').addEventListener('click', () => {
        window.game.showLeaderboard();
    });

    const settingsModal = document.getElementById('settingsModal');
    const openSettings = ({ resumeGame = false } = {}) => {
        if (resumeGame && window.game) {
            window.game.isPaused = false;
            window.game.pauseModal.classList.remove('active');
        }
        settingsModal.classList.add('active');
    };

    // Settings from start screen
    document.getElementById('startSettingsBtn').addEventListener('click', () => {
        openSettings();
    });

    // Settings from pause menu
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.game.sound.play('button');
            openSettings({ resumeGame: true });
        });
    }

    // Close settings
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
    if (privacyPolicyBtn && privacyModal) {
        privacyPolicyBtn.addEventListener('click', () => {
            window.game.sound.play('button');
            privacyModal.classList.add('active');
        });
    }

    const closePrivacyBtn = document.getElementById('closePrivacyBtn');
    if (closePrivacyBtn && privacyModal) {
        closePrivacyBtn.addEventListener('click', () => {
            privacyModal.classList.remove('active');
        });
    }

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

    // Single-piece draw toggle
    const pieceModeToggle = document.getElementById('pieceModeToggle');
    const syncPieceModeToggle = () => {
        const isSinglePieceMode = settings.pieceMode === 'single';
        pieceModeToggle.classList.toggle('active', isSinglePieceMode);
        pieceModeToggle.setAttribute('aria-pressed', String(isSinglePieceMode));
    };
    syncPieceModeToggle();
    pieceModeToggle.addEventListener('click', () => {
        settings.pieceMode = settings.pieceMode === 'single' ? 'tray' : 'single';
        syncPieceModeToggle();
        window.game.setPieceMode(settings.pieceMode);
        localStorage.setItem('blockRoyalePieceMode', settings.pieceMode);
    });

    // Clear data — uses confirm modal instead of native confirm()
    const confirmModal = document.getElementById('confirmModal');
    const confirmYesBtn = document.getElementById('confirmYes');
    const confirmNoBtn = document.getElementById('confirmNo');

    document.getElementById('clearDataBtn').addEventListener('click', () => {
        confirmModal.classList.add('active');
    });

    confirmNoBtn.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });

    confirmYesBtn.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        localStorage.removeItem('blockRoyaleHighScore');
        localStorage.removeItem('blockRoyaleLeaderboard');
        localStorage.removeItem('blockRoyaleTutorialDone');
        localStorage.removeItem('blockRoyaleSound');
        localStorage.removeItem('blockRoyaleHaptics');
        localStorage.removeItem('blockRoyalePieceMode');
        settings.sound = true;
        settings.haptics = true;
        settings.pieceMode = 'tray';
        soundToggle.classList.add('active');
        hapticsToggle.classList.add('active');
        syncPieceModeToggle();
        window.game.sound.enabled = true;
        window.game.hapticsEnabled = true;
        window.game.setPieceMode(settings.pieceMode);
        window.game.highScore = 0;
        window.game.updateHighScoreDisplay();
        window.game.leaderboard.clearScores();
        if (startHighScore) startHighScore.textContent = '0';
        document.getElementById('settingsModal').classList.remove('active');
    });

    // =====================================================
    // TUTORIAL — ANIMATED HAND
    // =====================================================
    function showTutorial() {
        const el = document.createElement('div');
        el.className = 'tutorial-overlay';
        el.innerHTML = `
            <div class="tutorial-hand"><svg viewBox="0 0 48 48" width="64" height="64" fill="none">
                <defs>
                    <linearGradient id="cursorGrad" x1="0" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stop-color="#fb923c"/>
                        <stop offset="100%" stop-color="#2dd4bf"/>
                    </linearGradient>
                    <filter id="cursorGlow">
                        <feGaussianBlur stdDeviation="1.5" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <g filter="url(#cursorGlow)">
                    <path d="M14 6l20 16-10 2 6 14-5 2-6-14-5 10z"
                          fill="url(#cursorGrad)" stroke="white" stroke-width="1.5"
                          stroke-linejoin="round"/>
                </g>
            </svg></div>
            <div class="tutorial-hint">Drag pieces onto the board</div>
            <div class="tutorial-tap-hint">Tap to skip</div>
        `;
        document.body.appendChild(el);

        requestAnimationFrame(() => el.classList.add('visible'));

        function dismiss() {
            localStorage.setItem('blockRoyaleTutorialDone', 'true');
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 300);
        }

        el.addEventListener('click', dismiss);
        // Auto-dismiss after 3 animation loops (2.4s each)
        setTimeout(dismiss, 7200);
    }
});

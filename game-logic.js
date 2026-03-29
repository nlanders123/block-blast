/**
 * Block Royale — Pure Game Logic
 *
 * All functions here are pure (no DOM, no side effects).
 * Used by BlockBlast class for gameplay, and by Jest for testing.
 */

/**
 * Create an empty board (2D array of nulls).
 */
function createEmptyBoard(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

/**
 * Check if a piece can be placed at (startRow, startCol) on the board.
 * Returns true if every filled cell in the shape maps to an empty, in-bounds cell.
 */
function canPlacePiece(board, piece, startRow, startCol) {
    const boardSize = board.length;
    const shape = piece.shape;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const row = startRow + r;
                const col = startCol + c;

                if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
                    return false;
                }

                if (board[row][col] !== null) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Place a piece on the board, mutating the board array.
 * Returns the number of blocks placed (for scoring).
 * Assumes canPlacePiece has already been checked.
 */
function placePieceOnBoard(board, piece, startRow, startCol) {
    const shape = piece.shape;
    const color = piece.color;
    let blockCount = 0;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                board[startRow + r][startCol + c] = color;
                blockCount++;
            }
        }
    }

    return blockCount;
}

/**
 * Find all complete rows and columns on the board.
 * Returns { rows: number[], cols: number[], cellsToClear: Set<string> }
 * where cellsToClear contains "row-col" keys.
 */
function findLinesToClear(board) {
    const boardSize = board.length;
    const rows = [];
    const cols = [];

    for (let row = 0; row < boardSize; row++) {
        if (board[row].every(cell => cell !== null)) {
            rows.push(row);
        }
    }

    for (let col = 0; col < boardSize; col++) {
        let full = true;
        for (let row = 0; row < boardSize; row++) {
            if (board[row][col] === null) {
                full = false;
                break;
            }
        }
        if (full) cols.push(col);
    }

    const cellsToClear = new Set();
    rows.forEach(row => {
        for (let col = 0; col < boardSize; col++) {
            cellsToClear.add(`${row}-${col}`);
        }
    });
    cols.forEach(col => {
        for (let row = 0; row < boardSize; row++) {
            cellsToClear.add(`${row}-${col}`);
        }
    });

    return { rows, cols, cellsToClear };
}

/**
 * Clear the identified cells from the board (set to null).
 */
function clearCells(board, cellsToClear) {
    cellsToClear.forEach(key => {
        const [row, col] = key.split('-').map(Number);
        board[row][col] = null;
    });
}

/**
 * Calculate score for a line clear.
 * Base: 10 points per cell cleared.
 * Combo bonus: 50 per line if more than 1 line cleared simultaneously.
 */
function calculateClearScore(cellCount, lineCount) {
    const baseScore = cellCount * 10;
    const comboBonus = lineCount > 1 ? lineCount * 50 : 0;
    return baseScore + comboBonus;
}

/**
 * Check if any of the given pieces can be placed anywhere on the board.
 * Returns true if at least one piece has a valid placement.
 */
function hasValidMove(board, pieces) {
    const boardSize = board.length;

    for (const piece of pieces) {
        if (!piece) continue;
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (canPlacePiece(board, piece, row, col)) {
                    return true;
                }
            }
        }
    }

    return false;
}

// CommonJS exports for Jest (game.js uses these via the global scope in-browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createEmptyBoard,
        canPlacePiece,
        placePieceOnBoard,
        findLinesToClear,
        clearCells,
        calculateClearScore,
        hasValidMove,
    };
}

const {
    createEmptyBoard,
    canPlacePiece,
    placePieceOnBoard,
    findLinesToClear,
    clearCells,
    calculateClearScore,
    hasValidMove,
} = require('../game-logic');

// Helper: create a piece object
function piece(shape, color = 'blue') {
    return { shape, color };
}

describe('createEmptyBoard', () => {
    test('creates an 8x8 board of nulls', () => {
        const board = createEmptyBoard(8);
        expect(board).toHaveLength(8);
        expect(board[0]).toHaveLength(8);
        expect(board.flat().every(cell => cell === null)).toBe(true);
    });

    test('creates a custom-sized board', () => {
        const board = createEmptyBoard(4);
        expect(board).toHaveLength(4);
        expect(board[0]).toHaveLength(4);
    });

    test('rows are independent (modifying one does not affect others)', () => {
        const board = createEmptyBoard(4);
        board[0][0] = 'red';
        expect(board[1][0]).toBeNull();
    });
});

describe('canPlacePiece', () => {
    test('1x1 piece fits on empty board at (0,0)', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1]]), 0, 0)).toBe(true);
    });

    test('1x1 piece fits on empty board at (7,7)', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1]]), 7, 7)).toBe(true);
    });

    test('1x1 piece out of bounds at (8,0)', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1]]), 8, 0)).toBe(false);
    });

    test('1x1 piece out of bounds at (-1,0)', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1]]), -1, 0)).toBe(false);
    });

    test('horizontal 3-piece fits at (0,0)', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1, 1, 1]]), 0, 0)).toBe(true);
    });

    test('horizontal 3-piece overflows right edge', () => {
        const board = createEmptyBoard(8);
        // 3-wide at col 5 → cols 5,6,7 = fits
        expect(canPlacePiece(board, piece([[1, 1, 1]]), 0, 5)).toBe(true);
        // 3-wide at col 6 → cols 6,7,8 = col 8 out of bounds
        expect(canPlacePiece(board, piece([[1, 1, 1]]), 0, 6)).toBe(false);
    });

    test('vertical 3-piece overflows bottom edge', () => {
        const board = createEmptyBoard(8);
        // 3-tall at row 5 → rows 5,6,7 = fits
        expect(canPlacePiece(board, piece([[1], [1], [1]]), 5, 0)).toBe(true);
        // 3-tall at row 6 → rows 6,7,8 = row 8 out of bounds
        expect(canPlacePiece(board, piece([[1], [1], [1]]), 6, 0)).toBe(false);
    });

    test('L-shape blocked by occupied cell', () => {
        const board = createEmptyBoard(8);
        board[1][0] = 'red'; // Block the second row of the L
        const lShape = piece([[1, 0], [1, 0], [1, 1]]);
        expect(canPlacePiece(board, lShape, 0, 0)).toBe(false);
    });

    test('L-shape fits when occupied cell is in a gap', () => {
        const board = createEmptyBoard(8);
        board[0][1] = 'red'; // Cell at (0,1) — the L has a 0 there
        const lShape = piece([[1, 0], [1, 0], [1, 1]]);
        expect(canPlacePiece(board, lShape, 0, 0)).toBe(true);
    });

    test('2x2 piece blocked by single occupied cell', () => {
        const board = createEmptyBoard(8);
        board[3][4] = 'green';
        expect(canPlacePiece(board, piece([[1, 1], [1, 1]]), 3, 3)).toBe(false);
    });

    test('3x3 piece at bottom-right corner', () => {
        const board = createEmptyBoard(8);
        expect(canPlacePiece(board, piece([[1, 1, 1], [1, 1, 1], [1, 1, 1]]), 5, 5)).toBe(true);
        expect(canPlacePiece(board, piece([[1, 1, 1], [1, 1, 1], [1, 1, 1]]), 6, 5)).toBe(false);
    });
});

describe('placePieceOnBoard', () => {
    test('places a 1x1 piece and returns block count', () => {
        const board = createEmptyBoard(8);
        const count = placePieceOnBoard(board, piece([[1]], 'red'), 3, 4);
        expect(count).toBe(1);
        expect(board[3][4]).toBe('red');
    });

    test('places a 2x2 piece correctly', () => {
        const board = createEmptyBoard(8);
        const count = placePieceOnBoard(board, piece([[1, 1], [1, 1]], 'cyan'), 0, 0);
        expect(count).toBe(4);
        expect(board[0][0]).toBe('cyan');
        expect(board[0][1]).toBe('cyan');
        expect(board[1][0]).toBe('cyan');
        expect(board[1][1]).toBe('cyan');
    });

    test('L-shape only fills the 1-cells', () => {
        const board = createEmptyBoard(8);
        const lShape = piece([[1, 0], [1, 0], [1, 1]], 'orange');
        const count = placePieceOnBoard(board, lShape, 2, 3);
        expect(count).toBe(4);
        expect(board[2][3]).toBe('orange');
        expect(board[2][4]).toBeNull(); // The 0 in the shape
        expect(board[3][3]).toBe('orange');
        expect(board[3][4]).toBeNull();
        expect(board[4][3]).toBe('orange');
        expect(board[4][4]).toBe('orange');
    });
});

describe('findLinesToClear', () => {
    test('no lines to clear on empty board', () => {
        const board = createEmptyBoard(8);
        const result = findLinesToClear(board);
        expect(result.rows).toHaveLength(0);
        expect(result.cols).toHaveLength(0);
        expect(result.cellsToClear.size).toBe(0);
    });

    test('detects a full row', () => {
        const board = createEmptyBoard(8);
        for (let c = 0; c < 8; c++) board[3][c] = 'blue';
        const result = findLinesToClear(board);
        expect(result.rows).toEqual([3]);
        expect(result.cols).toHaveLength(0);
        expect(result.cellsToClear.size).toBe(8);
    });

    test('detects a full column', () => {
        const board = createEmptyBoard(8);
        for (let r = 0; r < 8; r++) board[r][5] = 'red';
        const result = findLinesToClear(board);
        expect(result.rows).toHaveLength(0);
        expect(result.cols).toEqual([5]);
        expect(result.cellsToClear.size).toBe(8);
    });

    test('detects simultaneous row and column (combo)', () => {
        const board = createEmptyBoard(8);
        // Fill row 3
        for (let c = 0; c < 8; c++) board[3][c] = 'blue';
        // Fill column 5
        for (let r = 0; r < 8; r++) board[r][5] = 'red';
        const result = findLinesToClear(board);
        expect(result.rows).toEqual([3]);
        expect(result.cols).toEqual([5]);
        // 8 (row) + 8 (col) - 1 (overlap at 3,5) = 15
        expect(result.cellsToClear.size).toBe(15);
    });

    test('detects multiple rows', () => {
        const board = createEmptyBoard(8);
        for (let c = 0; c < 8; c++) {
            board[0][c] = 'green';
            board[7][c] = 'purple';
        }
        const result = findLinesToClear(board);
        expect(result.rows).toEqual([0, 7]);
        expect(result.cellsToClear.size).toBe(16);
    });

    test('incomplete row is not cleared', () => {
        const board = createEmptyBoard(8);
        for (let c = 0; c < 7; c++) board[3][c] = 'blue'; // 7 of 8
        const result = findLinesToClear(board);
        expect(result.rows).toHaveLength(0);
    });
});

describe('clearCells', () => {
    test('clears identified cells from the board', () => {
        const board = createEmptyBoard(8);
        for (let c = 0; c < 8; c++) board[2][c] = 'red';
        const { cellsToClear } = findLinesToClear(board);
        clearCells(board, cellsToClear);
        expect(board[2].every(cell => cell === null)).toBe(true);
    });

    test('does not affect other cells', () => {
        const board = createEmptyBoard(8);
        for (let c = 0; c < 8; c++) board[2][c] = 'red';
        board[3][0] = 'blue';
        const { cellsToClear } = findLinesToClear(board);
        clearCells(board, cellsToClear);
        expect(board[3][0]).toBe('blue');
    });
});

describe('calculateClearScore', () => {
    test('single row clear: 8 cells * 10 = 80', () => {
        expect(calculateClearScore(8, 1)).toBe(80);
    });

    test('single column clear: same as row', () => {
        expect(calculateClearScore(8, 1)).toBe(80);
    });

    test('double clear: base + combo bonus', () => {
        // 15 unique cells, 2 lines
        expect(calculateClearScore(15, 2)).toBe(15 * 10 + 2 * 50);
    });

    test('triple clear: higher combo bonus', () => {
        expect(calculateClearScore(22, 3)).toBe(22 * 10 + 3 * 50);
    });

    test('no combo bonus for single line', () => {
        expect(calculateClearScore(8, 1)).toBe(80);
    });
});

describe('hasValidMove', () => {
    test('always has moves on empty board', () => {
        const board = createEmptyBoard(8);
        const pieces = [piece([[1, 1, 1]])];
        expect(hasValidMove(board, pieces)).toBe(true);
    });

    test('no moves when board is full', () => {
        const board = createEmptyBoard(8);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                board[r][c] = 'red';
            }
        }
        expect(hasValidMove(board, [piece([[1]])])).toBe(false);
    });

    test('no moves when remaining piece cannot fit', () => {
        const board = createEmptyBoard(8);
        // Fill everything except (7,7)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r !== 7 || c !== 7) board[r][c] = 'red';
            }
        }
        // A 1x2 piece won't fit in a single empty cell
        expect(hasValidMove(board, [piece([[1, 1]])])).toBe(false);
        // But a 1x1 will
        expect(hasValidMove(board, [piece([[1]])])).toBe(true);
    });

    test('skips null pieces in the array', () => {
        const board = createEmptyBoard(8);
        expect(hasValidMove(board, [null, null, piece([[1]])])).toBe(true);
    });

    test('returns false for all-null pieces', () => {
        const board = createEmptyBoard(8);
        expect(hasValidMove(board, [null, null, null])).toBe(false);
    });

    test('detects when only one of three pieces can fit', () => {
        const board = createEmptyBoard(8);
        // Fill all but bottom-right 1x1
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r !== 7 || c !== 7) board[r][c] = 'red';
            }
        }
        const pieces = [
            piece([[1, 1, 1]]),  // can't fit
            piece([[1, 1], [1, 1]]),  // can't fit
            piece([[1]]),  // fits at (7,7)
        ];
        expect(hasValidMove(board, pieces)).toBe(true);
    });
});

describe('integration: place + clear + score', () => {
    test('filling a row triggers a clear', () => {
        const board = createEmptyBoard(8);
        // Fill 7 cells of row 0
        for (let c = 0; c < 7; c++) board[0][c] = 'blue';
        // Place the 8th cell
        placePieceOnBoard(board, piece([[1]], 'red'), 0, 7);
        const { rows, cellsToClear } = findLinesToClear(board);
        expect(rows).toEqual([0]);
        const score = calculateClearScore(cellsToClear.size, rows.length);
        expect(score).toBe(80);
        clearCells(board, cellsToClear);
        expect(board[0].every(cell => cell === null)).toBe(true);
    });

    test('simultaneous row + column clear', () => {
        const board = createEmptyBoard(8);
        // Fill row 4 (leave col 2 empty)
        for (let c = 0; c < 8; c++) {
            if (c !== 2) board[4][c] = 'blue';
        }
        // Fill col 2 (leave row 4 empty — it'll be filled by the piece)
        for (let r = 0; r < 8; r++) {
            if (r !== 4) board[r][2] = 'green';
        }
        // Place the intersection piece at (4, 2)
        placePieceOnBoard(board, piece([[1]], 'red'), 4, 2);
        const { rows, cols, cellsToClear } = findLinesToClear(board);
        expect(rows).toEqual([4]);
        expect(cols).toEqual([2]);
        expect(cellsToClear.size).toBe(15); // 8 + 8 - 1 overlap
        const score = calculateClearScore(cellsToClear.size, rows.length + cols.length);
        expect(score).toBe(15 * 10 + 2 * 50); // 250
    });
});

class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevels = 50;
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = [];
        for (let i = 1; i <= this.maxLevels; i++) {
            levels.push({
                id: i,
                targetScore: 500 * Math.pow(1.1, i - 1), // Exponential score target
                obstacleCount: Math.min(Math.floor(i / 3), 12), // Slowly increase obstacles
                obstaclePattern: this.getPatternForLevel(i)
            });
        }
        return levels;
    }

    getPatternForLevel(level) {
        const boardSize = 8;
        const patterns = [];

        // predefined patterns
        const corners = [{ r: 0, c: 0 }, { r: 0, c: 7 }, { r: 7, c: 0 }, { r: 7, c: 7 }];
        const center = [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }];

        // 1. Cross Pattern (Plus sign in middle)
        const cross = [
            { r: 2, c: 3 }, { r: 2, c: 4 },
            { r: 3, c: 2 }, { r: 3, c: 5 },
            { r: 4, c: 2 }, { r: 4, c: 5 },
            { r: 5, c: 3 }, { r: 5, c: 4 }
        ];

        // 2. Checkerboard (inner 4x4)
        const checkerboard = [
            { r: 2, c: 2 }, { r: 2, c: 4 },
            { r: 3, c: 3 }, { r: 3, c: 5 },
            { r: 4, c: 2 }, { r: 4, c: 4 },
            { r: 5, c: 3 }, { r: 5, c: 5 }
        ];

        // 3. Frame (Outer ring gaps)
        const frame = [
            { r: 1, c: 1 }, { r: 1, c: 6 }, { r: 6, c: 1 }, { r: 6, c: 6 },
            { r: 2, c: 2 }, { r: 2, c: 5 }, { r: 5, c: 2 }, { r: 5, c: 5 }
        ];

        // Determine pattern based on level
        if (level <= 2) return []; // Tutorial levels

        const patternType = level % 10;

        switch (patternType) {
            case 3: return corners;
            case 4: return center;
            case 5: return cross; // Challenge level
            case 6: return [...corners, ...center];
            case 7: return frame;
            case 8: return checkerboard;
            case 9: return this.shatterPattern(); // Random scattered
            case 0: return [...cross, ...corners]; // Boss level (10, 20, 30...)
            default: return corners; // Default fallback
        }
    }

    shatterPattern() {
        // Randomly scatter 4-8 obstacles away from center
        const obstacles = [];
        const count = 4 + Math.floor(Math.random() * 5);
        const prohibited = ['3-3', '3-4', '4-3', '4-4']; // Keep center clear

        for (let i = 0; i < count; i++) {
            let r, c, key;
            do {
                r = Math.floor(Math.random() * 8);
                c = Math.floor(Math.random() * 8);
                key = `${r}-${c}`;
            } while (prohibited.includes(key) || obstacles.some(o => o.r === r && o.c === c));
            obstacles.push({ r, c });
        }
        return obstacles;
    }

    getLevel(id) {
        return this.levels.find(l => l.id === id) || this.levels[0];
    }

    getCurrentLevelData() {
        return this.getLevel(this.currentLevel);
    }

    nextLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            return true;
        }
        return false;
    }
}

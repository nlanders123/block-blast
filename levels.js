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
        // Return a predefined pattern of obstacles (row, col)
        // Simple patterns for now
        const patterns = [];
        const corners = [{ r: 0, c: 0 }, { r: 0, c: 7 }, { r: 7, c: 0 }, { r: 7, c: 7 }];
        const center = [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }];

        if (level % 5 === 0) return [...center, ...corners]; // Every 5th level is hard
        if (level > 2) return corners; // Basic obstacles
        return []; // First 2 levels empty
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

# Block Royale — Architecture

## Overview
Single-page vanilla JS game. No framework, no build step. All game logic in `game.js`, styling in `style.css`, markup in `index.html`.

## Core Classes

### BlockBlast (game.js)
The game engine. Manages:
- **Board state** — 8x8 grid, `null` for empty, colour string for filled
- **Piece management** — 3 piece slots, random generation from shape pool
- **Drag & drop** — Touch/mouse input → grid snapping → placement
- **Scoring** — Points for placing blocks + line clears + combos
- **Game over detection** — Checks if any remaining piece fits anywhere

### SoundManager (game.js)
Web Audio API synthesiser. Generates tones for place, clear, combo, game over. No audio files needed.

### LeaderboardManager (game.js)
Top 10 local scores in localStorage. Simple add/get/clear interface.

### ThemeManager (game.js)
Dark/light/system theme toggle. Applies `data-theme` attribute to `<html>`, CSS handles the rest.

### LevelManager (levels.js)
50 procedurally-configured levels with obstacle patterns and escalating target scores. **Currently disabled** — game runs in endless mode.

## Data Flow
```
User Input (touch/mouse)
  → handleDragStart/Move/End
    → updateHighlight (grid snapping)
    → canPlacePiece (validation)
    → placePiece (state update)
      → checkAndClearLines (scoring)
      → checkGameOver (end condition)
```

## Rendering
- Board cells are divs in a CSS Grid, identified by `data-row`/`data-col`
- Pieces rendered as CSS Grid of coloured cells
- Drag clone is a DOM copy positioned with `position: fixed`
- Ghost preview overlays the board at the snap position
- Line clear particles are temporary DOM elements with CSS animations

## Persistence
- High score: `blockBlastHighScore` (localStorage)
- Leaderboard: `blockBlastLeaderboard` (localStorage, JSON array)
- Theme: `blockBlastTheme` (localStorage)

## Native Wrapper
Capacitor wraps the web app for iOS/Android. `npm run build` copies web files to `www/`, then `cap sync` pushes to native projects.

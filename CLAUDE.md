# Block Royale — CLAUDE.md

## What Is This
Jelly-themed block puzzle game. Place shapes on an 8x8 grid, clear lines to score. Mobile-first PWA, targeting App Store via Capacitor.

## Stack
- **Frontend**: Vanilla JS + HTML + CSS (no framework, no build step)
- **App wrapper**: Capacitor 5 (upgrade to 6 before App Store submission)
- **Hosting**: Static files, served via `npx serve .`
- **Persistence**: localStorage (scores, theme, leaderboard)

## Project Structure
```
game.js          — Game engine (BlockRoyale class, SoundManager, LeaderboardManager)
game-logic.js    — Pure game logic functions (no DOM, testable with Jest)
index.html       — Single page app
style.css        — All styles, CSS custom properties for theming
service-worker.js — Basic offline caching (network-first)
capacitor.config.json — iOS/Android wrapper config
ios/             — Capacitor iOS project
www/             — Capacitor web build output
assets/          — Game assets
levels.js        — LevelManager (50 levels, currently unused — kept for future)
```

## Key Conventions
- Single-file game engine (game.js) — all game logic lives here
- CSS custom properties for theming (`--cell-gap`, colours, etc.)
- No build step — files are served directly
- Capacitor `www/` dir is the web build target (`npm run build` copies files there)

## Commands
```bash
npm start          # Serve locally
npm run build      # Copy to www/ for Capacitor
npm run cap:sync   # Sync web assets to native projects
npm run cap:open:ios  # Open Xcode
```

## Known Issues
- Capacitor v5 needs upgrading to v6
- Icons are placeholder (579KB PNGs — need proper app icons)
- Google Fonts won't work offline — consider self-hosting for full PWA offline support

## Rules
- Test on mobile after any drag/touch changes — desktop mouse ≠ mobile touch
- Don't add libraries unless there's a clear need — vanilla JS is fine for this game
- All data goes through localStorage — no backend needed for MVP

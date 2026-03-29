# Block Royale — Architecture Decision Records

## ADR-001: Vanilla JS (no framework)
**Date**: Pre-2026-03
**Status**: Active
**Decision**: Build with vanilla JS, HTML, CSS — no React, no build tools.
**Why**: The game is a single screen with simple DOM manipulation. A framework would add bundle size and complexity with no benefit. Capacitor wraps static files directly.
**Trade-off**: No component model, no hot reload, no TypeScript. Acceptable for a game this size.

## ADR-002: Capacitor for App Store
**Date**: Pre-2026-03
**Status**: Active
**Decision**: Use Capacitor to wrap the PWA for iOS/Android App Store distribution.
**Why**: Allows shipping the same codebase as a web app and native app. No need to learn Swift/Kotlin for a puzzle game.
**Trade-off**: Capacitor v5 is current in the project; needs upgrade to v6 before submission.

## ADR-003: Endless mode (levels disabled)
**Date**: Pre-2026-03
**Status**: Active
**Decision**: Disable the 50-level system and run as endless mode.
**Why**: The level system (obstacle patterns, target scores) wasn't adding fun. Endless mode matches player expectations for this genre (BlockBlast, Woodoku, etc.).
**Trade-off**: LevelManager code remains in `levels.js` but is unused. Can be re-enabled or removed.

## ADR-004: Web Audio API for sounds
**Date**: Pre-2026-03
**Status**: Active
**Decision**: Synthesise all sounds with Web Audio API oscillators instead of audio files.
**Why**: Zero asset loading, tiny footprint, works offline. Sounds are simple tones and arpeggios.
**Trade-off**: Sounds are functional, not polished. May want real audio files for App Store quality.

## ADR-005: Drag dead zone + floor snapping
**Date**: 2026-03-27
**Status**: Active
**Decision**: Require 8px movement before starting a drag. Use `Math.floor(x + 0.5)` for grid snapping instead of `Math.round`.
**Why**: Prevents accidental drags from taps. Floor snapping gives consistent behaviour — the piece enters a cell when its center crosses the cell boundary, rather than jumping unpredictably at half-cell boundaries.
**Trade-off**: Slight delay before drag visual appears (imperceptible in practice).

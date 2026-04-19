Original prompt: I have been working on a game called Block Royale. I want you to review its code in preparation for Apple App store listing

2026-04-10
- Reviewed source, runtime behavior, and iOS packaging with an App Store readiness lens.
- Confirmed main blockers: stale iOS display name, no in-app privacy access, and drift between root source, `www`, and `ios/App/App/public`.
- Starting implementation with release-pipeline fixes first, then UI/UX cleanup on the synced build.
- Updated build/sync scripts so Capacitor rebuilds before syncing and copies `icons.js` into `www`.
- Renamed the installed iOS display name to `Block Royale`.
- Added an in-app privacy entry point and privacy modal from Settings.
- Refined the start screen, score panel, board/tray surfaces, and overall visual hierarchy for a cleaner presentation.
- Rebuilt and synced successfully; confirmed root source, `www`, and `ios/App/App/public` now match exactly.
- Verified locally with `node --check`, `npm test`, and a Playwright probe covering start screen, privacy flow, and drag-drop gameplay with no runtime errors.

2026-04-13
- Added a new Settings toggle for `Single-piece draw`, persisted in `localStorage` as `blockRoyalePieceMode`.
- Updated the tray UI so single-piece mode relabels the area to `Current Piece`, hides the next two queued shapes, and keeps the badge/help copy in sync with the selected mode.
- Wired gameplay so tray mode still exposes three playable pieces, while single-piece mode only exposes the front piece and refills the hidden queue after each placement.
- Expanded `render_game_to_text` to report `pieceMode` and `hiddenQueueCount`, which makes the new mode verifiable in automated probes.
- Verified the working copy with `node --check game.js`, `node --check tmp-verify-piece-mode.mjs`, `npm test -- --runInBand` (38/38), `npm run build`, the Playwright smoke client, and a dedicated Playwright verification script covering tray mode and single-piece mode before/after a placement.
- Fixed the pause → settings flow so opening Settings from the pause modal now clears the paused state before returning to gameplay, which prevents drag/drop from getting stuck after changing a setting mid-run.

# Block Blast - Project Notes

## Current State
- **Status**: Playable, some stability issues being investigated
- **Live URL**: https://nlanders123.github.io/block-blast/
- **GitHub**: https://github.com/nlanders123/block-blast

## Recent Changes (Jan 2026)

### Bug Fixes Applied
1. **Ghost/Phantom Block Bug** - Fixed by fully clearing ghost preview on hide
2. **Missing Method Error** - Removed call to non-existent `previewLineClears()`
3. **Drag Alignment** - Fixed offset calculation for consistent piece positioning (3 cells above finger on mobile)
4. **Throttling** - Added 60fps throttle to drag events to reduce lag
5. **Freeze Recovery** - Added:
   - `resetDragState()` method for centralized cleanup
   - Try-catch error handling in drag handlers
   - Tab/focus change detection to reset stuck drags
   - 5-second auto-reset timeout for stuck pieces

### Known Issues
- **Levels Disabled** - Level system (`checkLevelProgress`, obstacle placement) is commented out for debugging. We suspected it was causing visual glitches around score 500. Needs re-testing.
- **Occasional Freezes** - Still being investigated. Manifests as pieces becoming unresponsive.

## Architecture

### Key Files
- `game.js` - Main game logic (BlockBlast class)
- `levels.js` - Level management with 50 levels and obstacle patterns
- `style.css` - All styling including dark/light themes
- `index.html` - Main entry point

### Important Classes
- `BlockBlast` - Main game controller
- `SoundManager` - Web Audio API sounds
- `LeaderboardManager` - Local storage leaderboard
- `ThemeManager` - Dark/light/system theme support
- `LevelManager` - Level progression (currently disabled)

## TODO
- [ ] Re-enable and fix levels system
- [ ] Investigate remaining freeze issues
- [ ] Test on multiple devices
- [ ] Consider adding level indicator UI

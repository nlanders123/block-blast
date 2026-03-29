# Block Royale — Engineering Protocol

## Before Coding
1. Read `CLAUDE.md` for conventions
2. Read `docs/ARCHITECTURE.md` for how it's built
3. Read recent session logs in `docs/logs/`
4. Plan the change — where does it fit? What could break?

## While Building
- **No build step** — edit files directly, refresh to test
- **Test on mobile** — use Chrome DevTools device mode, or serve to phone via local IP
- **Touch ≠ mouse** — always test both input methods for drag changes
- **One change at a time** — don't refactor while adding features
- **Follow existing patterns** — check how similar things are done in game.js

## After Building
1. Verify — refresh the game, play a round, check console for errors
2. Test on mobile viewport (Chrome DevTools → responsive mode)
3. Update docs if architecture changed
4. Write session log to `docs/logs/YYYY-MM-DD.md`
5. Commit with clear message

## Running Locally
```bash
npm start          # Serves on http://localhost:3000
# OR
npx serve .        # Same thing
```

## Building for Capacitor
```bash
npm run build      # Copies web files to www/
npm run cap:sync   # Syncs to native projects
npm run cap:open:ios  # Opens in Xcode
```

## Testing
No test framework set up yet. Manual testing:
- Place pieces of various shapes
- Clear single rows, single columns, combos
- Trigger game over
- Test undo
- Test theme toggle
- Test on mobile (touch drag, haptics)

## Debugging
- Console errors → check game.js try/catch blocks
- Drag issues → add `console.log` in handleDragStart/Move/End
- Visual glitches → inspect with Chrome DevTools
- Capacitor issues → check Xcode console for native errors

## Key Gotchas
- `getBoundingClientRect()` values change with scroll/zoom — always recalculate
- Touch events fire differently than mouse events (touchend has no touches array, use changedTouches)
- CSS gap affects ghost preview positioning — read from computed style, don't hardcode
- `window.matchMedia('(pointer: coarse)')` detects touch devices but can be wrong on hybrid devices

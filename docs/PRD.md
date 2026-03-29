# Block Royale — Product Requirements Document

## Vision
A polished, jelly-themed block puzzle game for mobile. Think BlockBlast meets candy aesthetics. Simple to learn, satisfying to play, built for short sessions.

## Target Platform
- Mobile-first PWA (immediate play via browser)
- iOS App Store via Capacitor (primary distribution)
- Android Play Store via Capacitor (secondary)

## Monetisation
- Ads (interstitial between games, banner during play — TBD)
- In-app purchases (TBD — extra undos, themes, power-ups)

## Core Gameplay
- 8x8 grid
- 3 pieces dealt at a time from a shape pool
- Drag and drop pieces onto the board
- Complete a full row or column to clear it and score points
- Game ends when no remaining piece can be placed
- Endless mode (no time limit, no levels)

## MVP Features (Current)
- [x] Drag & drop piece placement (touch + mouse)
- [x] Line clearing with particle effects
- [x] Scoring with combo bonuses
- [x] High score tracking
- [x] Local leaderboard (top 10)
- [x] Sound effects (synthesised)
- [x] Dark/light/system theme
- [x] Undo (1 step)
- [x] PWA (offline capable, installable)
- [x] Capacitor iOS project scaffolded

## Next Up
- [ ] Fix naming: rename everything from Line Crush / Block Blast → Block Royale
- [ ] Jelly visual theme (wobbly animations, soft colours, rounded shapes)
- [ ] App Store-ready icons and splash screens
- [ ] Upgrade Capacitor v5 → v6
- [ ] Ad integration (AdMob via Capacitor plugin)
- [ ] Haptic feedback improvements (iOS native via Capacitor)
- [ ] Tutorial / first-time experience
- [ ] Share score functionality

## Future Considerations
- Daily challenge mode
- Re-enable level system with better obstacle design
- Cloud save (if adding accounts)
- Multiplayer / competitive leaderboard
- Power-ups (bomb, colour clear, row clear)

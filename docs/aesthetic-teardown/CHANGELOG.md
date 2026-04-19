# Aesthetic Pivot Changelog

## 2026-04-19 — Icon refresh installed (Phase 1 complete)

### Decision
Pivoted from dark-neon (`docs/DESIGN.md`) to Block Blast-style bright candy aesthetic
(`docs/DESIGN_v2.md`). Old design preserved as future "Synthwave" unlockable theme.

### What changed (Phase 1 — icon only)

**Chosen icon:** Variant A — full 8×8 grid mid-clear, royal-blue background, bright
candy blocks, asymmetric flash column with confetti particles. Source: programmatically
rendered via `generate_icons.py`.

**Files installed (all backed up as `*.pre-v2.bak`):**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024 master)
- `icon.png` (1024×1024)
- `icon-512.png` (512×512 PWA)
- `icon-192.png` (192×192 PWA)
- `apple-touch-icon.png` (180×180 Safari)
- `assets/icon-appstore.png` (1024×1024 — App Store backup)

**Other changes:**
- `package.json` build script updated to also copy `icon.png` to `www/`
- `www/` synced via `npm run build`

### What didn't change (Phase 2 — pending)

The in-game CSS aesthetic is still the previous "muted earth-tone candy minimalism."
The icon and the game now have inconsistent visual languages:
- **Icon:** royal blue + bright candy + Block Blast vocabulary
- **Game:** cream/white + muted earth-tones + clean minimalism

This needs to be reconciled before App Store submission, otherwise screenshots
won't match the icon. Recommended: refactor `style.css` to align with `DESIGN_v2.md`.

### How to roll back

```bash
cd ~/Projects/block-royale
for f in icon.png icon-192.png icon-512.png apple-touch-icon.png; do
  if [ -f "${f}.pre-v2.bak" ]; then mv "${f}.pre-v2.bak" "$f"; fi
done
mv assets/icon-appstore.png.pre-v2.bak assets/icon-appstore.png
mv ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png.pre-v2.bak \
   ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
npm run build
```

### Next steps (Phase 2)
1. Refactor `style.css` to update block colors, font, shadow recipe per `DESIGN_v2.md`
2. Test the refactored game in the browser (`npm start` → http://localhost:3000)
3. Capture 5 App Store screenshots from the refactored game
4. Capacitor sync (`npm run cap:sync`) and submit via Xcode

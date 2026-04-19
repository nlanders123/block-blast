# Block Royale — Design System v2 (Candy Default)

**Status:** Active default theme as of 2026-04-19.
**Replaces:** `DESIGN.md` (dark neon — preserved as future "Synthwave" unlockable theme).
**Reference:** Cloned visual playbook from Block Blast! (2.4M ratings, 4.87★, dominant in casual block puzzle category). See `docs/aesthetic-teardown/TEARDOWN.md` for the data behind this decision.

## Design Principle

> **Edible. Tactile. Inviting.**
> The blocks should look like candy you want to grab. The board should look like a thing you'd happily pick up. The screen should feel warm, not cold.

Every design decision flows from one question: **"Does this look more like Block Blast, or more like a Cyberpunk 2077 minigame?"** Pick the Block Blast answer every time.

## Palette

### Background
- **Primary:** Royal blue gradient — `#1e40af` (top) → `#312e81` (bottom). Saturated, never near-black.
- **Ambient overlay (optional):** Soft radial highlight in upper-left at 8% white opacity. Adds depth without darkness.
- **Vignette:** None. Vignettes feel premium-dark — wrong for this aesthetic.

### Block colors (KEEP from v1 — these work)
| Name | Hex | Use |
|------|-----|-----|
| Red | `#ef4444` | Block |
| Orange | `#f97316` | Block |
| Yellow | `#fbbf24` | Block |
| Green | `#22c55e` | Block |
| Teal | `#14b8a6` | Block |
| Blue | `#3b82f6` | Block |
| Purple | `#a855f7` | Block |

Slight saturation bump from v1 — these read brighter on a blue background than they did on near-black.

### UI text
- **Score (large):** white `#ffffff`, no glow, just a subtle dark drop-shadow `0 2px 4px rgba(0,0,0,0.3)` for legibility.
- **Best score label:** soft cream `#fef3c7` at 80% opacity.
- **General text:** white with varying opacity. **No neon glow effects.**

### Accent (used for combo text, celebrations, banners)
- **Highlight gold:** `#fbbf24` (matches the yellow block — celebratory, warm).
- **Black outline:** `#0c0a09` for cartoon outlining on combo text.

## Board

- **Container:** `#1e3a8a` (slightly lighter than background), `rounded-3xl` (24px), border `2px solid rgba(255,255,255,0.15)`, padding `12px`.
- **Empty cells:** `rgba(255,255,255,0.08)`, `rounded-md` (8px). Slightly more opaque than v1 for visibility.
- **Grid gap:** `6px`.
- **Subtle inner shadow on container:** `inset 0 2px 8px rgba(0,0,0,0.2)` — gives a "tray" feel.

## Blocks (filled cells) — the most important spec

This is the candy-block recipe. Every block is composed of three layers:

1. **Base fill:** The block color, full opacity.
2. **Top highlight:** Inner shadow at top, white `rgba(255,255,255,0.55)`, 3-4px tall — gives the rim-lit candy look.
3. **Bottom shadow:** Inner shadow at bottom, black `rgba(0,0,0,0.30)`, 3-4px tall — grounds the block.

CSS:
```css
.block {
  background: var(--block-color);
  border-radius: 8px; /* slightly more rounded than v1 */
  box-shadow:
    inset 0 4px 4px rgba(255, 255, 255, 0.55),
    inset 0 -4px 4px rgba(0, 0, 0, 0.30);
}
```

**Critical:** No outer glow. No neon. The 3D effect comes entirely from the inner shadows. This is what makes Block Blast's blocks look like jelly candies.

## Typography

- **Font:** **Fredoka** (Google Fonts) — rounded, friendly, candy-aligned.
  - Fallback: `'Fredoka', 'Baloo 2', 'Nunito', sans-serif`.
- **Score:** Fredoka 700 (Bold), 56px on mobile.
- **Best score:** Fredoka 600 (SemiBold), 14px, with trophy icon `🏆`.
- **Combo text:** Fredoka 800 (ExtraBold), 80px, italicized, with `-webkit-text-stroke: 4px #0c0a09` (chunky black outline).
- **Buttons / labels:** Fredoka 600, 16px, tracking-normal.

**Removed:** Spline Sans. Too modern/tech. Wrong vibe.

## Score panel

- **Container:** White `#ffffff` rounded card, `rounded-2xl` (16px), padding `16px 24px`, soft drop-shadow `0 4px 12px rgba(0,0,0,0.15)`.
- **Score number:** Dark slate `#0f172a` (near-black on white — readable).
- **Best score row:** Slate `#475569`, smaller, with trophy emoji.

This is a **major shift** — score panels are now light cards on the rich blue background, not frosted-glass dark elements. Adds warmth and contrast.

## Piece tray

- **Container:** Lighter blue `#1e3a8a`/80% opacity, rounded `rounded-3xl`.
- **Active piece slots:** `rounded-2xl`, white border at 25% opacity, `bg-white/8`.
- **Empty/used slots:** Dashed white border at 15% opacity, ghost piece at 12% opacity.
- **Pieces:** Same candy-block recipe as the board.

## Line clear effects

- **Clearing cells:** Briefly turn near-white `#fefce8` (cream) — keeps warmth.
- **Particle burst:** Chunky circular particles in the cleared row's primary color, scattering with gravity. **No neon.** Think confetti, not laser beams.
- **Intersection cell:** Bright yellow `#fbbf24` flash, scale 1.3, 200ms pulse.
- **Sound:** Satisfying "pop" / "clink" — no synth bleeps.

## Combo text

- **Type:** Fredoka 800 italic, 80px.
- **Fill:** Yellow gradient (`#fbbf24` → `#f97316`) — warm celebratory.
- **Outline:** Chunky 4px black `#0c0a09` (text-stroke).
- **Effect:** Slight rotation `-4deg`, scale-bounce in (0.5 → 1.15 → 1.0), confetti particles around.
- **No layered blur glow.** Outline carries the punch.

## Header

- **Pause button:** White rounded square `bg-white`, `rounded-2xl`, dark icon `#0f172a`, soft drop-shadow. Light, not frosted-glass dark.
- **Score:** Centered, in the white score card described above.

## Animations

- **Block snap-in:** Bounce ease (`cubic-bezier(0.34, 1.56, 0.64, 1)`), 250ms.
- **Line clear flash:** 0% → 50% (cream + scale 1.05) → 100% (transparent).
- **Particles:** Physics-based — initial velocity outward + downward gravity + fade out over 600ms.
- **Combo text:** Spring scale-bounce in, hold 800ms, fade out.

## Anti-slop rules (revised for v2)

- ❌ No near-black backgrounds.
- ❌ No outer glow / neon effects on blocks.
- ❌ No frosted-glass dark UI elements.
- ❌ No sleek/tech fonts (Spline Sans, Inter, SF Pro).
- ❌ No layered blur glow on text.
- ✅ All blocks must have the rim-light inner shadow recipe (top white + bottom black).
- ✅ Background must be a saturated mid-blue, never desaturated or dark.
- ✅ Score elements must be light cards on rich background, not dark on dark.
- ✅ Typography must be rounded and friendly (Fredoka or equivalent).
- ✅ Combo/celebration text must use chunky black outline, not blur.

## Migration notes (for the code refactor)

The existing app uses CSS custom properties for theming, which means swapping themes is mostly a matter of updating `:root` variables in `style.css`. The structural changes needed:

1. Update CSS variables: `--bg-base`, `--bg-gradient-stops`, `--text-primary`, `--block-shadow-recipe`, `--font-family`.
2. Replace `box-shadow` neon recipes with the candy inner-shadow recipe above.
3. Swap font import in `index.html` from Spline Sans → Fredoka.
4. Update score panel from frosted-glass to white card.
5. Replace particle effect render in `game.js` (search for "neon" in particle/glow code) with chunky circles.

**Estimated refactor time:** 1.5–2 hours.

## Theme switching for future Synthwave unlockable

When Synthwave (the old DESIGN.md) is added back as an unlockable:
- Wrap CSS variables in a `[data-theme="candy"]` / `[data-theme="synthwave"]` selector pattern.
- LocalStorage key: `blockRoyaleTheme`.
- Default value: `"candy"`.
- Synthwave unlocked at score threshold (e.g., 50,000) or via in-app purchase.

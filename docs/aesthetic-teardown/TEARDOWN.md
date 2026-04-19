# Block Royale — Competitive Aesthetic Teardown

**Date:** 2026-04-19
**Purpose:** Validate the visual direction before committing design budget to icon, screenshots, and App Store assets.

## The Question We're Answering

> "Does Block Royale's current dark-neon aesthetic appeal to the broader population that actually plays casual block puzzle games — or only to me?"

## What Was Compared

7 icons at 512×512 (App Store size), pulled live via the iTunes API on 2026-04-19:

| # | Game | Developer | Ratings | Avg Rating | Icon |
|---|---|---|---|---|---|
| 1 | **Royal Match** | Dream Games | **3,618,212** | 4.69★ | `icons/royal-match.jpg` |
| 2 | **Block Blast!** | Hungry Studio | **2,397,863** | 4.87★ | `icons/block-blast.jpg` |
| 3 | **Woodoku** | Tripledot | 648,334 | 4.71★ | `icons/woodoku.jpg` |
| 4 | **Tetris®** | PlayStudios | 451,950 | 4.54★ | `icons/tetris.jpg` |
| 5 | **Block Puzzle** | Block Puzzle Games | 145,662 | 4.51★ | `icons/block-puzzle-wood.jpg` |
| 6 | **1010!** | Gram Games | 22,730 | 4.28★ | `icons/1010.jpg` |
| 7 | **Block Royale (current)** | — | 0 | — | `icons/block-royale-current.png` |

## Visual Read — Each Icon

### Royal Match — 3.6M ratings, top grossing puzzle worldwide
Giant cartoon king's face fills the canvas. Warm gold + cream + red + ruby. Dreamy blue background with bokeh particles. **No game mechanic shown.** Pure character-driven storytelling. Reads like a Pixar movie poster.

### Block Blast! — 2.4M ratings, 4.87★ (highest in category)
Bright primary blocks (red, yellow, green, blue) with chunky 3D rim shadows on a rich royal-blue gradient. Blocks fill ~95% of the canvas. Looks **edible** — like glossy candy. Composition shows a partial mid-clear, hinting at the gameplay loop without being a screenshot.

### Woodoku — 648k ratings, 4.71★
Real wood grain. Warm beige + caramel brown. Slight 3D depth. Zen, tactile, calm. Reads like a board game you'd find at a craft market. **Zero color-pop primary hues.**

### Tetris — 451k ratings
Iconic Tetris logo dominates the bottom half. Bright primary blocks above. Navy background. Pure brand-driven — leans on 40 years of recognition. Not replicable.

### Block Puzzle (wood) — 145k ratings
Multi-color blocks (purple, cyan, orange, blue, green, red, yellow) on a dark grid background, with a flash of light. Closest aesthetic to Block Royale, but warmer and more candy-like than neon. **The dark approach is the low-performing end of this genre.**

### 1010! — 22k ratings, 4.28★ (declining classic)
Single giant red 3D cube, white outline, light blue gradient. Almost iOS-default friendly. Minimal. Old aesthetic — the genre has moved past it.

### Block Royale (current placeholder)
Four small candy-glow blocks (orange, teal, purple, hot pink) on near-black background. **Blocks fill ~40% of the canvas.** Heavy neon rim-light. Looks like a perfume bottle product shot or an audio plugin icon — **not a game icon.**

## The Pattern

Across the 6 successful competitors, **every single one** does at least 3 of the following:

1. **Warm or bright palette** (no near-blacks; warm woods, primary colors, jewel golds, or saturated mid-blues)
2. **Hero element fills 80%+ of the canvas** (legibility at 60×60px on a home screen)
3. **Character or chunky 3D form** (cute king, candy block, wood tile)
4. **High contrast with the surrounding App Store row** (no game in the top 10 is dark-on-dark)
5. **Implied warmth, comfort, or play** — not edge, danger, or tech

**Block Royale currently does ZERO of these.**

## The Damning Observations

1. **Scale problem.** Block Royale's blocks occupy ~40% of canvas. Every successful competitor fills 80–100%. At 60×60px on a real home screen, four small jellybeans on a black square will be **invisible** — your icon will literally disappear in the scroll.

2. **Darkness problem.** In an App Store row of warm/bright icons (Royal Match gold, Block Blast blue, Woodoku beige, 1010! sky-blue), Block Royale reads as a black hole. The eye **skips it.**

3. **Genre signal mismatch.** Casual block puzzle is a relax-before-bed, kill-time-in-line genre. The audience reads dark + neon as "stress" or "hardcore" or "boys' game" — and either skips it (most) or downloads expecting something more intense (and uninstalls when it's just block puzzle).

4. **The wood/warm aesthetic isn't optional in this genre.** Both Woodoku (648k ratings) and Block Puzzle wood (145k ratings) prove that warm/tactile is a **stable winning formula.** The two icons that look closest to Block Royale (Block Puzzle dark) underperform Block Blast 16:1.

## Competitor Aesthetic Buckets

| Bucket | Examples | Audience signal |
|---|---|---|
| **Bright primary candy** | Block Blast, Tetris, 1010! | Energetic, playful, all-ages |
| **Warm wood / zen** | Woodoku, Block Puzzle | Calm, cozy, before-bed |
| **Character-driven cartoon** | Royal Match | Story, emotional hook |
| **Dark neon (current Block Royale)** | — none in top 6 — | "Hardcore," male-skewing, edge |

The dark neon bucket is **empty in the winners' circle.** That's not a gap to exploit — it's a signal that the audience for casual block puzzle doesn't want it.

## Three Real Options

### Option A — Mass-market warm
Repaint to bright primary candy (Block Blast lane) or warm wood (Woodoku lane). Maximum addressable audience. Hardest to differentiate.

### Option B — Niche premium
Keep dark neon, position against the genre. Smaller audience. Premium pricing or zero-ad model. **Realistic ceiling: ~50k–200k downloads, not the 50M+ that Block Blast hit.**

### Option C — Hybrid (recommended)
**Default visual = warm and inviting** (drives the install). **Dark neon = premium unlockable theme** (lets your taste live, gives you something to monetize). Best of both, more dev work.

## Recommended Next Step

**Pick the bucket today.** The icon, screenshots, splash, and store description all flow from this one decision. Do not design any single asset before this is locked.

If Option C: the **default theme** needs to be designed first. The current dark neon DESIGN.md becomes the unlockable Theme #2.

If Option A: DESIGN.md gets shelved as a future cosmetic option, and a new warm/light DESIGN_v2.md gets written.

If Option B: nothing changes design-wise, but the marketing copy + price model + audience targeting all need a rewrite to match the niche positioning.

## Files in This Folder

- `TEARDOWN.md` — this document
- `icons/` — 7 App Store icons at 512px for direct visual comparison
- `screenshots/` — sample screenshots from top performers
- `raw-*.json` — raw iTunes API responses (for verification)

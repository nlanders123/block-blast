# Block Royale — Design System

Source: Google Stitch mockup (2026-03-27)

## Theme
Dark, high-energy, neon-glow aesthetic. Not cute/jelly — more arcade/premium mobile game.

## Palette

### Background
- Base: `#22101a` (deep rose-black)
- Gradient: `#12080e` → `#22101a` → `#0a050f`
- Ambient glow: orange `rgba(251, 146, 60, 0.1)` top-left, teal `rgba(45, 212, 191, 0.1)` bottom-right, both heavily blurred
- Vignette: radial gradient, transparent center fading to `rgba(0,0,0,0.6)`

### Accent colours
- Primary: `#f4259d` (hot pink — used sparingly)
- Orange: `#fb923c` (neon highlight, clear effects)
- Teal: `#2dd4bf` (neon highlight, clear effects)

### Block colours
| Name | Hex |
|------|-----|
| Orange | `#fb923c` |
| Teal | `#2dd4bf` |
| Purple | `#a855f7` |
| Blue | `#3b82f6` |
| Red | `#f43f5e` |
| Yellow | `#facc15` |
| Green | `#10b981` |

### UI text
- Score: white, large bold, subtle white glow `drop-shadow(0 0 15px rgba(255,255,255,0.3))`
- Best score label: muted rose `#ba9cad`
- General text: white with varying opacity

## Board
- Container: `bg-[#180d14]/80`, `backdrop-blur-sm`, `rounded-3xl`, `border border-white/10`, padding `12px`
- Empty cells: `bg-white/5`, `rounded-md`
- Grid gap: `6px` (1.5 in Tailwind units)

## Blocks (filled cells)
- Background: block colour
- Border radius: `rounded-md` (6px)
- **Rim shadow**: `inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.25)` — gives 3D candy/glass feel
- No border, no outline

## Line clear effects
- Clearing cells turn light (orange-200 or teal-200 depending on row/col direction)
- Neon glow shadow: `0 0 10px <color>, 0 0 20px <color>`
- Flash animation: brightness pulse
- Intersection cell: white, scale 1.25, strong neon glow, ping animation
- Particles: small circles with coloured glow, scattered near clearing lines

## Combo text
- Huge italic bold (7xl)
- Gradient: orange → teal
- Layered glow: orange blur behind, teal blur behind, offset
- Slight rotation (-6deg)
- Star icons at corners with spin/pulse

## Piece tray
- Container: dark, bottom of screen
- Active piece slots: `rounded-2xl`, `border border-white/20`, `bg-white/5`, shadow
- Empty/used slots: `border-2 border-dashed border-white/10`, ghost piece at 10% opacity
- Pieces use same block colours + rim shadow as board pieces

## Header
- Pause button: frosted glass circle (`bg-white/5`, `border border-white/10`, `backdrop-blur-md`)
- Score: centered, large (5xl), bold, tight tracking
- Best score: below, smaller, muted with trophy icon

## Typography
- Font: Spline Sans (Google Fonts)
- Score: 5xl bold
- Combo: 7xl black italic
- Labels: sm bold, tracking-wide

## Animations
- Line clear flash: `0%, 100% { opacity:1; scale:1; brightness:1.5 } 50% { opacity:0.8; scale:0.95; brightness:2 }`
- Combo text: scale bounce in
- Particles: pulse, fade out
- Star decorations: slow spin, pulse

## Anti-slop rules
- No generic white card backgrounds
- No perfectly uniform border radius on everything
- No symmetric layout that screams "template"
- Blocks must have the rim shadow — flat colour blocks look AI-generated
- Background must have the ambient colour blurs — solid dark backgrounds look dead
- Combo text must be layered with glow — plain text is boring

"""
Render the chosen icon (Variant A — Block Blast template) as a SQUARE 1024x1024
master (no rounded corners — iOS/Android apply their own mask), then write all
the PNGs the project needs to disk.

Targets:
- ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png (1024)
- icon.png (1024 — was 579KB placeholder)
- icon-512.png (512 — PWA)
- icon-192.png (192 — PWA)
- apple-touch-icon.png (180 — Safari home-screen)
- assets/icon-appstore.png (1024 — backup, was placeholder)
"""
import sys
from pathlib import Path

# Import the renderer from generate_icons.py (same dir).
sys.path.insert(0, str(Path(__file__).parent))
from generate_icons import variant_a_full_grid, draw_background, draw_candy_block, BLOCKS, SIZE
from PIL import Image, ImageFilter, ImageDraw
import random

PROJECT = Path("/Users/neillanders/Projects/block-royale")


def render_square_master():
    """
    Re-render Variant A WITHOUT the outer rounded-iOS mask.
    Apple wants a square 1024x1024 with no transparency.
    """
    # Reuse the same composition logic but skip the rounding step.
    # The cleanest way: call variant_a_full_grid() then re-mask to square.
    rounded = variant_a_full_grid()  # has rounded mask + alpha
    # Composite onto a solid background of the same gradient base color
    # so we get a SQUARE PNG with no transparency.
    bg = draw_background(SIZE)
    bg.alpha_composite(rounded)
    # Convert to RGB (drop alpha — Apple requires no alpha channel for App Store)
    return bg.convert("RGB")


def main():
    master = render_square_master()
    print(f"Rendered master: {master.size} mode={master.mode}")

    targets = [
        # (path_relative_to_project, size, save_kwargs)
        ("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024, {}),
        ("icon.png", 1024, {}),
        ("icon-512.png", 512, {}),
        ("icon-192.png", 192, {}),
        ("apple-touch-icon.png", 180, {}),
        ("assets/icon-appstore.png", 1024, {}),
    ]

    for rel, size, kwargs in targets:
        out = PROJECT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if size == 1024:
            img = master
        else:
            img = master.resize((size, size), Image.LANCZOS)
        # Backup existing if it exists and we haven't backed it up before
        if out.exists():
            backup = out.with_suffix(out.suffix + ".pre-v2.bak")
            if not backup.exists():
                out.rename(backup)
                print(f"  backed up → {backup.name}")
        img.save(out, "PNG", optimize=True, **kwargs)
        kb = out.stat().st_size // 1024
        print(f"  ✓ {rel}  ({size}x{size}, {kb} KB)")


if __name__ == "__main__":
    main()

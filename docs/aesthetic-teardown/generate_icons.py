"""
Block Royale icon generator — produces candidate App Store icons (1024x1024)
based on the v2 candy design system. Each function returns a fresh PIL image.

Run: python3 generate_icons.py
Outputs to ./candidates/
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import os

# ---------- Palette (from DESIGN_v2.md) ----------
BG_TOP = (30, 64, 175)       # #1e40af
BG_BOTTOM = (49, 46, 129)    # #312e81
BG_DEEP = (30, 27, 75)       # deeper variant for some compositions

BLOCKS = {
    "red":    (239,  68,  68),
    "orange": (249, 115,  22),
    "yellow": (251, 191,  36),
    "green":  ( 34, 197,  94),
    "teal":   ( 20, 184, 166),
    "blue":   ( 59, 130, 246),
    "purple": (168,  85, 247),
}

WHITE = (255, 255, 255)
CREAM = (254, 252, 232)

OUT_DIR = Path(__file__).parent / "candidates"
OUT_DIR.mkdir(exist_ok=True)
SIZE = 1024


# ---------- Helpers ----------
def vertical_gradient(size, top, bottom):
    """Produce a vertical gradient image."""
    img = Image.new("RGB", (size, size), top)
    pixels = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(size):
            pixels[x, y] = (r, g, b)
    return img


def radial_highlight(size, center, radius, color, alpha):
    """Soft radial highlight overlay (additive)."""
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = center
    for r in range(int(radius), 0, -2):
        a = int(alpha * (1 - (r / radius)) ** 2)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=color + (a,),
        )
    return overlay.filter(ImageFilter.GaussianBlur(radius * 0.15))


def _lighten(rgb, amt):
    """Lighten an RGB by amt (0..1) toward white."""
    return tuple(min(255, int(c + (255 - c) * amt)) for c in rgb)


def _darken(rgb, amt):
    """Darken an RGB by amt (0..1) toward black."""
    return tuple(max(0, int(c * (1 - amt))) for c in rgb)


def draw_candy_block(img, x, y, w, h, color, corner_radius=None, rim_strength=1.0):
    """
    Draw a glossy candy block, Block Blast style.
    Recipe (refined):
      1. Base = vertical gradient from lightened color (top) to slightly darkened (bottom)
         — keeps the block SATURATED through the middle.
      2. Soft white highlight band at the top edge (~12% of height).
      3. Soft dark rim at the bottom edge (~8% of height).
      4. Optional thin glossy curve in the upper third for a "wet" look.
    """
    if corner_radius is None:
        corner_radius = int(min(w, h) * 0.20)

    # 1. Base vertical gradient — keeps saturation, gives 3D feel without bleaching.
    block = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(block)
    top_color = _lighten(color, 0.18)
    bot_color = _darken(color, 0.20)
    for yy in range(h):
        t = yy / max(1, h - 1)
        r = int(top_color[0] + (bot_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bot_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bot_color[2] - top_color[2]) * t)
        bdraw.line([(0, yy), (w, yy)], fill=(r, g, b, 255))

    # Mask to rounded shape
    shape_mask = Image.new("L", (w, h), 0)
    sm = ImageDraw.Draw(shape_mask)
    sm.rounded_rectangle([0, 0, w, h], radius=corner_radius, fill=255)
    block.putalpha(shape_mask)

    # 2. Top highlight band (subtle, glossy) — confined to top ~12% of block.
    rim_top_h = int(h * 0.18)
    highlight = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.rounded_rectangle(
        [int(w * 0.06), int(h * 0.05), w - int(w * 0.06), rim_top_h],
        radius=int(rim_top_h * 0.55),
        fill=(255, 255, 255, int(110 * rim_strength)),
    )
    highlight = highlight.filter(ImageFilter.GaussianBlur(rim_top_h * 0.35))
    # Confine highlight to inside the rounded shape
    hl_masked = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hl_masked.paste(highlight, (0, 0), shape_mask)
    block.alpha_composite(hl_masked)

    # 3. Bottom rim shadow — confined to bottom ~10% of block, thin and dark.
    rim_bot_h = int(h * 0.12)
    rim = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    rd.rounded_rectangle(
        [int(w * 0.06), h - rim_bot_h, w - int(w * 0.06), h - int(h * 0.04)],
        radius=int(rim_bot_h * 0.55),
        fill=(0, 0, 0, int(80 * rim_strength)),
    )
    rim = rim.filter(ImageFilter.GaussianBlur(rim_bot_h * 0.4))
    rim_masked = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rim_masked.paste(rim, (0, 0), shape_mask)
    block.alpha_composite(rim_masked)

    # 4. Subtle 1px-feel inner outline at very top edge for crispness
    edge = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    ed.rounded_rectangle(
        [1, 1, w - 1, h - 1], radius=corner_radius, outline=(255, 255, 255, 35), width=2
    )
    edge_masked = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    edge_masked.paste(edge, (0, 0), shape_mask)
    block.alpha_composite(edge_masked)

    img.alpha_composite(block, (x, y))


def draw_background(size=SIZE, top=BG_TOP, bottom=BG_BOTTOM, with_highlight=True):
    """Royal blue background with optional upper-left highlight."""
    bg = vertical_gradient(size, top, bottom).convert("RGBA")
    if with_highlight:
        hl = radial_highlight(
            size,
            center=(int(size * 0.3), int(size * 0.25)),
            radius=int(size * 0.45),
            color=(255, 255, 255),
            alpha=45,
        )
        bg.alpha_composite(hl)
    return bg


def add_outer_rounded_mask(img, corner_radius_ratio=0.224):
    """
    Apply iOS-style rounded corners to the icon (~22.4% of side length =
    Apple's "squircle" approximation in rounded rectangle form).
    """
    size = img.width
    radius = int(size * corner_radius_ratio)
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)
    return output


# ---------- Variant A: Full-grid mid-clear (Block Blast template) ----------
def variant_a_full_grid():
    """
    Mimics Block Blast composition:
    8x8 grid mostly filled, mid-clear flash on one row.
    Blocks fill ~92% of the icon canvas.
    Refined: clearing column has a bright yellow flash burst + confetti
    so it reads as "line clearing!" not "empty cells."
    """
    img = draw_background()
    margin = int(SIZE * 0.05)
    grid_size = SIZE - margin * 2
    cells = 8
    gap = 12
    cell = (grid_size - gap * (cells - 1)) // cells

    # Grid layout (color name = block, 0 = empty, 'C' = clearing/flash column)
    # Cleared column moved off-center (col 5) — feels more dynamic + asymmetric.
    layout = [
        ["red",    "red",    "yellow", "yellow", "blue",   "C", "purple", "purple"],
        ["red",    "red",    "yellow", 0,        "blue",   "C", "purple", "purple"],
        ["green",  0,        "purple", "purple", "orange", "C", "teal",   0       ],
        ["green",  "green",  "purple", "purple", "orange", "C", "teal",   "teal"  ],
        ["teal",   "teal",   "yellow", "yellow", "red",    "C", "blue",   "blue"  ],
        ["teal",   "teal",   "blue",   "yellow", "red",    "C", "blue",   0       ],
        [0,        "orange", "blue",   "blue",   "yellow", "C", "green",  "green" ],
        ["yellow", "orange", 0,        "blue",   "yellow", "C", "green",  "green" ],
    ]

    # Pre-render the bright yellow flash column BEHIND the clearing blocks
    flash_col = 5
    flash_x = margin + flash_col * (cell + gap) - 8
    flash_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    fd = ImageDraw.Draw(flash_layer)
    fd.rounded_rectangle(
        [flash_x, margin - 10, flash_x + cell + 16, SIZE - margin + 10],
        radius=int(cell * 0.4),
        fill=(255, 240, 180, 200),
    )
    flash_layer = flash_layer.filter(ImageFilter.GaussianBlur(20))
    img.alpha_composite(flash_layer)

    for row_i, row in enumerate(layout):
        for col_i, key in enumerate(row):
            if key == 0:
                continue
            x = margin + col_i * (cell + gap)
            y = margin + row_i * (cell + gap)
            if key == "C":
                # Clearing block: bright yellow with extra glow strength
                draw_candy_block(img, x, y, cell, cell, (251, 191, 36), rim_strength=1.2)
            else:
                draw_candy_block(img, x, y, cell, cell, BLOCKS[key])

    # Add confetti particles bursting from the flash column for "explosion" feel
    import random
    random.seed(7)  # deterministic
    confetti_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cd = ImageDraw.Draw(confetti_layer)
    confetti_colors = [
        (251, 191, 36), (255, 255, 255), (249, 115, 22),
        (255, 245, 200), (251, 191, 36),
    ]
    cx_center = flash_x + cell // 2 + 8
    for _ in range(60):
        # Bias particles around the flash column, both sides
        side = random.choice([-1, 1])
        dist = random.randint(20, int(cell * 2.2))
        px = cx_center + side * random.randint(0, dist)
        py = random.randint(margin + 30, SIZE - margin - 30)
        radius = random.choice([6, 8, 10, 12, 14])
        color = random.choice(confetti_colors)
        alpha = random.randint(160, 230)
        cd.ellipse(
            [px - radius, py - radius, px + radius, py + radius],
            fill=color + (alpha,),
        )
    # Slight blur for softness
    confetti_layer = confetti_layer.filter(ImageFilter.GaussianBlur(1.5))
    img.alpha_composite(confetti_layer)

    # Strong central sparkle to pull the eye
    sparkle = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sparkle)
    sx = cx_center
    sy = SIZE // 2
    for r in range(int(cell * 1.3), 0, -8):
        a = int(70 * (1 - r / (cell * 1.3)) ** 2)
        sdraw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 220, a))
    sparkle = sparkle.filter(ImageFilter.GaussianBlur(cell * 0.35))
    img.alpha_composite(sparkle)

    return add_outer_rounded_mask(img)


# ---------- Variant B: Hero L-piece (clean, friendly, single shape) ----------
def variant_b_hero_piece():
    """
    Single bold L-shaped piece centered on canvas.
    Like 1010!'s hero-cube but with the BR palette and three-color piece.
    Block fills ~70% of canvas.
    """
    img = draw_background(top=(255, 184, 28), bottom=(247, 110, 28))  # warm gold→orange override
    # Actually keep blue per spec
    img = draw_background()

    cell = int(SIZE * 0.22)
    gap = int(SIZE * 0.018)

    # L-shape composition centered
    # Shape (5 cells):
    # X .
    # X .
    # X X
    # X X
    # We'll use teal + blue + purple alternating to add character
    shape = [
        (0, 0, "teal"),
        (0, 1, "teal"),
        (0, 2, "blue"),
        (1, 2, "blue"),
        (0, 3, "purple"),
        (1, 3, "purple"),
    ]
    cols = max(c[0] for c in shape) + 1
    rows = max(c[1] for c in shape) + 1
    total_w = cols * cell + (cols - 1) * gap
    total_h = rows * cell + (rows - 1) * gap
    x0 = (SIZE - total_w) // 2
    y0 = (SIZE - total_h) // 2

    # Subtle drop shadow under the whole piece
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [x0 - 20, y0 + total_h - 20, x0 + total_w + 20, y0 + total_h + 60],
        radius=40,
        fill=(0, 0, 0, 90),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    img.alpha_composite(shadow)

    for c, r, key in shape:
        x = x0 + c * (cell + gap)
        y = y0 + r * (cell + gap)
        draw_candy_block(img, x, y, cell, cell, BLOCKS[key])

    return add_outer_rounded_mask(img)


# ---------- Variant C: Diagonal stack with crown nod ("Royale") ----------
def variant_c_royale_stack():
    """
    Diagonal cascade of 3 oversized blocks with a small gold crown above
    the top block — a subtle nod to "Royale" without going Royal Match cartoon.
    """
    img = draw_background()
    cell = int(SIZE * 0.32)

    # 3 cascading blocks
    positions = [
        (int(SIZE * 0.10), int(SIZE * 0.40), "red"),
        (int(SIZE * 0.34), int(SIZE * 0.30), "yellow"),
        (int(SIZE * 0.58), int(SIZE * 0.20), "teal"),
    ]
    # Drop shadow group
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for x, y, _ in positions:
        sdraw.rounded_rectangle(
            [x + 10, y + cell - 30, x + cell + 30, y + cell + 60],
            radius=50,
            fill=(0, 0, 0, 80),
        )
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    img.alpha_composite(shadow)

    for x, y, key in positions:
        draw_candy_block(img, x, y, cell, cell, BLOCKS[key])

    # Small crown above the top (teal) block
    crown_color = (255, 215, 0)  # gold
    cx, cy = positions[2][0] + cell // 2, positions[2][1] - 60
    crown = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(crown)
    # Simple 3-spike crown
    spike_w = cell // 3
    base_y = cy + 30
    cdraw.polygon(
        [
            (cx - cell // 2 + 20, base_y),
            (cx - cell // 2 + 20, cy),
            (cx - spike_w, cy - 30),
            (cx - spike_w // 2, cy + 5),
            (cx, cy - 50),
            (cx + spike_w // 2, cy + 5),
            (cx + spike_w, cy - 30),
            (cx + cell // 2 - 20, cy),
            (cx + cell // 2 - 20, base_y),
        ],
        fill=crown_color,
        outline=(0, 0, 0, 200),
        width=4,
    )
    img.alpha_composite(crown)

    return add_outer_rounded_mask(img)


# ---------- Variant D: 4-block grid (refined version of current icon) ----------
def variant_d_clean_quad():
    """
    Cleaner version of Block Royale's current 4-block icon —
    but at 80% canvas fill, on royal blue background, no neon.
    For Neil to compare against the current placeholder directly.
    """
    img = draw_background()
    cell = int(SIZE * 0.35)
    gap = int(SIZE * 0.03)
    total = cell * 2 + gap
    x0 = (SIZE - total) // 2
    y0 = (SIZE - total) // 2

    blocks = [
        ("red",    0, 0),
        ("yellow", 1, 0),
        ("teal",   0, 1),
        ("blue",   1, 1),
    ]

    # Drop shadow under quad
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [x0 - 20, y0 + total - 30, x0 + total + 20, y0 + total + 60],
        radius=40,
        fill=(0, 0, 0, 100),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(40))
    img.alpha_composite(shadow)

    for key, cx, cy in blocks:
        x = x0 + cx * (cell + gap)
        y = y0 + cy * (cell + gap)
        draw_candy_block(img, x, y, cell, cell, BLOCKS[key])

    return add_outer_rounded_mask(img)


# ---------- Main ----------
if __name__ == "__main__":
    variants = {
        "v2-A-full-grid.png": variant_a_full_grid(),
        "v2-B-hero-piece.png": variant_b_hero_piece(),
        "v2-C-royale-stack.png": variant_c_royale_stack(),
        "v2-D-clean-quad.png": variant_d_clean_quad(),
    }
    for name, img in variants.items():
        path = OUT_DIR / name
        img.save(path, "PNG", optimize=True)
        print(f"  ✓ {path} ({path.stat().st_size // 1024} KB)")
    print(f"\nDone. {len(variants)} icons generated in {OUT_DIR}")

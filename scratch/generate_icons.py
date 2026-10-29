import os
from PIL import Image, ImageDraw

# Fastcase Palette
BG_COLOR = (1, 59, 54, 255)       # #013B36 deep emerald
ACCENT_COLOR = (110, 231, 183, 255) # #6EE7B7 mint
WHITE = (255, 255, 255, 255)
GLOW_COLOR = (110, 231, 183, 35)

MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

RES_DIR = r"c:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP\frontend\android\app\src\main\res"

def draw_scales(draw, w, h, is_foreground=False):
    # Scale coordinates based on 1000x1000 canvas
    s = w / 1000.0
    
    # Glow / aura circle behind scales
    draw.ellipse([500*s - 260*s, 380*s - 260*s, 500*s + 260*s, 380*s + 260*s], fill=GLOW_COLOR)

    # Top spire / finial ornament
    draw.ellipse([500*s - 35*s, 220*s - 35*s, 500*s + 35*s, 220*s + 35*s], fill=ACCENT_COLOR)

    # Center vertical column
    draw.rectangle([500*s - 14*s, 250*s, 500*s + 14*s, 670*s], fill=WHITE)

    # Main horizontal beam
    draw.rectangle([250*s, 320*s, 750*s, 350*s], fill=WHITE)
    # Beam center block
    draw.rectangle([475*s, 310*s, 525*s, 360*s], fill=ACCENT_COLOR)
    # Beam tips
    draw.ellipse([240*s, 315*s, 260*s, 355*s], fill=ACCENT_COLOR)
    draw.ellipse([740*s, 315*s, 760*s, 355*s], fill=ACCENT_COLOR)

    # Left chains
    draw.line([(270*s, 350*s), (190*s, 500*s)], fill=ACCENT_COLOR, width=max(1, int(12*s)))
    draw.line([(270*s, 350*s), (350*s, 500*s)], fill=ACCENT_COLOR, width=max(1, int(12*s)))

    # Left bowl (pan) - chord/pieslice
    draw.pieslice([170*s, 440*s, 370*s, 600*s], start=0, end=180, fill=ACCENT_COLOR)

    # Right chains
    draw.line([(730*s, 350*s), (650*s, 500*s)], fill=ACCENT_COLOR, width=max(1, int(12*s)))
    draw.line([(730*s, 350*s), (810*s, 500*s)], fill=ACCENT_COLOR, width=max(1, int(12*s)))

    # Right bowl (pan)
    draw.pieslice([630*s, 440*s, 830*s, 600*s], start=0, end=180, fill=ACCENT_COLOR)

    # Base tiers
    draw.rectangle([410*s, 670*s, 590*s, 705*s], fill=WHITE)
    draw.rectangle([340*s, 705*s, 660*s, 750*s], fill=ACCENT_COLOR)

def create_icon(size, is_round=False):
    canvas_size = size * 4
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if is_round:
        draw.ellipse([0, 0, canvas_size, canvas_size], fill=BG_COLOR)
    else:
        # Rounded rectangle
        corner_radius = int(canvas_size * 0.22)
        draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=corner_radius, fill=BG_COLOR)

    draw_scales(draw, canvas_size, canvas_size)
    return img.resize((size, size), Image.Resampling.LANCZOS)

def create_foreground(size):
    canvas_size = size * 4
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_scales(draw, canvas_size, canvas_size, is_foreground=True)
    return img.resize((size, size), Image.Resampling.LANCZOS)

for folder, size in MIPMAP_SIZES.items():
    folder_path = os.path.join(RES_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)

    # ic_launcher.png
    sq_icon = create_icon(size, is_round=False)
    sq_icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

    # ic_launcher_round.png
    rd_icon = create_icon(size, is_round=True)
    rd_icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

    print(f"Generated icons for {folder} ({size}x{size})")

for folder, fg_size in FOREGROUND_SIZES.items():
    folder_path = os.path.join(RES_DIR, folder)
    fg_icon = create_foreground(fg_size)
    fg_icon.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
    print(f"Generated foreground for {folder} ({fg_size}x{fg_size})")

print("All Fastcase icons successfully generated!")

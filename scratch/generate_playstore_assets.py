import os
from PIL import Image, ImageDraw, ImageFont

# Brand colors
EMERALD_DARK = (1, 59, 54, 255)       # #013B36
EMERALD_DEEP = (11, 61, 46, 255)      # #0B3D2E
MINT_ACCENT  = (110, 231, 183, 255)   # #6EE7B7
WHITE        = (255, 255, 255, 255)
GOLD_ACCENT  = (251, 191, 36, 255)    # #FBBF24

OUTPUT_DIR = r"c:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP\playstore_assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def draw_scales_emblem(draw, cx, cy, radius):
    s = radius / 500.0
    # Glow ring
    draw.ellipse([cx - 280*s, cy - 280*s, cx + 280*s, cy + 280*s], fill=(110, 231, 183, 30))
    # Top spire
    draw.ellipse([cx - 35*s, cy - 230*s, cx + 35*s, cy - 160*s], fill=MINT_ACCENT)
    # Vertical column
    draw.rectangle([cx - 15*s, cy - 170*s, cx + 15*s, cy + 240*s], fill=WHITE)
    # Crossbeam
    draw.rectangle([cx - 260*s, cy - 110*s, cx + 260*s, cy - 75*s], fill=WHITE)
    draw.rectangle([cx - 35*s, cy - 120*s, cx + 35*s, cy - 65*s], fill=MINT_ACCENT)
    draw.ellipse([cx - 275*s, cy - 115*s, cx - 245*s, cy - 70*s], fill=MINT_ACCENT)
    draw.ellipse([cx + 245*s, cy - 115*s, cx + 275*s, cy - 70*s], fill=MINT_ACCENT)
    # Left chains & pan
    draw.line([(cx - 250*s, cy - 75*s), (cx - 325*s, cy + 70*s)], fill=MINT_ACCENT, width=max(2, int(12*s)))
    draw.line([(cx - 250*s, cy - 75*s), (cx - 175*s, cy + 70*s)], fill=MINT_ACCENT, width=max(2, int(12*s)))
    draw.pieslice([cx - 345*s, cy + 10*s, cx - 155*s, cy + 170*s], start=0, end=180, fill=MINT_ACCENT)
    # Right chains & pan
    draw.line([(cx + 250*s, cy - 75*s), (cx + 175*s, cy + 70*s)], fill=MINT_ACCENT, width=max(2, int(12*s)))
    draw.line([(cx + 250*s, cy - 75*s), (cx + 325*s, cy + 70*s)], fill=MINT_ACCENT, width=max(2, int(12*s)))
    draw.pieslice([cx + 155*s, cy + 10*s, cx + 345*s, cy + 170*s], start=0, end=180, fill=MINT_ACCENT)
    # Pedestal
    draw.rectangle([cx - 95*s, cy + 240*s, cx + 95*s, cy + 275*s], fill=WHITE)
    draw.rectangle([cx - 165*s, cy + 275*s, cx + 165*s, cy + 320*s], fill=MINT_ACCENT)

# 1. Google Play Store 512x512 High-Res Icon
def generate_playstore_icon():
    size = 512
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle matching Google Play Store guidelines (512x512)
    radius = int(canvas_size * 0.22)
    # Subtle gradient background
    for y in range(canvas_size):
        interp = y / float(canvas_size)
        r = int(EMERALD_DARK[0] * (1 - interp) + EMERALD_DEEP[0] * interp)
        g = int(EMERALD_DARK[1] * (1 - interp) + EMERALD_DEEP[1] * interp)
        b = int(EMERALD_DARK[2] * (1 - interp) + EMERALD_DEEP[2] * interp)
        draw.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))

    # Mask with rounded rect
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=radius, fill=255)
    
    # Draw scales
    draw_scales_emblem(draw, canvas_size // 2, canvas_size // 2, canvas_size // 2)

    img.putalpha(mask)
    final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    icon_path = os.path.join(OUTPUT_DIR, "playstore_icon_512x512.png")
    final_icon.save(icon_path, "PNG")
    print(f"Generated Play Store Icon: {icon_path}")

# 2. Google Play Store 1024x500 Feature Graphic
def generate_feature_graphic():
    w, h = 1024, 500
    scale = 2
    cw, ch = w * scale, h * scale
    img = Image.new("RGB", (cw, ch), (1, 59, 54))
    draw = ImageDraw.Draw(img)

    # Rich dark emerald gradient with radial glow
    for x in range(cw):
        interp = x / float(cw)
        r = int(1 * (1 - interp) + 11 * interp)
        g = int(59 * (1 - interp) + 61 * interp)
        b = int(54 * (1 - interp) + 46 * interp)
        draw.line([(x, 0), (x, ch)], fill=(r, g, b))

    # Decorative background circles
    draw.ellipse([cw - 450, -100, cw + 300, ch + 200], fill=(110, 231, 183, 18))
    draw.ellipse([-150, ch - 350, 400, ch + 300], fill=(110, 231, 183, 12))

    # Scales emblem on the left
    draw_scales_emblem(draw, int(cw * 0.22), ch // 2, int(ch * 0.42))

    # Right side text block
    # Large Title: Fastcase
    try:
        font_large = ImageFont.truetype("arialbd.ttf", int(80 * scale))
        font_tag = ImageFont.truetype("arialbd.ttf", int(24 * scale))
        font_sub = ImageFont.truetype("arial.ttf", int(32 * scale))
        font_badge = ImageFont.truetype("arialbd.ttf", int(22 * scale))
    except Exception:
        font_large = ImageFont.load_default()
        font_tag = font_large
        font_sub = font_large
        font_badge = font_large

    tx = int(cw * 0.46)
    ty = int(ch * 0.22)

    # Badge pill
    draw.rounded_rectangle([tx, ty, tx + int(360 * scale), ty + int(34 * scale)], radius=int(17 * scale), fill=(110, 231, 183, 40))
    draw.text((tx + int(16 * scale), ty + int(6 * scale)), "LEGAL ERP FOR INDIAN ADVOCATES", fill=MINT_ACCENT, font=font_tag)

    # Main Brand
    ty += int(46 * scale)
    draw.text((tx, ty), "Fastcase", fill=WHITE, font=font_large)

    # Tagline
    ty += int(90 * scale)
    draw.text((tx, ty), "India's Complete Legal Operating System", fill=MINT_ACCENT, font=font_sub)

    # Highlights
    ty += int(52 * scale)
    draw.text((tx, ty), "Court Diary  *  500+ Drafts  *  GST Invoicing  *  Client CRM", fill=(203, 213, 225), font=font_badge)

    final_graphic = img.resize((w, h), Image.Resampling.LANCZOS)
    graphic_path = os.path.join(OUTPUT_DIR, "playstore_feature_graphic_1024x500.png")
    final_graphic.save(graphic_path, "PNG")
    print(f"Generated Play Store Feature Graphic: {graphic_path}")

generate_playstore_icon()
generate_feature_graphic()
print("All Play Store assets generated successfully!")

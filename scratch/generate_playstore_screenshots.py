import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = r"c:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP\playstore_assets"
SCREENSHOTS_DIR = r"c:\Users\Admin\Downloads\high-cortERP\High-Cort-ERP\frontend\public\screenshots"

CARDS = [
    {
        "filename": "screenshot_1_dashboard.png",
        "tag": "ALL-IN-ONE LEGAL COMMAND CENTER",
        "title": "Unified Advocate Dashboard",
        "subtitle": "Track hearings, daily board listings, and case alerts in real time.",
        "image": "dashboard.png",
    },
    {
        "filename": "screenshot_2_cases.png",
        "tag": "HIGH COURT & DISTRICT LITIGATION",
        "title": "Matter & CNR Tracking",
        "subtitle": "Automated court cause lists, diary entries, and limitation alerts.",
        "image": "case-management.png",
    },
    {
        "filename": "screenshot_3_drafts.png",
        "tag": "VERNACULAR LEGAL AUTOMATION",
        "title": "500+ Verified Legal Drafts",
        "subtitle": "Auto-populate matter details into English, Marathi, Hindi & Gujarati drafts.",
        "image": "draft-workspace.png",
    },
    {
        "filename": "screenshot_4_billing.png",
        "tag": "FINANCIAL COMPLIANCE & LEDGER",
        "title": "GST Invoicing & Retainers",
        "subtitle": "SAC 9982 tax invoices, client retainer trusts, and fee collections.",
        "image": "billing-invoicing.png",
    },
]

W, H = 1080, 1920

def create_playstore_poster(card):
    img = Image.new("RGB", (W, H), (1, 59, 54))
    draw = ImageDraw.Draw(img)

    # Vertical gradient from deep emerald to dark night
    for y in range(H):
        t = y / float(H)
        r = int(1 * (1 - t) + 11 * t)
        g = int(59 * (1 - t) + 25 * t)
        b = int(54 * (1 - t) + 25 * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Glow accents
    draw.ellipse([W - 300, -100, W + 300, 500], fill=(110, 231, 183, 22))
    draw.ellipse([-200, 300, 400, 900], fill=(110, 231, 183, 14))

    # Typography
    try:
        font_tag = ImageFont.truetype("arialbd.ttf", 26)
        font_title = ImageFont.truetype("arialbd.ttf", 60)
        font_sub = ImageFont.truetype("arial.ttf", 32)
    except Exception:
        font_tag = ImageFont.load_default()
        font_title = font_tag
        font_sub = font_tag

    # Tag pill
    tag_text = card["tag"]
    draw.rounded_rectangle([70, 110, 70 + len(tag_text)*18 + 40, 160], radius=25, fill=(110, 231, 183, 40))
    draw.text((90, 122), tag_text, fill=(110, 231, 183), font=font_tag)

    # Title
    draw.text((70, 190), card["title"], fill=(255, 255, 255), font=font_title)

    # Subtitle
    draw.text((70, 275), card["subtitle"], fill=(203, 213, 225), font=font_sub)

    # Smartphone Frame Mockup
    frame_w = 940
    frame_h = 1420
    frame_x = (W - frame_w) // 2
    frame_y = 390
    corner_radius = 56

    # Shadow
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle([frame_x - 10, frame_y - 10, frame_x + frame_w + 10, frame_y + frame_h + 10], radius=corner_radius, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    img.paste(shadow, (0, 0), shadow)

    # Phone Outer Border
    draw.rounded_rectangle([frame_x, frame_y, frame_x + frame_w, frame_y + frame_h], radius=corner_radius, fill=(15, 23, 42), outline=(51, 65, 85), width=6)

    # Camera Notch bar
    draw.rounded_rectangle([frame_x + frame_w//2 - 90, frame_y + 14, frame_x + frame_w//2 + 90, frame_y + 44], radius=15, fill=(30, 41, 59))
    draw.ellipse([frame_x + frame_w//2 + 40, frame_y + 22, frame_x + frame_w//2 + 56, frame_y + 38], fill=(51, 65, 85))

    # Inner Screen Area
    inner_margin = 16
    screen_x = frame_x + inner_margin
    screen_y = frame_y + 54
    screen_w = frame_w - (inner_margin * 2)
    screen_h = frame_h - 70

    # Load and place real app screenshot
    scr_path = os.path.join(SCREENSHOTS_DIR, card["image"])
    if os.path.exists(scr_path):
        scr = Image.open(scr_path).convert("RGB")
        # Resize maintaining aspect ratio or crop
        scr_ratio = scr.width / float(scr.height)
        target_ratio = screen_w / float(screen_h)

        if scr_ratio > target_ratio:
            # wider: crop width
            new_h = screen_h
            new_w = int(scr.width * (new_h / float(scr.height)))
            scr = scr.resize((new_w, new_h), Image.Resampling.LANCZOS)
            scr = scr.crop((0, 0, screen_w, screen_h))
        else:
            # taller: crop height
            new_w = screen_w
            new_h = int(scr.height * (new_w / float(scr.width)))
            scr = scr.resize((new_w, new_h), Image.Resampling.LANCZOS)
            scr = scr.crop((0, 0, screen_w, screen_h))

        # Rounded corners for screen
        mask = Image.new("L", (screen_w, screen_h), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, screen_w, screen_h], radius=corner_radius - 12, fill=255)
        img.paste(scr, (screen_x, screen_y), mask)

    out_file = os.path.join(OUTPUT_DIR, card["filename"])
    img.save(out_file, "PNG")
    print(f"Generated Play Store Poster: {out_file}")

for card in CARDS:
    create_playstore_poster(card)

print("All Play Store showcase screens generated successfully!")

import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "table_qr_codes"
os.makedirs(os.path.join(OUTPUT_DIR, "standees"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "pure_qr"), exist_ok=True)

# Colors
BG_COLOR = (250, 247, 242)       # Warm parchment #FAF7F2
INK_COLOR = (42, 36, 33)          # Dark ink #2A2421
BRONZE_COLOR = (184, 125, 75)     # Warm bronze #B87D4B
BRONZE_DARK = (130, 85, 48)       # Deep bronze
SUBTLE_BORDER = (222, 212, 198)   # Border #DED4C6
WHITE = (255, 255, 255)

# Fonts
font_title = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 52)
font_subtitle = ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 24)
font_badge = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 36)
font_instruction = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 26)
font_sub_instruction = ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 22)
font_footer1 = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 19)
font_footer2 = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 19)

# Pure QR Font
font_pure_title = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 46)
font_pure_sub = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 24)

# Load Logo if available
logo_img = None
if os.path.exists("public/logo.png"):
    try:
        logo_img = Image.open("public/logo.png").convert("RGBA")
    except Exception as e:
        print("Logo load note:", e)

def create_qr_image(url, box_size=16, border=2):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#2A2421", back_color="white").convert("RGBA")
    return img

def draw_centered_text(draw, text, y, font, color, canvas_width):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (canvas_width - text_width) // 2
    draw.text((x, y), text, font=font, fill=color)
    return y + (bbox[3] - bbox[1])

def generate_table_standee(table_num):
    width, height = 1200, 1680
    im = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(im)

    # 1. Outer & Inner Borders (Double frame aesthetic)
    draw.rectangle([(28, 28), (width - 28, height - 28)], outline=BRONZE_COLOR, width=3)
    draw.rectangle([(38, 38), (width - 38, height - 38)], outline=SUBTLE_BORDER, width=1)
    draw.rectangle([(48, 48), (width - 48, height - 48)], outline=BRONZE_DARK, width=2)

    # Corner corner ornaments
    corners = [(48, 48), (width - 48, 48), (48, height - 48), (width - 48, height - 48)]
    for cx, cy in corners:
        draw.ellipse([(cx - 7, cy - 7), (cx + 7, cy + 7)], fill=BRONZE_COLOR)

    # 2. Logo at top
    current_y = 80
    if logo_img:
        logo_resized = logo_img.resize((150, 150), Image.Resampling.LANCZOS)
        lx = (width - 150) // 2
        im.paste(logo_resized, (lx, current_y), logo_resized)
        current_y += 165
    else:
        current_y += 20

    # 3. Cafe Name
    current_y = draw_centered_text(draw, "TWO HEARTS CAFE", current_y, font_title, INK_COLOR, width) + 10
    current_y = draw_centered_text(draw, "Daily 12 PM - 12 AM  *  Pillar #852, Muradnagar", current_y, font_subtitle, BRONZE_DARK, width) + 25

    # 4. Table Badge (Pill button style)
    badge_text = f"TABLE  # {table_num}"
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bw, bh = tw + 70, th + 24
    bx = (width - bw) // 2
    by = current_y

    draw.rounded_rectangle([(bx, by), (bx + bw, by + bh)], radius=bh//2, fill=INK_COLOR)
    draw.text((bx + 35, by + 10), badge_text, font=font_badge, fill=WHITE)
    current_y = by + bh + 35

    # 5. QR Code in White Box
    url = f"https://twoheartscafe.in/?table={table_num}"
    qr_img = create_qr_image(url, box_size=15, border=1)
    qr_w, qr_h = qr_img.size

    # White container card for QR code
    card_padding = 24
    card_w, card_h = qr_w + card_padding * 2, qr_h + card_padding * 2
    card_x = (width - card_w) // 2
    card_y = current_y

    # Drop shadow effect
    draw.rounded_rectangle([(card_x + 6, card_y + 6), (card_x + card_w + 6, card_y + card_h + 6)], radius=16, fill=(228, 220, 208))
    draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + card_h)], radius=16, fill=WHITE, outline=BRONZE_COLOR, width=2)

    # Paste QR Code
    im.paste(qr_img, (card_x + card_padding, card_y + card_padding), qr_img)

    # Optional mini logo in center of QR code
    if logo_img:
        center_logo_size = int(qr_w * 0.2)
        c_logo = logo_img.resize((center_logo_size, center_logo_size), Image.Resampling.LANCZOS)
        clx = card_x + card_padding + (qr_w - center_logo_size) // 2
        cly = card_y + card_padding + (qr_h - center_logo_size) // 2
        # White circular backing for center logo
        pad = 6
        draw.rounded_rectangle([(clx - pad, cly - pad), (clx + center_logo_size + pad, cly + center_logo_size + pad)], radius=12, fill=WHITE, outline=BRONZE_COLOR, width=2)
        im.paste(c_logo, (clx, cly), c_logo)

    current_y = card_y + card_h + 40

    # 6. Instructions
    current_y = draw_centered_text(draw, "SCAN CAMERA TO VIEW MENU & ORDER", current_y, font_instruction, INK_COLOR, width) + 8
    current_y = draw_centered_text(draw, "No app download required  *  Instant live kitchen ordering", current_y, font_sub_instruction, BRONZE_DARK, width) + 40

    # 7. Divider Line
    div_w = 400
    div_x = (width - div_w) // 2
    draw.line([(div_x, current_y), (div_x + div_w, current_y)], fill=BRONZE_COLOR, width=1)
    draw.ellipse([(width // 2 - 4, current_y - 4), (width // 2 + 4, current_y + 4)], fill=BRONZE_COLOR)
    current_y += 24

    # 8. Footer Info
    draw_centered_text(draw, "Shivam Vihar Colony, Pillar No. 852, Muradnagar", current_y, font_footer1, (100, 80, 65), width)
    draw_centered_text(draw, "Helpline / Table Assistance: +91 90270 12158", current_y + 28, font_footer2, INK_COLOR, width)

    # Save high-res JPG (95% quality)
    out_path = os.path.join(OUTPUT_DIR, "standees", f"Table_{table_num:02d}_Standee.jpg")
    im.save(out_path, "JPEG", quality=95, optimize=True)
    return out_path

def generate_pure_qr(table_num):
    # Compact square format ideal for table stickers (900 x 1050 px)
    width, height = 900, 1050
    im = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(im)

    # Border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=BRONZE_COLOR, width=3)
    draw.rectangle([(28, 28), (width - 28, height - 28)], outline=SUBTLE_BORDER, width=1)

    # Table Header
    current_y = 48
    badge_text = f"TWO HEARTS CAFE  -  TABLE #{table_num}"
    draw_centered_text(draw, badge_text, current_y, font_pure_title, INK_COLOR, width)
    current_y += 65

    # QR Code
    url = f"https://twoheartscafe.in/?table={table_num}"
    qr_img = create_qr_image(url, box_size=18, border=1)
    qr_w, qr_h = qr_img.size

    # White box
    card_pad = 20
    cw, ch = qr_w + card_pad * 2, qr_h + card_pad * 2
    cx = (width - cw) // 2
    cy = current_y

    draw.rounded_rectangle([(cx, cy), (cx + cw, cy + ch)], radius=14, fill=WHITE, outline=BRONZE_COLOR, width=2)
    im.paste(qr_img, (cx + card_pad, cy + card_pad), qr_img)

    if logo_img:
        center_size = int(qr_w * 0.18)
        c_logo = logo_img.resize((center_size, center_size), Image.Resampling.LANCZOS)
        clx = cx + card_pad + (qr_w - center_size) // 2
        cly = cy + card_pad + (qr_h - center_size) // 2
        draw.rounded_rectangle([(clx - 5, cly - 5), (clx + center_size + 5, cly + center_size + 5)], radius=10, fill=WHITE, outline=BRONZE_COLOR, width=2)
        im.paste(c_logo, (clx, cly), c_logo)

    current_y = cy + ch + 35
    draw_centered_text(draw, "Scan with phone camera to order", current_y, font_pure_sub, BRONZE_DARK, width)

    out_path = os.path.join(OUTPUT_DIR, "pure_qr", f"Table_{table_num:02d}_QR.jpg")
    im.save(out_path, "JPEG", quality=95, optimize=True)
    return out_path

print("Starting generation of 10 table QR codes...")
standee_files = []
pure_files = []
for t in range(1, 11):
    s_path = generate_table_standee(t)
    p_path = generate_pure_qr(t)
    standee_files.append(s_path)
    pure_files.append(p_path)
    print(f"Generated Table {t}: {s_path} & {p_path}")

print("All 10 tables generated successfully!")

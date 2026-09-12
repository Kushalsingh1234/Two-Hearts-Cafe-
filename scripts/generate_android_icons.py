import os
from PIL import Image, ImageDraw

def generate_android_icons():
    src_path = "public/logo.png"
    if not os.path.exists(src_path):
        print("Source logo not found at public/logo.png")
        return

    src = Image.open(src_path).convert("RGBA")

    # Mipmap densities and sizes: (icon_size, foreground_size)
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }

    base_res = "android/app/src/main/res"

    for folder, (icon_size, fg_size) in densities.items():
        dir_path = os.path.join(base_res, folder)
        os.makedirs(dir_path, exist_ok=True)

        # 1. Generate ic_launcher_foreground.png
        # Adaptive icon foreground is fg_size x fg_size, logo sits in ~66% center safe area
        fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        logo_size = int(fg_size * 0.70)
        logo_resized = src.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        offset = (fg_size - logo_size) // 2
        fg_canvas.paste(logo_resized, (offset, offset), logo_resized)
        fg_canvas.save(os.path.join(dir_path, "ic_launcher_foreground.png"), "PNG", optimize=True)

        # 2. Generate ic_launcher.png (legacy square launcher)
        square_canvas = Image.new("RGBA", (icon_size, icon_size), (255, 255, 255, 255))
        sq_logo_size = int(icon_size * 0.88)
        sq_logo = src.resize((sq_logo_size, sq_logo_size), Image.Resampling.LANCZOS)
        sq_offset = (icon_size - sq_logo_size) // 2
        square_canvas.paste(sq_logo, (sq_offset, sq_offset), sq_logo)
        square_canvas.save(os.path.join(dir_path, "ic_launcher.png"), "PNG", optimize=True)

        # 3. Generate ic_launcher_round.png (circular launcher)
        round_canvas = Image.new("RGBA", (icon_size, icon_size), (0, 0, 0, 0))
        mask = Image.new("L", (icon_size, icon_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, icon_size - 1, icon_size - 1), fill=255)

        bg_circle = Image.new("RGBA", (icon_size, icon_size), (255, 255, 255, 255))
        round_logo_size = int(icon_size * 0.84)
        round_logo = src.resize((round_logo_size, round_logo_size), Image.Resampling.LANCZOS)
        r_offset = (icon_size - round_logo_size) // 2
        bg_circle.paste(round_logo, (r_offset, r_offset), round_logo)
        round_canvas.paste(bg_circle, (0, 0), mask)
        round_canvas.save(os.path.join(dir_path, "ic_launcher_round.png"), "PNG", optimize=True)

        print(f"Generated icons for {folder}: icon={icon_size}x{icon_size}, fg={fg_size}x{fg_size}")

if __name__ == "__main__":
    generate_android_icons()

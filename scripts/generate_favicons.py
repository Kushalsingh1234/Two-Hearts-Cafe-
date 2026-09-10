import os
from PIL import Image

def generate_icons():
    src_path = "public/logo.png"
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found")
        return

    src_img = Image.open(src_path).convert("RGBA")
    pwa_dir = "public/images/pwa"
    os.makedirs(pwa_dir, exist_ok=True)

    # 1. Favicon sizes (exact multiples of 48px for Google Search)
    sizes = {
        "favicon-48.png": 48,
        "favicon-96.png": 96,
        "favicon-144.png": 144,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }

    for name, size in sizes.items():
        out_path = os.path.join(pwa_dir, name)
        resized = src_img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, "PNG", optimize=True)
        print(f"Created {out_path} ({size}x{size})")

    # 2. Apple Touch Icon (180x180) in public root
    apple_icon = src_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save("public/apple-touch-icon.png", "PNG", optimize=True)
    print("Created public/apple-touch-icon.png (180x180)")

    # 3. Multi-resolution favicon.ico (16, 32, 48) for root /favicon.ico
    ico_img = src_img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Created public/favicon.ico (16, 32, 48)")

    # 4. Maskable icons for PWA (with ~10% safe-padding around circular logo)
    for name, size in [("icon-maskable-192.png", 192), ("icon-maskable-512.png", 512)]:
        canvas = Image.new("RGBA", (size, size), (250, 247, 242, 255))
        inner_size = int(size * 0.82)
        inner = src_img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (size - inner_size) // 2
        canvas.paste(inner, (offset, offset), inner)
        canvas.save(os.path.join(pwa_dir, name), "PNG", optimize=True)
        print(f"Created {name} ({size}x{size})")

if __name__ == "__main__":
    generate_icons()

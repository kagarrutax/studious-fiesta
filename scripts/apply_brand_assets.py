from PIL import Image
from pathlib import Path

logo_path = Path(
    r"C:\Users\casti\.cursor\projects\c-laragon-www-studious-fiesta\assets"
    r"\c__Users_casti_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"1847fe19f4e3cef0849c09af1f5ca193_images_ChatGPT_Image_13_ago_2026__"
    r"11_27_53-5eb90838-5769-4ab6-8991-dce760a50264.png"
)
brand_path = Path(
    r"C:\Users\casti\.cursor\projects\c-laragon-www-studious-fiesta\assets"
    r"\c__Users_casti_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"1847fe19f4e3cef0849c09af1f5ca193_images_studios-party-"
    r"dee723c3-c13f-45b4-9b7e-4741c8ea0840.png"
)
out_mobile = Path(r"C:\laragon\www\studious-fiesta\mobile\assets\images")
out_web = Path(r"C:\laragon\www\studious-fiesta\frontend\public")
out_web_src = Path(r"C:\laragon\www\studious-fiesta\frontend\src\assets")
out_docs = Path(r"C:\laragon\www\studious-fiesta\docs")
out_mobile.mkdir(parents=True, exist_ok=True)
out_web.mkdir(parents=True, exist_ok=True)
out_web_src.mkdir(parents=True, exist_ok=True)

BG = (15, 45, 35, 255)  # #0F2D23

src = Image.open(logo_path).convert("RGBA")
w, h = src.size
pixels = src.load()
minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a > 20 and (r + g + b) > 40:
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)
pad = 8
box = (max(0, minx - pad), max(0, miny - pad), min(w, maxx + pad + 1), min(h, maxy + pad + 1))
logo = src.crop(box)
print("logo crop", logo.size, "from", box)


def fit_square(img, size, bg=BG, scale=0.92):
    canvas = Image.new("RGBA", (size, size), bg)
    iw, ih = img.size
    target = int(size * scale)
    ratio = min(target / iw, target / ih)
    nw, nh = max(1, int(iw * ratio)), max(1, int(ih * ratio))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas


def to_rgb(img, bg=BG):
    base = Image.new("RGBA", img.size, bg)
    base.alpha_composite(img)
    return base.convert("RGB")


icon = fit_square(logo, 1024, BG, 0.96)
icon.save(out_mobile / "icon.png")

fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
iw, ih = logo.size
target = int(1024 * 0.72)
ratio = min(target / iw, target / ih)
nw, nh = max(1, int(iw * ratio)), max(1, int(ih * ratio))
resized = logo.resize((nw, nh), Image.Resampling.LANCZOS)
fg.alpha_composite(resized, ((1024 - nw) // 2, (1024 - nh) // 2))
fg.save(out_mobile / "android-icon-foreground.png")

Image.new("RGB", (1024, 1024), BG[:3]).save(out_mobile / "android-icon-background.png")

mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
gray = resized.convert("L")
alpha = gray.point(lambda p: 255 if p > 30 else 0)
mono_layer = Image.new("RGBA", resized.size, (255, 255, 255, 0))
mono_layer.putalpha(alpha)
mono.alpha_composite(mono_layer, ((1024 - nw) // 2, (1024 - nh) // 2))
mono.save(out_mobile / "android-icon-monochrome.png")

fit_square(logo, 1024, BG, 0.62).save(out_mobile / "splash-icon.png")
fav = fit_square(logo, 192, BG, 0.96)
fav.save(out_mobile / "favicon.png")
fav.save(out_web / "favicon.png")
fit_square(logo, 64, BG, 0.98).save(out_web / "favicon-32.png")

brand_logo = fit_square(logo, 512, BG, 0.98)
brand_logo.save(out_web / "logo.png")
brand_logo.save(out_web_src / "logo.png")
brand_logo.save(out_docs / "brand-logo.png")
Image.open(brand_path).convert("RGB").save(out_docs / "brand-guide.png", quality=90)
fit_square(logo, 180, BG, 0.96).save(out_web / "apple-touch-icon.png")
print("done")

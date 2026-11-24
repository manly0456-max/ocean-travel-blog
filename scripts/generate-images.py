"""
scripts/generate-images.py – SINH ẢNH MINH HOẠ PHONG CẢNH (không cần ảnh bản quyền)
Chạy:  python3 scripts/generate-images.py
Kết quả: public/assets/img/*.jpg
Bạn có thể thay bằng ảnh thật của mình, chỉ cần giữ đúng tên file.
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "img")
os.makedirs(OUT, exist_ok=True)
W, H = 1200, 800


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(w, h, stops):
    """Nền chuyển màu dọc qua nhiều điểm màu."""
    img = Image.new("RGB", (w, h))
    px = img.load()
    cols = [hex2rgb(c) for c in stops]
    n = len(cols) - 1
    for y in range(h):
        t = y / (h - 1) * n
        i = min(int(t), n - 1)
        c = lerp(cols[i], cols[i + 1], t - i)
        for x in range(w):
            px[x, y] = c
    return img


def ridge(w, base, amp, rough, seed):
    """Đường sống núi bằng thuật toán chia đôi trung điểm (midpoint displacement)."""
    rnd = random.Random(seed)
    n = 256                                   # số đoạn (luỹ thừa của 2)
    ys = [0.0] * (n + 1)
    ys[0], ys[n] = base + rnd.uniform(-amp, amp), base + rnd.uniform(-amp, amp)
    step, a = n, amp
    while step > 1:
        half = step // 2
        for i in range(0, n, step):
            ys[i + half] = (ys[i] + ys[i + step]) / 2 + rnd.uniform(-a, a)
        step, a = half, a * rough
    return [(i * w / n, ys[i]) for i in range(n + 1)]


def layer(img, points, color, alpha=255, blur=0):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    poly = points + [(img.width, img.height), (0, img.height)]
    d.polygon(poly, fill=hex2rgb(color) + (alpha,))
    if blur:
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
    img.paste(lay, (0, 0), lay)


def glow(img, cx, cy, r, color, strength=200):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse([cx - r * 3, cy - r * 3, cx + r * 3, cy + r * 3], fill=hex2rgb(color) + (strength // 3,))
    lay = lay.filter(ImageFilter.GaussianBlur(r * 1.6))
    img.paste(lay, (0, 0), lay)
    d2 = ImageDraw.Draw(img)
    d2.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hex2rgb(color))


def sea(img, top, c1, c2, sun_x=None, sun_col="#ffffff", seed=1):
    rnd = random.Random(seed)
    sea_img = gradient(img.width, img.height - top, [c1, c2])
    img.paste(sea_img, (0, top))
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(260):  # vệt sóng lấp lánh
        y = rnd.uniform(top + 4, img.height)
        depth = (y - top) / (img.height - top)
        x = rnd.uniform(0, img.width)
        if sun_x is not None and rnd.random() < 0.55:
            x = sun_x + rnd.gauss(0, 40 + depth * 120)
        ln = 10 + depth * 70
        d.line([(x - ln / 2, y), (x + ln / 2, y)], fill=hex2rgb(sun_col) + (int(40 + 90 * (1 - depth)),), width=2)


def fog(img, y, color="#ffffff", alpha=110, blur=30):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rectangle([0, y - 40, img.width, y + 40], fill=hex2rgb(color) + (alpha,))
    lay = lay.filter(ImageFilter.GaussianBlur(blur))
    img.paste(lay, (0, 0), lay)


def grain(img, amount=10, seed=3):
    rnd = random.Random(seed)
    noise = Image.effect_noise(img.size, amount).convert("RGB")
    return Image.blend(img, noise, 0.04)


def save(img, name):
    img = grain(img)
    img.save(os.path.join(OUT, name), "JPEG", quality=84, optimize=True, progressive=True)
    print("✔", name)


# ---------------------------------------------------------------- CẢNH
def halong():
    img = gradient(W, H, ["#0b2a4a", "#2f7fb5", "#9fe3d8"])
    glow(img, 860, 300, 45, "#fff5d6")
    sea(img, 560, "#2a8fb0", "#06233f", sun_x=860, sun_col="#d9fff5")
    rnd = random.Random(7)
    for depth, col in [(0, "#5f9fbf"), (1, "#2f6f8f"), (2, "#123b5a")]:  # cột đá vôi
        for _ in range(6 - depth):
            cx = rnd.uniform(0, W)
            wd = rnd.uniform(60, 140) * (1 + depth * 0.4)
            ht = rnd.uniform(140, 300) * (1 + depth * 0.35)
            pts = [(cx - wd / 2, 562)]
            for k in range(12):
                t = k / 11
                pts.append((cx - wd / 2 + wd * t, 562 - ht * math.sin(math.pi * t) ** 0.35 + rnd.uniform(-10, 10)))
            pts.append((cx + wd / 2, 562))
            d = ImageDraw.Draw(img)
            d.polygon(pts, fill=hex2rgb(col))
        fog(img, 520 - depth * 30, alpha=70)
    save(img, "halong.jpg")


def sapa():
    img = gradient(W, H, ["#13355c", "#4c9cc6", "#bff3e6"])
    glow(img, 300, 210, 40, "#fff8e1")
    for i, col in enumerate(["#7fb9cf", "#4f8fae", "#2b6a86", "#16485f", "#0b2d40"]):
        layer(img, ridge(W, 330 + i * 85, 90 - i * 10, 0.55, 11 + i), col)
        if i < 3:
            fog(img, 380 + i * 90, alpha=120)
    d = ImageDraw.Draw(img, "RGBA")
    for k in range(18):  # ruộng bậc thang
        y = 610 + k * 12
        d.arc([-200, y - 120, W + 200, y + 160], 190, 350, fill=(159, 227, 196, 120), width=3)
    save(img, "sapa.jpg")


def hoian():
    img = gradient(W, H, ["#0a1e3a", "#20507a", "#3f8fa8"])
    sea(img, 600, "#174a6a", "#061a30", sun_x=None, sun_col="#ffd9a0")
    d = ImageDraw.Draw(img)
    rnd = random.Random(5)
    x = 0
    while x < W:  # dãy nhà cổ
        wd = rnd.randint(110, 180)
        ht = rnd.randint(150, 260)
        d.rectangle([x, 600 - ht, x + wd, 600], fill=hex2rgb("#0b2238"))
        d.polygon([(x - 12, 600 - ht), (x + wd / 2, 600 - ht - 50), (x + wd + 12, 600 - ht)], fill=hex2rgb("#08192b"))
        for wy in range(600 - ht + 30, 590, 55):
            d.rectangle([x + 20, wy, x + 45, wy + 25], fill=hex2rgb("#ffcf8a"))
        x += wd + 6
    for _ in range(26):  # đèn lồng
        cx, cy = rnd.uniform(0, W), rnd.uniform(120, 420)
        col = rnd.choice(["#ffb86b", "#ff8f70", "#ffe08a", "#7ff0d0"])
        d.line([(cx, cy - 40), (cx, cy - 18)], fill=(30, 40, 60), width=2)
        glow(img, int(cx), int(cy), rnd.randint(10, 18), col, 230)
    save(img, "hoian.jpg")


def phuquoc():
    img = gradient(W, H, ["#1b3d6e", "#e88b7a", "#ffd39a"])
    glow(img, 600, 520, 70, "#fff0c2")
    sea(img, 540, "#3b7fa6", "#082a48", sun_x=600, sun_col="#ffe6b0")
    d = ImageDraw.Draw(img)
    for i in range(7):  # cây dừa
        a = -0.9 + i * 0.3
        d.line([(170, 260), (170 + 230 * math.cos(a), 260 + 120 * math.sin(a) + 60)], fill=(10, 30, 45), width=14)
    d.line([(120, 800), (170, 260)], fill=(10, 30, 45), width=18)
    save(img, "phuquoc.jpg")


def hagiang():
    img = gradient(W, H, ["#0e2f52", "#3a86b4", "#a8ecdc"])
    for i, col in enumerate(["#6fa7c2", "#3d7c9a", "#1f5872"]):
        layer(img, ridge(W, 260 + i * 70, 120, 0.6, 21 + i), col)
        fog(img, 330 + i * 70, alpha=90)
    d = ImageDraw.Draw(img)
    left = ridge(W, 0, 1, 0.5, 4)
    d.polygon([(0, 430), (480, 520), (560, 800), (0, 800)], fill=hex2rgb("#0b2c3e"))
    d.polygon([(W, 400), (720, 520), (640, 800), (W, 800)], fill=hex2rgb("#0a2534"))
    pts = [(600 + 40 * math.sin(y / 45), y) for y in range(520, 801, 10)]  # sông Nho Quế
    for w_, col in [(26, "#2fd3b5"), (12, "#9ff5e2")]:
        d.line(pts, fill=hex2rgb(col), width=w_)
    save(img, "hagiang.jpg")


def kyoto():
    img = gradient(W, H, ["#16365e", "#5aa8c8", "#ffd7c2"])
    glow(img, 860, 260, 50, "#fff3e0")
    layer(img, ridge(W, 470, 70, 0.55, 31), "#3a6f8c")
    fog(img, 500, alpha=110)
    layer(img, ridge(W, 560, 40, 0.5, 32), "#1d4a63")
    d = ImageDraw.Draw(img)
    red = hex2rgb("#d9483b")
    d.rectangle([380, 300, 820, 330], fill=red)            # cổng torii
    d.polygon([(350, 290), (850, 290), (870, 270), (330, 270)], fill=hex2rgb("#a93228"))
    d.rectangle([410, 370, 790, 388], fill=red)
    d.rectangle([440, 330, 475, 800], fill=red)
    d.rectangle([725, 330, 760, 800], fill=red)
    rnd = random.Random(9)
    for _ in range(140):  # lá phong rơi
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        r = rnd.uniform(3, 7)
        d.ellipse([x - r, y - r, x + r, y + r], fill=rnd.choice([(255, 140, 90), (240, 90, 70), (255, 190, 110)]))
    save(img, "kyoto.jpg")


def bali():
    img = gradient(W, H, ["#0f3a5c", "#4fb0c6", "#c9f7e4"])
    glow(img, 950, 220, 42, "#fffbe8")
    layer(img, ridge(W, 330, 80, 0.55, 41), "#4f9b8f")
    for i in range(10):  # bậc thang xanh
        col = lerp(hex2rgb("#5fd0a6"), hex2rgb("#0f4f46"), i / 9)
        pts = [(x, y + 40 + i * 42) for x, y in ridge(W, 360, 25, 0.4, 50 + i)]
        layer(img, pts, "#%02x%02x%02x" % col)
    d = ImageDraw.Draw(img)
    for k in range(5):  # tháp đền nhiều tầng
        wd = 120 - k * 22
        d.rectangle([200 - wd / 2, 420 - k * 34, 200 + wd / 2, 445 - k * 34], fill=(12, 40, 52))
    save(img, "bali.jpg")


def bangkok():
    img = gradient(W, H, ["#050f24", "#122f5a", "#1f6f8f"])
    rnd = random.Random(12)
    d = ImageDraw.Draw(img)
    x = 0
    while x < W:  # toà nhà
        wd, ht = rnd.randint(60, 130), rnd.randint(180, 520)
        d.rectangle([x, 640 - ht, x + wd, 640], fill=(8, 20, 40))
        for wy in range(640 - ht + 12, 630, 22):
            for wx in range(x + 8, x + wd - 8, 16):
                if rnd.random() < 0.45:
                    d.rectangle([wx, wy, wx + 7, wy + 10], fill=rnd.choice([(127, 240, 208), (255, 214, 140), (120, 190, 255)]))
        x += wd + 4
    sea(img, 640, "#0c3050", "#020a18", sun_x=600, sun_col="#7ff0d0")
    for _ in range(18):
        glow(img, int(rnd.uniform(0, W)), int(rnd.uniform(560, 630)), rnd.randint(5, 9), rnd.choice(["#ff7aa8", "#7ff0d0", "#ffd36b"]), 220)
    save(img, "bangkok.jpg")


def hue():
    img = gradient(W, H, ["#1a3f66", "#77b7cf", "#ffe2b8"])
    glow(img, 300, 300, 55, "#fff2d6")
    sea(img, 580, "#3d8aa8", "#0a2a44", sun_x=300, sun_col="#ffeec8")
    d = ImageDraw.Draw(img)
    c = hex2rgb("#173247")
    d.rectangle([380, 380, 820, 580], fill=c)              # cổng Ngọ Môn cách điệu
    d.rectangle([540, 470, 660, 580], fill=hex2rgb("#0b1d2a"))
    d.pieslice([540, 420, 660, 520], 180, 360, fill=hex2rgb("#0b1d2a"))
    for k, (wd, y) in enumerate([(480, 380), (380, 330), (260, 285)]):
        d.polygon([(600 - wd / 2 - 30, y), (600 + wd / 2 + 30, y), (600 + wd / 2, y - 38), (600 - wd / 2, y - 38)], fill=hex2rgb("#0f2638"))
        d.rectangle([600 - wd / 2 + 20, y - 38, 600 + wd / 2 - 20, y - 20], fill=c) if k < 2 else None
    save(img, "hue.jpg")


def santorini():
    img = gradient(W, H, ["#0f4f8a", "#5cc0e6", "#d8fbf2"])
    sea(img, 430, "#1f7fbf", "#06315c", sun_x=950, sun_col="#ffffff")
    d = ImageDraw.Draw(img)
    d.polygon([(0, 380), (700, 470), (760, 800), (0, 800)], fill=hex2rgb("#c9b9a6"))
    rnd = random.Random(15)
    for row in range(6):  # nhà trắng
        for col in range(7 - row // 2):
            x = 20 + col * 95 + row * 18 + rnd.randint(-8, 8)
            y = 430 + row * 62 + rnd.randint(-6, 6)
            if x > 680 - row * 10:
                continue
            d.rectangle([x, y, x + 80, y + 58], fill=(248, 250, 252))
            d.rectangle([x + 30, y + 22, x + 46, y + 58], fill=hex2rgb("#2a7fc0"))
            if rnd.random() < 0.35:
                d.pieslice([x + 10, y - 40, x + 70, y + 20], 180, 360, fill=hex2rgb("#1f6fd1"))
    save(img, "santorini.jpg")


def hero():
    global W, H
    W, H = 1920, 1080
    img = gradient(W, H, ["#041a33", "#0e4a7a", "#3fb3c4", "#bdf7e6"])
    glow(img, 1400, 640, 80, "#fff8e3")
    for i, col in enumerate(["#3e86a8", "#205f80"]):
        layer(img, ridge(W, 610 + i * 40, 90, 0.55, 61 + i), col)
        fog(img, 640 + i * 30, alpha=100, blur=40)
    sea(img, 720, "#1d84a8", "#021a33", sun_x=1400, sun_col="#d5fff3", seed=8)
    save(img, "hero.jpg")
    W, H = 1200, 800


def about():
    img = gradient(W, H, ["#06223f", "#1d6f9a", "#7fe0cf"])
    glow(img, 600, 300, 60, "#f3fff9")
    layer(img, ridge(W, 480, 50, 0.5, 71), "#14506f")
    sea(img, 560, "#1a7aa0", "#041d36", sun_x=600, sun_col="#e8fff8")
    d = ImageDraw.Draw(img)
    d.polygon([(0, 520), (380, 560), (420, 800), (0, 800)], fill=(8, 30, 45))
    d.ellipse([255, 470, 285, 500], fill=(8, 30, 45))           # người đứng ngắm biển
    d.rectangle([260, 498, 280, 560], fill=(8, 30, 45))
    save(img, "about.jpg")


if __name__ == "__main__":
    for fn in [halong, sapa, hoian, phuquoc, hagiang, kyoto, bali, bangkok, hue, santorini, about, hero]:
        fn()

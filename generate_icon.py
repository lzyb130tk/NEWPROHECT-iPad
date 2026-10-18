"""Regenerate home screen PNG icons from the simple document mark."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SCALE = 4
SIZE = 512 * SCALE
image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

def box(x0, y0, x1, y1):
    return tuple(round(value * SCALE) for value in (x0, y0, x1, y1))

def line(points, color, width):
    points = [(round(x * SCALE), round(y * SCALE)) for x, y in points]
    draw.line(points, fill=color, width=width * SCALE, joint="curve")
    radius = width * SCALE // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)

draw.rounded_rectangle(box(0, 0, 512, 512), radius=104*SCALE, fill="#f7f6f2")
draw.rounded_rectangle(box(120, 92, 392, 420), radius=24*SCALE, fill="white", outline="#37352f", width=12*SCALE)
for x0, y, x1 in [(174, 163, 338), (174, 209, 300), (174, 302, 338), (174, 348, 274)]:
    line([(x0, y), (x1, y)], "#37352f", 14)
line([(174, 255), (316, 255)], "#0f7b6c", 16)
draw.ellipse(box(338, 244, 360, 266), fill="#0f7b6c")

for size in (180, 192, 512):
    image.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / f"icon-{size}.png")

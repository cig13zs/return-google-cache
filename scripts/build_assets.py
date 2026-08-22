from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "extension" / "icons"
STORE_DIR = ROOT / "store-assets"

NAVY = (23, 50, 77, 255)
CREAM = (255, 250, 241, 255)
ORANGE = (230, 106, 44, 255)
TEAL = (13, 117, 104, 255)
LINE = (217, 210, 197, 255)
PALE_TEAL = (220, 238, 233, 255)


def scaled(value: float, scale: float) -> int:
    return round(value * scale)


def logo(size: int) -> Image.Image:
    multiplier = 4
    canvas_size = size * multiplier
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    scale = canvas_size / 128

    box = tuple(scaled(value, scale) for value in (19, 19, 109, 109))
    draw.rounded_rectangle(box, radius=scaled(20, scale), fill=NAVY)

    lens = tuple(scaled(value, scale) for value in (35, 30, 75, 70))
    draw.ellipse(lens, outline=CREAM, width=max(2, scaled(7, scale)))
    draw.line(
        tuple(scaled(value, scale) for value in (68, 65, 84, 81)),
        fill=CREAM,
        width=max(2, scaled(8, scale)),
    )

    arc_box = tuple(scaled(value, scale) for value in (27, 22, 97, 92))
    draw.arc(arc_box, start=205, end=326, fill=ORANGE, width=max(2, scaled(7, scale)))
    arrow = [
        (scaled(88, scale), scaled(70, scale)),
        (scaled(101, scale), scaled(73, scale)),
        (scaled(94, scale), scaled(61, scale)),
    ]
    draw.polygon(arrow, fill=ORANGE)

    draw.rounded_rectangle(
        tuple(scaled(value, scale) for value in (35, 91, 73, 97)),
        radius=scaled(3, scale),
        fill=TEAL,
    )
    draw.rounded_rectangle(
        tuple(scaled(value, scale) for value in (35, 101, 61, 107)),
        radius=scaled(3, scale),
        fill=TEAL,
    )
    return image.resize((size, size), Image.Resampling.LANCZOS)


def promo(width: int, height: int) -> Image.Image:
    multiplier = 2
    image = Image.new("RGBA", (width * multiplier, height * multiplier), NAVY)
    draw = ImageDraw.Draw(image)
    unit = image.height / 280

    def symbol_rect(values: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
        return tuple(scaled(value, unit) for value in values)

    card_left = round(image.width * 0.39)
    card_right = image.width - scaled(7, unit)
    card_top = scaled(36, unit)
    card_bottom = scaled(244, unit)
    card_width = card_right - card_left

    def card_x(fraction: float) -> int:
        return round(card_left + card_width * fraction)

    def card_rect(left: float, top: float, right: float, bottom: float) -> tuple[int, int, int, int]:
        return (card_x(left), scaled(top, unit), card_x(right), scaled(bottom, unit))

    draw.ellipse(symbol_rect((-80, 142, 120, 342)), fill=TEAL)
    draw.arc(symbol_rect((20, 18, 210, 208)), start=35, end=300, fill=ORANGE, width=max(10, scaled(15, unit)))
    arrow = [
        (scaled(163, unit), scaled(45, unit)),
        (scaled(203, unit), scaled(39, unit)),
        (scaled(181, unit), scaled(74, unit)),
    ]
    draw.polygon(arrow, fill=ORANGE)

    draw.rounded_rectangle((card_left, card_top, card_right, card_bottom), radius=scaled(15, unit), fill=CREAM)
    draw.rounded_rectangle(card_rect(0.10, 65, 0.64, 77), radius=scaled(4, unit), fill=(36, 79, 118, 255))
    draw.rounded_rectangle(card_rect(0.10, 91, 0.89, 99), radius=scaled(3, unit), fill=LINE)
    draw.rounded_rectangle(card_rect(0.10, 107, 0.77, 115), radius=scaled(3, unit), fill=LINE)
    draw.rounded_rectangle(card_rect(0.10, 135, 0.32, 147), radius=scaled(5, unit), fill=TEAL)
    draw.rounded_rectangle(card_rect(0.36, 135, 0.62, 147), radius=scaled(5, unit), fill=ORANGE)
    draw.line((card_x(0.10), scaled(171, unit), card_x(0.87), scaled(171, unit)), fill=LINE, width=max(2, scaled(2, unit)))
    draw.rounded_rectangle(card_rect(0.10, 191, 0.63, 203), radius=scaled(4, unit), fill=(36, 79, 118, 255))
    draw.rounded_rectangle(card_rect(0.10, 217, 0.81, 225), radius=scaled(3, unit), fill=LINE)

    draw.ellipse(symbol_rect((48, 72, 125, 149)), outline=CREAM, width=max(6, scaled(10, unit)))
    draw.line(symbol_rect((113, 138, 148, 173)), fill=CREAM, width=max(6, scaled(11, unit)))
    return image.resize((width, height), Image.Resampling.LANCZOS).convert("RGB")


def main() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        logo(size).save(ICON_DIR / f"icon{size}.png", optimize=True)
    promo(440, 280).save(STORE_DIR / "promo-small-440x280.png", optimize=True)
    promo(1400, 560).save(STORE_DIR / "promo-marquee-1400x560.png", optimize=True)
    print("ok, icons and promotional images built")


if __name__ == "__main__":
    main()

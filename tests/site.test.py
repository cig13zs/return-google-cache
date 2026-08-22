from __future__ import annotations

import json
import struct
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"

EXPECTED_MATCHES = [
    "https://www.google.com/search*",
    "https://www.google.co.uk/search*",
    "https://www.google.ca/search*",
    "https://www.google.com.au/search*",
    "https://www.google.de/search*",
    "https://www.google.fr/search*",
    "https://www.google.es/search*",
    "https://www.google.it/search*",
    "https://www.google.nl/search*",
    "https://www.google.co.in/search*",
    "https://www.google.com.br/search*",
    "https://www.google.com.ph/search*",
    "https://www.google.com.mx/search*",
    "https://www.google.co.jp/search*",
]


class PageAudit(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.inline_scripts = 0
        self.scripts: list[str] = []
        self.links: list[str] = []
        self.has_lang = False
        self.has_viewport = False
        self.has_description = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html" and values.get("lang") == "en":
            self.has_lang = True
        if tag == "meta" and values.get("name") == "viewport":
            self.has_viewport = True
        if tag == "meta" and values.get("name") == "description":
            self.has_description = True
        if tag == "script":
            source = values.get("src")
            if source:
                self.scripts.append(source)
            else:
                self.inline_scripts += 1
        if tag in {"link", "script", "img"}:
            target = values.get("href") or values.get("src")
            if target:
                self.links.append(target)


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"not a PNG: {path}"
    return struct.unpack(">II", data[16:24])


manifest = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))
assert manifest["manifest_version"] == 3
assert manifest["permissions"] == ["storage"]
assert "host_permissions" not in manifest
assert "background" not in manifest
assert len(manifest["content_scripts"]) == 1
content_script = manifest["content_scripts"][0]
assert content_script["matches"] == EXPECTED_MATCHES
assert content_script["js"] == ["core.js", "content.js"]
assert content_script["css"] == ["content.css"]
assert all(pattern.startswith("https://www.google.") and pattern.endswith("/search*") for pattern in EXPECTED_MATCHES)

referenced = set(manifest["icons"].values())
referenced.update(manifest["action"]["default_icon"].values())
referenced.update(content_script["js"])
referenced.update(content_script["css"])
referenced.add(manifest["action"]["default_popup"])
referenced.add(manifest["options_page"])
for name in referenced:
    assert (EXTENSION / name).is_file(), f"manifest resource is missing: {name}"

assert png_size(EXTENSION / "icons" / "icon16.png") == (16, 16)
assert png_size(EXTENSION / "icons" / "icon32.png") == (32, 32)
assert png_size(EXTENSION / "icons" / "icon48.png") == (48, 48)
assert png_size(EXTENSION / "icons" / "icon128.png") == (128, 128)

for relative, size in {
    "store-assets/promo-small-440x280.png": (440, 280),
    "store-assets/promo-marquee-1400x560.png": (1400, 560),
    "store-assets/screenshot-settings-1280x800.png": (1280, 800),
    "store-assets/screenshot-results-1280x800.png": (1280, 800),
}.items():
    assert png_size(ROOT / relative) == size, f"wrong dimensions: {relative}"

for page in [ROOT / "index.html", ROOT / "privacy.html", EXTENSION / "popup.html"]:
    text = page.read_text(encoding="utf-8")
    audit = PageAudit()
    audit.feed(text)
    assert audit.has_lang and audit.has_viewport and audit.has_description, f"missing page metadata: {page.name}"
    assert audit.inline_scripts == 0, f"inline script violates MV3-safe page style: {page.name}"
    assert all(not value.startswith(("http://", "https://")) for value in audit.links), f"remote page asset: {page.name}"

popup = (EXTENSION / "popup.html").read_text(encoding="utf-8")
assert 'data-setting="archiveLinks"' in popup
assert 'data-setting="loadMore"' in popup
assert 'role="status"' in popup

combined_css = (ROOT / "styles.css").read_text(encoding="utf-8") + (EXTENSION / "popup.css").read_text(encoding="utf-8")
assert "@media (max-width:" in combined_css
assert "focus-visible" in combined_css
assert "prefers-reduced-motion" in combined_css

text_extensions = {".css", ".html", ".js", ".json", ".md", ".py", ".txt", ".yml"}
bad_characters = {"\u2013", "\u2014", "\u2018", "\u2019", "\u201c", "\u201d", "\u2026", "\ufeff"}
for path in ROOT.rglob("*"):
    if path.is_file() and path.suffix.lower() in text_extensions and "dist" not in path.parts:
        text = path.read_text(encoding="utf-8")
        assert not (bad_characters & set(text)), f"typographic or invisible character in {path.relative_to(ROOT)}"

print("ok, manifest resources, public pages and store assets passed")

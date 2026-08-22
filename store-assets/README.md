# Store assets

The Chrome Web Store files use the Search Restore navy, orange, teal and paper
palette. The promotional images contain no text and remain legible when reduced.

- `promo-small-440x280.png` is the required small promotional image.
- `promo-marquee-1400x560.png` is the optional marquee image.
- `screenshot-settings-1280x800.png` shows the extension's settings page.
- `screenshot-results-1280x800.png` shows the injected controls on a stable local
  result fixture. It is an interface preview, not evidence of a live Google test.

Run `scripts/build_assets.py` after changing the logo geometry. Run
`scripts/capture_store_assets.ps1` after changing either interface. Both scripts
write fixed-size files to this directory.

# Return Google Cache

Google removed the **Cached** link from search results in 2024. This puts a working one back on
every result — pointed at the Wayback Machine and archive.today.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-buy_me_a_coffee-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/jju1s)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/cig13zs/return-google-cache/test.yml?style=flat-square&label=tests)](https://github.com/cig13zs/return-google-cache/actions)

**[cig13zs.github.io/return-google-cache](https://cig13zs.github.io/return-google-cache/)**

For twenty years every Google result had a Cached link — one click to see the page as Google last
saw it, invaluable when a page is down, paywalled, changed, or gone. Google retired it. This adds
it straight back using the Internet Archive, so the workflow you had is the workflow you have again.

Under each result you get a small row:

```
↻ Cached · archive.today · save now
```

- **Cached** — the latest Wayback Machine snapshot
- **archive.today** — its independent mirror
- **save now** — archive the live page this instant

## No server, no tracking

It reads the result links already rendered on your screen and builds archive URLs locally. It
opens no connection of its own, has no analytics, and declares no `permissions` key — it runs only
on Google search pages and can do nothing else.

## Install

Not on the Chrome Web Store yet — load it unpacked (works in Chrome, Edge, Brave, Opera):

1. Download the latest zip from [Releases](https://github.com/cig13zs/return-google-cache/releases) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**.
3. **Load unpacked** → pick the `extension` folder.
4. Search Google — the Cached links are there.

## How it's built

```
extension/
  manifest.json   MV3, runs only on google search pages
  core.js         cacheLinks() + enhance() — pure logic, works in browser and Node
  content.js      injects styling, runs enhance(), re-runs it as results stream in
  popup.html      toolbar popup
  icons/
core.test.js      node core.test.js
```

```bash
node core.test.js
```

The result walk is anchored on each result's `<h3>` title → its link, not on Google's
build-hashed class names, so a redesign doesn't silently break it. Verified against live Google.

## Limits

- **Covers the main Google TLDs** (com, co.uk, ca, de, fr, in, br, ph, jp, …). If your local
  Google domain isn't listed in the manifest, add one line and reload.
- **Archives aren't guaranteed to have every page.** If the Wayback Machine never captured a URL,
  its snapshot page says so — use **save now** to capture it going forward.
- **Reads only organic result links.** Ads, Google's own properties, and image thumbnails are skipped.

MIT licensed. Do what you like with it.

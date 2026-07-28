# Return Google Cache

Google removed the Cached link from search results in 2024. This puts a working
one back on every result, pointed at the Wayback Machine and archive.today.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-buy_me_a_coffee-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/jju1s)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/cig13zs/return-google-cache/test.yml?style=flat-square&label=tests)](https://github.com/cig13zs/return-google-cache/actions)

**[cig13zs.github.io/return-google-cache](https://cig13zs.github.io/return-google-cache/)**

For about twenty years every Google result had a Cached link. One click to see
the page as Google last saw it, which was the thing you reached for when a page
was down, paywalled, changed or gone. Google retired it. This adds it back using
the Internet Archive.

Under each result you get a small row:

```
↻ Cached · archive.today · save now
```

Cached is the latest Wayback Machine snapshot, archive.today is its independent
mirror, and save now archives the live page immediately.

## No server, no tracking

It reads the result links already rendered on your screen and builds archive
URLs locally. It opens no connection of its own, has no analytics, and declares
no `permissions` key. It runs on Google search pages and can do nothing else.

## Install

Not on the Chrome Web Store yet, so load it unpacked. Works in Chrome, Edge,
Brave and Opera.

1. Download the latest zip from [Releases](https://github.com/cig13zs/return-google-cache/releases) and unzip it.
2. Open `chrome://extensions`, turn on Developer mode.
3. Load unpacked, then pick the `extension` folder.
4. Search Google. The Cached links are there.

## Files

```
extension/
  manifest.json   MV3, runs only on google search pages
  core.js         cacheLinks() + enhance(), works in browser and Node
  content.js      injects styling, runs enhance(), re-runs as results stream in
  popup.html      toolbar popup
  icons/
core.test.js      node core.test.js
```

```bash
node core.test.js
```

The result walk is anchored on each result's `<h3>` title and then its link,
rather than on Google's build-hashed class names, so a redesign doesn't silently
break it.

## Limits

Covers the main Google TLDs (com, co.uk, ca, de, fr, in, br, ph, jp and others).
If your local Google domain isn't in the manifest, add one line and reload.

Archives don't have every page. If the Wayback Machine never captured a URL its
snapshot page says so, and you can use save now to capture it going forward.

Reads organic result links only. Ads, Google's own properties and image
thumbnails are skipped.

## More tools

- [Carryover](https://github.com/cig13zs/carryover), AI chat context transfer for ChatGPT, DeepSeek and Grok
- [Invisibles](https://github.com/cig13zs/invisibles), reveal and strip hidden Unicode from text
- [Rinse](https://github.com/cig13zs/rinse), see the GPS in a photo and wash it off
- [Return 100 Results](https://github.com/cig13zs/return-100-results), browse ~100 Google results as one page

Not affiliated with Google or the Internet Archive. MIT licensed.
[Ko-fi](https://ko-fi.com/jju1s) if you want to.

# Search Restore

Search Restore combines two Google Search repairs in one Chrome extension:
archive links under normal results and a button that loads later result pages
into the current list.

[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/jju1s)
[![License](https://img.shields.io/badge/license-MIT-17324d?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/cig13zs/search-restore/test.yml?style=flat-square&label=tests)](https://github.com/cig13zs/search-restore/actions)

## Features

Archive links can open the latest Wayback Machine capture, check archive.today
or save the live page. The load-more button requests one Google result page per
click and stops near 100 results.

Each feature has its own switch. The switches default to on and are stored with
`chrome.storage.local`.

## Install

1. Download the release ZIP and extract it.
2. Open `chrome://extensions` and turn on Developer mode.
3. Choose Load unpacked and select the extracted folder.
4. Open a supported Google search page.

The ZIP puts `manifest.json` at its root, so the extracted folder is the one to
select. Chrome, Edge, Brave and Opera can load MV3 extensions this way.

## Scope and privacy

The manifest declares only the `storage` permission. It has no
`host_permissions` key. Its content script is limited to the HTTPS `/search`
path on the Google domains listed in `manifest.json`, with a second runtime
check that requires `location.pathname === '/search'`.

Chrome may describe that content-script scope as permission to read and change
data on the listed Google sites. That access is what lets Search Restore inspect
the visible result links and add controls to the search page; it does not cover
other sites or other Google paths.

There is no analytics or extension server. The two switches stay in local
extension storage. Google receives a request only when the user presses the
load-more button. An archive service opens only after the user chooses its link.
See [PRIVACY.md](PRIVACY.md) for the full policy.

## Build and test

Node and Python are enough for the release checks.

```text
node tests/core.test.js
node tests/content.test.js
python scripts/package.py
python tests/site.test.py
python tests/package.test.py
```

`scripts/package.py` writes a sorted ZIP with fixed timestamps, then writes its
SHA-256 checksum. `tests/package.test.py` builds twice in temporary directories
and compares the bytes.

## Google markup limits

This extension is a page repair, not an official Google API client. The archive
feature looks for result title links under `#rso`. Pagination uses the `start`
query parameter and extracts result blocks from the next page. Google can change
either behavior without notice.

A read-only check on August 23, 2026 found one `#rso` container and seven linked
`h3` result titles for the query `example`. The same check found no captcha. See
[MAINTENANCE.md](MAINTENANCE.md) for the selectors and failure cases that need
watching.

## Files

```text
extension/           Chrome MV3 package source
scripts/package.py   deterministic ZIP and checksum builder
store-assets/        Chrome Web Store artwork and screenshots
tests/               core, content, manifest, page and package checks
```

Not affiliated with Google, the Internet Archive or archive.today. MIT licensed.

# Maintenance notes

Search Restore changes a page it does not control. Keep these assumptions in the
release checklist.

## Current Google result structure

On August 23, 2026, a read-only browser check of
`https://www.google.com/search?q=example&hl=en&gl=us&pws=0` returned:

- one `#rso` result container;
- seven `h3` elements with a closest external link;
- one `.MjjYud` wrapper per linked result;
- no unusual-traffic or captcha page.

The extension uses `#rso` and linked `h3` elements as its main result signals.
`.MjjYud` is only the preferred pagination wrapper. A generic single-heading
ancestor is the fallback because generated Google class names can change.

The production `core.js` and `content.js` files were also run in a fresh
logged-out tab. They added seven archive rows and one load control. One click
fetched `start=10`, found nine new result blocks, raised the linked-title count
from 7 to 16 and changed the button to `Load results 21-30`.

That test found a false block signal in the first detector: Google's normal page
scripts contain literal `/sorry/index` checks. `looksBlocked()` now strips script
and style blocks before using its HTML fallback. The response status and an
actual redirect to `/sorry/` remain the primary checks in `content.js`.

## Known failure cases

The extension intentionally does nothing when `/search` has no `#rso` block.
This includes some AI Mode, consent and zero-result layouts. A Google captcha or
HTTP 429 stops pagination and leaves a status message. The extension does not
attempt to bypass those checks.

If Google removes `start=` pagination, the load-more feature cannot reconstruct
pages that Google no longer serves. If result titles stop using linked `h3`
elements, archive rows will need a new reviewed selector.

## Release check

Use an unsigned, logged-out browser profile. Confirm `#rso`, linked `h3` titles,
archive-row placement and one next-page fetch. Check a normal web query and a
query with an AI Overview. Record limitations instead of marking an untested
layout as working.

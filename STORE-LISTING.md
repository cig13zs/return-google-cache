# Chrome Web Store listing

## Name

Search Restore

## Summary

Add archive links to Google results and load later result pages into the same list.

## Description

Search Restore puts two optional controls on supported Google Search pages.

Archive links appear under normal web results. They open the latest Wayback
Machine capture, archive.today or the Internet Archive save page.

The load-more button requests the next Google results page and places its normal
results below the current list. It loads one page per click and stops near 100
results, when no more results are found or when Google asks for verification.

Both features have separate on/off switches. Preferences stay in local Chrome
extension storage. Search Restore has no analytics, advertising, account system
or extension server.

Google page markup changes over time, so some result layouts may not be handled.
The project documents its current selectors and tests in the public repository.

Search Restore is not affiliated with Google, the Internet Archive or
archive.today.

## Category

Tools

## Permission justification

`storage` saves the two feature switches on the device. No other named
permission is requested. The content script is declared only for the listed
HTTPS Google Search paths and the manifest has no separate `host_permissions`.
Chrome may still describe that declared content-script scope as access to the
listed Google sites; reading and updating the visible results page is the
extension's single purpose.

## Privacy policy

https://cig13zs.github.io/search-restore/privacy.html

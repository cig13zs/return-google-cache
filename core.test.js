/*
 * Covers URL building and result-link detection. The DOM walk is checked in the
 * browser against live Google. Run: node core.test.js
 */
var assert = require('assert');
var RGC = require('./extension/core.js');

// URLs go in raw and query strings must survive intact.
var L = RGC.cacheLinks('https://example.com/a/b?x=1&y=2');
assert.strictEqual(L.wayback, 'https://web.archive.org/web/2/https://example.com/a/b?x=1&y=2');
assert.strictEqual(L.archive, 'https://archive.ph/newest/https://example.com/a/b?x=1&y=2');
assert.strictEqual(L.save, 'https://web.archive.org/save/https://example.com/a/b?x=1&y=2');

// isResultLink: keep external http(s) links, drop google's own / relative / junk.
var host = 'www.google.com';
assert.strictEqual(RGC.isResultLink('https://wikipedia.org/wiki/X', host), true);
assert.strictEqual(RGC.isResultLink('http://news.bbc.co.uk/story', host), true);
assert.strictEqual(RGC.isResultLink('https://www.google.com/search?q=x', host), false);
assert.strictEqual(RGC.isResultLink('https://maps.google.com/place', host), false);
assert.strictEqual(RGC.isResultLink('https://maps.google.co.uk/place', host), false);
assert.strictEqual(RGC.isResultLink('https://news.google.com.ph/story', host), false);
assert.strictEqual(RGC.isResultLink('https://lh3.googleusercontent.com/img', host), false);
assert.strictEqual(RGC.isResultLink('/search?q=next', host), false);   // relative
assert.strictEqual(RGC.isResultLink('#', host), false);
assert.strictEqual(RGC.isResultLink('javascript:void(0)', host), false);
assert.strictEqual(RGC.isResultLink('httpx://example.com/path', host), false);
assert.strictEqual(RGC.isResultLink('data:text/html,hello', host), false);
assert.strictEqual(RGC.isResultLink('', host), false);
assert.strictEqual(RGC.isResultLink(undefined, host), false);

console.log('ok, cache-link and result-filter checks passed');

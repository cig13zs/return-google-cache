/*
 * Covers the pure logic: how a result URL becomes archive links, and which
 * anchors count as real results. The DOM walk (enhance) is verified against
 * live Google in the browser, not here. Run: node core.test.js
 */
var assert = require('assert');
var RGC = require('./extension/core.js');

// cacheLinks: URLs are appended raw (the archives expect the target unescaped),
// and query strings must survive intact.
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
assert.strictEqual(RGC.isResultLink('https://lh3.googleusercontent.com/img', host), false);
assert.strictEqual(RGC.isResultLink('/search?q=next', host), false);   // relative
assert.strictEqual(RGC.isResultLink('#', host), false);
assert.strictEqual(RGC.isResultLink('javascript:void(0)', host), false);
assert.strictEqual(RGC.isResultLink('', host), false);
assert.strictEqual(RGC.isResultLink(undefined, host), false);

console.log('ok — cache-link and result-filter checks passed');

'use strict';

const assert = require('assert');
const SearchRestore = require('../extension/core.js');

assert.deepStrictEqual(SearchRestore.normalizeSettings(), { archiveLinks: true, loadMore: true, autoLoad: false, maxResults: 100 });
assert.deepStrictEqual(SearchRestore.normalizeSettings({ archiveLinks: false }), { archiveLinks: false, loadMore: true, autoLoad: false, maxResults: 100 });
assert.deepStrictEqual(SearchRestore.normalizeSettings({ autoLoad: true, maxResults: 50 }), { archiveLinks: true, loadMore: true, autoLoad: true, maxResults: 50 });
assert.deepStrictEqual(SearchRestore.normalizeSettings({ maxResults: 77 }), { archiveLinks: true, loadMore: true, autoLoad: false, maxResults: 100 }, 'invalid limit falls back');
assert.strictEqual(typeof SearchRestore.collectLoadedUrls, 'function', 'collectLoadedUrls exported');
assert.deepStrictEqual(SearchRestore.normalizeSettings({ loadMore: false }), { archiveLinks: true, loadMore: false, autoLoad: false, maxResults: 100 });

assert.strictEqual(SearchRestore.currentStart('https://www.google.com/search?q=test'), 0);
assert.strictEqual(SearchRestore.currentStart('https://www.google.com/search?q=test&start=40'), 40);
assert.strictEqual(
  SearchRestore.nextPageUrl('https://www.google.co.uk/search?q=a+b&hl=en&start=10', 10),
  'https://www.google.co.uk/search?q=a+b&hl=en&start=20'
);

assert.strictEqual(SearchRestore.looksBlocked('<form action="/sorry/index">'), true);
assert.strictEqual(SearchRestore.looksBlocked('<p>Detected unusual traffic</p>'), true);
assert.strictEqual(SearchRestore.looksBlocked('<div id="recaptcha"></div>'), true);
assert.strictEqual(SearchRestore.looksBlocked('<div id="rso">normal results</div>'), false);
assert.strictEqual(
  SearchRestore.looksBlocked('<script>if (response.url.indexOf("/sorry/index") > -1) stop()</script><div id="rso">normal results</div>'),
  false
);

assert.strictEqual(SearchRestore.isResultLink('https://example.com/page', 'www.google.com'), true);
assert.strictEqual(SearchRestore.isResultLink('http://example.com/page', 'www.google.com'), true);
assert.strictEqual(SearchRestore.isResultLink('https://www.google.com/search?q=x', 'www.google.com'), false);
assert.strictEqual(SearchRestore.isResultLink('https://maps.google.co.uk/place', 'www.google.co.uk'), false);
assert.strictEqual(SearchRestore.isResultLink('https://lh3.googleusercontent.com/image', 'www.google.com'), false);
assert.strictEqual(SearchRestore.isResultLink('/relative', 'www.google.com'), false);
assert.strictEqual(SearchRestore.isResultLink('javascript:void(0)', 'www.google.com'), false);

const archive = SearchRestore.cacheLinks('https://example.com/a?x=1&y=2');
assert.deepStrictEqual(archive, {
  wayback: 'https://web.archive.org/web/2/https://example.com/a?x=1&y=2',
  archiveToday: 'https://archive.ph/newest/https://example.com/a?x=1&y=2',
  save: 'https://web.archive.org/save/https://example.com/a?x=1&y=2'
});

function makeResult(href, title) {
  const block = {
    className: 'MjjYud',
    parentElement: null,
    querySelectorAll(selector) { return selector === 'h3' ? [heading] : []; }
  };
  const anchor = {
    href,
    parentElement: block,
    getAttribute(name) { return name === 'href' ? href : null; },
    closest(selector) {
      if (selector === 'a') return anchor;
      if (selector === '.MjjYud') return block;
      return null;
    }
  };
  const heading = {
    textContent: title,
    closest(selector) { return selector === 'a' ? anchor : null; }
  };
  return { anchor, block, heading };
}

const first = makeResult('https://example.com/one', 'One');
const duplicate = makeResult('https://example.com/one', 'One again');
const google = makeResult('https://news.google.com/story', 'Google property');
const second = makeResult('https://example.net/two', 'Two');
const rso = {
  id: 'rso',
  contains() { return true; },
  querySelectorAll(selector) {
    return selector === 'h3' ? [first.heading, duplicate.heading, google.heading, second.heading] : [];
  }
};

const collected = SearchRestore.collectResults(rso, 'www.google.com');
assert.strictEqual(collected.length, 2);
assert.deepStrictEqual(collected.map(result => result.href), ['https://example.com/one', 'https://example.net/two']);

function FakeParser() {}
FakeParser.prototype.parseFromString = function () {
  return {
    nodeType: 9,
    documentElement: {},
    querySelector(selector) { return selector === '#rso' ? rso : null; }
  };
};
const blocks = SearchRestore.extractResultBlocks('<html></html>', FakeParser, 'www.google.com');
assert.deepStrictEqual(blocks, [first.block, second.block]);

const created = [];
const fakeDocument = {
  createElement(tag) {
    const node = {
      tag,
      children: [],
      attrs: {},
      appendChild(child) { this.children.push(child); },
      setAttribute(name, value) { this.attrs[name] = value; }
    };
    created.push(node);
    return node;
  }
};
const row = SearchRestore.createArchiveRow(fakeDocument, 'https://example.com/page', 'Example page');
assert.strictEqual(row.attrs['data-sr-archive-row'], '1');
assert.strictEqual(row.attrs['aria-label'], 'Archived copies for Example page');
assert.strictEqual(row.children.length, 4);
assert.deepStrictEqual(row.children.slice(1).map(link => link.textContent), ['Wayback', 'archive.today', 'save now']);
assert.ok(row.children.slice(1).every(link => link.target === '_blank' && link.rel === 'noopener noreferrer'));

console.log('ok, Search Restore core behaviors passed');

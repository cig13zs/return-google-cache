'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('extension/content.js', 'utf8');

function buildHarness(initialSettings) {
  let archiveRow = null;
  let loadBar = null;
  let marked = false;
  let storageListener = null;

  const anchorParent = {
    insertBefore(row) { archiveRow = row; }
  };
  const anchor = {
    parentNode: anchorParent,
    nextSibling: null,
    hasAttribute(name) { return name === 'data-sr-archive-added' && marked; },
    setAttribute(name) { if (name === 'data-sr-archive-added') marked = true; },
    removeAttribute(name) { if (name === 'data-sr-archive-added') marked = false; }
  };
  const baseResult = { anchor, heading: { textContent: 'Example result' }, href: 'https://example.com/' };

  function element(tag) {
    return {
      tag,
      children: [],
      attrs: {},
      hidden: false,
      appendChild(child) { this.children.push(child); },
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, handler) { this['on' + name] = handler; },
      remove() { if (this === loadBar) loadBar = null; }
    };
  }

  const resultParent = {
    insertBefore(node) {
      loadBar = node;
    }
  };
  const resultRoot = {
    parentNode: resultParent,
    nextSibling: null,
    appendChild() {}
  };

  const document = {
    body: {},
    documentElement: {},
    createElement: element,
    importNode(node) { return node; },
    querySelector(selector) {
      if (selector === '#rso') return resultRoot;
      if (selector === '[data-sr-load-bar]') return loadBar;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-sr-archive-row]') return archiveRow ? [archiveRow] : [];
      if (selector === '[data-sr-archive-added]') return marked ? [anchor] : [];
      return [];
    }
  };

  const SearchRestore = {
    DEFAULT_SETTINGS: { archiveLinks: true, loadMore: true },
    normalizeSettings(value) {
      value = value || {};
      return { archiveLinks: value.archiveLinks !== false, loadMore: value.loadMore !== false };
    },
    collectResults(root) { return root === document ? [baseResult] : []; },
    createArchiveRow() {
      const row = element('span');
      row.remove = function () { archiveRow = null; };
      return row;
    },
    currentStart() { return 0; },
    extractResultBlocks() { return []; },
    looksBlocked() { return false; }
  };

  const chrome = {
    storage: {
      local: {
        get(defaults, callback) { callback(Object.assign({}, defaults, initialSettings)); }
      },
      onChanged: {
        addListener(listener) { storageListener = listener; }
      }
    }
  };

  function MutationObserver() {}
  MutationObserver.prototype.observe = function () {};

  vm.runInNewContext(source, {
    SearchRestore,
    URL,
    chrome,
    document,
    fetch: async () => { throw new Error('fetch is not expected in toggle tests'); },
    location: { href: 'https://www.google.com/search?q=x', hostname: 'www.google.com', pathname: '/search' },
    MutationObserver,
    setTimeout
  });

  return {
    archiveEnabled() { return Boolean(archiveRow && marked); },
    loadBarEnabled() { return Boolean(loadBar); },
    change(key, oldValue, newValue) {
      storageListener({ [key]: { oldValue, newValue } }, 'local');
    }
  };
}

const both = buildHarness({ archiveLinks: true, loadMore: true });
assert.strictEqual(both.archiveEnabled(), true);
assert.strictEqual(both.loadBarEnabled(), true);
both.change('archiveLinks', true, false);
assert.strictEqual(both.archiveEnabled(), false);
assert.strictEqual(both.loadBarEnabled(), true);
both.change('loadMore', true, false);
assert.strictEqual(both.archiveEnabled(), false);
assert.strictEqual(both.loadBarEnabled(), false);

const archiveOnly = buildHarness({ archiveLinks: true, loadMore: false });
assert.strictEqual(archiveOnly.archiveEnabled(), true);
assert.strictEqual(archiveOnly.loadBarEnabled(), false);

const loadOnly = buildHarness({ archiveLinks: false, loadMore: true });
assert.strictEqual(loadOnly.archiveEnabled(), false);
assert.strictEqual(loadOnly.loadBarEnabled(), true);

console.log('ok, independent feature-toggle behaviors passed');

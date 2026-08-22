(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SearchRestore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_SETTINGS = Object.freeze({
    archiveLinks: true,
    loadMore: true
  });

  function normalizeSettings(value) {
    value = value || {};
    return {
      archiveLinks: value.archiveLinks !== false,
      loadMore: value.loadMore !== false
    };
  }

  function currentStart(href) {
    var url = new URL(href, 'https://www.google.com');
    var value = parseInt(url.searchParams.get('start') || '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function nextPageUrl(href, step) {
    var url = new URL(href, 'https://www.google.com');
    var amount = Number.isFinite(step) && step > 0 ? step : 10;
    url.searchParams.set('start', String(currentStart(url.toString()) + amount));
    return url.toString();
  }

  function looksBlocked(html) {
    var visibleMarkup = String(html || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
    return /<form\b[^>]*action=["'][^"']*\/sorry\//i.test(visibleMarkup) ||
      /id=["'](?:recaptcha|captcha-form)["']/i.test(visibleMarkup) ||
      /detected unusual traffic/i.test(visibleMarkup) ||
      /<title>\s*Sorry\b/i.test(visibleMarkup);
  }

  function isResultLink(href, currentHostname) {
    if (!href) return false;
    try {
      var url = new URL(href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      var hostname = url.hostname.toLowerCase();
      var pageHostname = String(currentHostname || '').toLowerCase();
      if (!hostname || hostname === pageHostname) return false;
      if (/(^|\.)google(?:\.[a-z]{2,3}){1,2}$/i.test(hostname)) return false;
      if (/(^|\.)googleusercontent\.com$/i.test(hostname)) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  function findResultBlock(anchor, resultRoot) {
    var known = anchor.closest ? anchor.closest('.MjjYud') : null;
    if (known && resultRoot.contains(known)) return known;

    var node = anchor;
    var fallback = anchor.parentElement || anchor;
    while (node && node.parentElement && node !== resultRoot) {
      node = node.parentElement;
      if (node === resultRoot) break;
      if (!node.querySelectorAll) continue;
      var ownHeadings = node.querySelectorAll('h3').length;
      if (ownHeadings === 1) fallback = node;
      var parent = node.parentElement;
      if (ownHeadings === 1 && parent && parent.querySelectorAll && parent.querySelectorAll('h3').length > 1) {
        return node;
      }
    }
    return fallback;
  }

  function collectResults(root, currentHostname) {
    if (!root || (!root.querySelectorAll && !root.querySelector)) return [];
    var resultRoot;
    if (root.id === 'rso') resultRoot = root;
    else if (root.nodeType === 9 || root.documentElement) resultRoot = root.querySelector('#rso');
    else resultRoot = root.querySelector('#rso') || root;
    if (!resultRoot) return [];

    var headings = resultRoot.querySelectorAll('h3');
    var seen = Object.create(null);
    var results = [];
    for (var i = 0; i < headings.length; i++) {
      var heading = headings[i];
      var anchor = heading.closest ? heading.closest('a') : null;
      if (!anchor) continue;
      var href = anchor.getAttribute('href') || anchor.href;
      if (!isResultLink(href, currentHostname) || seen[href]) continue;
      seen[href] = true;
      results.push({
        anchor: anchor,
        block: findResultBlock(anchor, resultRoot),
        heading: heading,
        href: href
      });
    }
    return results;
  }

  function cacheLinks(url) {
    return {
      wayback: 'https://web.archive.org/web/2/' + url,
      archiveToday: 'https://archive.ph/newest/' + url,
      save: 'https://web.archive.org/save/' + url
    };
  }

  function createArchiveRow(doc, url, title) {
    var links = cacheLinks(url);
    var row = doc.createElement('span');
    row.className = 'sr-archive-row';
    row.setAttribute('data-sr-archive-row', '1');
    row.setAttribute('aria-label', 'Archived copies for ' + (title || 'this result'));

    var label = doc.createElement('span');
    label.className = 'sr-archive-label';
    label.textContent = 'Archive:';
    row.appendChild(label);

    var parts = [
      ['Wayback', links.wayback],
      ['archive.today', links.archiveToday],
      ['save now', links.save]
    ];
    for (var i = 0; i < parts.length; i++) {
      var link = doc.createElement('a');
      link.className = 'sr-archive-link';
      link.href = parts[i][1];
      link.textContent = parts[i][0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      row.appendChild(link);
    }
    return row;
  }

  function extractResultBlocks(html, DOMParserImpl, currentHostname) {
    var Parser = DOMParserImpl || (typeof DOMParser !== 'undefined' ? DOMParser : null);
    if (!Parser) return [];
    var doc = new Parser().parseFromString(String(html || ''), 'text/html');
    var results = collectResults(doc, currentHostname);
    var blocks = [];
    for (var i = 0; i < results.length; i++) {
      if (blocks.indexOf(results[i].block) === -1) blocks.push(results[i].block);
    }
    return blocks;
  }

  return {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    cacheLinks: cacheLinks,
    collectResults: collectResults,
    createArchiveRow: createArchiveRow,
    currentStart: currentStart,
    extractResultBlocks: extractResultBlocks,
    isResultLink: isResultLink,
    looksBlocked: looksBlocked,
    nextPageUrl: nextPageUrl,
    normalizeSettings: normalizeSettings
  };
}));

/*
 * Core logic, kept out of content.js so the URL building is testable in Node.
 *
 *   cacheLinks(url)  -> { wayback, archive, save }
 *   enhance(doc)     -> adds a Cached row under each Google result
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RGC = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  // /web/2/<url> redirects to the newest Wayback capture; archive.today's
  // /newest/ does the same. URLs go in raw, these services expect unescaped.
  function cacheLinks(url) {
    return {
      wayback: 'https://web.archive.org/web/2/' + url,
      archive: 'https://archive.ph/newest/' + url,
      save: 'https://web.archive.org/save/' + url
    };
  }

  // True for organic result links. Skips Google's own pages, ads and anchors.
  function isResultLink(href, hostname) {
    if (!href || href.indexOf('http') !== 0) return false;
    try {
      var h = new URL(href).hostname;
      if (!h || h === hostname) return false;                 // skip google's own links
      if (/(^|\.)google\.com$/.test(h)) return false;
      if (/(^|\.)googleusercontent\.com$/.test(h)) return false;
      return true;
    } catch (e) { return false; }
  }

  var MARK = 'data-rgc';

  function makeRow(doc, url) {
    var links = cacheLinks(url);
    var row = doc.createElement('div');
    row.className = 'rgc-row';
    row.setAttribute(MARK, '1');
    var parts = [['Cached', links.wayback], ['archive.today', links.archive], ['save now', links.save]];
    var label = doc.createElement('span');
    label.className = 'rgc-label';
    label.textContent = '↻ '; // ↻
    row.appendChild(label);
    for (var i = 0; i < parts.length; i++) {
      if (i) { var sep = doc.createElement('span'); sep.className = 'rgc-sep'; sep.textContent = ' · '; row.appendChild(sep); }
      var a = doc.createElement('a');
      a.className = 'rgc-link';
      a.href = parts[i][1];
      a.textContent = parts[i][0];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      row.appendChild(a);
    }
    return row;
  }

  // Walks each result title (h3) to its link and adds a row underneath.
  // Anchored on h3 so a class-name redesign doesn't break it.
  // Returns how many rows were added.
  function enhance(doc) {
    var hostname = (doc.location && doc.location.hostname) || 'www.google.com';
    var heads = doc.querySelectorAll('h3');
    var added = 0;
    for (var i = 0; i < heads.length; i++) {
      var h3 = heads[i];
      var a = h3.closest ? h3.closest('a') : null;
      if (!a) continue;
      var href = a.getAttribute('href') || a.href;
      if (!isResultLink(href, hostname)) continue;
      // anchor the row on the h3's block so we insert once per result
      var block = a.closest ? (a.closest('div') || a.parentNode) : a.parentNode;
      if (!block || block.querySelector('[' + MARK + ']')) continue;
      block.appendChild(makeRow(doc, href));
      added++;
    }
    return added;
  }

  return { cacheLinks: cacheLinks, isResultLink: isResultLink, enhance: enhance };
}));

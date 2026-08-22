(function () {
  'use strict';

  if (location.pathname !== '/search' || typeof SearchRestore === 'undefined') return;

  var MAX_RESULTS = 100;
  var PAGE_SIZE = 10;
  var settings = SearchRestore.normalizeSettings();
  var busy = false;
  var observerPending = false;

  function getResultRoot() {
    return document.querySelector('#rso');
  }

  function removeArchiveRows() {
    var rows = document.querySelectorAll('[data-sr-archive-row]');
    for (var i = 0; i < rows.length; i++) rows[i].remove();
    var marked = document.querySelectorAll('[data-sr-archive-added]');
    for (var j = 0; j < marked.length; j++) marked[j].removeAttribute('data-sr-archive-added');
  }

  function addArchiveRows() {
    if (!settings.archiveLinks) return;
    var results = SearchRestore.collectResults(document, location.hostname);
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (result.anchor.hasAttribute('data-sr-archive-added')) continue;
      var row = SearchRestore.createArchiveRow(document, result.href, result.heading.textContent.trim());
      result.anchor.parentNode.insertBefore(row, result.anchor.nextSibling);
      result.anchor.setAttribute('data-sr-archive-added', '1');
    }
  }

  function currentResultUrls() {
    var results = SearchRestore.collectResults(document, location.hostname);
    var urls = Object.create(null);
    for (var i = 0; i < results.length; i++) urls[results[i].href] = true;
    return urls;
  }

  function updateButtonLabel(button, offset) {
    button.textContent = 'Load results ' + (offset + 1) + '-' + Math.min(offset + PAGE_SIZE, MAX_RESULTS);
  }

  function removeLoadBar() {
    var existing = document.querySelector('[data-sr-load-bar]');
    if (existing) existing.remove();
  }

  function ensureLoadBar() {
    if (!settings.loadMore) {
      removeLoadBar();
      return;
    }
    var resultRoot = getResultRoot();
    if (!resultRoot || document.querySelector('[data-sr-load-bar]')) return;

    var loadedTo = SearchRestore.currentStart(location.href) + PAGE_SIZE;
    var bar = document.createElement('div');
    bar.className = 'sr-load-bar';
    bar.setAttribute('data-sr-load-bar', '1');

    var button = document.createElement('button');
    button.className = 'sr-load-button';
    button.type = 'button';
    updateButtonLabel(button, loadedTo);

    var status = document.createElement('span');
    status.className = 'sr-load-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    bar.appendChild(button);
    bar.appendChild(status);
    resultRoot.parentNode.insertBefore(bar, resultRoot.nextSibling);

    button.addEventListener('click', async function () {
      if (busy || loadedTo >= MAX_RESULTS) return;
      busy = true;
      button.disabled = true;
      status.textContent = 'Loading...';

      try {
        var url = new URL(location.href);
        url.searchParams.set('start', String(loadedTo));
        var response = await fetch(url.toString(), { credentials: 'include' });
        var html = await response.text();
        var blocked = response.status === 429 || (response.redirected && /\/sorry\//.test(response.url));
        if (blocked || SearchRestore.looksBlocked(html)) {
          status.textContent = 'Google asked for a verification step. Open the next page normally to continue.';
          button.hidden = true;
          return;
        }

        var knownUrls = currentResultUrls();
        var blocks = SearchRestore.extractResultBlocks(html, null, location.hostname);
        var appended = 0;
        for (var i = 0; i < blocks.length; i++) {
          var blockResults = SearchRestore.collectResults(blocks[i], location.hostname);
          var hasNewResult = false;
          for (var j = 0; j < blockResults.length; j++) {
            if (!knownUrls[blockResults[j].href]) {
              knownUrls[blockResults[j].href] = true;
              hasNewResult = true;
            }
          }
          if (hasNewResult) {
            resultRoot.appendChild(document.importNode(blocks[i], true));
            appended++;
          }
        }

        if (!appended) {
          status.textContent = 'No more results were found.';
          button.hidden = true;
          return;
        }

        loadedTo += PAGE_SIZE;
        status.textContent = 'Loaded through about result ' + loadedTo + '.';
        addArchiveRows();
        if (loadedTo >= MAX_RESULTS) {
          button.hidden = true;
        } else {
          updateButtonLabel(button, loadedTo);
        }
      } catch (error) {
        status.textContent = 'The next page could not be loaded.';
      } finally {
        busy = false;
        button.disabled = false;
      }
    });
  }

  function refresh() {
    if (settings.archiveLinks) addArchiveRows();
    else removeArchiveRows();
    ensureLoadBar();
  }

  function scheduleRefresh() {
    if (observerPending) return;
    observerPending = true;
    setTimeout(function () {
      observerPending = false;
      refresh();
    }, 120);
  }

  function loadSettings() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      refresh();
      return;
    }
    chrome.storage.local.get(SearchRestore.DEFAULT_SETTINGS, function (value) {
      settings = SearchRestore.normalizeSettings(value);
      refresh();
    });
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local') return;
      if (changes.archiveLinks) settings.archiveLinks = changes.archiveLinks.newValue !== false;
      if (changes.loadMore) settings.loadMore = changes.loadMore.newValue !== false;
      refresh();
    });
  }

  loadSettings();

  var observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
}());

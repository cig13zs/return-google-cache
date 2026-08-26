(function () {
  'use strict';

  if (location.pathname !== '/search' || typeof SearchRestore === 'undefined') return;

  var MAX_RESULTS = 100;
  var PAGE_SIZE = 10;
  var settings = SearchRestore.normalizeSettings();
  var busy = false;
  var observerPending = false;
  var autoLoadTimer = null;

  function resultCap() {
    // maxResults arrived in 2.1.0; older stored settings fall back to the cap.
    return settings.maxResults || MAX_RESULTS;
  }

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

  function updateButtonLabel(button, offset, cap) {
    cap = cap || MAX_RESULTS;
    button.textContent = 'Load results ' + (offset + 1) + '-' + Math.min(offset + PAGE_SIZE, cap);
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
    var cap = resultCap();
    if (loadedTo > cap) loadedTo = cap;
    var bar = document.createElement('div');
    bar.className = 'sr-load-bar';
    bar.setAttribute('data-sr-load-bar', '1');

    var button = document.createElement('button');
    button.className = 'sr-load-button';
    button.type = 'button';
    updateButtonLabel(button, loadedTo, cap);

    var status = document.createElement('span');
    status.className = 'sr-load-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    var copy = document.createElement('button');
    copy.className = 'sr-copy-button';
    copy.type = 'button';
    copy.textContent = 'Copy URLs';
    copy.addEventListener('click', function () {
      var urls = SearchRestore.collectLoadedUrls(document, location.hostname);
      var text = urls.join('\n');
      var done = function () {
        copy.textContent = 'Copied ' + urls.length;
        setTimeout(function () { copy.textContent = 'Copy URLs'; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        // Clipboard API needs a focused document; fall back for edge cases.
        var helper = document.createElement('textarea');
        helper.value = text;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
        done();
      }
    });

    bar.appendChild(button);
    bar.appendChild(copy);
    bar.appendChild(status);
    resultRoot.parentNode.insertBefore(bar, resultRoot.nextSibling);

    var loadNext = async function () {
      if (busy || loadedTo >= cap) return true;
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
          stopAutoLoad();
          return false;
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
          stopAutoLoad();
          return false;
        }

        loadedTo += PAGE_SIZE;
        if (loadedTo > cap) loadedTo = cap;
        status.textContent = 'Loaded through about result ' + loadedTo + '.';
        addArchiveRows();
        if (loadedTo >= cap) {
          status.textContent = 'Loaded to your limit of about ' + cap + ' results. Raise it in settings for more.';
          button.hidden = true;
          stopAutoLoad();
          return false;
        }
        updateButtonLabel(button, loadedTo, cap);
        return true;
      } catch (error) {
        status.textContent = 'The next page could not be loaded.';
        stopAutoLoad();
        return false;
      } finally {
        busy = false;
        button.disabled = false;
      }
    };

    button.addEventListener('click', loadNext);

    function stopAutoLoad() {
      if (autoLoadTimer) {
        window.removeEventListener('scroll', onScroll);
        clearTimeout(autoLoadTimer);
        autoLoadTimer = null;
      }
    }

    function nearBottom() {
      var view = document.documentElement;
      return view.scrollHeight - (window.pageYOffset + window.innerHeight) < 400;
    }

    function onScroll() {
      if (!nearBottom()) return;
      window.removeEventListener('scroll', onScroll);
      // A beat of delay keeps fast wheel scrolling from stacking requests.
      autoLoadTimer = setTimeout(function () { loadNext().then(function (more) {
        if (more && settings.autoLoad && loadedTo < resultCap()) {
          window.addEventListener('scroll', onScroll);
        }
      }); }, 350);
    }

    if (settings.autoLoad) {
      window.addEventListener('scroll', onScroll);
    }
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
      var before = JSON.stringify(settings);
      if (changes.archiveLinks) settings.archiveLinks = changes.archiveLinks.newValue !== false;
      if (changes.loadMore) settings.loadMore = changes.loadMore.newValue !== false;
      if (changes.autoLoad) settings.autoLoad = changes.autoLoad.newValue === true;
      if (changes.maxResults) {
        var max = parseInt(changes.maxResults.newValue, 10);
        settings.maxResults = [30, 50, 100].indexOf(max) !== -1 ? max : 100;
      }
      refresh();
    });
  }

  loadSettings();

  var observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
}());

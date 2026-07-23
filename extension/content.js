/*
 * Injects the cached-link styling once, runs enhance() on load, and re-runs it
 * as Google streams more results in (scroll, tab switches). enhance() dedupes,
 * so the observer can fire freely.
 */
(function () {
  var STYLE_ID = 'rgc-style';
  if (!document.getElementById(STYLE_ID)) {
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.rgc-row{font-size:13px;line-height:1.6;margin:2px 0 0;color:#70757a}' +
      '.rgc-label{opacity:.75}' +
      '.rgc-link{color:#1a73e8;text-decoration:none}' +
      '.rgc-link:hover{text-decoration:underline}' +
      '.rgc-sep{color:#9aa0a6}' +
      '@media (prefers-color-scheme:dark){.rgc-row{color:#9aa0a6}.rgc-link{color:#8ab4f8}}';
    (document.head || document.documentElement).appendChild(s);
  }

  function run() { try { RGC.enhance(document); } catch (e) {} }
  run();

  var pending = false;
  var obs = new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; run(); }, 300);
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();

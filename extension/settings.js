(function () {
  'use strict';

  var inputs = document.querySelectorAll('[data-setting]');
  var status = document.getElementById('settings-status');

  function announce(text) {
    if (status) status.textContent = text;
  }

  function apply(values) {
    for (var i = 0; i < inputs.length; i++) {
      var key = inputs[i].getAttribute('data-setting');
      inputs[i].checked = values[key] !== false;
    }
  }

  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    apply({ archiveLinks: true, loadMore: true });
    announce('Saved on this device.');
    return;
  }

  chrome.storage.local.get({ archiveLinks: true, loadMore: true }, function (values) {
    apply(values);
    announce('Saved on this device.');
  });

  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('change', function (event) {
      var update = {};
      update[event.currentTarget.getAttribute('data-setting')] = event.currentTarget.checked;
      chrome.storage.local.set(update, function () {
        announce('Saved.');
      });
    });
  }
}());

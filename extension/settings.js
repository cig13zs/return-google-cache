(function () {
  'use strict';

  var inputs = document.querySelectorAll('input[data-setting]');
  var selects = document.querySelectorAll('select[data-setting]');
  var status = document.getElementById('settings-status');

  function announce(text) {
    if (status) status.textContent = text;
  }

  function apply(values) {
    for (var i = 0; i < inputs.length; i++) {
      var key = inputs[i].getAttribute('data-setting');
      if (key === 'autoLoad') inputs[i].checked = values[key] === true;
      else inputs[i].checked = values[key] !== false;
    }
    for (var j = 0; j < selects.length; j++) {
      var name = selects[j].getAttribute('data-setting');
      if (values[name]) selects[j].value = String(values[name]);
    }
  }

  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    apply({ archiveLinks: true, loadMore: true, autoLoad: false, maxResults: 100 });
    announce('Saved on this device.');
    return;
  }

  chrome.storage.local.get({ archiveLinks: true, loadMore: true, autoLoad: false, maxResults: 100 }, function (values) {
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

  for (var k = 0; k < selects.length; k++) {
    selects[k].addEventListener('change', function (event) {
      var update = {};
      update[event.currentTarget.getAttribute('data-setting')] = parseInt(event.currentTarget.value, 10);
      chrome.storage.local.set(update, function () {
        announce('Saved.');
      });
    });
  }
}());

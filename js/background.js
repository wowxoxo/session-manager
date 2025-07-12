// Background service worker for Session Manager MV3

let store = {};
const version = chrome.runtime.getManifest().version;

function ga() {}

async function init() {
  const defaults = {
    sessions: '{}',
    pinned: 'skip',
    open: JSON.stringify({
      add: 'click',
      replace: 'shift+click',
      new: 'ctrl/cmd+click',
      incognito: 'alt+click'
    })
  };

  const data = await chrome.storage.local.get([
    'sessions',
    'pinned',
    'open',
    'temp',
    'version',
    'readchanges',
    'noreplacingpinned'
  ]);

  Object.assign(store, defaults, data);

  if (store.version === version) {
    if (store.temp) {
      JSON.parse(store.temp).forEach(v => chrome.tabs.create({ url: v }));
      delete store.temp;
    }
  } else {
    store.readchanges = false;
    store.version = version;
  }

  await chrome.storage.local.set(store);
}

init();
chrome.runtime.onInstalled.addListener(init);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    for (const key in changes) {
      store[key] = changes[key].newValue;
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'openSession') {
    sendResponse(openSession(msg.cwinId, msg.urls, msg.event, msg.isTemp));
  }
});

function openSession(cwinId, urls, e, isTemp) {
  const open = JSON.parse(store.open);
  let action = e
    ? ((e.ctrlKey || e.metaKey) && 'ctrl/cmd+click') ||
      (e.shiftKey && 'shift+click') ||
      (e.altKey && 'alt+click') ||
      'click'
    : open.add;

  for (const k in open) {
    if (action === open[k]) {
      action = k;
      break;
    }
  }

  if (action === 'add') {
    urls.forEach(v => {
      chrome.tabs.create({ windowId: cwinId, url: v });
    });
  } else if (action === 'replace') {
    chrome.tabs.query({ windowId: cwinId }, tabs => {
      openSession(cwinId, urls);

      if (store.noreplacingpinned) {
        tabs = tabs.filter(t => !t.pinned);
      }

      tabs.forEach(tab => {
        chrome.tabs.remove(tab.id);
      });
    });
  } else if (action === 'new' || action === 'incognito') {
    chrome.windows.create(
      { url: urls.shift(), incognito: action === 'incognito' },
      win => {
        openSession(win.id, urls);
      }
    );
  } else {
    return false;
  }

  return true;
}

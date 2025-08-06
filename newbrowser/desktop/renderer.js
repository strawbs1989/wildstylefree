const { ipcRenderer } = require('electron');

const tabsEl = document.getElementById('tabs');
const viewsEl = document.getElementById('views');
const addressBar = document.getElementById('addressBar');
const newTabBtn = document.getElementById('newTabBtn');

let tabIdCounter = 0;
const tabs = new Map();

function createTab(url = 'https://duckduckgo.com') {
  const id = ++tabIdCounter;

  // Tab button
  const btn = document.createElement('div');
  btn.className = 'tab';
  btn.textContent = `Tab ${id}`;
  btn.onclick = () => activateTab(id);
  tabsEl.appendChild(btn);

  // Webview
  const viewContainer = document.createElement('div');
  viewContainer.className = 'webview-container';
  viewContainer.id = `wc-${id}`;
  const view = document.createElement('webview');
  view.src = url;
  view.id = `wv-${id}`;
  view.style.display = 'none';
  view.setAttribute('partition', `persist:wildstyle`);
  viewContainer.appendChild(view);
  viewsEl.appendChild(viewContainer);

  tabs.set(id, { btn, viewContainer, view });
  activateTab(id);
}

function activateTab(id) {
  tabs.forEach((obj, key) => {
    obj.btn.classList.toggle('active', key === id);
    obj.viewContainer.style.display = (key === id ? 'block' : 'none');
  });
}

addressBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let url = addressBar.value.trim();
    if (!/^https?:\/\//.test(url)) {
      if (url.includes('.')) url = 'https://' + url;
      else url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
    }
    const active = [...tabs.keys()].find(id => tabs.get(id).btn.classList.contains('active'));
    if (active) tabs.get(active).view.src = url;
    addressBar.value = '';
  }
});

newTabBtn.addEventListener('click', () => createTab());

window.addEventListener('DOMContentLoaded', () => {
  createTab();
});

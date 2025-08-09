const searchBar = document.getElementById('searchBar');
const addTabButton = document.getElementById('addTab');
const tabsContainer = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');

let tabs = [];

function createTab(url = 'https://wildstyle.vip', isPinned = false) {
  const id = Date.now();
  const tab = {
    id,
    url,
    pinned: isPinned
  };

  tabs.push(tab);
  renderTabs();
  openTab(id);
}

function renderTabs() {
  tabsContainer.innerHTML = '';
  tabs.forEach(tab => {
    const tabBtn = document.createElement('div');
    tabBtn.className = 'tab';
    tabBtn.textContent = tab.pinned ? '📌 Wildstyle' : new URL(tab.url).hostname;
    tabBtn.onclick = () => openTab(tab.id);
    if (tab.active) tabBtn.classList.add('active');
    tabsContainer.appendChild(tabBtn);
  });
}

function openTab(id) {
  tabs.forEach(tab => (tab.active = tab.id === id));
  renderTabs();
  const tab = tabs.find(t => t.id === id);
  tabContents.innerHTML = `<iframe src="${tab.url}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>`;
}

function openBookmark(url) {
  createTab(url);
}

addTabButton.addEventListener('click', () => {
  createTab('https://www.bing.com');
});

searchBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = searchBar.value.trim();
    let url;
    try {
      url = new URL(query).href;
    } catch {
      url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    }
    createTab(url);
  }
});

// Initial pinned tab for Wildstyle
createTab('https://wildstyle.vip', true);

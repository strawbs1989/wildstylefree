let tabId = 0;
let currentTab = null;

function addNewTab(url = 'https://www.bing.com') {
  tabId++;
  const tabLabel = `Tab ${tabId}`;

  // Create tab button
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = tabLabel;
  tab.dataset.id = tabId;
  tab.onclick = () => switchTab(tabId);
  document.getElementById('tabs').insertBefore(tab, document.querySelector('.new-tab-btn'));

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.id = `iframe-${tabId}`;
  iframe.className = 'tab-frame';
  document.getElementById('tabContents').appendChild(iframe);

  switchTab(tabId);
}

function switchTab(id) {
  currentTab = id;

  // Handle tab UI
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.id == id);
  });

  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.classList.remove('active');
  });

  const activeFrame = document.getElementById(`iframe-${id}`);
  if (activeFrame) activeFrame.classList.add('active');
}

function handleSearch(event) {
  if (event.key === 'Enter') {
    const input = event.target.value.trim();
    let url = '';

    // Check if it's a full URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      url = input;
    } else if (input.includes('.') && !input.includes(' ')) {
      url = `https://${input}`;
    } else {
      // Treat as a search query
      const searchQuery = encodeURIComponent(input);
      url = `https://www.google.com/search?q=${searchQuery}`;
    }

    // Load into active tab
    if (currentTab) {
      const iframe = document.getElementById(`iframe-${currentTab}`);
      if (iframe) iframe.src = url;
    } else {
      addNewTab(url);
    }

    event.target.value = '';
  }
}

function addBookmark() {
  const iframe = document.getElementById(`iframe-${currentTab}`);
  if (!iframe) return;

  const url = iframe.src;
  const name = prompt('Bookmark name:', url);
  if (!name) return;

  const bookmark = document.createElement('div');
  bookmark.textContent = name;
  bookmark.className = 'tab';
  bookmark.onclick = () => addNewTab(url);

  document.getElementById('bookmarks').appendChild(bookmark);
}

// Load default tab on startup
window.onload = () => {
  addNewTab();
};

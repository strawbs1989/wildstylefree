let tabCount = 1;

function handleSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (!query) return;

    let url;
    if (query.includes('.') || query.startsWith('http')) {
      url = query.startsWith('http') ? query : `https://${query}`;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    addNewTabWithContent(`<iframe src="${url}" frameborder="0" style="width: 100%; height: 80vh;"></iframe>`);
    event.target.value = '';
  }
}

function switchTab(event, tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

function addNewTab() {
  const tabId = `tab-${++tabCount}`;

  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = `Tab ${tabCount}`;
  tab.onclick = (e) => switchTab(e, tabId);

  const content = document.createElement('div');
  content.className = 'tab-content';
  content.id = tabId;
  content.innerHTML = `<p>New tab ready. Type in the search bar to start browsing.</p>`;

  document.getElementById('tabs').insertBefore(tab, document.querySelector('.new-tab-btn'));
  document.getElementById('tabContents').appendChild(content);

  tab.click(); // Switch to new tab
}

function addNewTabWithContent(html) {
  const tabId = `tab-${++tabCount}`;

  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = `Tab ${tabCount}`;
  tab.onclick = (e) => switchTab(e, tabId);

  const content = document.createElement('div');
  content.className = 'tab-content';
  content.id = tabId;
  content.innerHTML = html;

  document.getElementById('tabs').insertBefore(tab, document.querySelector('.new-tab-btn'));
  document.getElementById('tabContents').appendChild(content);

  tab.click();
}

function addBookmark() {
  const currentTab = document.querySelector('.tab.active');
  const contentId = currentTab ? currentTab.textContent : null;
  const tabContent = document.getElementById(contentId);

  if (!tabContent) return;

  const urlInput = prompt("Enter URL to bookmark:");
  if (urlInput) {
    const bookmarksBar = document.getElementById('bookmarks');
    const link = document.createElement('a');
    link.href = urlInput;
    link.target = '_blank';
    link.textContent = '🔗 Bookmark';
    link.style.marginLeft = '10px';
    link.style.color = '#00ffd5';

    bookmarksBar.appendChild(link);
  }
}

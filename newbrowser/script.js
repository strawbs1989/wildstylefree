const tabsContainer = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');
const searchBox = document.getElementById('searchBox');

// Add first tab content
let currentTabIndex = 0;

function addNewTab(url = 'about:blank') {
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.innerText = 'New Tab';
  tab.onclick = () => switchTab(tab);

  const content = document.createElement('div');
  content.className = 'tab-content';
  const iframe = document.createElement('iframe');
  iframe.src = url;
  content.appendChild(iframe);

  tabsContainer.insertBefore(tab, tabsContainer.querySelector('.new-tab-btn'));
  tabContents.appendChild(content);

  switchTab(tab);
}

function switchTab(tabElement) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(t => t.classList.remove('active'));
  contents.forEach(c => c.classList.remove('active'));

  tabElement.classList.add('active');
  const index = Array.from(tabsContainer.children).indexOf(tabElement);
  contents[index].classList.add('active');
  currentTabIndex = index;
}

function handleSearch() {
  const query = searchBox.value.trim();
  if (!query) return;

  const url = isValidURL(query) 
    ? formatURL(query)
    : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  addNewTab(url);
  searchBox.value = '';
}

searchBox.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function formatURL(str) {
  if (!str.startsWith('http')) {
    return 'https://' + str;
  }
  return str;
}

function addBookmark() {
  const tabs = document.querySelectorAll('.tab-content iframe');
  const current = tabs[currentTabIndex];
  if (current && current.src) {
    alert('Bookmark saved: ' + current.src);
    // Here you could save to localStorage or show in a list
  }
}

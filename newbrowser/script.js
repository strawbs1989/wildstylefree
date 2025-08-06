const tabs = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');
const searchInput = document.getElementById('searchInput');

function switchTab(event, index) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  event.target.classList.add('active');
  document.querySelectorAll('.tab-content')[index].classList.add('active');
}

function addNewTab(url = 'https://wildstyle.vip/news') {
  const tabIndex = document.querySelectorAll('.tab').length;

  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.innerText = `Tab ${tabIndex}`;
  newTab.onclick = function(event) {
    switchTab(event, tabIndex);
  };
  tabs.appendChild(newTab);

  const content = document.createElement('div');
  content.className = 'tab-content';
  content.innerHTML = `<iframe src="${url}" frameborder="0"></iframe>`;
  tabContents.appendChild(content);

  newTab.click();
}

function openBookmark(url) {
  addNewTab(url);
}

searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;

    const isURL = query.startsWith('http://') || query.startsWith('https://');
    const finalUrl = isURL ? query : `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

    addNewTab(finalUrl);
    searchInput.value = '';
  }
});

// Load default tab
window.onload = () => {
  addNewTab('https://wildstyle.vip');
};

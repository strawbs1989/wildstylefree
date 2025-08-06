const tabs = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');
const searchInput = document.getElementById('searchInput');

function switchTab(event, index) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  event.target.classList.add('active');
  document.querySelectorAll('.tab-content')[index].classList.add('active');
}

function addNewTab() {
  const tabIndex = document.querySelectorAll('.tab').length;

  // Create new tab button
  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.innerText = `Tab ${tabIndex}`;
  newTab.onclick = function(event) {
    switchTab(event, tabIndex);
  };
  tabs.appendChild(newTab);

  // Create new tab content with blank iframe
  const content = document.createElement('div');
  content.className = 'tab-content';
  content.innerHTML = `<iframe src="https://wildstyle.vip/news" frameborder="0"></iframe>`;
  tabContents.appendChild(content);

  // Switch to new tab
  newTab.click();
}

// Search with Enter key
searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;

    const searchUrl = `https://www.duckduckgo.com/search?q=${encodeURIComponent(query)}`;

    const tabIndex = document.querySelectorAll('.tab').length;

    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.innerText = `Search: ${query}`;
    newTab.onclick = function(event) {
      switchTab(event, tabIndex);
    };
    tabs.appendChild(newTab);

    const content = document.createElement('div');
    content.className = 'tab-content';
    content.innerHTML = `<iframe src="${searchUrl}" frameborder="0"></iframe>`;
    tabContents.appendChild(content);

    newTab.click();
    searchInput.value = '';
  }
});

function toggleTheme() {
  document.body.classList.toggle('light-theme');
}

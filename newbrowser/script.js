const tabs = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');
const searchInput = document.getElementById('searchInput');

function switchTab(event, index) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  event.target.classList.add('active');
  document.querySelectorAll('.tab-content')[index].classList.add('active');
}

function addNewTab(title = "New Tab", url = "https://wildstyle.vip/news") {
  const tabIndex = document.querySelectorAll('.tab').length;

  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.innerText = title;
  newTab.onclick = function(event) {
    switchTab(event, tabIndex);
  };
  tabs.appendChild(newTab);

  const content = document.createElement('div');
  content.className = 'tab-content';
  content.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
  tabContents.appendChild(content);

  newTab.click();
}

searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;

    // ✅ Redirecting to your own search results page instead of external iframe
    const searchUrl = `https://wildstyle.vip/newbrowser/search-results.html?q=${encodeURIComponent(query)}`;

    addNewTab(`Search: ${query}`, searchUrl);
    searchInput.value = '';
  }
});

function toggleTheme() {
  document.body.classList.toggle('light-theme');
}

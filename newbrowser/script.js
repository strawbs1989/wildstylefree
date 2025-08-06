const tabs = document.getElementById('tabs');
const tabContents = document.getElementById('tabContents');
const searchInput = document.getElementById('searchInput');

let tabCount = 0;

// Load initial tab
window.onload = () => {
  addTab('New Tab', 'https://wildstyle.vip/news');
};

function addTab(title, url) {
  const index = tabCount++;

  // Create tab button
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.innerText = title;
  tab.onclick = (event) => switchTab(event, index);
  tabs.appendChild(tab);

  // Create tab content
  const content = document.createElement('div');
  content.className = 'tab-content';
  content.innerHTML = `<iframe src="${url}" frameborder="0"></iframe>`;
  tabContents.appendChild(content);

  // Activate new tab
  tab.click();
}

function switchTab(event, index) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  document.querySelectorAll('.tab')[index].classList.add('active');
  document.querySelectorAll('.tab-content')[index].classList.add('active');
}

searchInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;

    // Use Brave Search (DuckDuckGo blocks iframes)
    const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;

    addTab(`Search: ${query}`, searchUrl);
    searchInput.value = '';
  }
});

function toggleTheme() {
  document.body.classList.toggle('light-theme');
}

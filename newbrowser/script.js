function handleSearch(event) {
  if (event.key === "Enter") {
    const query = event.target.value.trim();
    const url = getSearchUrl(query);
    openInNewTab(url);
  }
}

function getSearchUrl(query) {
  // Check if the input is a full URL
  if (query.startsWith("http://") || query.startsWith("https://")) {
    return query;
  } else if (query.includes(".")) {
    return "http://" + query;
  } else {
    // If not a URL, treat as a DuckDuckGo search
    return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  }
}

function openInNewTab(url) {
  const tabId = `tab-${Date.now()}`;
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.textContent = url;
  tab.onclick = (event) => switchTab(event, tabId);

  const content = document.createElement("iframe");
  content.src = url;
  content.className = "tab-content";
  content.id = tabId;

  document.getElementById("tabs").appendChild(tab);
  document.getElementById("tabContents").appendChild(content);

  switchTab(null, tabId);
}

function switchTab(event, tabId) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  if (event) event.target.classList.add("active");

  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((content) => (content.style.display = "none"));

  const selected = document.getElementById(tabId);
  if (selected) selected.style.display = "block";
}

function addNewTab() {
  const newTabId = `tab-${Date.now()}`;
  const tab = document.createElement("div");
  tab.className = "tab active";
  tab.textContent = "New Tab";
  tab.onclick = (event) => switchTab(event, newTabId);

  const content = document.createElement("div");
  content.className = "tab-content";
  content.id = newTabId;
  content.innerHTML = "<h2>New Tab</h2><p>Start browsing!</p>";

  // Clear other active tabs
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => (c.style.display = "none"));

  document.getElementById("tabs").appendChild(tab);
  document.getElementById("tabContents").appendChild(content);
  content.style.display = "block";
}

function addBookmark() {
  const currentUrl = document.querySelector(".tab-content:not([style*='display: none'])")?.src;
  if (currentUrl) {
    const bookmarks = document.getElementById("bookmarks");
    const bookmark = document.createElement("div");
    bookmark.textContent = currentUrl;
    bookmark.className = "bookmark";
    bookmark.onclick = () => openInNewTab(currentUrl);
    bookmarks.appendChild(bookmark);
  }
}

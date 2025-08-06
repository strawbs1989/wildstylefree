let tabCounter = 1;

function switchTab(event, tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  event.target.classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

function addNewTab() {
  const tabs = document.getElementById("tabs");
  const contents = document.getElementById("tabContents");

  const newTabId = `tab${tabCounter++}`;

  // Create new tab button
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.textContent = "New Tab";
  tab.onclick = function (e) {
    switchTab(e, newTabId);
  };
  tabs.insertBefore(tab, document.querySelector(".new-tab-btn"));

  // Create new content pane
  const content = document.createElement("div");
  content.className = "tab-content";
  content.id = newTabId;
  content.innerHTML = `
    <h2>Welcome to WildstyleRadio Browser</h2>
    <p>This is your stylish, secure browsing experience.</p>
  `;
  contents.appendChild(content);

  // Switch to new tab
  tab.click();
}

// Search or URL handler
document.getElementById("searchInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const query = this.value.trim();
    if (query === "") return;

    const activeContent = document.querySelector(".tab-content.active");
    const isURL = query.startsWith("http://") || query.startsWith("https://") || query.includes(".");

    let url = query;
    if (!isURL) {
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    } else if (!query.startsWith("http")) {
      url = `https://${query}`;
    }

    activeContent.innerHTML = `
      <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
    `;
  }
});

function switchTab(event, tabId) {
  const allTabs = document.querySelectorAll(".tab");
  const allContents = document.querySelectorAll(".tab-content");

  allTabs.forEach(tab => tab.classList.remove("active"));
  allContents.forEach(content => content.classList.remove("active"));

  event.currentTarget.classList.add("active");
  const selectedContent = document.getElementById(tabId);
  if (selectedContent) {
    selectedContent.classList.add("active");
  }
}

function addNewTab() {
  const tabsContainer = document.getElementById("tabs");
  const tabContentsContainer = document.getElementById("tabContents");

  const newTabId = "tab" + Date.now();

  // Create new tab button
  const newTab = document.createElement("div");
  newTab.className = "tab";
  newTab.textContent = "New Tab";
  newTab.onclick = (event) => switchTab(event, newTabId);
  tabsContainer.insertBefore(newTab, tabsContainer.querySelector(".new-tab-btn"));

  // Create new tab content
  const newContent = document.createElement("div");
  newContent.className = "tab-content";
  newContent.id = newTabId;
  newContent.classList.add("active");
  newContent.innerHTML = `
    <h2>New Tab</h2>
    <p>Search or browse below...</p>
    <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
  `;

  // Deactivate all existing tabs and contents
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  // Activate new tab and content
  newTab.classList.add("active");
  tabContentsContainer.appendChild(newContent);
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

// Search functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(url, "_blank");
      }
    }
  });
});

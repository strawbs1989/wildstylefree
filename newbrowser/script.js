let tabCounter = 1;

function handleSearch(event) {
  if (event.key === "Enter") {
    const query = event.target.value;
    const isURL = query.includes(".") && !query.includes(" ");
    const searchUrl = `https://duckduckgo.com/?q=${query}`;

    openInNewTab(url);
  }
}

function openInNewTab(url) {
  const iframe = `<iframe src="${url}" style="width:100%; height:90vh; border:none;"></iframe>`;
  const tabId = "tab" + tabCounter;
  const newTabContent = document.createElement("div");
  newTabContent.classList.add("tab-content");
  newTabContent.id = tabId;
  newTabContent.innerHTML = iframe;

  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");

  const newTab = document.createElement("div");
  newTab.classList.add("tab", "active");
  newTab.innerText = "Tab " + tabCounter;
  newTab.onclick = (e) => switchTab(e, tabId);

  document.getElementById("tabs").insertBefore(newTab, document.querySelector(".new-tab-btn"));
  document.getElementById("tabContents").appendChild(newTabContent);

  newTabContent.style.display = "block";
  tabCounter++;
}

function addNewTab() {
  const tabId = "tab" + tabCounter;
  const newTabContent = document.createElement("div");
  newTabContent.classList.add("tab-content");
  newTabContent.id = tabId;
  newTabContent.innerHTML = "<p>New blank tab. Enter a search or URL.</p>";

  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");

  const newTab = document.createElement("div");
  newTab.classList.add("tab", "active");
  newTab.innerText = "Tab " + tabCounter;
  newTab.onclick = (e) => switchTab(e, tabId);

  document.getElementById("tabs").insertBefore(newTab, document.querySelector(".new-tab-btn"));
  document.getElementById("tabContents").appendChild(newTabContent);

  newTabContent.style.display = "block";
  tabCounter++;
}

function switchTab(event, tabId) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");

  event.target.classList.add("active");
  document.getElementById(tabId).style.display = "block";
}

function addBookmark() {
  const activeTab = document.querySelector(".tab.active");
  if (!activeTab || activeTab.innerText === "New Tab") return alert("Nothing to bookmark!");
  const name = prompt("Bookmark name:");
  if (name) {
    const link = document.createElement("a");
    link.href = "#";
    link.innerText = name;
    link.style.margin = "0 5px";
    link.onclick = () => {
      const tabId = activeTab.innerText.toLowerCase().replace(" ", "");
      switchTab({ target: activeTab }, tabId);
    };
    document.getElementById("bookmarks").appendChild(link);
  }
}

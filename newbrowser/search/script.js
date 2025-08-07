let tabId = 0;
const tabsContainer = document.getElementById("tabs");
const tabContents = document.getElementById("tabContents");
const searchBar = document.getElementById("searchBar");
const addTabBtn = document.getElementById("addTab");

function createTab(query = "") {
  const id = `tab-${tabId++}`;
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.textContent = query || "New Tab";
  tab.dataset.id = id;

  const iframe = document.createElement("iframe");
  iframe.id = id;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  if (query) {
    iframe.src = `search-results.html?q=${encodeURIComponent(query)}`;
  } else {
    iframe.src = "new-tab.html";
  }

  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll("iframe").forEach(f => f.style.display = "none");
    tab.classList.add("active");
    iframe.style.display = "block";
  };

  tabsContainer.appendChild(tab);
  tabContents.appendChild(iframe);
  tab.click();
}

addTabBtn.onclick = () => createTab();

searchBar.addEventListener("keypress", e => {
  if (e.key === "Enter" && searchBar.value.trim()) {
    createTab(searchBar.value.trim());
    searchBar.value = "";
  }
});

window.onload = () => {
  createTab();
};

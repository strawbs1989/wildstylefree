let tabs = [];
let currentTab = 0;

function addNewTab(url = "https://wildstyle.vip") {
  const tabIndex = tabs.length;
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.textContent = `Tab ${tabIndex + 1}`;
  tab.onclick = (e) => switchTab(e, tabIndex);

  document.getElementById("tabs").insertBefore(tab, document.querySelector(".new-tab-btn"));

  const iframe = document.createElement("iframe");
  iframe.className = "tab-frame";
  iframe.src = url;
  iframe.style.display = "none";
  document.getElementById("tabContents").appendChild(iframe);

  tabs.push({ tab, iframe });

  switchTab(null, tabIndex);
}

function switchTab(event, index) {
  tabs.forEach((obj, i) => {
    obj.tab.classList.remove("active");
    obj.iframe.style.display = "none";
  });

  tabs[index].tab.classList.add("active");
  tabs[index].iframe.style.display = "block";
  currentTab = index;
}

function handleSearchInput(event) {
  if (event.key === "Enter") {
    const input = event.target.value.trim();
    if (!input) return;

    let url = input;
    if (!input.startsWith("http://") && !input.startsWith("https://") && !input.includes(".")) {
      url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    } else if (!input.startsWith("http")) {
      url = "https://" + input;
    }

    tabs[currentTab].iframe.src = url;
    event.target.value = ""; // clear input
  }
}

function addBookmark() {
  const currentURL = tabs[currentTab].iframe.src;
  alert("Bookmark saved: " + currentURL);
}

// Initialize first tab
window.onload = () => {
  tabs.push({
    tab: document.querySelector(".tab"),
    iframe: document.querySelector(".tab-frame")
  });
  document.getElementById("searchBox").addEventListener("keydown", handleSearchInput);
};

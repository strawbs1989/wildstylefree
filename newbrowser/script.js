document.getElementById("searchBtn").addEventListener("click", function () {
  const query = document.getElementById("searchInput").value.trim();
  if (query) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  }
});

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
}

function switchTab(evt, tabName) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active"));
  evt.currentTarget.classList.add("active");

  const content = document.getElementById("content");
  if (tabName === "home") {
    content.innerHTML = `
      <h2>Welcome to WildstyleRadio Browser</h2>
      <p>Your secure, stylish browsing starts here.</p>
      <p class="loading">Loading secure modules...</p>
      <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
    `;
  }
}

function openNewTab(url) {
  window.open(url, "_blank");
}

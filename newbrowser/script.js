// Handle search functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        const searchUrl = `https://www.duckduckgo.com/search?q=${encodeURIComponent(query)}`;
        window.open(searchUrl, "_blank");
      }
    }
  });
});

// Handle tab switching
function switchTab(event, tabName) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active"));
  event.target.classList.add("active");

  const content = document.getElementById("content");
  if (tabName === "home") {
    content.innerHTML = `
      <h2>Welcome to WildstyleRadio Browser</h2>
      <p>Your secure, stylish browsing starts here. This is a prototype layout designed to mimic a secure custom browser for desktop and Android.</p>
      <p class="loading">Loading secure modules...</p>
      <iframe class="radio" src="https://yourstreamurl.com/embed" title="Wildstyle Radio Player"></iframe>
    `;
  } else if (tabName === "wildstyle") {
    content.innerHTML = `<iframe src="https://wildstyle.vip" width="100%" height="600px" style="border:none;"></iframe>`;
  } else if (tabName === "nowPlaying") {
    content.innerHTML = `<iframe src="https://wildstyle.vip/nowplaying" width="100%" height="600px" style="border:none;"></iframe>`;
  }
}

// Theme toggle
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains("dark")) {
    body.classList.remove("dark");
    body.style.background = "#fff";
    body.style.color = "#000";
  } else {
    body.classList.add("dark");
    body.style.background = "#0a0a0a";
    body.style.color = "#fff";
  }
}

async function updateLiveCount() {
  try {
    const res = await fetch("https://api.live365.com/station/a50378/status");
    const data = await res.json();

    const count = data.listeners || 0;

    const el = document.querySelector(".now-playing-count");
    if (el) {
      el.textContent = `${count.toLocaleString()} listening live`;
    }
  } catch (err) {
    console.error("Live365 count error:", err);
  }
}

// Load immediately
updateLiveCount();

// Refresh every 20 seconds
setInterval(updateLiveCount, 20000);

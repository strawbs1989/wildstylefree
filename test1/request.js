// ===== SONG REQUEST OPEN/CLOSE SYSTEM =====

// Define live shows (day, start time, end time in 24h format)
const liveShows = [
  { day: "Thursday", start: "19:00", end: "20:00" },
  { day: "Sunday", start: "20:00", end: "21:00" },
  // Add more shows if needed
];

// Check if a show is live
function isLiveNow() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  for (let show of liveShows) {
    if (show.day === dayName) {
      if (currentTime >= show.start && currentTime < show.end) {
        return true;
      }
    }
  }
  return false;
}

// Update request button
function updateRequestStatus() {
  const btn = document.getElementById("request-btn");
  const status = document.getElementById("request-status");

  if (!btn || !status) return;

  if (isLiveNow()) {
    btn.disabled = false;
    btn.textContent = "Request a Song 🎶";
    status.textContent = "Requests are OPEN — your DJ is live!";
  } else {
    btn.disabled = true;
    btn.textContent = "Requests Closed";
    status.textContent = "Requests are only open during live shows.";
  }
}

// Run check every 30s (auto-refresh)
setInterval(updateRequestStatus, 30000);
window.addEventListener("load", updateRequestStatus);

// Example button click
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("request-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("Request form coming soon! (hook to Google Sheets or backend)");
    });
  }
});

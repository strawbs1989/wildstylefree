// ===== SONG REQUEST OPEN/CLOSE SYSTEM =====

// Define live shows
const liveShows = [
  { day: "Thursday", start: "19:00", end: "20:00" },
  { day: "Sunday", start: "20:00", end: "21:00" },
];

// Check if a show is live
function isLiveNow() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  return liveShows.some(show =>
    show.day === dayName && currentTime >= show.start && currentTime < show.end
  );
}

// Update request form visibility
function updateRequestStatus() {
  const form = document.getElementById("requestForm");
  const status = document.getElementById("request-status");

  if (!form || !status) return;

  if (isLiveNow()) {
    form.style.display = "block";
    status.textContent = "✅ Requests are OPEN — your DJ is live!";
  } else {
    form.style.display = "none";
    status.textContent = "❌ Requests are CLOSED — please come back during a live show.";
  }
}

// Run check every 30s
setInterval(updateRequestStatus, 30000);
window.addEventListener("load", updateRequestStatus);

// Handle Formspree submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  const success = document.getElementById("success");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      }).then(response => {
        if (response.ok) {
          form.reset();
          form.style.display = "none";
          success.style.display = "block";
        } else {
          alert("⚠️ There was an issue sending your request.");
        }
      }).catch(() => {
        alert("⚠️ Network error. Try again later.");
      });
    });
  }
});

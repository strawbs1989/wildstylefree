// Live audio player toggle
const playPauseBtn = document.getElementById("playPauseBtn");
const liveAudio = document.getElementById("liveAudio");

if (playPauseBtn) {
  playPauseBtn.addEventListener("click", () => {
    if (liveAudio.paused) {
      liveAudio.play();
      playPauseBtn.textContent = "⏸ Pause";
    } else {
      liveAudio.pause();
      playPauseBtn.textContent = "▶ Live Player";
    }
  });
}

// Listener count fetch (from realtime.csv or API)
async function fetchListeners() {
  try {
    const res = await fetch("realtime.csv");
    const text = await res.text();
    const lines = text.trim().split("\n");
    const lastLine = lines[lines.length - 1].split(",");
    const count = lastLine[1] || 0;
    document.getElementById("listener-count").textContent = count;
  } catch (e) {
    console.error("Error fetching listeners:", e);
  }
}
setInterval(fetchListeners, 5000);
fetchListeners();

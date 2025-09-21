// Basic player logic with HLS support
const audio = document.getElementById('player');

function initPlayer() {
  const streamUrl = 'https://das-edge12-live365-dal02.cdnstream.com/metadata';

  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(audio);
  } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
    audio.src = streamUrl; // native HLS
  } else {
    audio.src = 'https://streaming.live365.com/a50378'; // fallback MP3
  }
}
initPlayer();

const playBtn = document.getElementById('playPause');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(e => console.warn('play failed', e));
      playBtn.textContent = 'Pause';
    } else {
      audio.pause();
      playBtn.textContent = 'Play';
    }
  });
}

const openBtn = document.getElementById('openPlayer');
if (openBtn) {
  openBtn.addEventListener('click', () => {
    audio.paused ? audio.play() : audio.pause();
    if (playBtn) playBtn.textContent = audio.paused ? 'Play' : 'Pause';
  });
}

// Nav links active state
document.querySelectorAll('.navlink').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('.navlink').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

// Now Playing (main content) — no last played
async function fetchNowPlayingMain() {
  try {
    const res = await fetch("https://api.live365.com/station/a50378");
    const data = await res.json();
    const np = data.now_playing;

    document.getElementById("np-art").src = np.art || "placeholder.png";
    document.getElementById("np-title").textContent = np.title || "Unknown Title";
    document.getElementById("np-artist").textContent = np.artist || "Unknown Artist";
  } catch (err) {
    console.error("Now Playing fetch error:", err);
    document.getElementById("np-title").textContent = "Error loading track";
    document.getElementById("np-artist").textContent = "";
  }
}
fetchNowPlayingMain();
setInterval(fetchNowPlayingMain, 30000);

// Who's Listening (auto from CSV)
async function fetchWhoListening() {
  try {
    const res = await fetch("/test1/real_time_sessions.csv");
    const csvText = await res.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const countryIdx = headers.indexOf("country");
    const cityIdx = headers.indexOf("city");
    const countIdx = headers.indexOf("active_session_count");

    let total = 0;
    const locations = {};

    dataRows.forEach(r => {
      const country = r[countryIdx];
      const city = r[cityIdx];
      const count = parseInt(r[countIdx] || "0", 10);
      total += count;

      const key = `${country} (${city})`;
      locations[key] = (locations[key] || 0) + count;
    });

    document.getElementById("listenerTotal").textContent = total;

    const top = Object.entries(locations)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5);

    const ul = document.getElementById("listenerLocations");
    ul.innerHTML = "";
    top.forEach(([loc, count]) => {
      const li = document.createElement("li");
      li.textContent = `${loc} — ${count}`;
      ul.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading Who's Listening CSV:", err);
  }
}
fetchWhoListening();
setInterval(fetchWhoListening, 60000);

// Accessibility: stop audio when navigating away
window.addEventListener('pagehide', () => {
  audio.pause();
  if (playBtn) playBtn.textContent = 'Play';
});
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

((i,c)=>{if(!window.history.state||!window.history.state.key){let p=Math.random().toString(32).slice(2);window.history.replaceState({key:p},"")}try{let d=JSON.parse(sessionStorage.getItem(i)||"{}")[c||window.history.state.key];typeof d=="number"&&window.scrollTo(0,d)}catch(p){console.error(p),sessionStorage.removeItem(i)}})("positions", null)

// Basic player logic with HLS support
const audio = document.getElementById('player');

function initPlayer() {
  const stream-hls-Url = 'https://streaming.live365.com/a50378/playlist.m3u8';

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

// Now Playing 

async function fetchNowPlaying() {
  try {
    const res = await fetch("https://api.live365.com/station/a50378");
    const data = await res.json();

    if (data && data.currentTrack) {
      document.getElementById("npTitle").textContent = data.currentTrack.title || "Unknown Title";
      document.getElementById("npArtist").textContent = data.currentTrack.artist || "Unknown Artist";

      const art = data.currentTrack.art || "/test1/placeholder.png";
      document.getElementById("npArt").src = art;
    }
  } catch (err) {
    console.error("Now Playing fetch error:", err);
  }
}

// fetch immediately + refresh every 20s
fetchNowPlaying();
setInterval(fetchNowPlaying, 20000);


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


// WSR Info (placeholder until XR API/server integration)
function loadWSRInfo() {
  const xrTopEl = document.getElementById('xrTop');
  const xrStatsEl = document.getElementById('xrStats');

  if (xrTopEl && xrStatsEl) {
    // Example info – replace with real API values if available
    xrTopEl.innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
    xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';
  }
}

// Load once at startup
loadWSRInfo();







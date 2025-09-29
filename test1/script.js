// ========= Audio Player (HLS-first) =========
document.addEventListener("DOMContentLoaded", () => {
  const myAudio   = document.getElementById('myAudio');
  const playdiv   = document.getElementById('playdiv');
  const pausediv  = document.getElementById('pausediv');
  const control   = document.getElementById('control');
  const openBtn   = document.getElementById('openPlayer');
  const streamUrl = 'https://streaming.live365.com/a50378/playlist.m3u8';

  if (!myAudio) return;

  // HLS attach
  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(myAudio);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ HLS manifest loaded');
    });
  } else if (myAudio.canPlayType('application/vnd.apple.mpegurl')) {
    myAudio.src = streamUrl; // native HLS
  } else {
    myAudio.src = 'https://streaming.live365.com/a50378'; // MP3 fallback
  }

  // Toggle UI helper
  function updateIcons() {
    if (myAudio.paused) {
      if (playdiv)  playdiv.style.display  = 'block';
      if (pausediv) pausediv.style.display = 'none';
    } else {
      if (playdiv)  playdiv.style.display  = 'none';
      if (pausediv) pausediv.style.display = 'block';
    }
  }

  // Button: topbar icon
  if (control) {
    control.addEventListener('click', () => {
      if (myAudio.paused) {
        myAudio.play().then(updateIcons).catch(e => console.error('❌ Play failed:', e));
      } else {
        myAudio.pause();
        updateIcons();
      }
    });
  }

  // Button: sidebar "Open Player" uses same audio
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (myAudio.paused) {
        myAudio.play().then(updateIcons).catch(e => console.error('❌ Play failed:', e));
      } else {
        myAudio.pause();
        updateIcons();
      }
    });
  }

  // Keep icons in sync with real state
  myAudio.addEventListener('play', updateIcons);
  myAudio.addEventListener('pause', updateIcons);
  myAudio.addEventListener('ended', updateIcons);

  // Stop audio when leaving page
  window.addEventListener('pagehide', () => {
    if (!myAudio.paused) myAudio.pause();
  });
});

// ========= Desktop/Mobile nav active state =========
document.querySelectorAll('.navlink').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('.navlink').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

// ========= Mobile nav toggle =========
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const menu   = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("show"));
  }
});

// ========= Now Playing (guarded; skip if elements not present) =========
async function fetchNowPlaying() {
  const titleEl = document.getElementById("npTitle");
  const artistEl = document.getElementById("npArtist");
  const artEl = document.getElementById("npArt");
  if (!titleEl || !artistEl || !artEl) return; // using iframe on home page

  try {
    const res = await fetch("https://api.live365.com/station/a50378");
    const data = await res.json();
    if (data && data.currentTrack) {
      titleEl.textContent  = data.currentTrack.title || "Unknown Title";
      artistEl.textContent = data.currentTrack.artist || "Unknown Artist";
      artEl.src            = data.currentTrack.art || "/test1/placeholder.png";
    }
  } catch (err) {
    console.error("Now Playing fetch error:", err);
  }
}
fetchNowPlaying();
setInterval(fetchNowPlaying, 20000);

// ========= Who's Listening (guarded) =========
async function fetchWhoListening() {
  const totalEl = document.getElementById("listenerTotal");
  const listEl  = document.getElementById("listenerLocations");
  if (!totalEl || !listEl) return;

  try {
    const res = await fetch("/test1/real_time_sessions.csv");
    const csvText = await res.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const countryIdx = headers.indexOf("country");
    const cityIdx    = headers.indexOf("city");
    const countIdx   = headers.indexOf("active_session_count");

    let total = 0;
    const locations = {};

    dataRows.forEach(r => {
      const country = r[countryIdx];
      const city    = r[cityIdx];
      const count   = parseInt(r[countIdx] || "0", 10);
      total += count;
      const key = `${country} (${city})`;
      locations[key] = (locations[key] || 0) + count;
    });

    totalEl.textContent = total;

    const top = Object.entries(locations).sort((a,b) => b[1]-a[1]).slice(0,5);
    listEl.innerHTML = "";
    top.forEach(([loc, count]) => {
      const li = document.createElement("li");
      li.textContent = `${loc} — ${count}`;
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading Who's Listening CSV:", err);
  }
}
fetchWhoListening();
setInterval(fetchWhoListening, 60000);

// ========= WSR Info (placeholder until real source) =========
function loadWSRInfo() {
  const xrTopEl = document.getElementById('xrTop');
  const xrStatsEl = document.getElementById('xrStats');
  if (!xrTopEl || !xrStatsEl) return;

  xrTopEl.innerHTML  = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
  xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';
}
loadWSRInfo();

// ========= Song Requests logic =========
// Always show the form so users can send; status tells if live or off-air
const liveShows = [
  { day: "Wednesday", start: "15:00", end: "17:00" },
  { day: "Sunday",    start: "20:00", end: "21:00" },
];

function isLiveNow() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const current = now.toTimeString().slice(0,5);
  return liveShows.some(s => s.day === dayName && current >= s.start && current < s.end);
}

function updateRequestStatus() {
  const status = document.getElementById("request-status");
  const form   = document.getElementById("requestForm");
  if (!status || !form) return;

  // Keep the form visible, change the message only
  if (isLiveNow()) {
    status.textContent = "✅ Requests are OPEN — your DJ is live!";
  } else {
    status.textContent = "ℹ️ Off-air: your request will be queued for the next live show.";
  }
}
updateRequestStatus();
setInterval(updateRequestStatus, 30000);

// Formspree submit
document.addEventListener("DOMContentLoaded", () => {
  const form    = document.getElementById("requestForm");
  const success = document.getElementById("success");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    fetch(form.action, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    }).then(resp => {
      if (resp.ok) {
        form.reset();
        if (success) success.style.display = "block";
        setTimeout(() => { if (success) success.style.display = "none"; }, 4000);
      } else {
        alert("⚠️ There was an issue sending your request.");
      }
    }).catch(() => alert("⚠️ Network error. Try again later."));
  });
});

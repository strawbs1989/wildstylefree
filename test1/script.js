// ======================
// Basic player logic with HLS support
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const myAudio = document.getElementById('myAudio');
  const playdiv = document.getElementById('playdiv');
  const pausediv = document.getElementById('pausediv');
  const controlBtn = document.getElementById('control');
  const streamUrl = 'https://streaming.live365.com/a50378/playlist.m3u8';

  // Attach HLS
  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(myAudio);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ HLS manifest loaded');
    });
  } else if (myAudio.canPlayType('application/vnd.apple.mpegurl')) {
    myAudio.src = streamUrl;
  } else {
    myAudio.src = 'https://streaming.live365.com/a50378';
  }

  // Play/Pause
  controlBtn.addEventListener('click', () => {
    if (myAudio.paused) {
      myAudio.play().then(() => {
        playdiv.style.display = 'none';
        pausediv.style.display = 'block';
      }).catch(e => console.error('❌ Play failed:', e));
    } else {
      myAudio.pause();
      playdiv.style.display = 'block';
      pausediv.style.display = 'none';
    }
  });
});

// ======================
// Nav links active state
// ======================
document.querySelectorAll('.navlink').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('.navlink').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

// ======================
// Now Playing (Live365 API)
// ======================
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
fetchNowPlaying();
setInterval(fetchNowPlaying, 20000);

// ======================
// Who's Listening (auto from CSV)
// ======================
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

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

// ======================
// Stop audio when leaving page
// ======================
window.addEventListener('pagehide', () => {
  const myAudio = document.getElementById('myAudio');
  if (myAudio && !myAudio.paused) {
    myAudio.pause();
  }
});

// ======================
// WSR Info placeholder
// ======================
function loadWSRInfo() {
  const xrTopEl = document.getElementById('xrTop');
  const xrStatsEl = document.getElementById('xrStats');

  if (xrTopEl && xrStatsEl) {
    xrTopEl.innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
    xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';
  }
}
loadWSRInfo();

// ======================
// SONG REQUEST SYSTEM
// ======================
const liveShows = [
  { day: "Wednesday", start: "15:00", end: "17:00" },
  { day: "Sunday", start: "20:00", end: "21:00" },
];

function isLiveNow() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  return liveShows.some(show =>
    show.day === dayName && currentTime >= show.start && currentTime < show.end
  );
}

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
setInterval(updateRequestStatus, 30000);
window.addEventListener("load", updateRequestStatus);

// ======================
// Formspree submission
// ======================
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
          if (success) success.style.display = "block";
        } else {
          alert("⚠️ There was an issue sending your request.");
        }
      }).catch(() => {
        alert("⚠️ Network error. Try again later.");
      });
    });
  }
});

// ======================
// Mobile nav toggle
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("show");
    });
  }
});

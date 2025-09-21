// Basic player logic with HLS support
const audio = document.getElementById('player');

function initPlayer() {
  const streamUrl = 'https://streaming.live365.com/a50378/playlist.m3u8';

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
{
  "name": "Wildstyleradio",
  "station-logo": "https://media.live365.com/download/a6fa5836-cc54-4daf-bb69-637f14ed0587.png",
  "station-logo-dominant-color": "#3c3145",
  "genres": [
    "Alternative",
    "80s",
    "90s",
    "00s",
    "Drum 'n' Bass"
  ],
  "website": "https://wildstyle.vip",
  "timezone": "UTC",
  "stream-urls": [
    {
      "high_quality": "https://streaming.live365.com/a50378",
      "encoding": "mp3"
    },
    {
      "low_quality": "https://streaming.live365.com/a50378",
      "encoding": "mp3"
    },
    {
      "hls": "https://streaming.live365.com/a50378/playlist.m3u8",
      "encoding": "mp3"
    }
  ],
  "stream-url": "https://streaming.live365.com/a50378",
  "stream-hls-url": "https://streaming.live365.com/a50378/playlist.m3u8",
  "listening-urls": [
    {
      "url": "https://streaming.live365.com/a50378",
      "encoding": "mp3",
      "bitrate": 128
    }
  ],
  "description": "Where music comes alive!",
  "facebook": "https://www.facebook.com/wildstyleuk",
  "twitter": null,
  "instagram": null,
  "current-track": {
    "title": "Popped Radio TAKEOVER from the Queen City NY",
    "artist": "",
    "art": "https://broadcaster.live365.com/static/assets/img/blankart.jpg",
    "start": "2025-09-21 19:12:47.990327+00:00",
    "played": "True",
    "sync_offset": 0,
    "duration": null,
    "source": "live",
    "status": "playing"
  },
  "last-played": [
    {
      "title": "",
      "artist": "",
      "art": "https://broadcaster.live365.com/static/assets/img/blankart.jpg",
      "start": "2025-09-21 19:05:07.947151+00:00",
      "played": true,
      "sync_offset": 0,
      "duration": null,
      "end": null,
      "source": "live"
    }
  ],
  "mount-id": "a50378",
  "cover": "https://media.live365.com/download/c1f99e18-3cb2-4389-901b-3f7b4a036812.jpg",
  "auto_dj_on": false,
  "live_dj_on": true,
  "active_mount": "live",
  "is_playing": true,
  "station_enabled": true,
  "slug": "Wildstyleradio",
  "listeners": 6,
  "station_type": "broadcaster",
  "cache-time": "2025-09-21 19:21:28.309764",
  "cache-host": "d708d5dac464ac3e4f769074d3550aa59e09a2bd29cd18c7b5130801"
}
// Accessibility: stop audio when navigating away
window.addEventListener('pagehide', () => {
  audio.pause();
  if (playBtn) playBtn.textContent = 'Play';
});

// WSR Stats
async function fetchWSRLiveStats() {
  const xrTopEl = document.getElementById('xrTop');
  const xrStatsEl = document.getElementById('xrStats');

  try {
    // Replace with your real streaminfo URL if you get one working
    const res = await fetch("https://streaming.live365.com/a50378");
    if (!res.ok) throw new Error("Streaminfo endpoint not ok");

    const data = await res.json();
    // Suppose data has fields: title, listeners, etc
    const title = data.current_track || data.title || "Unknown Track";
    const listeners = data.listeners_count || data.current_listeners || 0;

    xrTopEl.innerHTML = `Now playing: <strong>${title}</strong>`;
    xrStatsEl.innerHTML = `Current listeners: <strong>${listeners}</strong>`;
  } catch (err) {
    console.warn("WSR Live stats fetch failed:", err);
    // Fallback static
    xrTopEl.innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
    xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';
  }
}

// Call it at load, then periodically
fetchWSRLiveStats();
setInterval(fetchWSRLiveStats, 60000);





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

// Who's listening & shoutouts (placeholder)
const locationEl = document.getElementById('location');
if (locationEl) locationEl.textContent = 'United Kingdom (estimated)';

const shoutouts = document.getElementById('shoutouts');
if (shoutouts) {
  shoutouts.innerHTML = '';
  ['Jay from Cornwall', 'Laura in Plymouth', 'Hannah - sending love'].forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    shoutouts.appendChild(li);
  });
}

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

// Accessibility: stop audio when navigating away
window.addEventListener('pagehide', () => {
  audio.pause();
  if (playBtn) playBtn.textContent = 'Play';
});

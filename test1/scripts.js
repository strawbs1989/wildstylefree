const btn = document.getElementById('playPauseBtn');
let playing = false;
btn.addEventListener('click', () => {
  playing = !playing;
  btn.textContent = playing ? '⏸ Pause' : '▶ Play';
  document.getElementById('nowPlaying').textContent =
    playing ? 'Now Playing: Live Wildstyle Radio Stream' : 'Now Playing: DJ Spotlight Mix';
});

document.getElementById('requestBtn').addEventListener('click', () => {
  alert('Request form coming soon!');
});

setInterval(() => {
  document.getElementById('listenerCount').textContent = 'Live listeners: ' + Math.floor(Math.random() * 50 + 1);
}, 5000);

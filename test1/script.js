// Fetch Now Playing info
function fetchNowPlaying() {
  document.getElementById('current-track').innerText = 'Artist - Track Name'; // Replace with real fetch
}

function fetchListeners() {
  document.getElementById('listeners').innerText = 'X listeners from ExperienceRewind'; // Replace with real fetch
}

function fetchXRInfo() {
  document.getElementById('xr-text').innerText = 'ExperienceRewind - The ultimate radio experience!';
}

// Periodic updates
setInterval(fetchNowPlaying, 30000);
setInterval(fetchListeners, 60000);
fetchNowPlaying();
fetchListeners();
fetchXRInfo();

// Play/Pause Button
const playPauseBtn = document.getElementById('play-pause');
let isPlaying = false;

playPauseBtn.addEventListener('click', () => {
  if (!isPlaying) {
    // Open stream in the same tab or embed a player
    window.open('https://streaming.live365.com/a50378', '_blank');
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    // No direct pause; toggle icon
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  isPlaying = !isPlaying;
});
 // Fetch Now Playing info from Live365
function fetchNowPlaying() {
  // Example: just static data or fetch from your API if available
  document.getElementById('current-track').innerText = 'Artist - Track Name'; // Placeholder
}

function fetchListeners() {
  // Example: static or fetch from your API
  document.getElementById('listeners').innerText = 'X listeners from ExperienceRewind'; // Placeholder
}

function fetchXRInfo() {
  // Fetch info from ExperienceRewind or static info
  const xrText = document.getElementById('xr-text');
  // For demo, static info
  xrText.innerText = 'ExperienceRewind - The ultimate radio experience!';
}

// Update periodically
setInterval(fetchNowPlaying, 30000);
setInterval(fetchListeners, 60000);
fetchNowPlaying();
fetchListeners();
fetchXRInfo();

// Play/Pause Button Logic
const playPauseBtn = document.getElementById('play-pause');
let isPlaying = false;

playPauseBtn.addEventListener('click', () => {
  if (!isPlaying) {
    // Play stream
    window.open('https://streaming.live365.com/a50378', '_blank');
    // Change icon
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    // Pause stream - no direct pause, so perhaps just switch icon or stop playback
    // If embedded player, implement pause logic
    // For now, toggle icon
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  isPlaying = !isPlaying;
});
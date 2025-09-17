function togglePlayer() {
  const player = document.getElementById('livePlayer');
  const btn = document.getElementById('playBtn');
  
  if (!player || !btn) return; // Safety check

  if (player.paused) {
    player.play().then(() => {
      btn.innerText = '⏸ Pause';
    }).catch(error => {
      console.error('Error attempting to play:', error);
    });
  } else {
    player.pause();
    btn.innerText = '▶ Live Player';
  }
}

// Optional: Update button text when stream ends
document.getElementById('livePlayer').addEventListener('ended', () => {
  document.getElementById('playBtn').innerText = '▶ Live Player';
});

function updateNowPlaying(track) {
  document.getElementById('NowOn').textContent = track;
}

function updateWSRInfo(info) {
  document.getElementById('infoCard').textContent = info;
}

function fetchStatus() {
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      updateNowPlaying(data.nowPlaying);
      updateListeners(data.listenerCount, data.listeners);
      updateWSRInfo(data.wsrInfo);
    })
    .catch(error => console.error('Error fetching status:', error));
}

// Poll every 10 seconds
setInterval(fetchStatus, 10000);

// Initial fetch
fetchStatus();
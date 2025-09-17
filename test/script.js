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

// Mock data object
let mockData = {
  nowPlaying: "Initial Track",
  listeners: ["Listener1", "Listener2"],
  listenerCount: 2,
  wsrInfo: "Initial info about WSR"
};

// Function to simulate data updates
function simulateDataUpdate() {
  const tracks = ["Track A", "Track B", "Track C", "Track D"];
  mockData.nowPlaying = tracks[Math.floor(Math.random() * tracks.length)];

  mockData.listenerCount = Math.floor(Math.random() * 20);
  
  mockData.listeners = [];
  for (let i = 0; i < mockData.listenerCount; i++) {
    mockData.listeners.push(`Listener${Math.floor(Math.random() * 100)}`);
  }

  mockData.wsrInfo = `Updated info at ${new Date().toLocaleTimeString()}`;

  setTimeout(simulateDataUpdate, 15000); // update every 15 seconds
}

// Start simulation
simulateDataUpdate();

// Your existing fetchStatus() function
function fetchStatus() {
  setTimeout(() => {
    const data = mockData;
    updateNowPlaying(data.nowPlaying);
    updateListeners(data.listenerCount, data.listeners);
    updateWSRInfo(data.wsrInfo);
  }, 500);
}

// Poll every 10 seconds
setInterval(fetchStatus, 10000);
// Initial load
fetchStatus();







function updateNowPlaying(track) {
  document.getElementById('NowOn').textContent = track;
}

simulateDataUpdate(); // start the simulation



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
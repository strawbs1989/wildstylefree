document.addEventListener('DOMContentLoaded', () => {
    // Mock data setup
    let mockData = {
      nowPlaying: "Initial Track",
      listenerCount: 0,
      listeners: [],
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
    }

    // Function to update DOM elements from mock data
    function updateDisplay() {
      document.getElementById('NowOn').textContent = mockData.nowPlaying;
      document.getElementById('listenerCount').textContent = '🎧 ' + mockData.listenerCount;
      document.getElementById('listenerList').textContent = mockData.listeners.join(', ') || 'No listeners currently.';
      document.getElementById('infoCard').textContent = mockData.wsrInfo;
    }

    // Periodically simulate data and update UI
    setInterval(() => {
      simulateDataUpdate();
      updateDisplay();
    }, 15000); // every 15 seconds

    // Initial data load
    simulateDataUpdate();
    updateDisplay();

    // Toggle player function
    function togglePlayer() {
      const player = document.getElementById('livePlayer');
      const btn = document.getElementById('playBtn');

      if (!player || !btn) return;

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

    // Event listener for play button
    document.getElementById('playBtn').addEventListener('click', togglePlayer);

    // Optional: update button text when stream ends
    document.getElementById('livePlayer').addEventListener('ended', () => {
      document.getElementById('playBtn').innerText = '▶ Live Player';
    });

    // Optional: if you want to fetch real data instead of simulation, replace simulateDataUpdate() with your fetch code as needed
  });
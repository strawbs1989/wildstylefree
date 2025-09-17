const stream = document.getElementById('stream');
  const playBtn = document.getElementById('playPause');

  // Toggle play/pause
  playBtn.onclick = () => {
    if(stream.paused) stream.play();
    else stream.pause();
  };

  // Fetch current song info (simulate or connect to your API)
  async function fetchCurrentSong() {
    // Example static data
    document.getElementById('current-song').innerHTML = `
      <p>Title: Example Song</p>
      <p>Artist: Example Artist</p>
    `;
    // For real data, fetch from your API or JSON
  }

  // Fetch listener count (simulate or connect to Live365 API)
  async function fetchListeners() {
    // Example: random number
    const count = Math.floor(Math.random() * 1000);
    document.getElementById('listeners-count').innerText = count + ' listeners';
  }

  fetchCurrentSong();
  fetchListeners();
  setInterval(fetchListeners, 30000); // update every 30 seconds
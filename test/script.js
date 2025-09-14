<!-- JS -->
  
    function togglePlayer() {
      const player = document.getElementById('livePlayer');
      const btn = event.target;
      if (player.paused) {
        player.play();
        btn.textContent = "⏸ Pause Player";
      } else {
        player.pause();
        btn.textContent = "▶ Live Player";
      }
    }

    // Schedule Matrix
    var DH = Array.from({ length: 7 }, () => Array(24).fill(""));
    DH[1][12] = "12pm – 2pm<br>James - Wizard Of Rock";
    DH[1][14] = "2pm – 4pm<br>BabyJane";
    DH[1][15] = "3pm – 5pm<br>James Stephen";
    DH[1][17] = "5pm – 7pm<br>Lewis";
    DH[1][19] = "7pm – 10pm<br>DJ Dezzy – Mix Set";
    DH[1][22] = "10pm – 12am<br>DJ Jayden Mac – Grime";
    // ... (rest of week filled the same way)

    function NowON() {
      const now = new Date();
      const show = DH[now.getDay()][now.getHours()] || "No Show Scheduled";
      document.getElementById("NowOn").innerHTML = show;
    }

    // XR Info extractor
    function extractAndDisplayInfo() {
      const loadDiv = document.querySelector('#load_xrinfo');
      if (!loadDiv) {
        document.querySelector('#infoCard').innerHTML = '<p>No data available</p>';
        return;
      }
      const links = loadDiv.querySelectorAll('a');
      let listenerLocation = links[1]?.textContent.trim() || 'N/A';
      let recentQuestion = 'N/A';
      let likes = 'N/A';
      links.forEach(link => {
        const text = link.textContent.trim();
        if (text.includes('They asked me how I knew')) recentQuestion = text;
        if (text.includes('likes')) likes = text;
      });
      document.querySelector('#infoCard').innerHTML = `
        <p><strong>Listener Location:</strong> ${listenerLocation}</p>
        <p><strong>Recent Question:</strong> ${recentQuestion}</p>
        <p><strong>Number of Likes:</strong> ${likes}</p>`;
    }
    setInterval(extractAndDisplayInfo, 30000);
    extractAndDisplayInfo();
  
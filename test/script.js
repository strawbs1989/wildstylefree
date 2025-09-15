function togglePlayer(e) {
  const player = document.getElementById('livePlayer');
  const btn = e.target;
  if (player.paused) {
    player.play();
    btn.textContent = "⏸ Pause Player";
  } else {
    player.pause();
    btn.textContent = "▶ Live Player";
  }
}

// Schedule fallback
var DH = Array.from({ length: 7 }, () => Array(24).fill(""));
DH[1][12] = "12pm – 2pm James - Wizard Of Rock";

function NowON() {
  const now = new Date();
  const show = DH[now.getDay()][now.getHours()] || "No Show Scheduled";
  document.getElementById("NowOn").innerHTML = show;
}

// Metadata fetch proxy attempt
async function fetchMetadata() {
  try {
    let res = await fetch('proxy.php'); // placeholder proxy script
    let data = await res.json();
    if (data && data.title) {
      document.getElementById('NowOn').innerText = data.artist + " — " + data.title;
    }
  } catch (e) {
    console.log("Fallback to schedule", e);
    NowON();
  }
}

setInterval(fetchMetadata, 30000);
fetchMetadata();

// XR Info dummy
function extractAndDisplayInfo() {
  document.querySelector('#infoCard').innerHTML = `
    <p><strong>Listener Location:</strong> UK</p>
    <p><strong>Recent Question:</strong> Example Question</p>
    <p><strong>Number of Likes:</strong> 42</p>`;
}
extractAndDisplayInfo();
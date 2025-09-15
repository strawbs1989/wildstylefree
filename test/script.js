function togglePlayer(event) {
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

// Weekly schedule matrix
var DH = Array.from({ length: 7 }, () => Array(24).fill(""));
DH[1][12] = "12pm – 2pm<br>James - Wizard Of Rock";
DH[1][14] = "2pm – 4pm<br>BabyJane";
DH[1][15] = "3pm – 5pm<br>James Stephen";
DH[1][17] = "5pm – 7pm<br>Lewis";
DH[1][19] = "7pm – 10pm<br>DJ Dezzy – Mix Set";
DH[1][22] = "10pm – 12am<br>DJ Jayden Mac – Grime";

function NowON() {
  const now = new Date();
  const show = DH[now.getDay()][now.getHours()] || "No Show Scheduled";
  document.getElementById("NowOn").innerHTML = show;
}

// XR Info extractor (placeholder)
function extractAndDisplayInfo() {
  const infoCard = document.querySelector('#infoCard');
  if (!infoCard) return;
  infoCard.innerHTML = `
    <p><strong>Listener Location:</strong> UK</p>
    <p><strong>Recent Question:</strong> Who runs Wildstyle?</p>
    <p><strong>Number of Likes:</strong> 25</p>
  `;
}
setInterval(extractAndDisplayInfo, 30000);
extractAndDisplayInfo();

function togglePlayer() {
  const player = document.getElementById('livePlayer');
  if (player.paused) { player.play(); document.getElementById('playBtn').innerText = '⏸ Pause'; }
  else { player.pause(); document.getElementById('playBtn').innerText = '▶ Live Player'; }
}
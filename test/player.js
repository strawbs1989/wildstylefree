const player =
  document.getElementById("radioPlayer");

const playBtn =
  document.getElementById("playBtn");

player.src =
  "https://streaming.live365.com/a50378";

playBtn.addEventListener("click", () => {

  if (player.paused) {

    player.play();

    playBtn.textContent = "⏸️";

  } else {

    player.pause();

    playBtn.textContent = "▶️";

  }

});

document
.getElementById("volumeSlider")
.addEventListener("input", e => {

  player.volume =
    e.target.value / 100;

});
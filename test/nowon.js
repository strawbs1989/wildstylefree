const NOWON_URL = "https://script.google.com/macros/s/AKfycbydBPqENGJ6B49CGP6IIFKD0QD-bwJ9n9VL0b8UdckOKUmOkJ77W2ooobnf4KZ9jGU/exec";

async function loadNowOn() {






  const nowEl = document.getElementById("nowon");
  const heroShowName = document.getElementById("heroShowName");
  const heroShowTime = document.getElementById("heroShowTime");

  if (!nowEl) return;

  try {

    const res = await fetch(
      NOWON_URL + "?t=" + Date.now(),
      { cache: "no-store" }
    );

    const data = await res.json();

    nowEl.textContent = data.text || "Off Air";


const playerDJ =
  document.getElementById("playerDJ");

const playerTime =
  document.getElementById("playerTime");



    if (data.currentSlot) {

  if (heroShowName) {
    heroShowName.textContent =
      data.currentSlot.dj;
  }

  if (heroShowTime) {
    heroShowTime.textContent =
      data.currentSlot.start +
      " - " +
      data.currentSlot.end;
  }

  const heroDJ =
    document.getElementById("heroDJ");

  const liveDJ =
    schedule.find(
      show => show.dj === data.currentSlot.dj
    );

  if (heroDJ && liveDJ) {
    heroDJ.src = liveDJ.image;
  }

}
document.addEventListener("DOMContentLoaded", () => {

  loadNowOn();

  setInterval(loadNowOn, 60000);

});
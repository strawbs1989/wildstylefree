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

    const playerArtwork =
  document.getElementById("playerArtwork");

const heroDJ =
  document.getElementById("heroDJ");


const currentDJ =
  schedule.find(
    show => show.dj === data.currentSlot.dj
  );

if (playerArtwork && currentDJ) {
  playerArtwork.src = currentDJ.image;
}

if (heroDJ && currentDJ) {
  heroDJ.src = currentDJ.image;
}

    console.log("FOUND SLOT");
console.log(data.currentSlot);

    



      if (playerDJ) {
        playerDJ.textContent =
          data.currentSlot.dj;
      }

      if (playerTime) {
        playerTime.textContent =
          data.currentSlot.start +
          " - " +
          data.currentSlot.end;
      }

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

      

    

  } catch (err) {

    console.error("Now On failed:", err);

    nowEl.textContent = "Off Air";

  }

}

document.addEventListener("DOMContentLoaded", () => {

  loadNowOn();

  setInterval(loadNowOn, 60000);

});
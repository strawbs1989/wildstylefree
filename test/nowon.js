const NOWON_URL = "https://script.google.com/macros/s/AKfycbydBPqENGJ6B49CGP6IIFKD0QD-bwJ9n9VL0b8UdckOKUmOkJ77W2ooobnf4KZ9jGU/exec";

const djImages = {
  "DJ STORMZy": "/images/stormzy.jpg",
  "DJ Nala": "/images/djnala.jpg",
  "DJ Don": "/images/djdon.jpg",
  "DJ EchoFalls": "/images/djechofalls.jpg",
  "Chanel": "/images/chanel.jpg"
};

async function loadNowOn() {
  const nowEl = document.getElementById("nowon");
  const heroDJ = document.getElementById("heroDJ");

  if (!nowEl) return;

  try {
    const res = await fetch(
      NOWON_URL + "?t=" + Date.now(),
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Now On request failed");

    const data = await res.json();

    nowEl.textContent = data.text || "Off Air";

    if (heroDJ) {

      for (const dj in djImages) {

        if (data.text.includes(dj)) {

          heroDJ.src = djImages[dj];
          break;

        }

      }

    }

  } catch (err) {

    console.error(err);

    nowEl.textContent = "Off Air";

  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNowOn();
  setInterval(loadNowOn, 60000);
});
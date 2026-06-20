const NOWON_URL = "https://script.google.com/macros/s/AKfycbydBPqENGJ6B49CGP6IIFKD0QD-bwJ9n9VL0b8UdckOKUmOkJ77W2ooobnf4KZ9jGU/exec";

/* DJ images */
const djImages = {
  "DJ EchoFalls": "/images/echo1.jpg",
  "DJ Nala": "/images/djnala.jpg",
  "DJ Don": "/images/don.jpg",
  "DJ StormZy": "/images/spark.jpeg",
  "DJ Chanel": "/images/chanel.jpg"
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

    if (!res.ok) {
      throw new Error("Now On request failed: " + res.status);
    }

    const data = await res.json();

    const nowText = data.text || "Off Air";

    nowEl.textContent = nowText;

    /* Change hero image automatically */

    if (heroDJ) {

      let foundImage = false;

      Object.keys(djImages).forEach(dj => {

        if (nowText.toLowerCase().includes(dj.toLowerCase())) {

          heroDJ.src = djImages[dj];
          foundImage = true;

        }

      });

      if (!foundImage) {
        heroDJ.src = "/images/defaultdj.jpg";
      }

    }

  } catch (err) {

    console.error("Now On failed:", err);

    nowEl.textContent = "Off Air";

    if (heroDJ) {
      heroDJ.src = "/images/defaultdj.jpg";
    }

  }

}

document.addEventListener("DOMContentLoaded", () => {

  loadNowOn();

  setInterval(loadNowOn, 60000);

});
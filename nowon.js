const NOWON_URL = "https://script.google.com/macros/s/AKfycbydBPqENGJ6B49CGP6IIFKD0QD-bwJ9n9VL0b8UdckOKUmOkJ77W2ooobnf4KZ9jGU/exec";

async function loadNowOn() {
  const nowEl = document.getElementById("nowon");
  if (!nowEl) return;

  try {
    const res = await fetch(NOWON_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("Now On request failed: " + res.status);

    const data = await res.json();
    nowEl.textContent = data.text || "Off Air";
  } catch (err) {
    console.error("Now On failed:", err);
    nowEl.textContent = "Off Air";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNowOn();
  setInterval(loadNowOn, 60000);
}); 

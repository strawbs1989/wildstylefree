const NOWON_URL = "https://script.google.com/macros/s/AKfycbze6G605GR2QpJU8uDlilbh3ie8Wr9zpTLUmz3azHdSl1OtalHQWSlTPiUSH7oWhlc/exec";
const UPNEXT_URL = "https://script.google.com/macros/s/AKfycbw1qz4qgUrlon1BI9WD28y78OPQkQ01Wmhr9mygD6Jxm-ZfDDiL0tC3kwDurHYT-73Y/exec";

async function loadNowOn() {
  const el = document.getElementById("nowon");
  if (!el) {
    console.warn("nowon element not found");
    return;
  }

  try {
    const res = await fetch(NOWON_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Now On request failed: " + res.status);
    }

    const data = await res.json();
    el.textContent = data.text || "Off Air";
  } catch (err) {
    console.error("Now On failed:", err);
    el.textContent = "Off Air";
  }
}

async function loadUpNext() {
  const el = document.getElementById("upNext");
  if (!el) {
    console.warn("upNext element not found");
    return;
  }

  try {
    const res = await fetch(UPNEXT_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Up Next request failed: " + res.status);
    }

    const data = await res.json();

    el.innerHTML = data.dj
      ? `${escapeHtml(data.dj)}<br><span class="muted-inline">${escapeHtml(data.start)}–${escapeHtml(data.end)} UK</span>`
      : (data.text || "No upcoming shows");
  } catch (err) {
    console.error("Up Next failed:", err);
    el.textContent = "Unavailable";
  }
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadNowOn();
  loadUpNext();

  setInterval(loadNowOn, 60000);
  setInterval(loadUpNext, 60000);
}); 

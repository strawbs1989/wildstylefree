const UPNEXT_URL =
  "https://script.google.com/macros/s/AKfycbyz46hBv4Sd1Qyl0vtbZ78n41RxjSn1UWydb8b36yymk8uVJeJGCLiYz7kiBQYNlaIN/exec";

function escapeHtmlUpNext(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadUpNextOnly() {
  const upNextEl = document.getElementById("upNext");
  if (!upNextEl) return;

  try {
    const res = await fetch(UPNEXT_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Up Next request failed: " + res.status);
    }

    const data = await res.json();

    upNextEl.innerHTML = data.dj
      ? `${escapeHtmlUpNext(data.dj)}<br><span class="muted-inline">${escapeHtmlUpNext(data.start)}–${escapeHtmlUpNext(data.end)} UK</span>`
      : (data.text || "No upcoming shows");
  } catch (err) {
    console.error("Up Next failed:", err);
    upNextEl.textContent = "Unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadUpNextOnly();
  setInterval(loadUpNextOnly, 60000);
});
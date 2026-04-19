/* -------------------------
   SHOUT
------------------------- */

let userCountry = "Unknown Country";

// 🌍 GET COUNTRY
async function getCountry() {
  const countryEl = document.getElementById("listenerCountry");

  try {
    const res = await fetch("https://ipwho.is/");

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.success === false) {
      throw new Error(data.message || "API request failed");
    }

    userCountry = data.country || "Unknown Country";

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: " + userCountry;
    }
  } catch (err) {
    console.warn("Country lookup failed:", err);
    userCountry = "Unknown Country";

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: Unknown Country";
    }
  }
}

getCountry();

/* -------------------------
   SHOUT TICKER
------------------------- */

const SHOUTS_URL = "PASTE_YOUR_SHOUTS_API_URL_HERE";

async function loadShoutouts() {
  const tickerText = document.getElementById("tickerText");
  const tickerClone = document.getElementById("tickerTextClone");

  if (!tickerText || !tickerClone) return;

  try {
    const res = await fetch(SHOUTS_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Shout fetch failed: " + res.status);
    }

    const data = await res.json();

    const items = Array.isArray(data)
      ? data
      : (data.shoutouts || []);

    const text = items.length
      ? items.map(s =>
          `🔥 ${s.name || "Listener"}: ${s.message || ""} 🌍 ${s.country || "Unknown"}`
        ).join(" • ")
      : "No shout-outs yet";

    tickerText.textContent = text;
    tickerClone.textContent = text;

  } catch (err) {
    console.error("Shout load failed:", err);
    tickerText.textContent = "Shout-outs unavailable";
    tickerClone.textContent = "Shout-outs unavailable";
  }
}

// run it
loadShoutouts();
setInterval(loadShoutouts, 15000);
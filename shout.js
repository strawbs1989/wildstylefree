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
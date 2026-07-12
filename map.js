async function registerVisitor() {
  try {
    // Ask the Worker which country this visitor is in
    const response = await fetch(WORKER_URL + "/country");

if (!response.ok) {
  throw new Error(`Country lookup failed: ${response.status}`);
}

    const data = await response.json();

    console.log("Country endpoint returned:", data);

    const register = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        country: data.country || ""
      })
    });

    const text = await register.text();

    console.log("POST status:", register.status, text);

    if (!register.ok) {
      throw new Error(`Register failed (${register.status}): ${text}`);
    }

    console.log("Visitor registered:", data.country);

  } catch (err) {
    console.error("Could not register visitor:", err);
  }
}



const WORKER_URL = "https://wildstyle-geo.jayaubs89.workers.dev/";

const countryPositions = {
  "United Kingdom": { x: 46.5, y: 26.5 },
  "Ireland": { x: 44.8, y: 27.0 },
  "France": { x: 47.2, y: 30.5 },
  "Germany": { x: 50.0, y: 27.8 },
  "Spain": { x: 45.0, y: 35.0 },
  "Italy": { x: 50.5, y: 34.2 },
  "Netherlands": { x: 48.2, y: 26.8 },
  "Belgium": { x: 47.7, y: 28.5 },
  "Sweden": { x: 54.8, y: 18.5 },
  "Norway": { x: 50.5, y: 15.5 },
  "Finland": { x: 58.0, y: 17.5 },

  "United States": { x: 20.0, y: 31.5 },
  "Canada": { x: 18.5, y: 18.5 },
  "Mexico": { x: 18.8, y: 41.5 },

  "Brazil": { x: 31.0, y: 60.0 },
  "Argentina": { x: 30.5, y: 79.0 },

  "Australia": { x: 85.8, y: 74.5 },
  "New Zealand": { x: 92.8, y: 82.5 },

  "India": { x: 66.0, y: 41.0 },
  "Pakistan": { x: 63.5, y: 38.0 },
  "China": { x: 73.5, y: 31.5 },
  "Japan": { x: 84.8, y: 31.2 },
  "South Korea": { x: 81.8, y: 30.0 },

  "Malaysia": { x: 72.5, y: 52.8 },
  "Singapore": { x: 73.0, y: 55.2 },
  "Indonesia": { x: 76.8, y: 59.0 },
  "Philippines": { x: 79.5, y: 47.5 },

  "South Africa": { x: 55.0, y: 78.0 },
  "Kenya": { x: 58.5, y: 55.5 },
  "Nigeria": { x: 50.0, y: 48.5 },
  "Ghana": { x: 48.0, y: 49.5 },

  "Trinidad and Tobago": { x: 28.5, y: 46.0 },
  "Bahamas": { x: 22.8, y: 38.5 },

  "Turkey": { x: 55.0, y: 32.0 },
  "Russia": { x: 63.0, y: 17.5 },
  "Ukraine": { x: 54.5, y: 25.5 },
  "Poland": { x: 50.8, y: 24.5 }
};
let previousData = new Map();

function openMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.add("active");
  if (navBackdrop) navBackdrop.hidden = false;
}

function closeMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.remove("active");
  if (navBackdrop) navBackdrop.hidden = true;
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(n || 0);
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getScale(count) {
  return Math.max(1, Math.min(2.4, 1 + count / 250));
}

function createFeedItems(sorted) {
  const feed = document.getElementById("activityFeed");
  if (!feed) return;

  const updates = sorted
    .map((item) => {
      const prev = previousData.get(item.country) || 0;
      const diff = item.count - prev;
      return { ...item, diff };
    })
    .filter((item) => item.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5);

  if (!updates.length) {
    const topCountry = sorted[0];
    const secondCountry = sorted[1];

    feed.innerHTML = `
      <div class="feed-item">
        <strong>${topCountry ? topCountry.country : "Wildstyle"}</strong>
        <span>${topCountry ? formatNumber(topCountry.count) : "0"} logged listeners currently leading</span>
      </div>
      <div class="feed-item">
        <strong>${secondCountry ? secondCountry.country : "System Live"}</strong>
        <span>${secondCountry ? formatNumber(secondCountry.count) + " logged listeners active" : "Tracking audience globally"}</span>
      </div>
    `;
    return;
  }

  feed.innerHTML = updates.map((item) => `
    <div class="feed-item">
      <strong>${item.country} +${item.diff}</strong>
      <span>New logged listener activity since last refresh</span>
    </div>
  `).join("");
}

function renderMap(data) {
  const mapWrap = document.getElementById("mapWrap");
  const countryList = document.getElementById("countryList");
  const totalListenersBadge = document.getElementById("totalListenersBadge");
  const countryCountBadge = document.getElementById("countryCountBadge");
  const heroTopCountry = document.getElementById("topCountryName");
const mapTopCountry = document.getElementById("mapTopCountryName");
  const topCountryCount = document.getElementById("topCountryCount");
  const lastUpdated = document.getElementById("lastUpdated");

  if (!mapWrap || !countryList) return;

  mapWrap.querySelectorAll(".listener-dot").forEach(dot => dot.remove());

  const sorted = [...data].sort((a, b) => b.count - a.count);
  const totalListeners = sorted.reduce((sum, item) => sum + (item.count || 0), 0);
  const countriesWithPositions = sorted.filter(item => countryPositions[item.country]);
  const topCountry = sorted[0];

  if (totalListenersBadge) {
    totalListenersBadge.textContent = `${formatNumber(totalListeners)} total`;
  }

  if (countryCountBadge) {
    countryCountBadge.textContent = `${sorted.length} countries`;
  }

  if (heroTopCountry) {
  heroTopCountry.textContent = topCountry ? topCountry.country : "No data";
}

if (mapTopCountry) {
  mapTopCountry.textContent = topCountry ? topCountry.country : "No data";
}

  if (topCountryCount) {
    topCountryCount.textContent = topCountry ? formatNumber(topCountry.count) : "0";
  }

  if (lastUpdated) {
    lastUpdated.textContent = `Updated ${formatTime(new Date())}`;
  }

  countriesWithPositions.forEach((item) => {
    const pos = countryPositions[item.country];
    const prev = previousData.get(item.country) || 0;
    const changed = item.count > prev;

    const dot = document.createElement("div");
    dot.className = "listener-dot";
    if (changed) dot.classList.add("listener-dot-new");
    dot.style.left = pos.x + "%";
    dot.style.top = pos.y + "%";
    dot.style.transform = `translate(-50%, -50%) scale(${getScale(item.count)})`;
    dot.setAttribute("data-label", `${item.country} • ${formatNumber(item.count)}`);

    mapWrap.appendChild(dot);
  });

  const topSix = sorted.slice(0, 6);

  countryList.innerHTML = topSix.map((item) => {
    const prev = previousData.get(item.country) || 0;
    const diff = item.count - prev;
    const trend = diff > 0
      ? `<small class="trend-up">+${diff} since last check</small>`
      : `<small>Logged audience activity</small>`;

    return `
      <div class="country-row">
        <div>
          <b>${item.country}</b><br>
          ${trend}
        </div>
        <span class="badge">${formatNumber(item.count)}</span>
      </div>
    `;
  }).join("");

  createFeedItems(sorted);

  previousData.clear();
  sorted.forEach(item => previousData.set(item.country, item.count));
}

async function loadMapData() {

console.log("Refreshing...", new Date().toLocaleTimeString());

  const countryList = document.getElementById("countryList");

  try {
    const res = await fetch(WORKER_URL + "?t=" + Date.now(), {
    cache: "no-store"
});
    const data = await res.json();
    

    if (!Array.isArray(data) || !data.length) {
      if (countryList) {
        countryList.innerHTML = `<div class="error">No listener data returned yet.</div>`;
      }
      return;
    }

    renderMap(data);
  } catch (err) {
    console.error("Listener map load failed:", err);
    if (countryList) {
      countryList.innerHTML = `<div class="error">Could not load listener map data right now.</div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const navClose = document.getElementById("navClose");
  const navBackdrop = document.getElementById("navBackdrop");

  if (burger) burger.onclick = openMenu;
  if (navClose) navClose.onclick = closeMenu;
  if (navBackdrop) navBackdrop.onclick = closeMenu;

  registerVisitor();
loadMapData();

setInterval(() => {
    registerVisitor();
    loadMapData();
}, 30000);
}); 
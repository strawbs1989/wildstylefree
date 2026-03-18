const WORKER_URL = "https://wildstyle-geo.jayaubs89.workers.dev/";

const countryPositions = {
  "United Kingdom": { x: 48, y: 22 },
  "Ireland": { x: 46, y: 23 },
  "Spain": { x: 46, y: 29 },
  "Germany": { x: 52, y: 24 },
  "Switzerland": { x: 51, y: 27 },
  "Sweden": { x: 53, y: 18 },
  "Norway": { x: 51, y: 16 },
  "Finland": { x: 56, y: 16 },
  "Malta": { x: 53, y: 33 },
  "Nigeria": { x: 49, y: 44 },
  "South Africa": { x: 53, y: 62 },
  "Kenya": { x: 56, y: 48 },
  "India": { x: 66, y: 36 },
  "Malaysia": { x: 72, y: 46 },
  "Australia": { x: 81, y: 64 },
  "Canada": { x: 20, y: 22 },
  "United States": { x: 21, y: 30 },
  "Puerto Rico": { x: 29, y: 40 },
  "Trinidad and Tobago": { x: 30, y: 44 }
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
  const topCountryName = document.getElementById("topCountryName");
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

  if (topCountryName) {
    topCountryName.textContent = topCountry ? topCountry.country : "No data";
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
  const countryList = document.getElementById("countryList");

  try {
    const res = await fetch(WORKER_URL + "?t=" + Date.now());
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

  loadMapData();
  setInterval(loadMapData, 30000);
}); 
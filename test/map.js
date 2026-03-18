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

    const burger = document.getElementById("burger");
    const navClose = document.getElementById("navClose");
    const navBackdrop = document.getElementById("navBackdrop");
    if (burger) burger.onclick = openMenu;
    if (navClose) navClose.onclick = closeMenu;
    if (navBackdrop) navBackdrop.onclick = closeMenu;

    function formatNumber(n) {
      return new Intl.NumberFormat().format(n || 0);
    }

    function renderMap(data) {
      const mapWrap = document.getElementById("mapWrap");
      const countryList = document.getElementById("countryList");
      const totalListenersBadge = document.getElementById("totalListenersBadge");
      const countryCountBadge = document.getElementById("countryCountBadge");
      const topCountryName = document.getElementById("topCountryName");
      const topCountryCount = document.getElementById("topCountryCount");

      if (!mapWrap || !countryList) return;

      const existingDots = mapWrap.querySelectorAll(".listener-dot");
      existingDots.forEach(dot => dot.remove());

      const sorted = [...data].sort((a, b) => b.count - a.count);
      const totalListeners = sorted.reduce((sum, item) => sum + (item.count || 0), 0);
      const countriesWithPositions = sorted.filter(item => countryPositions[item.country]);
      const topCountry = sorted[0];

      totalListenersBadge.textContent = formatNumber(totalListeners) + " total";
      countryCountBadge.textContent = sorted.length + " countries";
      topCountryName.textContent = topCountry ? topCountry.country : "No data";
      topCountryCount.textContent = topCountry ? formatNumber(topCountry.count) : "0";

      countriesWithPositions.forEach(item => {
        const pos = countryPositions[item.country];
        const dot = document.createElement("div");
        dot.className = "listener-dot";
        dot.style.left = pos.x + "%";
        dot.style.top = pos.y + "%";
        dot.setAttribute("data-label", `${item.country} • ${formatNumber(item.count)}`);
        mapWrap.appendChild(dot);
      });

      const topFive = sorted.slice(0, 6);
      countryList.innerHTML = topFive.map(item => `
        <div class="country-row">
          <div>
            <b>${item.country}</b><br>
            <small>Logged audience activity</small>
          </div>
          <span class="badge">${formatNumber(item.count)}</span>
        </div>
      `).join("");
    }

    async function loadMapData() {
      const countryList = document.getElementById("countryList");
      try {
        const res = await fetch(WORKER_URL);
        const data = await res.json();

        if (!Array.isArray(data) || !data.length) {
          if (countryList) {
            countryList.innerHTML = '<div class="error">No listener data returned yet.</div>';
          }
          return;
        }

        renderMap(data);
      } catch (err) {
        console.error("Listener map load failed:", err);
        if (countryList) {
          countryList.innerHTML = '<div class="error">Could not load listener map data right now.</div>';
        }
      }
    }

    loadMapData();
    setInterval(loadMapData, 30000);
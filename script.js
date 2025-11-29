// ✅ Google Apps Script endpoint
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1frZjzw1b6CNEHOiOzobXALQatnVRQEKZXDqZg78VTes3oZWOIjxB0aYTIFEptuAw/exec";

// === Fetch & display shoutouts ===
async function fetchShoutouts() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    const list = document.getElementById("shoutoutList");
    if (!list) return;

    list.innerHTML = "";
    data.reverse().forEach(item => {
      const div = document.createElement("div");
      div.className = "shoutout";
      div.innerHTML = `
        <p>${item.message}</p>
        <span>— ${item.name || "Anonymous"}${item.location ? " (" + item.location + ")" : ""}</span>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Shoutout fetch error:", err);
  }
}

const shoutForm = document.getElementById("shoutoutForm");
if (shoutForm) {
  shoutForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const message = document.getElementById("message").value.trim();
    if (!message) return;

    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ name, location, message }),
      headers: { "Content-Type": "application/json" },
    });

    shoutForm.reset();
    fetchShoutouts(); // refresh immediately
  });

  fetchShoutouts();
  setInterval(fetchShoutouts, 10000);
}

// === Ticker updates ===
const SHOUTOUTS_API = SCRIPT_URL;

async function updateTicker() {
  try {
    const res = await fetch(SHOUTOUTS_API);
    const data = await res.json();
    const latest = data.slice(-10);
    const text = latest
      .map(item => `🎵 ${item.name || "Anonymous"}: ${item.message}`)
      .join("  •  ");
    const ticker = document.getElementById("tickerContent");
    if (ticker) ticker.innerText = text;
  } catch (err) {
    console.error("Ticker error:", err);
  }
}

updateTicker();
setInterval(updateTicker, 20000);

// === DJ LIST ===
// (your DJs array – no change needed except for missing commas)

const DJs = [
  // existing DJ objects...
  {
    name: "DJ Mark",
    show: "Breakfast Show",
    days: [1, 3],
    times: ["10:00–12:00", "10:00–12:00"],
    genre: "Breakfast",
    img: "/images/mark.png"
  },
  {
    name: "DJ Dutch",
    days: [1, 3],
    times: ["12:00–13:00"],
    genre: "Unknown"
  },
  {
    name: "DJ Kiky",
    days: [1],
    times: ["07:00–08:00"],
    genre: "Unknown"
  },
  {
    name: "Russ",
    days: [4],
    times: ["20:00–22:00"],
    genre: "Unknown"
  },
  {
    name: "Bobby",
    days: [0],
    times: ["19:00–20:00"],
    genre: "Unknown"
  }
];

function renderDJs(filterDay = "all") {
  const grid = document.getElementById("djGrid");
  if (!grid) return;

  grid.innerHTML = "";
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  DJs.forEach(dj => {
    if (filterDay !== "all" && !dj.days.includes(Number(filterDay))) return;

    let isLive = false;
    dj.times.forEach((slot, i) => {
      const [start, end] = slot.split("–").map(t => parseInt(t));
      if (dj.days[i] === currentDay && currentHour >= start && currentHour < end) {
        isLive = true;
      }
    });

    const card = document.createElement("div");
    card.className = `dj-card ${isLive ? "live" : ""}`;
    card.innerHTML = `
      <img src="${dj.img}" alt="${dj.name}">
      <div class="dj-info">
        <h3>${dj.name}</h3>
        ${dj.show ? `<p><strong>${dj.show}</strong></p>` : ""}
        <p>⏰ ${dj.times.join(", ")} (${dj.days.map(day => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]).join(", ")})</p>
        <p>🎵 ${dj.genre}</p>
        ${isLive ? '<span class="live-indicator">🟢 LIVE NOW</span>' : ""}
        <div class="socials">
          ${dj.socials?.insta ? `<a href="${dj.socials.insta}" target="_blank">📸</a>` : ""}
          ${dj.socials?.fb ? `<a href="${dj.socials.fb}" target="_blank">📘</a>` : ""}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderDJs(btn.dataset.day);
  });
});

renderDJs();

// === Request Form Widget ===
const btn = document.getElementById('requestBtn');
const popup = document.getElementById('requestPopup');
const form = document.getElementById('requestForm');
const statusBox = document.getElementById('reqStatus');

if (btn && popup && form && statusBox) {
  btn.addEventListener('click', () => popup.classList.toggle('active'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.textContent = "Sending...";
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      await fetch("https://script.google.com/macros/s/AKfycbyoAZ_BA9pmiPycdiI1xfrOTf7UG5lYaw7P50Y_E5TJ_2uxFd7H6_5GnRADTDPieVg/exec", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      statusBox.textContent = "✅ Request sent!";
      form.reset();
      setTimeout(() => popup.classList.remove('active'), 1500);
    } catch (err) {
      console.error("Request send error:", err);
      statusBox.textContent = "❌ Error sending request.";
    }
  });
}
// =========================
// DJ LIVE MODE - Bass Pulse Glow
// =========================

// Attach LIVE badge to popup
const requestLiveBox = document.getElementById("requestPopup");
const liveBadge = document.createElement("div");
liveBadge.className = "live-badge";
liveBadge.textContent = "LIVE";
requestLiveBox.appendChild(liveBadge);

// Check which DJ is live
function checkDJLiveMode() {
  fetch("https://wildstyle.vip/nowplaying/nowon.js")
    .then(res => res.text())
    .then(text => {
      // nowon.js returns something like: currentDJ = "DJ Sonic Circuit"
      const match = text.match(/currentDJ\s*=\s*"([^"]+)"/);
      const dj = match ? match[1] : "No DJ";

      if (dj && dj !== "No DJ") {
        requestLiveBox.classList.add("dj-live");
        liveBadge.classList.add("active");
      } else {
        requestLiveBox.classList.remove("dj-live");
        liveBadge.classList.remove("active");
      }
    })
    .catch(err => console.error("Live Mode Error:", err));
}

// Run immediately + every 15 seconds
checkDJLiveMode();
setInterval(checkDJLiveMode, 15000);

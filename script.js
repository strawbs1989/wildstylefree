const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzDtgWjFCODgajdvOacEk7c3b7Ik15iezKSenDERQJ6H1YCsM22oQojQphtE-xNcfDX/exec"; // replace with your URL

async function fetchShoutouts() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    const list = document.getElementById("shoutoutList");
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
    console.error(err);
  }
}

document.getElementById("shoutoutForm").addEventListener("submit", async e => {
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

  document.getElementById("shoutoutForm").reset();
  fetchShoutouts(); // refresh list immediately
});

fetchShoutouts();
setInterval(fetchShoutouts, 10000); // refresh every 10s

const SHOUTOUTS_API = "https://script.google.com/macros/s/AKfycbzDtgWjFCODgajdvOacEk7c3b7Ik15iezKSenDERQJ6H1YCsM22oQojQphtE-xNcfDX/exec";

async function updateTicker() {
  try {
    const res = await fetch(SHOUTOUTS_API);
    const data = await res.json();

    // Keep only last 10 shoutouts
    const latest = data.slice(-10);
    const text = latest
      .map(item => `🎵 ${item.name || "Anonymous"}: ${item.message}`)
      .join("  •  ");

    const ticker = document.getElementById("tickerContent");
    ticker.innerText = text;
  } catch (err) {
    console.error("Ticker error:", err);
  }
}

updateTicker();
setInterval(updateTicker, 20000); // refresh every 20 seconds

// DJ Shows //

const DJs = [
  {
    name: "DJ EchoFalls",
    show: "Frequency Shift",
    days: [4, 0], // Thu, Sun
    times: ["19:00–20:00", "20:00–21:00"],
    genre: "Dance / Club",
    img: "/images/djstrawbs.jpg",
    socials: {
      insta: "https://instagram.com/wildstyle_radio",
      fb: "https://facebook.com/wildstylefreestyleradio"
    }
  },
  {
    name: "DJ Lil Devil",
    show: "Saturday Madness",
    days: [6],
    times: ["17:00–18:00"],
    genre: "House / Rave",
    img: "/images/laura.jpg"
  },
  {
    name: "DJ Dezzy",
    show: "Mix Set",
    days: [1],
    times: ["19:00–22:00"],
    genre: "Club Bangers",
    img: "/images/dezzy.jpg"
  }
];
name: "Hotshot DJ",
    show: "Mix Set",
    days: [1],
    times: ["19:00–22:00"],
    genre: "Club Bangers",
    img: "/images/dezzy.jpg"
  }
];

function renderDJs(filterDay = "all") {
  const grid = document.getElementById("djGrid");
  grid.innerHTML = "";

  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  DJs.forEach(dj => {
    if (filterDay !== "all" && !dj.days.includes(Number(filterDay))) return;

    // Check if currently live
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
        <p><strong>${dj.show}</strong></p>
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
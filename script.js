const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1frZjzw1b6CNEHOiOzobXALQatnVRQEKZXDqZg78VTes3oZWOIjxB0aYTIFEptuAw/exec"; 

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

const SHOUTOUTS_API = "https://script.google.com/macros/s/AKfycbz1frZjzw1b6CNEHOiOzobXALQatnVRQEKZXDqZg78VTes3oZWOIjxB0aYTIFEptuAw/exec";

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

const djs = [
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
    name: "DJ Dezzy Mac",
    show: "Mixture (Taking Break)",
    days: [1, 3, 4], // Monday, Wednesday, Thursday
    times: ["19:00–22:00", "15:00-17:00", "15:00-16:00"],
    genre: "Mix / Variety",
    img: "/images/dezzy.jpg"
  },
  {
    name: "James - Wizard Of Rock",
    show: "Rock Hour",
    days: [1, 2],
    times: ["12:00–14:00", "01:00–02:00"],
    genre: "Rock",
    img: "/images/james.jpg"
  },
  {
    name: "BabyJane",
    show: "Afternoon Mix",
    days: [1],
    times: ["14:00–16:00"],
    genre: "Pop / Classics",
    img: "/images/babyjane.jpg"
  },
  {
    name: "James Stephen",
    show: "Afternoon Vibes",
    days: [1, 2, 5],
    times: ["15:00–17:00", "15:00–17:00", "15:00–17:00"],
    genre: "Mixed",
    img: "/images/jamesstephen.jpg"
  },
  {
    name: "Lewis",
    show: "Mix Set",
    days: [1, 0],
    times: ["17:00–19:00", "17:00–19:00"],
    genre: "Dance / EDM",
    img: "/images/lewis.jpg"
  },
  {
    name: "DJ Jaydon Mac",
    show: "Grime Hour",
    days: [1],
    times: ["22:00–00:00"],
    genre: "Grime",
    img: "/images/jaydon.jpg"
  },
  {
    name: "DJ Queen Dani",
    show: "Early Morning Mix",
    days: [2],
    times: ["03:00–06:00"],
    genre: "Dance / Club",
    img: "/images/dani.jpg"
  },
  {
    name: "Hotshot DJ",
    show: "90's & 2000's",
    days: [2],
    times: ["10:00–12:00"],
    genre: "Throwbacks",
    img: "/images/hotshot.jpg"
  },
  {
    name: "DJ Squeek",
    show: "Evening Beats",
    days: [2],
    times: ["18:00–20:00"],
    genre: "Dance / Funky",
    img: "/images/squeek.jpg"
  },
  {
    name: "DJ Lewis",
    show: "Night Flow",
    days: [2],
    times: ["20:00–22:00"],
    genre: "Dance / Club",
    img: "/images/lewis.jpg"
  },
  {
    name: "DanPlayzBangers",
    show: "Late Night Bangers",
    days: [2, 3],
    times: ["22:00–00:00", "19:00–20:00"],
    genre: "EDM / Club",
    img: "/images/danplayz.jpg"
  },
  {
    name: "DJ European BOB",
    show: "Afternoon Grooves",
    days: [3],
    times: ["18:00–19:00"],
    genre: "Dance / Groove",
    img: "/images/bob.jpg"
  },
  {
    name: "Steve D J Smith",
    show: "Late Night Energy",
    days: [3],
    times: ["20:00–22:00"],
    genre: "House / Club",
    img: "/images/steve.jpg"
  },
  {
    name: "Reece",
    show: "Midnight Set",
    days: [3],
    times: ["22:00–00:00"],
    genre: "House / Tech",
    img: "/images/reece.jpg"
  },
  {
    name: "Coll",
    show: "Morning Drive",
    days: [4],
    times: ["08:00–10:00"],
    genre: "Pop / Dance",
    img: "/images/coll.jpg"
  },
  {
    name: "DJ Mary Sailor",
    show: "Early Club Set",
    days: [4],
    times: ["00:00–01:00"],
    genre: "Dance / Party",
    img: "/images/mary.jpg"
  },
  {
    name: "Gordan",
    show: "Morning Mix",
    days: [4],
    times: ["10:00–12:00"],
    genre: "Pop / Soul",
    img: "/images/gordan.jpg"
  },
  {
    name: "Christina",
    show: "Midday Show",
    days: [4],
    times: ["12:00–15:00"],
    genre: "Variety",
    img: "/images/christina.jpg"
  },
  {
    name: "MottMuzik",
    show: "Late Hour Mix",
    days: [4],
    times: ["22:00–23:00"],
    genre: "R&B / Club",
    img: "/images/mott.jpg"
  },
  {
    name: "Steve G",
    show: "Early Mix",
    days: [5],
    times: ["00:00–04:00"],
    genre: "Dance / House",
    img: "/images/steveg.jpg"
  },
  {
    name: "Vish",
    show: "Morning Grooves",
    days: [5],
    times: ["10:00–12:00"],
    genre: "World / Chill",
    img: "/images/vish.jpg"
  },
  {
    name: "Steven D",
    show: "Evening Drive",
    days: [5],
    times: ["16:00–20:00"],
    genre: "Dance / Chart",
    img: "/images/stevend.jpg"
  },
  {
    name: "Wendell",
    show: "Evening Mix",
    days: [5],
    times: ["20:00–22:00"],
    genre: "Old Skool / Dance",
    img: "/images/wendell.jpg"
  },
  {
    name: "Rebecca - DJ Mix N Match",
    show: "Night Vibes",
    days: [5],
    times: ["22:00–23:00"],
    genre: "Dance / Club",
    img: "/images/rebecca.jpg"
  },
  {
    name: "Rob - Trevor Nannab",
    show: "Late Night Beats",
    days: [6],
    times: ["00:00–02:00"],
    genre: "House / Garage",
    img: "/images/rob.jpg"
  },
  {
    name: "Amar - DJ AJ",
    show: "Early House",
    days: [6],
    times: ["02:00–04:00"],
    genre: "House / Chill",
    img: "/images/amar.jpg"
  },
  {
    name: "Cam",
    show: "Morning Session",
    days: [6],
    times: ["06:00–10:00"],
    genre: "Pop / Dance",
    img: "/images/cam.jpg"
  },
  {
    name: "The Byrdman",
    show: "Afternoon Chill",
    days: [6],
    times: ["16:00–18:00"],
    genre: "Soul / Funk",
    img: "/images/byrdman.jpg"
  },
  {
    name: "Sonic",
    show: "PreRecorded",
    days: [6],
    times: ["19:00–20:00"],
    genre: "Mixed",
    img: "/images/sonic.jpg"
  },
  {
    name: "Daniel",
    show: "Evening Flow",
    days: [6],
    times: ["20:00–21:00"],
    genre: "Pop / Dance",
    img: "/images/daniel.jpg"
  },
  {
    name: "DJ Nero",
    show: "Late Night Madness",
    days: [6],
    times: ["22:00–00:00"],
    genre: "Club / Dance",
    img: "/images/nero.jpg"
  },
  {
    name: "JK",
    show: "Afternoon Vibes",
    days: [0],
    times: ["13:00–15:00"],
    genre: "Pop / Soul",
    img: "/images/jk.jpg"
  },
  {
    name: "Fraser",
    show: "Afternoon Energy",
    days: [0],
    times: ["15:00–17:00"],
    genre: "Mixed / Dance",
    img: "/images/fraser.jpg"
  },
  {
    name: "Hotshot DJ",
    show: "80's 90's",
    days: [0],
    times: ["11:00–12:00"],
    genre: "Throwbacks",
    img: "/images/hotshot.jpg"
  },
  {
    name: "Popped Radio (Suzette & Co)",
    show: "Late Night Show",
    days: [0],
    times: ["21:00–00:00"],
    genre: "Variety / Talk",
    img: "/images/poppedradio.jpg"
  }
  {
    name: "DJ Mark",
    show: "Breakfast Show",
    days: [1, 3], // Monday, Wednesday
    times: ["10:00–12:00", "10:00-12:00"],
    genre: "Breakfast",
    img: "/images/mark.png"
  }
  {
    name: "DJ Dutch",
    days: [1, 3], // Monday,
    times: ["12:00–13:00"],
    genre: "Unkown",
    
  }
   {
    name: "DJ Kiky",
    days: [1], // Monday,
    times: ["07:00–08:00"],
    genre: "Unkown",
    
  }
  {
    name: "Russ",
    days: [4], // Thursday,
    times: ["20:00–22:00"],
    genre: "Unkown",
    
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
/* =========================
   Wildstyle — FINAL FIX
========================= */

const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbz_DpOgEO3Wcid-7MTv22arYiLZh5wLDNlwlPHjJxfUYo6nhqZnXsAU0xLXofogMyg/exec";

const DAY_ORDER = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

/* =========================
   UK Time (BST aware)
========================= */
function getUKNow() {
  const now = new Date();
  const y = now.getUTCFullYear();

  const bstStart = new Date(Date.UTC(y, 2, 31));
  bstStart.setUTCDate(31 - bstStart.getUTCDay());

  const bstEnd = new Date(Date.UTC(y, 9, 31));
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay());

  const inBST = now >= bstStart && now < bstEnd;
  return new Date(now.getTime() + (inBST ? 3600000 : 0));
}

/* =========================
   Helpers
========================= */
function normDay(d) {
  const s = String(d || "").trim().toLowerCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(cap) ? cap : null;
}

function timeToMinutes(t) {
  const s = String(t || "").trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  if (h === 12) h = 0;
  if (m[3] === "pm") h += 12;
  return h * 60 + mins;
}

function slotRange(slot) {
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);
  if (start === null || end === null) return null;
  return { start, end, crosses: end <= start };
}

function cleanTime(t) {
  return String(t || "").toLowerCase().replace(/\s+/g, "");
}

/* =========================
   Fetch + Normalise
========================= */
async function fetchSlots() {
  const res = await fetch(SCHEDULE_URL + "?v=" + Date.now(), { cache: "no-store" });
  const raw = await res.json();

  return raw.map(r => ({
    day: normDay(r.day ?? r.Day),
    start: cleanTime(r.start ?? r.Start),
    end: cleanTime(r.end ?? r.End),
    dj: (r.dj ?? r.DJ ?? "Free").trim()
  })).filter(s => s.day && s.start && s.end);
}

/* =========================
   Render Schedule
========================= */
function renderSchedule(slots) {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const days = {};
  DAY_ORDER.forEach(d => days[d] = []);

  slots.forEach(s => days[s.day].push(s));

  DAY_ORDER.forEach(d =>
    days[d].sort((a,b) =>
      timeToMinutes(a.start) - timeToMinutes(b.start)
    )
  );

  grid.innerHTML = DAY_ORDER.map(day => `
    <div class="schedule-day glass">
      <h3>${day}</h3>
      ${
        days[day].length
          ? days[day].map(s => `
              <div class="slot">
                <div class="time">${s.start} – ${s.end}</div>
                <div class="show">${s.dj}</div>
              </div>
            `).join("")
          : `
              <div class="slot">
                <div class="time">—</div>
                <div class="show">Free</div>
              </div>
            `
      }
    </div>
  `).join("");
}

/* =========================
   NOW ON
========================= */
function findNowOn(slots) {
  const now = getUKNow();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mins = now.getHours() * 60 + now.getMinutes();

  const today = DAY_ORDER[dayIdx];
  const prev = DAY_ORDER[(dayIdx + 6) % 7];

  for (const s of slots) {
    const r = slotRange(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crosses && mins >= r.start && mins < r.end) return s;
      if (r.crosses && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crosses && mins < r.end) return s;
  }

  return null;
}

/* =========================
   UP NEXT (ignore Free)
========================= */
function findUpNext(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayIdx + o) % 7];
    for (const s of slots.filter(x => x.day === day)) {
      if (s.dj.toLowerCase() === "free") continue;
      const start = timeToMinutes(s.start);
      if (o === 0 && start <= mins) continue;
      list.push({ o, start, s });
    }
  }

  list.sort((a,b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

/* =========================
   UI
========================= */
function updateNowOnUI(s) {
  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");

  if (!pill || !title || !artist) return;

  if (!s) {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    title.textContent = "No current broadcast";
    artist.textContent = "Schedule resumes soon";
    return;
  }

  pill.textContent = s.dj.toLowerCase() === "free" ? "AUTO" : "ON AIR";
  pill.classList.toggle("onair", s.dj.toLowerCase() !== "free");
  title.textContent = `${s.start} – ${s.end}`;
  artist.textContent = s.dj;
}

function updateUpNextUI(s) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  el.textContent = s
    ? `${s.day} • ${s.start} – ${s.end} • ${s.dj}`
    : "Auto / Free Rotation";
}

/* =========================
   INIT
========================= */
async function init() {
  const slots = await fetchSlots();
  renderSchedule(slots);

  const tick = () => {
    updateNowOnUI(findNowOn(slots));
    updateUpNextUI(findUpNext(slots));
  };

  tick();
  setInterval(tick, 60000);
}

/* =========================
   DOM Ready
========================= */
document.addEventListener("DOMContentLoaded", () => {
  init();

  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) burger.addEventListener("click", () => nav.classList.toggle("open"));

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
const DH = Array.from({ length: 7 }, () => Array(24).fill(null))

// MONDAY
DH[1][10] = { show: "1am – 3am<br>DJ Carrillo", duration: 3 }
DH[1][10] = { show: "10am – 12pm<br>", duration: 2 }
DH[1][12] = { show: "7am – 8am<br>DJ Keeks", duration: 2 }
DH[1][10] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[1][12] = { show: "12pm – 2pm<br>James-Wizard Of Rock", duration: 2 }
DH[1][14] = { show: "2pm – 4pm<br>Auto", duration: 2 }
DH[1][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[1][17] = { show: "5pm – 7pm<br>Lewis", duration: 2 }
DH[1][19] = { show: "7pm – 10pm<br>Auto", duration: 3 }
DH[1][22] = { show: "10pm – 12am<br>Auto", duration: 2 }

// TUESDAY
DH[2][1] = { show: "1am – 2am<br>James - Wizard Of Rock", duration: 1 }
DH[2][3] = { show: "3am – 6am<br>Dani - DJ Queen Dani", duration: 3 }
DH[2][6] = { show: "6am – 8am<br>Auto", duration: 2 }
DH[2][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[2][15] = { show: "6pm – 8pm<br>DJ Squeek", duration: 2 }
DH[2][20] = { show: "8pm – 10pm<br>Dj Lewis", duration: 2 }
DH[2][10] = { show: "10am – 12pm<br>HothotDJ", duration: 2 }

// WEDNESDAY
DH[3][10] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[3][10] = { show: "10am – 12pm<br>", duration: 2 }
DH[3][15] = { show: "3pm – 5pm<br>", duration: 2 }
DH[3][18] = { show: "6pm – 7pm<br>Auto", duration: 1 }
DH[3][20] = { show: "8pm – 10pm<br>", duration: 2 }
DH[3][22] = { show: "10pm – 12am<br>Auto", duration: 2 }

// THURSDAY
DH[4][8] = { show: "8am – 10am<br>Coll", duration: 2 }
DH[4][0] = { show: "12am – 4am<br>Auto", duration: 4 }
DH[4][10] = { show: "10am – 12pm<br>DJ Barred", duration: 2 }
DH[4][03] = { show: "1pm – 3pm<br>Christina", duration: 2 }
DH[4][15] = { show: "3pm – 4pm<br>Auto", duration: 1 }
DH[4][19] = { show: "7pm – 8pm<br>Echofalls(DJ Strawbs)", duration: 1 }
DH[4][20] = { show: "8pm – 10pm<br>Russ", duration: 2 }
DH[4][22] = { show: "10pm – 11pm<br>MottMuzik", duration: 1 }

// FRIDAY
DH[5][0] = { show: "12am – 4am<br>SteveG", duration: 4 }
DH[5][10] = { show: "10am – 12pm<br>Dani - DJ Queen Dani", duration: 2 }
DH[5][15] = { show: "3pm – 5pm<br>James Stephen", duration: 2 }
DH[5][16] = { show: "4pm – 8pm<br>StevenD", duration: 4 }
DH[5][20] = { show: "8pm – 10pm<br>DJ indigo Riz", duration: 2 }
DH[5][22] = { show: "10pm – 11pm<br>Rebecca - DJ Mix&Match", duration: 1 }
DH[5][00] = { show: "12pm – 3pm<br>DJ Nala", duration: 3 }
// SATURDAY
DH[6][0] = { show: "12am – 2am<br>Auto", duration: 2 }
DH[6][2] = { show: "2am – 4am<br>DJ AJ", duration: 2 }
DH[6][2] = { show: "4am – 6am<br>Wendell", duration: 2 }
DH[6][16] = { show: "4pm – 6pm<br>The Byrdman", duration: 2 }
DH[6][18] = { show: "6pm –8pm<br>DJ LiL Devil", duration: 2 }
DH[6][19] = { show: "7pm – 8pm<br>Sonic-Recorded", duration: 1 }
DH[6][19] = { show: "8pm – 10pm<br>DJ indigo Riz", duration: 2 }
DH[6][6] = { show: "6am – 10am<br>Cam", duration: 4 }
DH[6][10] = { show: "10am – 12pm<br>DJ Nitro", duration: 2 }
DH[6][20] = { show: "8pm – 9pm<br>Daniel", duration: 1 }


// SUNDAY
DH[0][8] = { show: "8am – 10am<br>Dani - DJ Queen Dani", duration: 2 }
DH[0][11] = { show: "11am – 12pm<br>HotShot - 80's 90's", duration: 1 }
DH[0][12] = { show: "12pm – 1pm<br>Dutch", duration: 1 }
DH[0][13] = { show: "1pm – 3pm<br>Christina", duration: 2 }
DH[0][15] = { show: "3pm – 5pm<br>DJ Fraser", duration: 2 }
DH[0][17] = { show: "5pm – 7pm<br>DJ Lewis", duration: 2 }
DH[0][19] = { show: "7pm - 8pm<br>Auto", duration: 1 }
DH[0][20] = { show: "8pm - 9pm<br>BIG BOSS Dj Echofalls", duration: 1 }
DH[0][21] = { show: "9pm - 12am<br>Popped Radio", duration: 3 }

function NowON() {
  const now = new Date()
  const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  const localHour = ukTime.getHours()
  const day = ukTime.getDay()
  const prevDay = (day - 1 + 7) % 7
 
  const isInShow = (startHour, slot, hour) => {
    const start = parseInt(startHour)
    const end = (start + slot.duration) % 24
    return start <= hour && hour < end || (end < start && (hour >= start || hour < end))
  }
 
  // Check current day's shows
  const currentShow = Object.entries(DH[day])
    .filter(([, slot]) => slot !== null)
    .find(([startHour, slot]) => isInShow(startHour, slot, localHour))
 
  // If no show found, check if a show from previous day is still running
  const prevDayShow = !currentShow ? Object.entries(DH[prevDay])
    .filter(([, slot]) => slot !== null)
    .find(([startHour, slot]) => {
      const start = parseInt(startHour)
      const end = start + slot.duration
      return end >= 24 && localHour < end - 24
    }) : null
 
  const show = (currentShow?.[1] || prevDayShow?.[1])?.show || "🕓 Off Air<br>No current broadcast."
  document.getElementById("NowOn").innerHTML = show
}

setInterval(NowON, 60000)

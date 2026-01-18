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

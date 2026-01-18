/* =========================
   Wildstyle — FIXED FINAL
========================= */

const SCHEDULE_API =
  "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

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
  const s = String(t || "").toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  if (h === 12) h = 0;
  if (m[3] === "pm") h += 12;
  return h * 60 + mins;
}

function slotRange(s) {
  const start = timeToMinutes(s.start);
  const end = timeToMinutes(s.end);
  if (start === null || end === null) return null;
  return { start, end, crosses: end <= start };
}

/* =========================
   Fetch Schedule
========================= */
async function fetchSchedule() {
  const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
  return await r.json();
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
function getNowOn(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

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
function getUpNext(slots) {
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
function updateUI(slots) {
  const nowOn = getNowOn(slots);
  const upNext = getUpNext(slots);

  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");
  const upNextEl = document.getElementById("upNextShow");

  if (nowOn) {
    pill.textContent = nowOn.dj.toLowerCase() === "free" ? "AUTO" : "ON AIR";
    pill.classList.toggle("onair", nowOn.dj.toLowerCase() !== "free");
    title.textContent = `${nowOn.start} – ${nowOn.end}`;
    artist.textContent = nowOn.dj;
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    title.textContent = "No current broadcast";
    artist.textContent = "Auto / Free Rotation";
  }

  upNextEl.textContent = upNext
    ? `${upNext.day} • ${upNext.start} – ${upNext.end} • ${upNext.dj}`
    : "Auto / Free Rotation";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const raw = await fetchSchedule();

  const slots = raw.map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  })).filter(s => s.day);

  renderSchedule(slots);
  updateUI(slots);
  setInterval(() => updateUI(slots), 60000);

  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) burger.addEventListener("click", () => nav.classList.toggle("open"));

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

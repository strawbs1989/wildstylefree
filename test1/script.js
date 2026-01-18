/* =========================
   Wildstyle — script.js
   Schedule + NOW ON + UP NEXT (FIXED)
========================= */

const SCHEDULE_API =
  "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* ---------- UK Time ---------- */
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

/* ---------- Time helpers ---------- */
function toMinutes(t) {
  if (!t) return null;
  const s = t.toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  if (h === 12) h = 0;
  if (m[3] === "pm") h += 12;
  return h * 60 + min;
}

function normDay(d) {
  if (!d) return "";
  const x = d.trim().toLowerCase();
  return DAYS.find(v => v.toLowerCase() === x) || "";
}

/* ---------- Fetch ---------- */
async function fetchSchedule() {
  const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
  const j = await r.json();
  return (j.slots || []).map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj && s.dj.trim() ? s.dj : "Free"
  }));
}

/* ---------- Schedule Render ---------- */
function renderSchedule(slots) {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const map = {};
  DAYS.forEach(d => (map[d] = []));

  slots.forEach(s => {
    if (s.day) map[s.day].push(s);
  });

  grid.innerHTML = DAYS.map(d => `
    <div class="schedule-day glass">
      <h3>${d}</h3>
      ${
        map[d].length
          ? map[d].map(s => `
            <div class="slot">
              <div class="time">${s.start} – ${s.end}</div>
              <div class="show">${s.dj}</div>
            </div>
          `).join("")
          : `<div class="slot"><div class="show">Free</div></div>`
      }
    </div>
  `).join("");
}

/* ---------- NOW ON ---------- */
function getNowOn(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const day = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  return slots.find(s => {
    if (s.day !== day) return false;
    const st = toMinutes(s.start);
    const en = toMinutes(s.end);
    if (st === null || en === null) return false;

    return en > st
      ? mins >= st && mins < en
      : mins >= st || mins < en;
  }) || null;
}

/* ---------- UP NEXT ---------- */
function getUpNext(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const list = [];

  for (let o = 0; o < 7; o++) {
    const d = DAYS[(todayIdx + o) % 7];

    slots
      .filter(s => s.day === d && s.dj.toLowerCase() !== "free")
      .forEach(s => {
        const st = toMinutes(s.start);
        if (st === null) return;
        if (o === 0 && st <= mins) return;
        list.push({ o, st, s });
      });
  }

  list.sort((a,b) => a.o - b.o || a.st - b.st);
  return list[0]?.s || null;
}

/* ---------- UI ---------- */
function updateUI(slots) {
  const nowOn = getNowOn(slots);
  const upNext = getUpNext(slots);

  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");
  const up = document.getElementById("upNextShow");

  if (nowOn) {
    pill.textContent = nowOn.dj.toLowerCase() === "free" ? "AUTO" : "ON AIR";
    title.textContent = `${nowOn.start} – ${nowOn.end}`;
    artist.textContent = nowOn.dj;
  } else {
    pill.textContent = "AUTO";
    title.textContent = "No live show";
    artist.textContent = "Auto / Free Rotation";
  }

  up.textContent = upNext
    ? `${upNext.day} ${upNext.start} – ${upNext.end} • ${upNext.dj}`
    : "Auto / Free Rotation";
}

/* ---------- Init ---------- */
async function initSchedule() {
  window.ALL_SLOTS = await fetchSchedule();
  renderSchedule(window.ALL_SLOTS);
  updateUI(window.ALL_SLOTS);
  setInterval(() => updateUI(window.ALL_SLOTS), 60000);
}

document.addEventListener("DOMContentLoaded", initSchedule);

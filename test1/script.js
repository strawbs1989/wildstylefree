/* =========================
   Wildstyle — script.js (FINAL CLEAN)
   Schedule (Apps Script) + Now On + Up Next
========================= */

/* ---------- CONFIG ---------- */
const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbz_DpOgEO3Wcid-7MTv22arYiLZh5wLDNlwlPHjJxfUYo6nhqZnXsAU0xLXofogMyg/exec";

/* ---------- YEAR ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* ---------- BURGER MENU ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (!burger || !nav) return;
  burger.addEventListener("click", () => nav.classList.toggle("open"));
});

/* -------------------------
   UK TIME (BST AWARE)
------------------------- */
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

function getNowMinutes() {
  const now = getUKNow();
  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(), // Mon=1..Sun=7
    mins: now.getHours() * 60 + now.getMinutes()
  };
}

/* -------------------------
   HELPERS
------------------------- */
const DAY_ORDER = [
  "Monday","Tuesday","Wednesday","Thursday",
  "Friday","Saturday","Sunday"
];

function normDay(d) {
  const s = String(d || "").trim().toLowerCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(cap) ? cap : "";
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

function slotStartEndMinutes(slot) {
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);
  if (start === null || end === null) return null;
  return { start, end, crossesMidnight: end <= start };
}

function cleanTime(v) {
  const s = String(v || "").trim().toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(s)) return s;
  return v;
}

/* -------------------------
   RENDER SCHEDULE GRID
------------------------- */
function renderSchedule(slots) {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const days = {};
  DAY_ORDER.forEach(d => (days[d] = []));

  slots.forEach(s => {
    const day = normDay(s.day);
    if (!day) return;
    days[day].push({
      start: s.start,
      end: s.end,
      dj: s.dj || "Free"
    });
  });

  DAY_ORDER.forEach(d => {
    days[d].sort(
      (a,b) =>
        (timeToMinutes(a.start) ?? 9999) -
        (timeToMinutes(b.start) ?? 9999)
    );
  });

  grid.innerHTML = DAY_ORDER.map(day => `
    <div class="schedule-day glass">
      <h3>${day}</h3>
      ${
        days[day].length
          ? days[day].map(s => `
              <div class="slot">
                <div class="time">${cleanTime(s.start)} – ${cleanTime(s.end)}</div>
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

/* -------------------------
   NOW ON
------------------------- */
function findCurrentSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotStartEndMinutes(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crossesMidnight && mins >= r.start && mins < r.end) return s;
      if (r.crossesMidnight && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && mins < r.end) return s;
  }
  return null;
}

/* -------------------------
   UP NEXT
------------------------- */
function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];
    slots
      .filter(s => s.day === day)
      .forEach(s => {
        const start = timeToMinutes(s.start);
        if (start === null) return;
        if (o === 0 && start <= mins) return;
        list.push({ o, start, s });
      });
  }

  list.sort((a,b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

/* -------------------------
   UI UPDATES
------------------------- */
function updateNowOnUI(c) {
  const pill = document.getElementById("live-pill");
  const t = document.getElementById("np-title");
  const a = document.getElementById("np-artist");
  if (!pill || !t || !a) return;

  if (!c) {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    t.textContent = "No current broadcast";
    a.textContent = "Schedule resumes soon";
    return;
  }

  const free = String(c.dj).toLowerCase() === "free";
  pill.textContent = free ? "AUTO" : "ON AIR";
  pill.classList.toggle("onair", !free);
  t.textContent = `${c.start} – ${c.end}`;
  a.textContent = free ? "Auto / Free Rotation" : c.dj;
}

function updateUpNextUI(n) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  el.textContent = n
    ? `${n.day} • ${n.start} – ${n.end} • ${n.dj}`
    : "Auto / Free Rotation";
}

/* -------------------------
   FETCH + REFRESH
------------------------- */
function refreshUI(slots) {
  renderSchedule(slots);
  updateNowOnUI(findCurrentSlot(slots));
  updateUpNextUI(findUpNextSlot(slots));
}

function fetchSchedule() {
  fetch(SCHEDULE_URL + "?v=" + Date.now(), { cache: "no-store" })
    .then(r => r.json())
    .then(slots => {
      window.ALL_SLOTS = slots;
      refreshUI(slots);
    })
    .catch(err => console.error("Schedule fetch failed:", err));
}

document.addEventListener("DOMContentLoaded", () => {
  fetchSchedule();
  setInterval(fetchSchedule, 60000);
});

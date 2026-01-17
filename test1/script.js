/* =========================
   Wildstyle - script.js
   Spreadsheet schedule + Now On + Up Next
   ========================= */

const SCHEDULE_API = "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ---------- Burger Menu ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => nav.classList.toggle("open"));
  }
});

/* -------------------------
   UK Time (BST aware)
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

/* -------------------------
   Helpers
------------------------- */
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

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

/* -------------------------
   Render Schedule
------------------------- */
function cleanTime(v) {
  const s = String(v || "").trim().toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(s)) return s;
  const d = new Date(v);
  if (!isNaN(d)) {
    let h = d.getHours();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    const m = d.getMinutes();
    return m ? `${h}:${String(m).padStart(2,"0")}${ampm}` : `${h}${ampm}`;
  }
  return v;
}

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
    days[d].sort((a, b) =>
      (timeToMinutes(a.start) ?? 9999) - (timeToMinutes(b.start) ?? 9999)
    );
  });

  grid.innerHTML = DAY_ORDER.map(day => `
    <div class="schedule-day glass">
      <h3>${day}</h3>
      ${
        days[day].length
          ? days[day].map(s => `
              <div class="slot">
                <div class="time">${cleanTime(s.start)} - ${cleanTime(s.end)}</div>
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
   NOW ON + UP NEXT
------------------------- */
function findCurrentSlot(slots, now) {
  const dayNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotStartEndMinutes(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crossesMidnight && minsNow >= r.start && minsNow < r.end) return s;
      if (r.crossesMidnight && (minsNow >= r.start || minsNow < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && minsNow < r.end) return s;
  }
  return null;
}

function findUpNextSlot(slots, now) {
  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const dayNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
  const candidates = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];
    for (const s of slots.filter(x => x.day === day)) {
      const m = timeToMinutes(s.start);
      if (m === null || (o === 0 && m <= minsNow)) continue;
      candidates.push({ o, m, s });
    }
  }

  candidates.sort((a,b)=>a.o-b.o||a.m-b.m);
  return candidates.find(c => c.s.dj.toLowerCase() !== "free")?.s || candidates[0]?.s || null;
}

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

  const free = c.dj.toLowerCase() === "free";
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
   Fetch + Init
------------------------- */
async function fetchSchedule() {
  const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
  return (await r.json()).slots || [];
}

async function initSchedule() {
  const slots = (await fetchSchedule()).map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  }));

  renderSchedule(slots);

  const tick = () => {
    const now = getUKNow();
    updateNowOnUI(findCurrentSlot(slots, now));
    updateUpNextUI(findUpNextSlot(slots, now));
  };

  tick();
  setInterval(tick, 60000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("scheduleGrid")) initSchedule();
}); 
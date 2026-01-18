/* =========================
   Wildstyle - script.js
   FIXED & STABLE
   Schedule + Now On + Up Next
   ========================= */

const SCHEDULE_API =
  "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* ===============================
   MOBILE BURGER MENU (STABLE)
   =============================== */
(function () {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (!burger || !nav) return;

  burger.addEventListener("click", e => {
    e.preventDefault();
    nav.classList.toggle("open");
    burger.setAttribute(
      "aria-expanded",
      nav.classList.contains("open") ? "true" : "false"
    );
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#nav") && !e.target.closest("#burger")) {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });
})();

/* -------------------------
   UK TIME (BST SAFE)
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
   HELPERS
------------------------- */
const DAY_ORDER = [
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday"
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

function getNowMinutes() {
  const now = getUKNow();
  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(),
    mins: now.getHours() * 60 + now.getMinutes()
  };
}

/* -------------------------
   SCHEDULE RENDER (UNCHANGED)
------------------------- */
function cleanTime(v) {
  const s = String(v || "").trim().toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(s)) return s;
  return v;
}

function renderSchedule(slots) {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const days = {};
  DAY_ORDER.forEach(d => (days[d] = []));

  slots.forEach(s => {
    const d = normDay(s.day);
    if (!d) return;
    days[d].push(s);
  });

  DAY_ORDER.forEach(d =>
    days[d].sort((a, b) =>
      (timeToMinutes(a.start) ?? 9999) -
      (timeToMinutes(b.start) ?? 9999)
    )
  );

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
   NOW ON (FIXED)
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
   UP NEXT (IGNORE FREE)
------------------------- */
function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if (s.dj.toLowerCase() === "free") continue;

      const start = timeToMinutes(s.start);
      if (start === null) continue;
      if (o === 0 && start <= mins) continue;

      list.push({ o, start, s });
    }
  }

  list.sort((a, b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

/* -------------------------
   UI
------------------------- */
function updateNowOnUI(slot) {
  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");
  if (!pill || !title || !artist) return;

  if (slot && slot.dj.toLowerCase() !== "free") {
    pill.textContent = "ON AIR";
    title.textContent = `${slot.start} – ${slot.end}`;
    artist.textContent = slot.dj;
  } else {
    pill.textContent = "AUTO";
    title.textContent = "No live show";
    artist.textContent = "Auto / Free Rotation";
  }
}

function updateUpNextUI(slot) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  el.textContent = slot
    ? `${slot.day} ${slot.start} – ${slot.end} • ${slot.dj}`
    : "Auto / Free Rotation";
}

/* -------------------------
   FETCH + INIT (SINGLE SOURCE)
------------------------- */
async function fetchSchedule() {
  const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
  return await r.json(); // array
}

async function initSchedule() {
  const slots = (await fetchSchedule()).map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  }));

  window.ALL_SLOTS = slots;

  renderSchedule(slots);

  const tick = () => {
    updateNowOnUI(findCurrentSlot(slots));
    updateUpNextUI(findUpNextSlot(slots));
  };

  tick();
  setInterval(tick, 60000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("scheduleGrid")) initSchedule();
});

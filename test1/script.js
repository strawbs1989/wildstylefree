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

/* ===============================
   FORCE MOBILE BURGER MENU FIX
   =============================== */

(function () {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (!burger || !nav) {
    console.warn("Burger or nav missing");
    return;
  }

  // Kill any previous listeners fighting this
  burger.replaceWith(burger.cloneNode(true));
  nav.replaceWith(nav.cloneNode(true));

  const freshBurger = document.getElementById("burger");
  const freshNav = document.getElementById("nav");

  freshBurger.setAttribute("aria-expanded", "false");

  freshBurger.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();

    const isOpen = freshNav.classList.contains("open");

    freshNav.classList.toggle("open", !isOpen);
    freshBurger.setAttribute("aria-expanded", String(!isOpen));
  });

  // Close when clicking a link
  freshNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      freshNav.classList.remove("open");
      freshBurger.setAttribute("aria-expanded", "false");
    }
  });

  // Close when clicking outside
  document.addEventListener("click", function (e) {
    if (
      freshNav.classList.contains("open") &&
      !e.target.closest("#nav") &&
      !e.target.closest("#burger")
    ) {
      freshNav.classList.remove("open");
      freshBurger.setAttribute("aria-expanded", "false");
    }
  });

  // Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      freshNav.classList.remove("open");
      freshBurger.setAttribute("aria-expanded", "false");
    }
  });
})(); 

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

/* =========================
   UP NEXT (ignore Free)
========================= */
function getUpNext(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAYS[(dayIdx + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if (s.dj.toLowerCase() === "free") continue;
      const start = toMinutes(s.start);
      if (o === 0 && start <= mins) continue;
      list.push({ o, start, s });
    }
  }

  list.sort((a,b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
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

function refreshScheduleUI() {
  if (!window.ALL_SLOTS || !window.ALL_SLOTS.length) return;

  const nowOn = findCurrentSlot(window.ALL_SLOTS);
  const upNext = findUpNextSlot(window.ALL_SLOTS);

  updateNowOnUI(nowOn);
  updateUpNextUI(upNext);
}

// run once when page loads
document.addEventListener("DOMContentLoaded", () => {
  refreshScheduleUI();
});

// update every minute
setInterval(refreshScheduleUI, 60000);

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
    title.textContent = `${nowOn.start} – ${nowOn.end}`;
    artist.textContent = nowOn.dj;
  } else {
    pill.textContent = "OFF AIR";
    title.textContent = "No live show";
    artist.textContent = "Auto / Free Rotation";
  }

  upNextEl.textContent = upNext
    ? `${upNext.day} ${upNext.start} – ${upNext.end} • ${upNext.dj}`
    : "Auto / Free Rotation";
}
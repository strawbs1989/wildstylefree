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

/* -------------------------
   NOW ON + UP NEXT
------------------------- */

// Utility: Convert HH:MM string to total minutes (UTC assumed)
function timeToMinutes(timeStr) {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [hours, mins] = timeStr.split(":").map(Number);
  return hours * 60 + mins;
}

// Utility: Get start/end minutes + check if slot crosses midnight
function slotStartEndMinutes(slot) {
  if (!slot?.day || !slot?.start || !slot?.end) return null;
 
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);
  if (start === null || end === null) return null;

  return {
    start,
    end,
    crossesMidnight: end < start // Crosses midnight if end time is earlier than start
  };
}

// Assume DAY_ORDER is defined (e.g., ["Monday", "Tuesday", ..., "Sunday"])
// Validate DAY_ORDER to prevent index errors
if (typeof DAY_ORDER === "undefined" || DAY_ORDER.length !== 7) {
  console.error("DAY_ORDER must be an array of 7 day names (e.g., ['Monday', 'Tuesday', ..., 'Sunday'])");
}

function findCurrentSlot(slots, now) {
  if (!Array.isArray(slots) || !(now instanceof Date)) return null;

  const dayNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay(); // 1=Mon, 7=Sun
  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = DAY_ORDER?.[dayNum - 1];
  const prevDay = DAY_ORDER?.[(dayNum + 5) % 7]; // Previous day (e.g., Sun → Sat)

  if (!today || !prevDay) return null;

  for (const slot of slots) {
    const timeData = slotStartEndMinutes(slot);
    if (!timeData) continue;

    // Check today's slots
    if (slot.day === today) {
      if (!timeData.crossesMidnight && minsNow >= timeData.start && minsNow < timeData.end) {
        return slot;
      }
      if (timeData.crossesMidnight && (minsNow >= timeData.start || minsNow < timeData.end)) {
        return slot;
      }
    }

    // Check previous day's slots that cross into today
    if (slot.day === prevDay && timeData.crossesMidnight && minsNow < timeData.end) {
      return slot;
    }
  }
  return null;
}

function findUpNextSlot(slots, now) {
  if (!Array.isArray(slots) || !(now instanceof Date)) return null;

  const minsNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const dayNum = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
  const candidates = [];

  // Check next 7 days (including today)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayIndex = (dayNum - 1 + dayOffset) % 7;
    const targetDay = DAY_ORDER?.[dayIndex];
    if (!targetDay) continue;

    for (const slot of slots.filter(s => s.day === targetDay)) {
      const timeData = slotStartEndMinutes(slot);
      if (!timeData) continue;

      let isUpNext = false;
      if (dayOffset === 0) {
        // Today: slot starts after now, OR crosses midnight (starts before now but ends tomorrow)
        isUpNext = timeData.start > minsNow || timeData.crossesMidnight;
      } else {
        // Future days: all valid slots are candidates
        isUpNext = true;
      }

      if (isUpNext) {
        candidates.push({
          dayOffset,
          startMins: timeData.start,
          endMins: timeData.end,
          slot
        });
      }
    }
  }

  // Sort by day offset → start time → end time (stable sort)
  candidates.sort((a, b) => {
    if (a.dayOffset !== b.dayOffset) return a.dayOffset - b.dayOffset;
    if (a.startMins !== b.startMins) return a.startMins - b.startMins;
    return a.endMins - b.endMins;
  });

  // Prioritize non-"free" slots first
  return candidates.find(c => c.slot.dj?.toLowerCase() !== "free")?.slot || candidates[0]?.slot || null;
}

function updateNowOnUI(currentSlot) {
  const pill = document.getElementById("live-pill");
  const titleEl = document.getElementById("np-title");
  const artistEl = document.getElementById("np-artist");
  if (!pill || !titleEl || !artistEl) {
    console.warn("NOW ON UI elements not found");
    return;
  }

  if (!currentSlot) {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    titleEl.textContent = "No current broadcast";
    artistEl.textContent = "Schedule resumes soon";
    return;
  }

  const isFree = currentSlot.dj?.toLowerCase() === "free";
  pill.textContent = isFree ? "AUTO" : "ON AIR";
  pill.classList.toggle("onair", !isFree);
  // Add UTC label for clarity (or replace with local time if needed)
  titleEl.textContent = `${currentSlot.start} – ${currentSlot.end} (UTC)`;
  artistEl.textContent = isFree ? "Auto / Free Rotation" : currentSlot.dj;
}

function updateUpNextUI(nextSlot) {
  const el = document.getElementById("upNextShow");
  if (!el) {
    console.warn("UP NEXT UI element not found");
    return;
  }

  el.textContent = nextSlot
    ? `${nextSlot.day} • ${nextSlot.start} – ${nextSlot.end} (UTC) • ${nextSlot.dj}`
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
/* =========================
   Wildstyle - script.js
   Spreadsheet schedule + Now On + Up Next
   ========================= */

// ✅ Put your NEW /exec URL here
const SCHEDULE_API = "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Burger menu
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if (burger && nav) burger.addEventListener("click", () => nav.classList.toggle("open"));

/* -------------------------
   UK time (BST aware)
------------------------- */
function getUKNow() {
  const now = new Date(); // UTC baseline
  const y = now.getUTCFullYear();

  // BST: last Sunday in March -> last Sunday in October
  const bstStart = new Date(Date.UTC(y, 2, 31));
  bstStart.setUTCDate(31 - bstStart.getUTCDay()); // last Sunday in March

  const bstEnd = new Date(Date.UTC(y, 9, 31));
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay()); // last Sunday in October

  const inBST = now >= bstStart && now < bstEnd;
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600 * 1000);
}

/* -------------------------
   Helpers
------------------------- */
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_TO_NUM = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6, Sunday:7 };

function normDay(d) {
  const s = String(d || "").trim().toLowerCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(cap) ? cap : "";
}

function timeToMinutes(t) {
  const s = String(t || "").trim().toLowerCase().replace(/\s+/g, "");
  // matches "1am", "10pm", "1:30pm"
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];

  if (h === 12) h = 0;
  if (ap === "pm") h += 12;

  return h * 60 + mins;
}

function slotStartEndMinutes(slot) {
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);
  if (start === null || end === null) return null;

  // If end <= start, it crosses midnight (e.g., 10pm-12am or 10pm-2am)
  const crossesMidnight = end <= start;
  return { start, end, crossesMidnight };
}

/* -------------------------
   Render schedule grid
------------------------- */
function cleanTime(v) {
  const s = String(v || "").trim();

  // Already good? e.g. "1am" or "1:30pm"
  const compact = s.toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(compact)) return compact;

  // If it looks like a Date string, convert it to am/pm
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    let h = d.getHours();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12; if (h === 0) h = 12;
    const m = d.getMinutes();
    return m ? `${h}:${String(m).padStart(2, "0")}${ampm}` : `${h}${ampm}`;
  }

  // Fallback: return original
  return s;
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
      day,
      start: String(s.start || "").trim(),
      end: String(s.end || "").trim(),
      dj: String(s.dj || "").trim()
    });
  });

  // Sort by start time
  DAY_ORDER.forEach(d => {
    days[d].sort((a, b) => {
      const am = timeToMinutes(a.start) ?? 9999;
      const bm = timeToMinutes(b.start) ?? 9999;
      return am - bm;
    });
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
   NOW ON + UP NEXT from slots
------------------------- */
function findCurrentSlot(slots, ukNow) {
  const dayNum = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // Mon=1..Sun=7
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  // Check today's slots + previous day slots that cross midnight
  const todayName = DAY_ORDER[dayNum - 1];
  const prevName = DAY_ORDER[(dayNum + 5) % 7];

  // Helper to test if now is inside a slot
  const isInSlot = (slotDayName, slot) => {
    const r = slotStartEndMinutes(slot);
    if (!r) return false;

    if (slotDayName === todayName) {
      if (!r.crossesMidnight) return minsNow >= r.start && minsNow < r.end;
      // crosses midnight: active if now >= start OR now < end
      return minsNow >= r.start || minsNow < r.end;
    }

    // previous day crossing midnight can still be active after midnight today
    if (slotDayName === prevName && r.crossesMidnight) {
      return minsNow < r.end; // after midnight part
    }

    return false;
  };
  
  // refresh
  function refreshNowOn(slots) {
  const now = getUKNow();
  const current = findCurrentSlot(slots, now);
  const next = findUpNextSlot(slots, now);

  updateNowOnUI(current);
  updateUpNextUI(next);
}

setInterval(() => refreshNowOn(scheduleSlots), 60000);
refreshNowOn(scheduleSlots); 

  // normalize
  const clean = slots.map(s => ({
    day: normDay(s.day),
    start: String(s.start || "").trim(),
    end: String(s.end || "").trim(),
    dj: String(s.dj || "").trim()
  })).filter(s => s.day && s.start && s.end && s.dj);

  // Check today first
  const todaySlots = clean.filter(s => s.day === todayName);
  for (const s of todaySlots) if (isInSlot(todayName, s)) return { ...s };

  // Then prev-day cross-midnight
  const prevSlots = clean.filter(s => s.day === prevName);
  for (const s of prevSlots) if (isInSlot(prevName, s)) return { ...s };

  return null;
}

function findUpNextSlot(slots, ukNow) {
  const dayNum = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // 1..7
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  const clean = slots.map(s => ({
    day: normDay(s.day),
    start: String(s.start || "").trim(),
    end: String(s.end || "").trim(),
    dj: String(s.dj || "").trim()
  })).filter(s => s.day && s.start && s.end); 

  // Build a list of candidate "next start times" over the next 7 days
  const candidates = [];

  for (let offset = 0; offset < 7; offset++) {
    const dIndex = (dayNum - 1 + offset) % 7;
    const dayName = DAY_ORDER[dIndex];
    const daySlots = clean.filter(s => s.day === dayName);

    for (const s of daySlots) {
      const startM = timeToMinutes(s.start);
      if (startM === null) continue;

      // Same day: only consider starts after now
      if (offset === 0 && startM <= minsNow) continue;

      candidates.push({
        offset,
        startM,
        slot: s
      });
    }
  }

  candidates.sort((a, b) => (a.offset - b.offset) || (a.startM - b.startM));
  return candidates.length ? candidates[0].slot : null;
}

function updateNowOnUI(current) {
  const pill = document.getElementById("live-pill");
  const t = document.getElementById("np-title");
  const a = document.getElementById("np-artist");
  if (!pill || !t || !a) return;

  if (current) {
  pill.textContent = current.dj.toLowerCase() === "free" ? "AUTO" : "ON AIR";
  pill.classList.toggle("onair", current.dj.toLowerCase() !== "free");

  t.textContent = `${current.start} – ${current.end}`;
  a.textContent = current.dj === "Free"
    ? "Auto / Free Rotation"
    : current.dj;
} 
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    t.textContent = "No current broadcast";
    a.textContent = "Schedule resumes soon";
  }
}

function updateUpNextUI(next) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  if (!next) {
    el.textContent = "Auto / Free Rotation";
    return;
  }
  el.innerHTML = `${next.day} • ${next.start} – ${next.end} • <strong>${next.dj}</strong>`;
}

/* -------------------------
   Fetch schedule (robust)
   - tries direct fetch first
   - falls back to AllOrigins RAW if CORS blocks
------------------------- */
async function fetchSchedule() {
  // Try direct first
  try {
    const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    // Fallback: proxy (avoids CORS issues)
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(SCHEDULE_API + "?v=" + Date.now());
    const r2 = await fetch(proxy, { cache: "no-store" });
    const txt = await r2.text();
    return JSON.parse(txt);
  }
}

/* -------------------------
   Init schedule page
------------------------- */
async function initSchedule() {
  const grid = document.getElementById("scheduleGrid");
  const upNextEl = document.getElementById("upNextShow");

  if (grid) {
    grid.innerHTML = `<div class="slot"><div class="time">Loading…</div><div class="show">Fetching schedule</div></div>`;
  }
  if (upNextEl) upNextEl.textContent = "Loading next show…";

  try {
    const data = await fetchSchedule();
    const slots = Array.isArray(data.slots) ? data.slots : [];

    renderSchedule(slots);

    const tick = () => {
      const ukNow = getUKNow();
      const current = findCurrentSlot(slots, ukNow);
      const next = findUpNextSlot(slots, ukNow);
      updateNowOnUI(current);
      updateUpNextUI(next);
    };

    tick();
    setInterval(tick, 60_000);
  } catch (err) {
    console.error("Schedule load failed:", err);
    if (grid) {
      grid.innerHTML = `
        <div class="slot">
          <div class="time">Schedule error</div>
          <div class="show">Apps Script not returning JSON / blocked</div>
        </div>`;
    }
    if (upNextEl) upNextEl.textContent = "Schedule unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Only run schedule init if container exists (safe on other pages)
  if (document.getElementById("scheduleGrid")) initSchedule();
}); 
// URL for your Apps Script endpoint that fetches the schedule
const SCHEDULE_URL = 'https://script.google.com/macros/s/AKfycbz_DpOgEO3Wcid-7MTv22arYiLZh5wLDNlwlPHjJxfUYo6nhqZnXsAU0xLXofogMyg/exec';

// Fetch schedule data and update UI
function fetchScheduleData() {
  fetch(SCHEDULE_URL)
    .then(response => response.json())
    .then(slots => {
      // Save slots to a global variable
      window.ALL_SLOTS = slots;
      // Call the UI update function
      updateScheduleUI(slots);
    })
    .catch(err => console.error('Error fetching schedule:', err));
}

// Function to update Now On and Up Next UI
function updateScheduleUI(slots) {
  const nowOn = findCurrentSlot(slots);
  const upNext = findUpNextSlot(slots);

  updateNowOnUI(nowOn);
  updateUpNextUI(upNext);
}

// Call fetchScheduleData on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchScheduleData();
});

// Refresh the schedule every 60 seconds
setInterval(() => {
  fetchScheduleData();
}, 60000);


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
// Function to get current slot
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

    if (s.day === prev && r.crossesMidnight && mins < r.end) {
      return s;
    }
  }
  return null;
}

// Function to get "Up Next" show
function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const candidates = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];
    for (const s of slots.filter(x => x.day === day)) {
      const start = timeToMinutes(s.start);
      if (start === null) continue;

      if (o === 0 && start <= mins) continue;
      candidates.push({ o, start, s });
    }
  }

  candidates.sort((a, b) => a.o - b.o || a.start - b.start);

  return candidates[0]?.s || null;
}

// Update the "Now On" UI
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

// Update the "Up Next" UI
function updateUpNextUI(n) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  el.textContent = n
    ? `${n.day} • ${n.start} – ${n.end} • ${n.dj}`
    : "Auto / Free Rotation";
}

// Fetch the schedule from the Apps Script API and update UI
function fetchScheduleData() {
  fetch(SCHEDULE_URL)
    .then(response => response.json())
    .then(slots => {
      window.ALL_SLOTS = slots;
      updateScheduleUI(slots);
    })
    .catch(err => console.error('Error fetching schedule:', err));
}

// Update the schedule UI
function updateScheduleUI(slots) {
  const nowOn = findCurrentSlot(slots);
  const upNext = findUpNextSlot(slots);

  updateNowOnUI(nowOn);
  updateUpNextUI(upNext);
}

// Call fetchScheduleData when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  fetchScheduleData();
});

// Refresh the schedule every 60 seconds
setInterval(() => {
  fetchScheduleData();
}, 60000);


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
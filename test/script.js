/* =========================
   Wildstyle - script.js
   Schedule Grid + Now On + Up Next + Burger Menu
   ========================= */

/* -------------------------
   CONFIG
------------------------- */
const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

/* -------------------------
   SCHEDULE TIME DISPLAY MODE
   "uk" | "local" | "both"
------------------------- */
let SCHEDULE_TIME_MODE = "both";

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ===============================
   BURGER MENU FIX
   =============================== */
(function () {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (!burger || !nav) return;

  burger.replaceWith(burger.cloneNode(true));
  nav.replaceWith(nav.cloneNode(true));

  const freshBurger = document.getElementById("burger");
  const freshNav = document.getElementById("nav");

  if (!freshBurger || !freshNav) return;

  freshBurger.setAttribute("aria-expanded", "false");

  freshBurger.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();
    const isOpen = freshNav.classList.contains("open");
    freshNav.classList.toggle("open", !isOpen);
    freshBurger.setAttribute("aria-expanded", String(!isOpen));
  });

  freshNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      freshNav.classList.remove("open");
      freshBurger.setAttribute("aria-expanded", "false");
    }
  });

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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      freshNav.classList.remove("open");
      freshBurger.setAttribute("aria-expanded", "false");
    }
  });
})();

/* -------------------------
   UK TIME
   Proper UK time without manual BST edits
------------------------- */
function getUKParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(new Date());

  const out = {};
  for (const part of parts) {
    if (part.type !== "literal") out[part.type] = part.value;
  }

  return {
    weekday: out.weekday,
    hour: Number(out.hour),
    minute: Number(out.minute)
  };
}

function getNowMinutes() {
  const now = new Date(); // 

  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(),
    mins: now.getHours() * 60 + now.getMinutes()
  };
} 

/* -------------------------
   HELPERS
------------------------- */
function normDay(d) {
  const s = String(d || "").trim().toLowerCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(cap) ? cap : "";
}

function parseTime(t) {

  t = String(t || "").trim().toLowerCase();

  // 24 hour format
  let m = t.match(/^(\d{1,2}):(\d{2})$/);

  if (m) {
    return parseInt(m[1], 10) * 60 +
           parseInt(m[2], 10);
  }

  // 12 hour format
  m = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);

  if (m) {

    let h = parseInt(m[1], 10);

    const mins =
      parseInt(m[2] || "0", 10);

    if (m[3] === "pm" && h !== 12)
      h += 12;

    if (m[3] === "am" && h === 12)
      h = 0;

    return h * 60 + mins;
  }

  return null;
}

/* -------------------------
   TIMEZONE DISPLAY HELPERS
------------------------- */
function getUserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function parse12HourTimeTo24(timeStr) {
  const mins = parseTime(timeStr);
  if (mins == null) return null;

  return {
    hours: Math.floor(mins / 60),
    minutes: mins % 60
  };
}

function getNextDateForDay(dayName) {
  const nowUK = new Date();
  const jsDay = nowUK.getDay(); // 0=Sun
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // Monday=0
  const targetIndex = DAY_ORDER.indexOf(dayName);

  if (targetIndex === -1) return null;

  const diff = (targetIndex - todayIndex + 7) % 7;
  const targetDate = new Date(nowUK);
  targetDate.setDate(nowUK.getDate() + diff);
  return targetDate;
}

function buildUKDateForSlot(dayName, timeStr) {
  const date = getNextDateForDay(dayName);
  const parsed = parse12HourTimeTo24(timeStr);

  if (!date || !parsed) return null;

  const d = new Date(date);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

function formatDateInTimeZone(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone
    }).format(date);
  } catch {
    return "";
  }
}

function getSlotDisplayTime(slot) {
  const userTZ = getUserTimeZone();

  const ukStartDate = buildUKDateForSlot(slot.day, slot.start);
  const ukEndDate = buildUKDateForSlot(slot.day, slot.end);

  if (!ukStartDate || !ukEndDate) {
    return cleanTime(slot.start) + " - " + cleanTime(slot.end);
  }

  const ukStart = formatDateInTimeZone(ukStartDate, "Europe/London");
  const ukEnd = formatDateInTimeZone(ukEndDate, "Europe/London");

  const localStart = formatDateInTimeZone(ukStartDate, userTZ);
  const localEnd = formatDateInTimeZone(ukEndDate, userTZ);

  if (SCHEDULE_TIME_MODE === "uk") {
    return `<span class="time-uk">${ukStart} - ${ukEnd}</span>`;
  }

  if (SCHEDULE_TIME_MODE === "local") {
    return `<span class="time-local">${localStart} - ${localEnd}</span>`;
  }

  return `
    <span class="time-uk"><strong>UK:</strong> ${ukStart} - ${ukEnd}</span>
    <span class="time-local"><strong>Local:</strong> ${localStart} - ${localEnd}</span>
  `;
}

function updateScheduleTimeNote() {
  const note = document.getElementById("scheduleTimeNote");
  if (!note) return;

  const userTZ = getUserTimeZone();

  if (SCHEDULE_TIME_MODE === "uk") {
    note.textContent = "Schedule shown in UK station time";
  } else if (SCHEDULE_TIME_MODE === "local") {
    note.textContent = "Schedule shown in your local time (" + userTZ + ")";
  } else {
    note.textContent = "Schedule shown in UK station time and your local time (" + userTZ + ")";
  }
}

function setScheduleTimeMode(mode) {
  SCHEDULE_TIME_MODE = mode;
  updateScheduleTimeNote();

  if (window.ALL_SLOTS) {
    renderSchedule(window.ALL_SLOTS);
  }
}
window.setScheduleTimeMode = setScheduleTimeMode;

/* -------------------------
   RENDER SCHEDULE GRID
   Keep schedule in UK time only
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
    days[d].sort((a, b) =>
      (parseTime(a.start) ?? 9999) - (parseTime(b.start) ?? 9999)
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
   Based on UK station time
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

function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if ((s.dj || "").toLowerCase() === "free") continue;

      const r = slotStartEndMinutes(s);
      if (!r) continue;

      if (o === 0) {
        if (!r.crossesMidnight && r.start > mins) list.push({ o, start: r.start, s });
        if (r.crossesMidnight && mins < r.start) list.push({ o, start: r.start, s });
      } else {
        list.push({ o, start: r.start, s });
      }
    }
  }

  list.sort((a, b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

/* -------------------------
   FETCH + INIT
------------------------- */
async function loadSchedule() {
  try {
    const res = await fetch(SCHEDULE_URL + "?v=" + Date.now(), { cache: "no-store" });
    const data = await res.json();

    // supports either {slots:[...]} or plain [...]
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.slots)) return data.slots;

    console.error("Unexpected schedule response:", data);
    return [];
  } catch (e) {
    console.error("Schedule load error:", e);
    return [];
  }
}

async function initSchedule() {
  const rawSlots = await loadSchedule();

  const slots = rawSlots.map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  })).filter(s => s.day && s.start && s.end);

  window.ALL_SLOTS = slots;

  renderSchedule(slots);
  updateNowNext();

  setInterval(updateNowNext, 60000);
}

function updateNowNext() {
  if (!window.ALL_SLOTS) return;

  const now = findCurrentSlot(window.ALL_SLOTS);
  const next = findUpNextSlot(window.ALL_SLOTS);

  const nowEl = document.getElementById("nowon");
  const nextEl = document.getElementById("upnext");

  if (nowEl) {
    nowEl.innerHTML = now
      ? `${now.dj} <span>${cleanTime(now.start)}–${cleanTime(now.end)}</span>`
      : "Off Air";
  }

  if (nextEl) {
    nextEl.innerHTML = next
      ? `${next.dj} <span>${cleanTime(next.start)}–${cleanTime(next.end)}</span>`
      : "No upcoming shows";
  }
}




/* -------------------------
   START
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initSchedule();
});

/* -------------------------
   NOW PLAYING UI UPDATE
------------------------- */
function updateNowPlayingUI(track) {
  const artEl = document.getElementById("np-art");
  const titleEl = document.getElementById("np-title");
  const artistEl = document.getElementById("np-artist");
  const liveEl = document.getElementById("live-pill");

  if (!artEl || !titleEl || !artistEl || !liveEl) return;

  if (!track) {
    titleEl.textContent = "Loading track…";
    artistEl.textContent = "Please wait";
    artEl.src = "./assets/cover_placeholder.png";
    liveEl.textContent = "OFF AIR";
    liveEl.classList.remove("live");
    return;
  }

  titleEl.textContent = track.title || "Unknown Track";
  artistEl.textContent = track.artist || "Unknown Artist";
  artEl.src = track.art || "./assets/cover_placeholder.png";

  if (track.isLive) {
    liveEl.textContent = "LIVE";
    liveEl.classList.add("live");
  } else {
    liveEl.textContent = "OFF AIR";
    liveEl.classList.remove("live");
  }
}

/* -------------------------
   Report Listener Country
------------------------- */
async function reportListener() {
  try {
    const geo = await fetch("https://ipapi.co/json/");
    const data = await geo.json();

    await fetch("https://wildstyle-geo.jayaubs89.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: data.country_name })
    });

  } catch (err) {
    console.log("Geo reporting failed:", err);
  }
}



/* -------------------------
   MOBILE MENU
------------------------- */
function openMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.add("active");
  if (navBackdrop) navBackdrop.hidden = false;
}

function closeMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.remove("active");
  if (navBackdrop) navBackdrop.hidden = true;
}

const navClose = document.getElementById("navClose");
const navBackdrop = document.getElementById("navBackdrop");

if (navClose) navClose.onclick = closeMenu;
if (navBackdrop) navBackdrop.onclick = closeMenu;

/* =================
TRIBES
================== */
const tribes = [

{
  name:"🎧 Dancefloor Addicts",
  genres:["Dance","House"],
  eras:["00s","10s","Today"],
  description:
  "You love big beats, club anthems and weekend party vibes."
},

{
  name:"🔥 Urban Legends",
  genres:["Hip-Hop","R&B"],
  eras:["90s","00s","10s"],
  description:
  "Hip-Hop, R&B and urban classics are your thing."
},

{
  name:"🎸 Rock Revolution",
  genres:["Rock","Indie"],
  eras:["80s","90s","00s"],
  description:
  "You live for guitars, alternative sounds and rock anthems."
},

{
  name:"🌈 Feel Good Vibes",
  genres:["Pop"],
  eras:["80s","90s","Today"],
  description:
  "You enjoy singalong hits and feel-good music."
}

];

document
.getElementById("findTribeBtn")
?.addEventListener("click", () => {

const genre =
document.getElementById("genreSelect").value;

const era =
document.getElementById("eraSelect").value;

let bestMatch = null;
let bestScore = 0;

tribes.forEach(tribe => {

let score = 0;

if (tribe.genres.includes(genre))
score += 50;

if (tribe.eras.includes(era))
score += 50;

if (score > bestScore) {
bestScore = score;
bestMatch = tribe;
}

});

const result =
document.getElementById("tribeResult");

if (!bestMatch) {

result.innerHTML = `
<h3>No Match Found</h3>
<p>Try different choices.</p>
`;

return;

}

result.innerHTML = `
<h3>${bestMatch.name}</h3>
<p>${bestScore}% Match</p>
<p>${bestMatch.description}</p>
`;

});






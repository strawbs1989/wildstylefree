/* =========================
   Wildstyle — Schedule Logic (FIXED)
   Google Sheets + Apps Script compatible
   ========================= */

const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycbz_DpOgEO3Wcid-7MTv22arYiLZh5wLDNlwlPHjJxfUYo6nhqZnXsAU0xLXofogMyg/exec";

const DAY_ORDER = [
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday"
];

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

/* ---------- Time helpers ---------- */
function timeToMinutes(t) {
  if (!t) return null;
  t = t.toLowerCase().replace(/\s/g, "");

  let h, m = 0;
  const pm = t.includes("pm");
  t = t.replace("am","").replace("pm","");

  if (t.includes(":")) {
    [h,m] = t.split(":").map(Number);
  } else {
    h = Number(t);
  }

  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;

  return h * 60 + m;
}

function slotStartEndMinutes(slot) {
  const start = timeToMinutes(slot.start);
  const end   = timeToMinutes(slot.end);
  if (start === null || end === null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

/* ---------- Fetch & normalise schedule ---------- */
async function fetchSchedule() {
  const res = await fetch(SCHEDULE_URL);
  const raw = await res.json();

  return raw.map(r => ({
    day: r.Day,
    start: r.Start,
    end: r.End,
    dj: r.DJ?.trim() || "Free"
  }));
}

/* ---------- NOW ON ---------- */
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

/* ---------- UP NEXT ---------- */
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

/* ---------- UI ---------- */
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

/* ---------- INIT ---------- */
async function initSchedule() {
  try {
    const slots = await fetchSchedule();
    const now = new Date();

    const current = findCurrentSlot(slots, now);
    const next = findUpNextSlot(slots, now);

    updateNowOnUI(current);
    updateUpNextUI(next);
  } catch (e) {
    console.error("Schedule error:", e);
  }
}

document.addEventListener("DOMContentLoaded", initSchedule);
setInterval(initSchedule, 60000);

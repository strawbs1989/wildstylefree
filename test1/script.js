const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* =========================
   UK Time (BST aware)
========================= */
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

/* =========================
   Helpers
========================= */
function normDay(d) {
  const s = String(d).trim().toLowerCase();
  return DAYS.find(x => x.toLowerCase() === s) || null;
}

function toMinutes(t) {
  const m = String(t).toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1],10);
  const min = parseInt(m[2] || 0,10);
  if (h === 12) h = 0;
  if (m[3] === "pm") h += 12;
  return h * 60 + min;
}

function slotRange(s) {
  const start = toMinutes(s.start);
  const end = toMinutes(s.end);
  if (start === null || end === null) return null;
  return { start, end, crosses: end <= start };
}

/* =========================
   Fetch + Normalise
========================= */
async function fetchSlots() {
  const res = await fetch(SCHEDULE_URL + "?v=" + Date.now());
  const data = await res.json();

  return data.map(r => ({
    day: normDay(r.day),
    start: r.start.toLowerCase(),
    end: r.end.toLowerCase(),
    dj: r.dj || "Free"
  })).filter(s => s.day);
}

/* =========================
   NOW ON
========================= */
function getNowOn(slots) {
  const now = getUKNow();
  const mins = now.getHours() * 60 + now.getMinutes();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  const today = DAYS[dayIdx];
  const prev = DAYS[(dayIdx + 6) % 7];

  for (const s of slots) {
    const r = slotRange(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crosses && mins >= r.start && mins < r.end) return s;
      if (r.crosses && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crosses && mins < r.end) return s;
  }

  return null;
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

/* =========================
   INIT
========================= */
async function initOnAir() {
  const slots = await fetchSlots();
  updateUI(slots);
  setInterval(() => updateUI(slots), 60000);
}

document.addEventListener("DOMContentLoaded", initOnAir); 

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
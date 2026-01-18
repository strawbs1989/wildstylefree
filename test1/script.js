/* =========================================================
   Wildstyle Radio — MASTER script.js (FIXED PROPERLY)
   Burger menu + Schedule + NOW ON + UP NEXT
   Spreadsheet / Apps Script compatible
   ========================================================= */

/* ================= CONFIG ================= */

const SCHEDULE_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

const DAY_ORDER = [
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday"
];

/* ================= UTILITIES ================= */

function timeToMinutes(t) {
  if (!t) return null;
  t = t.toLowerCase().replace(/\s/g, "");

  let h, m = 0;
  const pm = t.includes("pm");
  t = t.replace("am","").replace("pm","");

  if (t.includes(":")) {
    [h, m] = t.split(":").map(Number);
  } else {
    h = Number(t);
  }

  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;

  return h * 60 + m;
}

function slotRange(slot) {
  const start = timeToMinutes(slot.start);
  const end   = timeToMinutes(slot.end);
  if (start === null || end === null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

function ukNow() {
  const now = new Date();
  return new Date(now.toLocaleString("en-GB", { timeZone: "Europe/London" }));
}

/* ================= BURGER MENU ================= */

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    nav.classList.toggle("open");
    burger.classList.toggle("open");
    burger.setAttribute(
      "aria-expanded",
      nav.classList.contains("open") ? "true" : "false"
    );
  });
});

/* ================= FETCH SCHEDULE ================= */

async function fetchSchedule() {
  const res = await fetch(SCHEDULE_URL);
  const data = await res.json();

  return data.map(r => ({
    day: r.Day,
    start: r.Start,
    end: r.End,
    dj: r.DJ && r.DJ.trim() !== "" ? r.DJ.trim() : "Free"
  }));
}

/* ================= RENDER GRID ================= */

function renderSchedule(slots) {
  DAY_ORDER.forEach(day => {
    const col = document.querySelector(`.schedule-day[data-day="${day}"]`);
    if (!col) return;

    col.innerHTML = `<h3>${day}</h3>`;

    const daySlots = slots.filter(s => s.day === day);

    if (!daySlots.length) {
      col.innerHTML += `
        <div class="slot">
          <div class="time">—</div>
          <div class="show">Free</div>
        </div>`;
      return;
    }

    daySlots.forEach(s => {
      col.innerHTML += `
        <div class="slot">
          <div class="time">${s.start} – ${s.end}</div>
          <div class="show">${s.dj}</div>
        </div>`;
    });
  });
}

/* ================= NOW ON ================= */

function findCurrentSlot(slots, now) {
  const dayNum = now.getDay() === 0 ? 7 : now.getDay();
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotRange(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crossesMidnight && minsNow >= r.start && minsNow < r.end) return s;
      if (r.crossesMidnight && (minsNow >= r.start || minsNow < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && minsNow < r.end) return s;
  }
  return null;
}

function updateNowOnUI(slot) {
  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");

  if (!pill || !title || !artist) return;

  if (!slot) {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    title.textContent = "No current broadcast";
    artist.textContent = "Schedule resumes soon";
    return;
  }

  const free = slot.dj.toLowerCase() === "free";
  pill.textContent = free ? "AUTO" : "ON AIR";
  pill.classList.toggle("onair", !free);
  title.textContent = `${slot.start} – ${slot.end}`;
  artist.textContent = free ? "Auto / Free Rotation" : slot.dj;
}

/* ================= UP NEXT ================= */

function findUpNextSlot(slots, now) {
  const minsNow = now.getHours() * 60 + now.getMinutes();
  const dayNum = now.getDay() === 0 ? 7 : now.getDay();
  const candidates = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];
    slots.filter(s => s.day === day).forEach(s => {
      const m = timeToMinutes(s.start);
      if (m === null) return;
      if (o === 0 && m <= minsNow) return;
      candidates.push({ o, m, s });
    });
  }

  candidates.sort((a,b)=>a.o-b.o||a.m-b.m);
  return candidates[0]?.s || null;
}

function updateUpNextUI(slot) {
  const el = document.getElementById("upNextShow");
  if (!el) return;

  el.textContent = slot
    ? `${slot.day} • ${slot.start} – ${slot.end} • ${slot.dj}`
    : "Auto / Free Rotation";
}

/* ================= INIT ================= */

async function initSchedule() {
  try {
    const slots = await fetchSchedule();
    const now = ukNow();

    renderSchedule(slots);
    updateNowOnUI(findCurrentSlot(slots, now));
    updateUpNextUI(findUpNextSlot(slots, now));
  } catch (e) {
    console.error("Schedule failed:", e);
  }
}

document.addEventListener("DOMContentLoaded", initSchedule);
setInterval(initSchedule, 60000);

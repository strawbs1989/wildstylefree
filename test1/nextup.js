/* -------------------------
   CONFIG
------------------------- */

const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
];

/* -------------------------
   LOAD SCHEDULE
------------------------- */

async function loadSchedule() {
  try {
    const res = await fetch(SCHEDULE_URL);
    const data = await res.json();
    return data.slots; // IMPORTANT: your JSON uses "slots"
  } catch (e) {
    console.error("Schedule load error:", e);
    return [];
  }
}

/* -------------------------
   TIME HELPERS
------------------------- */

function getNowMinutes() {
  const now = new Date();
  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(), // Sun=7
    mins: now.getHours() * 60 + now.getMinutes()
  };
}

function parseTime(t) {
  t = t.toLowerCase().trim();
  const match = t.match(/(\d{1,2})(?::(\d{2}))?(am|pm)/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] || "0", 10);
  const ampm = match[3];

  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return h * 60 + m;
}

function slotStartEndMinutes(slot) {
  const start = parseTime(slot.start);
  const end = parseTime(slot.end);
  if (start == null || end == null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

/* -------------------------
   FIND CURRENT SHOW
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

    if (s.day === prev && r.crossesMidnight && mins < r.end) {
      return s;
    }
  }

  return null;
}

/* -------------------------
   FIND UP NEXT SHOW
------------------------- */

function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if (s.dj.toLowerCase() === "free") continue;

      const r = slotStartEndMinutes(s);
      if (!r) continue;

      if (o === 0) {
        if (!r.crossesMidnight && r.start > mins) {
          list.push({ o, start: r.start, s });
        }
        if (r.crossesMidnight && mins < r.start) {
          list.push({ o, start: r.start, s });
        }
      } else {
        list.push({ o, start: r.start, s });
      }
    }
  }

  list.sort((a, b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

/* -------------------------
   UPDATE UI
------------------------- */

function updateNowNext() {
  if (!window.ALL_SLOTS) return;

  const now = findCurrentSlot(window.ALL_SLOTS);
  const next = findUpNextSlot(window.ALL_SLOTS);

  const nowEl = document.getElementById("nowon");      // if you add this later
  const nextEl = document.getElementById("upNextShow"); // <-- FIXED

  if (nowEl) {
    nowEl.innerHTML = now
      ? `${now.dj} <span>${now.start}–${now.end}</span>`
      : "Off Air";
  }

  if (nextEl) {
    nextEl.innerHTML = next
      ? `${next.dj} <span>${next.start}–${next.end}</span>`
      : "No upcoming shows";
  }
} 


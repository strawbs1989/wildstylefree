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

async function updateNowNext() {
  const slots = await loadSchedule();
  const now = findCurrentSlot(slots);
  const next = findUpNextSlot(slots);

  const nowEl = document.getElementById("nowon");
  const nextEl = document.getElementById("upnext");

  nowEl.innerHTML = now
    ? `${now.dj} <span>${now.start}–${now.end}</span>`
    : "Off Air";

  nextEl.innerHTML = next
    ? `${next.dj} <span>${next.start}–${next.end}</span>`
    : "No upcoming shows";
}

updateNowNext();
setInterval(updateNowNext, 60000);
</script>

<div id="nowon"></div>
<div id="upnext"></div> 

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
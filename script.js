const DJ_SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const djSearch = document.getElementById("djSearch");
const filterButtons = document.querySelectorAll(".filter-btn");
const djCards = document.querySelectorAll(".dj-card");
const djCount = document.getElementById("djCount");

let currentFilter = "all";

function normaliseText(value) {
  return String(value || "").trim().toLowerCase();
}

function normaliseDay(value) {
  const v = normaliseText(value);
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function updateDjCount() {
  const visible = [...djCards].filter(card => !card.classList.contains("hidden")).length;
  if (djCount) {
    djCount.textContent = `${visible} DJ${visible === 1 ? "" : "s"}`;
  }
}

function filterDjCards() {
  const term = normaliseText(djSearch?.value);
  djCards.forEach(card => {
    const category = normaliseText(card.dataset.category);
    const haystack = normaliseText(card.dataset.search);

    const matchesFilter = currentFilter === "all" || category === currentFilter;
    const matchesSearch = !term || haystack.includes(term);

    card.classList.toggle("hidden", !(matchesFilter && matchesSearch));
  });

  updateDjCount();
}

if (djSearch) {
  djSearch.addEventListener("input", filterDjCards);
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter || "all";
    filterDjCards();
  });
});

function setDjSlot(card, slots) {
  const slotEl = card.querySelector(".slot");
  if (!slotEl) return;

  if (!slots.length) {
    slotEl.innerHTML = `Schedule TBC<small>Check back soon for updated show times</small>`;
    return;
  }

  if (slots.length === 1) {
    const s = slots[0];
    slotEl.innerHTML = `${s.day} • ${s.start}–${s.end}<small>${s.note}</small>`;
    return;
  }

  const first = slots[0];
  const extra = slots
    .slice(1)
    .map(s => `${s.day} ${s.start}–${s.end}`)
    .join(" • ");

  slotEl.innerHTML = `${first.day} • ${first.start}–${first.end}<small>${extra}</small>`;
}

function buildDjScheduleMap(slots) {
  const map = {};

  slots.forEach(slot => {
    const dj = String(slot.dj || "").trim();
    if (!dj || dj.toLowerCase() === "free") return;

    if (!map[dj]) map[dj] = [];

    map[dj].push({
      day: normaliseDay(slot.day),
      start: slot.start,
      end: slot.end,
      note: "Live on Wildstyle Radio"
    });
  });

  Object.keys(map).forEach(name => {
    map[name].sort((a, b) => {
      const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  });

  return map;
}

async function loadDjTimes() {
  try {
    const res = await fetch(DJ_SCHEDULE_URL + "?v=" + Date.now());
    const data = await res.json();
    const slots = data.slots || [];
    const map = buildDjScheduleMap(slots);

    djCards.forEach(card => {
      const djName = card.dataset.dj;
      const slotsForDj = map[djName] || [];
      setDjSlot(card, slotsForDj);
    });
  } catch (err) {
    console.error("DJ schedule load failed:", err);
  }
}

filterDjCards();
loadDjTimes(); 

/* =========================
   NOW ON / UP NEXT
========================= */

const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

function getUKNow() {
  return new Date(new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London"
  }));
}

function parseTimeToMinutes(t) {
  const s = String(t || "").trim().toLowerCase();
  const m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || "0", 10);
  const ampm = m[3].toLowerCase();

  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return h * 60 + mins;
}

function splitRange(range) {
  const text = String(range || "").trim();
  const parts = text.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return { start: parts[0].trim(), end: parts[1].trim() };
  }
  return { start: "", end: "" };
}

function dayNameToIndex(day) {
  const map = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  };
  return map[String(day || "").trim().toLowerCase()] || null;
}

function normaliseScheduleData(data) {
  let rows = [];

  if (Array.isArray(data?.slots)) {
    rows = data.slots;
  } else if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          rows.push({ ...item, day: item.day || key });
        }
      }
    }
  }

  return rows.map((row) => {
    const range = row.timeRange || row.time || row.slot || row.hours || "";
    const split = splitRange(range);

    const start = String(row.start || row.startTime || row.from || split.start || "").trim();
    const end = String(row.end || row.endTime || row.to || split.end || "").trim();

    const dj = String(
      row.dj || row.presenter || row.host || row.name || ""
    ).trim();

    const show = String(
      row.show || row.title || row.programme || row.program || ""
    ).trim();

    const day = String(row.day || row.dayName || row.weekday || "").trim();

    return {
      day,
      dayIndex: dayNameToIndex(day),
      start,
      end,
      startMins: parseTimeToMinutes(start),
      endMins: parseTimeToMinutes(end),
      dj,
      show
    };
  }).filter((row) =>
    row.dayIndex &&
    row.start &&
    row.end &&
    row.startMins != null &&
    row.endMins != null
  );
}

function displayName(row) {
  if (row.dj && row.show && row.show.toLowerCase() !== row.dj.toLowerCase()) {
    return `${row.dj} - ${row.show}`;
  }
  return row.dj || row.show || "Free";
}

function isFreeRow(row) {
  const txt = displayName(row).trim().toLowerCase();
  return !txt || txt === "free" || txt.includes("off air");
}

function isCurrentRow(row, nowDay, nowMins) {
  const crossesMidnight = row.endMins <= row.startMins;

  if (!crossesMidnight) {
    return row.dayIndex === nowDay && nowMins >= row.startMins && nowMins < row.endMins;
  }

  const prevDay = nowDay === 1 ? 7 : nowDay - 1;

  return (
    (row.dayIndex === nowDay && nowMins >= row.startMins) ||
    (row.dayIndex === prevDay && nowMins < row.endMins)
  );
}

function findCurrentAndNext(rows) {
  const now = getUKNow();
  const nowDay = now.getDay() === 0 ? 7 : now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  let current = null;
  for (const row of rows) {
    if (isCurrentRow(row, nowDay, nowMins)) {
      current = row;
      break;
    }
  }

  const upcoming = [];
  for (const row of rows) {
    if (isFreeRow(row)) continue;

    const dayDiff = (row.dayIndex - nowDay + 7) % 7;
    const crossesMidnight = row.endMins <= row.startMins;

    if (dayDiff === 0) {
      if (!crossesMidnight && row.startMins > nowMins) {
        upcoming.push({ scoreDay: 0, scoreTime: row.startMins, row });
      } else if (crossesMidnight && row.startMins > nowMins) {
        upcoming.push({ scoreDay: 0, scoreTime: row.startMins, row });
      }
    } else {
      upcoming.push({ scoreDay: dayDiff, scoreTime: row.startMins, row });
    }
  }

  upcoming.sort((a, b) => a.scoreDay - b.scoreDay || a.scoreTime - b.scoreTime);
  const next = upcoming[0]?.row || null;

  return { current, next };
}

async function loadNowOnAndUpNext() {
  const nowEl = document.getElementById("nowon");
  const upNextEl = document.getElementById("upNext");
  if (!nowEl && !upNextEl) return;

  try {
    const res = await fetch(`${SCHEDULE_URL}?v=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    const rows = normaliseScheduleData(data);
    const { current, next } = findCurrentAndNext(rows);

    if (nowEl) {
      nowEl.textContent = current
        ? `${displayName(current)} ${current.start}–${current.end}`
        : "Off Air";
    }

    if (upNextEl) {
      upNextEl.innerHTML = next
        ? `${displayName(next)}<br><span class="muted-inline">${next.start}–${next.end} UK</span>`
        : "No upcoming shows";
    }
  } catch (err) {
    console.error("Now On / Up Next load failed:", err);
    if (nowEl) nowEl.textContent = "Unavailable";
    if (upNextEl) upNextEl.textContent = "Unavailable";
  }
} 

	
	
	
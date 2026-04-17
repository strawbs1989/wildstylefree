const SCHEDULE_SOURCE_URL =
  "https://script.google.com/macros/s/AKfycbzhCps7H6jp8TMt76mgdH1EgUxk2u2qfoJewiolEvNAEM8zL7EFjpM5rSoQGH0UAcQ/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

function getUKNow() {
  return new Date(
    new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })
  );
}

function normDay(day) {
  const s = String(day || "").trim().toLowerCase();
  const fixed = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return DAY_ORDER.includes(fixed) ? fixed : "";
}

function parseTime(value) {
  const t = String(value || "").trim().toLowerCase();
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || "0", 10);
  const ampm = m[3].toLowerCase();

  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return h * 60 + mins;
}

function splitTimeRange(range) {
  const text = String(range || "").trim();
  if (!text) return { start: "", end: "" };

  const parts = text.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    return {
      start: parts[0].trim(),
      end: parts[1].trim()
    };
  }

  return { start: "", end: "" };
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

function normaliseSlots(data) {
  let raw = [];

  if (Array.isArray(data?.slots)) {
    raw = data.slots;
  } else if (Array.isArray(data)) {
    raw = data;
  } else if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          raw.push({
            ...item,
            day: item.day || key
          });
        });
      }
    }
  }

  return raw.map(slot => {
    const split = splitTimeRange(
      slot.timeRange ||
      slot.time ||
      slot.slot ||
      slot.hours ||
      ""
    );

    return {
      day: normDay(slot.day || slot.dayName || slot.weekday),
      start: String(slot.start || slot.startTime || slot.from || split.start || "").trim(),
      end: String(slot.end || slot.endTime || slot.to || split.end || "").trim(),
      dj: String(
        slot.dj ||
        slot.presenter ||
        slot.host ||
        slot.name ||
        slot.show ||
        slot.title ||
        "Free"
      ).trim()
    };
  }).filter(slot => slot.day && slot.start && slot.end);
}

function findCurrentSlot(slots) {
  const now = getUKNow();
  const dayNum = now.getDay() === 0 ? 7 : now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();

  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotStartEndMinutes(s);
    if (!r) continue;

    if (s.day === today && !r.crossesMidnight) {
      if (mins >= r.start && mins < r.end) return s;
    }

    if (s.day === today && r.crossesMidnight) {
      if (mins >= r.start) return s;
    }

    if (s.day === prev && r.crossesMidnight) {
      if (mins < r.end) return s;
    }
  }

  return null;
}

async function loadNowOn() {
  const nowEl = document.getElementById("nowon");
  if (!nowEl) return;

  try {
    const res = await fetch(SCHEDULE_SOURCE_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Schedule request failed: " + res.status);
    }

    const data = await res.json();
    const slots = normaliseSlots(data);
    const current = findCurrentSlot(slots);

    nowEl.textContent = current
      ? `${current.dj} ${current.start}–${current.end}`
      : "Off Air";
  } catch (err) {
    console.error("Now On failed:", err);
    nowEl.textContent = "Off Air";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNowOn();
  setInterval(loadNowOn, 60000);
});
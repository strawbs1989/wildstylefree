const SCHEDULE_SOURCE_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMVtacmYtSGPNNeT0mzIBorEPIvnGLDe4G4LrDCK8F3lUS6NkWyl_z5oAhTDJorVMxqPN8esIoBctFDyyJdgGi9VeuzcGlOQKRv6YBLoK4D-IT-h2f81TkB6_mVPJVIdroAIDQmS98zWiqHjDjMtsM-5-GH4PjI_vUMAXr-Rbi4tgYP6d4ulPWNFTFAGeLjR3gsAGhPogjaDDrVgHszmqDB-7rJ3VgU3bqI2IaaJVugsy0Mpvvw716kFELFPbk9zh5TpGoS0hhphqmBkXSfF6_fFYWFkNg&lib=MpeUWhAb9CJmYiRHsXLYuv7qPCa2hpXwN";

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

    if (s.day === today) {
      if (!r.crossesMidnight && mins >= r.start && mins < r.end) return s;
      if (r.crossesMidnight && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && mins < r.end) return s;
  }

  return null;
}

function findUpNextSlot(slots) {
  const now = getUKNow();
  const dayNum = now.getDay() === 0 ? 7 : now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const list = [];

  for (let offset = 0; offset < 7; offset++) {
    const day = DAY_ORDER[(dayNum - 1 + offset) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if ((s.dj || "").trim().toLowerCase() === "free") continue;

      const r = slotStartEndMinutes(s);
      if (!r) continue;

      if (offset === 0) {
        if (!r.crossesMidnight && r.start > mins) {
          list.push({ offset, start: r.start, slot: s });
        }
        if (r.crossesMidnight && mins < r.start) {
          list.push({ offset, start: r.start, slot: s });
        }
      } else {
        list.push({ offset, start: r.start, slot: s });
      }
    }
  }

  list.sort((a, b) => a.offset - b.offset || a.start - b.start);
  return list[0]?.slot || null;
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadNowAndUpNext() {
  const nowEl = document.getElementById("nowon");
  const upNextEl = document.getElementById("upNext");

  if (!nowEl && !upNextEl) return;

  try {
    const res = await fetch(SCHEDULE_SOURCE_URL + "&t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Schedule request failed: " + res.status);
    }

    const data = await res.json();
    const slots = normaliseSlots(data);
    const now = findCurrentSlot(slots);
    const next = findUpNextSlot(slots);

    if (nowEl) {
  if (now) {
    nowEl.textContent = `${now.dj} ${now.start}–${now.end}`;
    nowEl.classList.remove("offair");
    nowEl.classList.add("onair");
  } else {
    nowEl.textContent = "Off Air";
    nowEl.classList.remove("onair");
    nowEl.classList.add("offair");
  }
}

    if (upNextEl) {
      upNextEl.innerHTML = next
        ? `${escapeHtml(next.dj)}<br><span class="muted-inline">${escapeHtml(next.start)}–${escapeHtml(next.end)} UK</span>`
        : "No upcoming shows";
    }
  } catch (err) {
    console.error("Now/Up Next failed:", err);

    if (nowEl) nowEl.textContent = "Off Air";
    if (upNextEl) upNextEl.textContent = "Unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNowAndUpNext();
  setInterval(loadNowAndUpNext, 60000);
}); 

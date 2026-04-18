const UPNEXT_SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycbyz46hBv4Sd1Qyl0vtbZ78n41RxjSn1UWydb8b36yymk8uVJeJGCLiYz7kiBQYNlaIN/exec";

const UPNEXT_DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

function getUKNowUpNext() {
  return new Date(
    new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })
  );
}

function normDayUpNext(day) {
  const s = String(day || "").trim().toLowerCase();
  const fixed = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return UPNEXT_DAY_ORDER.includes(fixed) ? fixed : "";
}

function parseTimeUpNext(value) {
  const t = String(value || "").trim().toLowerCase();

  let m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1], 10);
    const mins = parseInt(m[2], 10);
    if (h >= 0 && h <= 23 && mins >= 0 && mins <= 59) {
      return h * 60 + mins;
    }
  }

  m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2] || "0", 10);
    const ampm = m[3].toLowerCase();

    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;

    return h * 60 + mins;
  }

  return null;
}

function splitTimeRangeUpNext(range) {
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

function formatTimeValueUpNext(val) {
  if (val === null || val === undefined || val === "") return "";

  if (typeof val === "string") {
    const s = val.trim();

    if (/^\d{1,2}:\d{2}$/.test(s) || /am|pm/i.test(s)) {
      return s;
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }

    return s;
  }

  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  return String(val).trim();
}

function slotMinutesUpNext(slot) {
  const start = parseTimeUpNext(slot.start);
  const end = parseTimeUpNext(slot.end);
  if (start == null || end == null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

function normaliseSlotsUpNext(data) {
  let raw = [];

  if (Array.isArray(data?.slots)) {
    raw = data.slots;
  } else if (Array.isArray(data)) {
    raw = data;
  } else if (data && typeof data === "object") {
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          raw.push({
            ...item,
            day: item.day || key
          });
        });
      }
    });
  }

  return raw.map(slot => {
    const split = splitTimeRangeUpNext(
      slot.timeRange ||
      slot.time ||
      slot.slot ||
      slot.hours ||
      ""
    );

    return {
      day: normDayUpNext(slot.day || slot.dayName || slot.weekday),
      start: formatTimeValueUpNext(slot.start || slot.startTime || slot.from || split.start),
      end: formatTimeValueUpNext(slot.end || slot.endTime || slot.to || split.end),
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

function findUpNextSlotOnly(slots) {
  const now = getUKNowUpNext();
  const dayNum = now.getDay() === 0 ? 7 : now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const candidates = [];

  for (let offset = 0; offset < 7; offset++) {
    const day = UPNEXT_DAY_ORDER[(dayNum - 1 + offset) % 7];

    for (const slot of slots.filter(x => x.day === day)) {
      if ((slot.dj || "").trim().toLowerCase() === "free") continue;

      const r = slotMinutesUpNext(slot);
      if (!r) continue;

      if (offset === 0) {
        if (r.start > mins) {
          candidates.push({ offset, start: r.start, slot });
        }
      } else {
        candidates.push({ offset, start: r.start, slot });
      }
    }
  }

  candidates.sort((a, b) => a.offset - b.offset || a.start - b.start);
  return candidates[0]?.slot || null;
}

function escapeHtmlUpNext(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadUpNextOnly() {
  const upNextEl = document.getElementById("upNext");
  if (!upNextEl) return;

  try {
    const res = await fetch(UPNEXT_SCHEDULE_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Schedule request failed: " + res.status);
    }

    const data = await res.json();
    const slots = normaliseSlotsUpNext(data);
    const next = findUpNextSlotOnly(slots);

    upNextEl.innerHTML = next
      ? `${escapeHtmlUpNext(next.dj)}<br><span class="muted-inline">${escapeHtmlUpNext(next.start)}–${escapeHtmlUpNext(next.end)} UK</span>`
      : "No upcoming shows";
  } catch (err) {
    console.error("Up Next failed:", err);
    upNextEl.textContent = "Unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadUpNextOnly();
  setInterval(loadUpNextOnly, 60000);
});
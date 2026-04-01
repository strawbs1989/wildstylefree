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
  const now = getUKParts();
  return {
    dayNum: DAY_ORDER.indexOf(now.weekday) + 1,
    mins: now.hour * 60 + now.minute
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
  const m = t.match(/(\d{1,2})(?::(\d{2}))?(am|pm)/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || "0", 10);
  const ampm = m[3];

  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return h * 60 + mins;
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

function cleanTime(v) {
  const s = String(v || "").trim().toLowerCase();
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(s)) return s;

  const d = new Date(v);
  if (!isNaN(d)) {
    let h = d.getHours();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    const m = d.getMinutes();
    return m ? `${h}:${String(m).padStart(2,"0")}${ampm}` : `${h}${ampm}`;
  }
  return String(v || "");
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
  const nowUK = getUKNow();
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

document.addEventListener("DOMContentLoaded", () => {
  initSchedule();
});


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
   SHOUT
------------------------- */
const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const wave = document.getElementById("wave");
const previewBtn = document.querySelector(".preview");
const deleteBtn = document.querySelector(".delete");
const sendBtn = document.querySelector(".send");

let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let recordingTimeout;
let userCountry = "Unknown Country";

// 🌍 GET COUNTRY
async function getCountry() {
  const countryEl = document.getElementById("listenerCountry");

  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    userCountry = data.country || "Unknown Country";

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: " + userCountry;
    }
  } catch (err) {
    console.warn("Country lookup failed:", err);

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: Unknown Country";
    }
  }
}

getCountry();

// 🎤 START RECORDING
if (recordBtn && statusText && wave) {
  recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      startRecording();
    } else {
      stopRecording();
    }
  });
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
    if (statusText) {
      statusText.textContent = `Recording complete ✔ (${userCountry})`;
    }
  };

  mediaRecorder.start();

  if (recordBtn) recordBtn.classList.add("recording");
  if (statusText) statusText.textContent = "Recording... (5 sec max)";

  let progress = 0;
  recordingTimeout = setInterval(() => {
    progress += 10;
    if (wave) wave.style.width = progress + "%";
    if (progress >= 100) stopRecording();
  }, 500);

  setTimeout(stopRecording, 5000);
}

// 🛑 STOP RECORDING
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearInterval(recordingTimeout);
  if (recordBtn) recordBtn.classList.remove("recording");
}

// ▶ PREVIEW
if (previewBtn) {
  previewBtn.addEventListener("click", () => {
    if (!recordedBlob) return alert("No recording yet!");
    const audioURL = URL.createObjectURL(recordedBlob);
    const audio = new Audio(audioURL);
    audio.play();
  });
}

// ❌ DELETE
if (deleteBtn) {
  deleteBtn.addEventListener("click", () => {
    recordedBlob = null;
    if (wave) wave.style.width = "0%";
    if (statusText) statusText.textContent = "Recording deleted";
  });
}

// 🚀 SEND TO STUDIO
if (sendBtn) {
  sendBtn.addEventListener("click", async () => {
    if (!recordedBlob) {
      alert("No recording to send!");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob);
      formData.append("country", userCountry || "Unknown");

      const response = await fetch("https://discord.jayaubs89.workers.dev/", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        alert("🎉 Shoutout sent to studio!");
        recordedBlob = null;
        if (wave) wave.style.width = "0%";
        if (statusText) statusText.textContent = "Tap to Record (5 seconds max)";
      } else {
        alert("Upload failed.");
      }

    } catch (err) {
      alert("Error sending shoutout.");
    }

    sendBtn.disabled = false;
    sendBtn.textContent = "🚀 Send to Studio";
  });
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

/* -------------------------
   GUESS THE TUNE
------------------------- */
let guessTracks = [];
let guessRound = 0;

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTKikwIIXG6VxIRfoFYVEIr97lQmscpP8X-bQ_iqouO2jgaFseI8HMKD6L6QG67Z-Ob36fTEa50zBa-/pub?output=csv";

function playGuessClip() {
  const audio = document.getElementById("guessAudio");
  if (!audio || !guessTracks.length) return;

  audio.src = guessTracks[guessRound].clip;
  audio.currentTime = 0;
  audio.play();
}

function loadGuessTracks() {
  const buttons = document.querySelectorAll(".guess-btn");
  const result = document.getElementById("guess-result");
  const nextRoundBtn = document.getElementById("nextRound");

  if (!buttons.length || !result || !nextRoundBtn) return;

  fetch(SHEET_URL)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.trim().split(/\r?\n/).slice(1);

      guessTracks = rows.map(row => {
        const cols = row.split(",");
        return {
          clip: cols[0],
          answer: cols[1],
          options: [cols[2], cols[3], cols[4], cols[5]]
        };
      });

      setupOptions(buttons, result);
    })
    .catch(err => {
      console.error("Guess The Tune load failed:", err);
    });

  nextRoundBtn.onclick = () => {
    if (!guessTracks.length) return;
    guessRound++;
    if (guessRound >= guessTracks.length) guessRound = 0;
    setupOptions(buttons, result);
  };
}

function setupOptions(buttons, result) {
  if (!guessTracks.length) return;

  buttons.forEach((btn, i) => {
    btn.textContent = guessTracks[guessRound].options[i] || "Option";

    btn.onclick = () => {
      if (btn.textContent === guessTracks[guessRound].answer) {
        result.innerHTML = "✅ Correct!";
        result.style.color = "#00ff9f";
      } else {
        result.innerHTML = "❌ Wrong! Answer: " + guessTracks[guessRound].answer;
        result.style.color = "#ff4d6d";
      }
    };
  });
}

loadGuessTracks();

/* -------------------------
   LIVE SHOUT-OUT TICKER
------------------------- */
(function () {
  const tickerText = document.getElementById("tickerText");
  const tickerTextClone = document.getElementById("tickerTextClone");

  if (!tickerText || !tickerTextClone) return;

  const SHOUTOUTS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRczHmCBV2ef-aaYHoKgLPuv8hLcmWwzzHW91tp3GwRDpbr0F1bdM2BVBLxDot4ojGYC3ubuNITrN1x/pub?output=csv";

  function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  fetch(SHOUTOUTS_URL)
    .then(function (res) {
      return res.text();
    })
    .then(function (csv) {
      const rows = csv.trim().split(/\r?\n/);
      rows.shift();

      const messages = rows
        .map(function (row) {
          const cols = parseCSVLine(row);

          const name = cols[0] ? cols[0].trim() : "";
          const message = cols[1] ? cols[1].trim() : "";

          if (!name && !message) return "";
          if (name && message) return name + " 🎉 " + message;
          return name || message;
        })
        .filter(function (msg) {
          return msg !== "";
        });

      const joined = messages.join(" • ");

      tickerText.textContent = joined || "No shout-outs yet — send yours in!";
      tickerTextClone.textContent = tickerText.textContent;
    })
    .catch(function (err) {
      console.error("Shout-out ticker failed:", err);
      tickerText.textContent = "Shout-outs unavailable right now.";
      tickerTextClone.textContent = tickerText.textContent;
    });
})(); 

/* =========================
   Wildstyle - script.js (FIXED)
   ========================= */

/* -------------------------
   CONFIG
------------------------- */
const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

let SCHEDULE_TIME_MODE = "triple"; // "uk" | "local" | "triple"

/* -------------------------
   YEAR
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* -------------------------
   MOBILE MENU
------------------------- */
function openMenu() {
  document.getElementById("mobileNav")?.classList.add("active");
  document.getElementById("navBackdrop").hidden = false;
}

function closeMenu() {
  document.getElementById("mobileNav")?.classList.remove("active");
  document.getElementById("navBackdrop").hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("navClose")?.addEventListener("click", closeMenu);
  document.getElementById("navBackdrop")?.addEventListener("click", closeMenu);
});

/* -------------------------
   UK TIME HELPERS
------------------------- */
function getLondonParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(date);

  const out = {};
  parts.forEach(p => {
    if (p.type !== "literal") out[p.type] = p.value;
  });

  return {
    weekday: out.weekday,
    hour: Number(out.hour),
    minute: Number(out.minute)
  };
}

function getNowMinutes() {
  const now = getLondonParts();
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
  const m = String(t).toLowerCase().match(/(\d{1,2})(?::(\d{2}))?(am|pm)/);
  if (!m) return null;

  let h = +m[1];
  const mins = +(m[2] || 0);

  if (m[3] === "pm" && h !== 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;

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

/* -------------------------
   TIMEZONE DISPLAY
------------------------- */
function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function parse12HourTimeTo24(timeStr) {
  const mins = parseTime(timeStr);
  if (mins == null) return null;

  return {
    hours: Math.floor(mins / 60),
    minutes: mins % 60
  };
}

/* ✅ FIXED FUNCTION */
function buildLondonSlotDate(dayName, timeStr) {
  const parsed = parse12HourTimeTo24(timeStr);
  if (!parsed) return null;

  const now = new Date();
  const londonNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/London" })
  );

  const todayIndex = londonNow.getDay();
  const targetIndex = DAY_ORDER.indexOf(dayName);

  if (targetIndex === -1) return null;

  const dayOffset = (targetIndex - todayIndex + 7) % 7;

  const base = new Date(londonNow);
  base.setDate(londonNow.getDate() + dayOffset);

  const utc = Date.UTC(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    parsed.hours,
    parsed.minutes
  );

  return new Date(utc);
}

/* ✅ NEW FUNCTION */
function getSlotDisplayTimeSafe(slot) {
  if (SCHEDULE_TIME_MODE === "uk") {
    return `${slot.start}–${slot.end}`;
  }

  const startDate = buildLondonSlotDate(slot.day, slot.start);
  const endDate = buildLondonSlotDate(slot.day, slot.end);

  if (!startDate || !endDate) {
    return `${slot.start}–${slot.end}`;
  }

  const opts = { hour: "2-digit", minute: "2-digit" };

  const localStart = startDate.toLocaleTimeString([], opts);
  const localEnd = endDate.toLocaleTimeString([], opts);

  if (SCHEDULE_TIME_MODE === "local") {
    return `${localStart}–${localEnd}`;
  }

  return `${slot.start}–${slot.end} (Local: ${localStart}–${localEnd})`;
}

/* -------------------------
   RENDER
------------------------- */
function renderSchedule(slots) {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const days = {};
  DAY_ORDER.forEach(d => (days[d] = []));

  slots.forEach(s => {
    const day = normDay(s.day);
    if (!day) return;

    days[day].push(s);
  });

  DAY_ORDER.forEach(d => {
    days[d].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  });

  grid.innerHTML = DAY_ORDER.map(day => `
    <div class="schedule- 


/* -------------------------
   NOW ON + UP NEXT (UK-BASED)
------------------------- */
function getNowMinutes() {
  const now = getUKNow();
  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(),
    mins: now.getHours() * 60 + now.getMinutes()
  };
}

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
    const res = await fetch(SCHEDULE_URL + "?v=" + Date.now());
    const data = await res.json();
    return data.slots || [];
  } catch (e) {
    console.error("Schedule load error:", e);
    return [];
  }
}

async function initSchedule() {
  const slots = (await loadSchedule()).map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  }));

  window.ALL_SLOTS = slots;

  renderSchedule(slots);
  updateScheduleTimeNote();
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
      ? `${now.dj} <span>${now.start}–${now.end}</span>`
      : "Off Air";
  }

  if (nextEl) {
    nextEl.innerHTML = next
      ? `${next.dj} <span>${next.start}–${next.end}</span>`
      : "No upcoming shows";
  }
}

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

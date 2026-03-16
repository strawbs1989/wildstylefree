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

/* -------------------------
   Helpers
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

/* -------------------------
   Render Schedule Grid
------------------------- */
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
  return v;
}

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
   NOW ON + UP NEXT (FINAL FIXED)
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
      if (s.dj.toLowerCase() === "free") continue;

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

  if (!track) {
    // No track playing
    titleEl.textContent = "Loading track…";
    artistEl.textContent = "Please wait";
    artEl.src = "./assets/cover_placeholder.png";
    liveEl.textContent = "OFF AIR";
    liveEl.classList.remove("live");
    return;
  }

  // Update UI
  titleEl.textContent = track.title || "Unknown Track";
  artistEl.textContent = track.artist || "Unknown Artist";
  artEl.src = track.art || "./assets/cover_placeholder.png";

  // Live pill
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

// REPORT WEBSITE LISTENER COUNTRY
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

/*--------
SHOUT
----------*/

const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const wave = document.getElementById("wave");
const previewBtn = document.querySelector(".preview");
const deleteBtn = document.querySelector(".delete");

let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let recordingTimeout;
let userCountry = "Detecting...";


// 🌍 GET COUNTRY
async function getCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    userCountry = data.country_name || "Unknown Country";
  } catch {
    userCountry = "Unknown Country";
  }
}
getCountry();


// 🎤 START RECORDING
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
    statusText.textContent = `Recording complete ✔ (${userCountry})`;
  };

  mediaRecorder.start();
  recordBtn.classList.add("recording");
  statusText.textContent = "Recording... (5 sec max)";

  // fake waveform animation
  let progress = 0;
  recordingTimeout = setInterval(() => {
    progress += 10;
    wave.style.width = progress + "%";
    if (progress >= 100) stopRecording();
  }, 500);

  // auto stop after 5 sec
  setTimeout(stopRecording, 5000);
}


// 🛑 STOP RECORDING
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearInterval(recordingTimeout);
  recordBtn.classList.remove("recording");
}


// ▶ PREVIEW
previewBtn.addEventListener("click", () => {
  if (!recordedBlob) return alert("No recording yet!");

  const audioURL = URL.createObjectURL(recordedBlob);
  const audio = new Audio(audioURL);
  audio.play();
});


// ❌ DELETE
deleteBtn.addEventListener("click", () => {
  recordedBlob = null;
  wave.style.width = "0%";
  statusText.textContent = "Recording deleted";
});

// Discord send
// 🚀 SEND TO STUDIO (Discord via Worker)

const sendBtn = document.querySelector(".send");

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
      wave.style.width = "0%";
      statusText.textContent = "Tap to Record (5 seconds max)";
    } else {
      alert("Upload failed.");
    }

  } catch (err) {
    alert("Error sending shoutout.");
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "🚀 Send to Studio";
}); 

// =======================
// MOBILE MENU
// =======================

function openMenu(){
document.getElementById("mobileNav").classList.add("active");
document.getElementById("navBackdrop").hidden = false;
}

function closeMenu(){
document.getElementById("mobileNav").classList.remove("active");
document.getElementById("navBackdrop").hidden = true;
}

document.getElementById("navClose").onclick = closeMenu;
document.getElementById("navBackdrop").onclick = closeMenu;

// =======================
// GUESS THE TUNE
// =======================

var guessTracks = [];
var guessRound = 0;

// Replace this with your published Google Sheet CSV link
var GUESS_TUNES_CSV_URL = "https://docs.google.com/spreadsheets/d/1YrH1TrDyCApuOnMOurYJdhS_yBruHLsqQ2BrITFMLcY/edit?usp=sharing";

function playGuessClip() {
  var audio = document.getElementById("guessAudio");

  if (!audio || !guessTracks.length) return;

  audio.src = guessTracks[guessRound].clip;
  audio.currentTime = 0;

  audio.play().then(function () {
    console.log("Guess clip playing");
  }).catch(function (err) {
    console.error("Audio play failed:", err);
  });
}

function parseCSVLine(line) {
  var result = [];
  var current = "";
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var char = line[i];
    var next = line[i + 1];

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

function setupGuessTheTune() {
  var result = document.getElementById("guess-result");
  var next = document.getElementById("nextRound");
  var optionButtons = document.querySelectorAll(".guess-btn");

  if (!result || !next || optionButtons.length === 0) {
    return;
  }

  function updateOptions() {
    if (!guessTracks.length) return;

    for (var i = 0; i < optionButtons.length; i++) {
      optionButtons[i].textContent = guessTracks[guessRound].options[i] || "Option";
    }

    result.innerHTML = "";
    result.style.color = "";
  }

  for (var i = 0; i < optionButtons.length; i++) {
    optionButtons[i].onclick = function () {
      if (!guessTracks.length) return;

      if (this.innerText === guessTracks[guessRound].answer) {
        result.innerHTML = "✅ Correct!";
        result.style.color = "#00ff9f";
      } else {
        result.innerHTML = "❌ Wrong! Answer: " + guessTracks[guessRound].answer;
        result.style.color = "#ff4d6d";
      }
    };
  }

  next.onclick = function () {
    if (!guessTracks.length) return;

    guessRound++;

    if (guessRound >= guessTracks.length) {
      guessRound = 0;
    }

    updateOptions();
  };

  fetch(GUESS_TUNES_CSV_URL)
    .then(function (res) {
      return res.text();
    })
    .then(function (csv) {
      var rows = csv.trim().split(/\r?\n/);

      // remove header row
      rows.shift();

      guessTracks = rows.map(function (row) {
        var cols = parseCSVLine(row);

        return {
          clip: cols[0],
          answer: cols[1],
          options: [cols[2], cols[3], cols[4], cols[5]]
        };
      }).filter(function (item) {
        return item.clip && item.answer;
      });

      guessRound = 0;
      updateOptions();
    })
    .catch(function (err) {
      console.error("Could not load Guess The Tune CSV", err);
      result.innerHTML = "Could not load Guess The Tune.";
      result.style.color = "#ff4d6d";
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupGuessTheTune);
} else {
  setupGuessTheTune();
} 


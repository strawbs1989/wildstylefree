/* =========================
   Wildstyle - script.js
   Spreadsheet schedule + Now On + Up Next
   ========================= */

// ✅ Put your NEW /exec URL here
const SCHEDULE_API = "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

/* -------------------------
   Render schedule grid
------------------------- */
function cleanTime(v) {
  const s = String(v || "").trim();

  // Already good? e.g. "1am" or "1:30pm"
  const compact = s.toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,2}(:\d{2})?(am|pm)$/.test(compact)) return compact;

  // If it looks like a Date string, convert it to am/pm
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    let h = d.getHours();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12; if (h === 0) h = 12;
    const m = d.getMinutes();
    return m ? `${h}:${String(m).padStart(2, "0")}${ampm}` : `${h}${ampm}`;
  }

  // Fallback: return original
  return s;
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
      day,
      start: String(s.start || "").trim(),
      end: String(s.end || "").trim(),
      dj: String(s.dj || "").trim()
    });
  });

  // Sort by start time
  DAY_ORDER.forEach(d => {
    days[d].sort((a, b) => {
      const am = timeToMinutes(a.start) ?? 9999;
      const bm = timeToMinutes(b.start) ?? 9999;
      return am - bm;
    });
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

/* =========================
   Wildstyle Radio — script.js (FIXED & CLEAN)
   ========================= */

/* ---------- YEAR ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* =========================
   ✅ MOBILE BURGER NAV (WORKING)
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    nav.classList.toggle("open");
    burger.classList.toggle("open");
  });

  // Close menu when a link is clicked
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      burger.classList.remove("open");
    }
  });
});

/* =========================
   🎧 HLS PLAYER
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const STREAM_URL = "https://streaming.live365.com/a50378";
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const muteBtn = document.getElementById("muteBtn");

  if (!audio) return;

  if (window.Hls && window.Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
  } else {
    audio.src = STREAM_URL;
  }

  let playing = false;

  if (playBtn) {
    playBtn.addEventListener("click", async () => {
      try {
        if (!playing) {
          await audio.play();
          playing = true;
          playBtn.textContent = "⏸ Pause";
        } else {
          audio.pause();
          playing = false;
          playBtn.textContent = "▶ Listen Live";
        }
      } catch (e) {
        console.log("Playback blocked");
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
    });
  }
});

/* =========================
   🇬🇧 UK TIME (BST SAFE)
   ========================= */
function getUKNow() {
  const now = new Date();
  const y = now.getUTCFullYear();

  const bstStart = new Date(Date.UTC(y, 2, 31));
  bstStart.setUTCDate(31 - bstStart.getUTCDay());

  const bstEnd = new Date(Date.UTC(y, 9, 31));
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay());

  const inBST = now >= bstStart && now < bstEnd;
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600000);
}

/* =========================
   📻 SCHEDULE SLOTS (TRUTH SOURCE)
   ========================= */
const SLOTS = [
  { day: 1, start: "1am", end: "3am", dj: "DJ Carrillo" },
  { day: 1, start: "6am", end: "10am", dj: "Free" },
  { day: 1, start: "12pm", end: "2pm", dj: "DJ Dezzy Mac" },
  { day: 1, start: "3pm", end: "5pm", dj: "James Stephen" },
  { day: 1, start: "5pm", end: "7pm", dj: "Lewis" },
  { day: 1, start: "8pm", end: "10pm", dj: "DJ Dezzy Mac" },
  { day: 1, start: "10pm", end: "12am", dj: "Jayden" },

  { day: 2, start: "6am", end: "10am", dj: "Steve" },
  { day: 2, start: "10am", end: "12pm", dj: "DJ Paul" },
  { day: 2, start: "10pm", end: "12am", dj: "Andrew" },

  { day: 3, start: "10am", end: "12pm", dj: "DJ Nala" },
  { day: 3, start: "4pm", end: "6pm", dj: "Tee" },
  { day: 3, start: "8pm", end: "9pm", dj: "DJ Eliseo" },

  { day: 4, start: "7pm", end: "8pm", dj: "DJ EchoFalls" },

  { day: 5, start: "8am", end: "10am", dj: "Paradice With DJ LUX" },
  { day: 5, start: "6pm", end: "8pm", dj: "Baby Jayne" },

  { day: 6, start: "6am", end: "10am", dj: "Leo" },
  { day: 6, start: "7pm", end: "8pm", dj: "DJ Sonic J" },

  { day: 7, start: "12pm", end: "1pm", dj: "Paradice With DJ LUX" },
  { day: 7, start: "8pm", end: "9pm", dj: "DJ EchoFalls" }
];

/* =========================
   ⏱ TIME HELPERS
   ========================= */
function timeToMinutes(t) {
  const m = String(t).toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  if (h === 12) h = 0;
  if (m[3] === "pm") h += 12;
  return h * 60 + mins;
}

function inSlot(now, start, end) {
  if (end <= start) return now >= start || now < end;
  return now >= start && now < end;
}

/* =========================
   🔴 NOW ON / ⏭ UP NEXT
   ========================= */
function getDayNum(d) {
  return d === 0 ? 7 : d;
}

function findCurrent() {
  const uk = getUKNow();
  const day = getDayNum(uk.getUTCDay());
  const nowM = uk.getUTCHours() * 60 + uk.getUTCMinutes();

  for (const s of SLOTS) {
    if (s.day !== day) continue;
    const sm = timeToMinutes(s.start);
    const em = timeToMinutes(s.end);
    if (sm !== null && em !== null && inSlot(nowM, sm, em)) return s;
  }
  return null;
}

function findNext() {
  const uk = getUKNow();
  const day = getDayNum(uk.getUTCDay());
  const nowM = uk.getUTCHours() * 60 + uk.getUTCMinutes();

  const list = [];
  for (let i = 0; i < 7; i++) {
    const d = ((day - 1 + i) % 7) + 1;
    SLOTS.filter(s => s.day === d).forEach(s => {
      const sm = timeToMinutes(s.start);
      if (i === 0 && sm <= nowM) return;
      list.push({ offset: i, sm, s });
    });
  }

  list.sort((a, b) => a.offset - b.offset || a.sm - b.sm);
  return list[0]?.s || null;
}

function updateNowUI() {
  const now = findCurrent();
  const next = findNext();

  const pill = document.getElementById("live-pill");
  const title = document.getElementById("np-title");
  const artist = document.getElementById("np-artist");
  const upNext = document.getElementById("upNextShow");

  if (now) {
    pill.textContent = "ON AIR";
    pill.classList.add("onair");
    title.textContent = `${now.start} – ${now.end}`;
    artist.textContent = now.dj;
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    title.textContent = "No current broadcast";
    artist.textContent = "Auto / Free Rotation";
  }

  if (upNext && next) {
    const days = ["","Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    upNext.innerHTML = `${days[next.day]} • ${next.start} – ${next.end} • <strong>${next.dj}</strong>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateNowUI();
  setInterval(updateNowUI, 60000);
}); 

/* -------------------------
   Fetch schedule (robust)
   - tries direct fetch first
   - falls back to AllOrigins RAW if CORS blocks
------------------------- */
async function fetchSchedule() {
  // Try direct first
  try {
    const r = await fetch(SCHEDULE_API + "?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    // Fallback: proxy (avoids CORS issues)
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(SCHEDULE_API + "?v=" + Date.now());
    const r2 = await fetch(proxy, { cache: "no-store" });
    const txt = await r2.text();
    return JSON.parse(txt);
  }
}

/* -------------------------
   Init schedule page
------------------------- */
async function initSchedule() {
  const grid = document.getElementById("scheduleGrid");
  const upNextEl = document.getElementById("upNextShow");

  if (grid) {
    grid.innerHTML = `<div class="slot"><div class="time">Loading…</div><div class="show">Fetching schedule</div></div>`;
  }
  if (upNextEl) upNextEl.textContent = "Loading next show…";

  try {
    const data = await fetchSchedule();
    const slots = Array.isArray(data.slots) ? data.slots : [];

    renderSchedule(slots);

    const tick = () => {
      const ukNow = getUKNow();
      const current = findCurrentSlot(slots, ukNow);
      const next = findUpNextSlot(slots, ukNow);
      updateNowOnUI(current);
      updateUpNextUI(next);
    };

    tick();
    setInterval(tick, 60_000);
  } catch (err) {
    console.error("Schedule load failed:", err);
    if (grid) {
      grid.innerHTML = `
        <div class="slot">
          <div class="time">Schedule error</div>
          <div class="show">Apps Script not returning JSON / blocked</div>
        </div>`;
    }
    if (upNextEl) upNextEl.textContent = "Schedule unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Only run schedule init if container exists (safe on other pages)
  if (document.getElementById("scheduleGrid")) initSchedule();
}); 
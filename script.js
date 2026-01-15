// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Burger menu
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if (burger && nav){ burger.addEventListener("click", ()=> nav.classList.toggle("open")); }

// HLS player
const STREAM_URL = "https://streaming.live365.com/a50378";
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const muteBtn = document.getElementById("muteBtn");

if (audio){
  if (window.Hls && window.Hls.isSupported()) {
    const hls = new Hls({lowLatencyMode:true});
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
  } else {
    audio.src = STREAM_URL;
  }
  let playing = false;
  if (playBtn){
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
      } catch (e) { console.log("Playback blocked", e); }
    });
  }
  if (muteBtn){ muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted; muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
    });
  }
}

// Subtle animated background
const canvas = document.getElementById("bgCanvas");
if (canvas){
  const ctx = canvas.getContext("2d");
  function resize(){ canvas.width = window.innerWidth; canvas.height = 240; }
  window.addEventListener("resize", resize); resize();
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<90;i++){
      const y = (i/90)*canvas.height;
      const grd = ctx.createLinearGradient(0,y,canvas.width,y);
      grd.addColorStop(0,"rgba(42,123,255,0)");
      grd.addColorStop(0.5,"rgba(42,123,255,0.15)");
      grd.addColorStop(1,"rgba(255,42,109,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0,y,canvas.width,2);
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ----------------- UK CLOCK (device-proof) -----------------
function getUKNow() {
  const now = new Date(); // UTC baseline
  const y = now.getUTCFullYear();

  // BST: last Sunday in March -> last Sunday in October (UTC math)
  const bstStart = new Date(Date.UTC(y, 2, 31)); // Mar 31 UTC
  bstStart.setUTCDate(31 - bstStart.getUTCDay()); // last Sunday Mar
  const bstEnd = new Date(Date.UTC(y, 9, 31)); // Oct 31 UTC
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay()); // last Sunday Oct

  const inBST = now >= bstStart && now < bstEnd;
  // UK time = UTC + (BST ? 1h : 0h)
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600 * 1000);
}

// ----------------- SCHEDULE (DH[1..7][0..23]) -----------------
const DH = Array.from({ length: 8 }, () => Array(24).fill(""));

// MONDAY (1) 
DH[1][1]  = "1am - 3am<br>DJ Carrillo";
DH[1][6]  = "6am – 10am<br>Free";
DH[1][10] = "10am – 12pm<br>Free";
DH[1][12] = "12pm – 2pm<br>DJ Dezzy Mac";
DH[1][15] = "3pm – 5pm<br>James Stephen";
DH[1][18] = "6pm – 9pm<br>FireDancer";   
DH[1][17] = "5pm – 7pm<br>Lewis";
DH[1][20] = "8pm – 10pm<br>DJ Dezzy Mac";
DH[1][22] = "10pm – 12am<br>Jayden";
           

// TUESDAY (2) 
DH[2][2]  = "2am - 5am<br>James-Wizard Of Rock";
DH[2][3]  = "3am – 6am<br>DJ Queen Dani";
DH[2][6]  = "6am - 10am<br>Steve";
DH[2][10] = "10am - 12pm<br>DJ Paul";
DH[2][18] = "6pm – 8pm<br>Free";
DH[2][20] = "8pm – 10pm<br>Free";
DH[2][22] = "10pm - 12am<br>Andrew";

// WEDNESDAY (3) 
DH[3][10] = "10am – 12pm<br>DJ Nala";
DH[3][12] = "12pm - 2pm<br>Free";
DH[3][12] = "2pm - 4pm<br>Free";
DH[3][16] = "4pm - 6pm<br>Tee";
DH[3][18] = "6pm - 7pm<br>Daniel Parker";
DH[3][19] = "7pm - 8pm<br>Strange";
DH[3][19] = "8pm - 9pm<br>DJ Eliseo";
DH[3][22] = "10pm – 12am<br>DJ Nitro";

// THURSDAY (4) 
DH[4][0]  = "12am - 1am<br>DJ Mary";
DH[4][10] = "10am – 12pm<br>DJ Salty";
DH[4][13] = "1pm - 3pm<br>Free";
DH[4][15] = "3pm – 4pm<br>Charlotte";
DH[4][15] = "4pm – 7pm<br>DJ JohnT";
DH[4][19] = "7pm – 8pm<br>DJ EchoFalls";
DH[4][20] = "8pm – 10pm<br>Strange";
DH[4][22] = "10pm – 12pm<br>DJ Indigo Riz";
DH[4][23] = "12pm –3am<br>Ejay Hill";

// FRIDAY (5) 
DH[5][8]  = "8am - 10am<br>Paradice With DJ LUX";                         
DH[5][10] = "10am – 12pm<br>DJ Queen Dani";
DH[5][12] = "12pm – 3pm<br>DJ Nala";
DH[5][15] = "3pm - 5pm<br>Free";
DH[5][15] = "5pm - 6pm<br>Monet";
DH[5][18] = "6pm - 8pm<br>Baby Jayne";
DH[5][20] = "8pm - 9pm<br>DJ Mix N Match";
DH[5][20] = "9pm - 10pm<br>DJ Mix N Match";
DH[5][22] = "10pm - 12am<br>Tom";
DH[5][22] = "12am - 3am<br>FireDancer";

// SATURDAY (6)
DH[6][0]  = "12am – 2am<br>DJ Songbird";
DH[6][2]  = "2am – 4am<br>Amar - AJ";
DH[6][4]  = "4am – 6am<br>DJ OldSkool";
DH[6][6]  = "6am – 10am<br>Leo";
DH[6][10]  = "10am – 12pm<br>DJ Queen Dani";
DH[6][16] = "4pm – 6pm<br>DJ Keyes";
DH[6][18] = "6pm – 7pm<br>Laura - DJ LilDevil";
DH[6][18] = "7pm – 8pm<br>DJ Sonic J";
DH[6][19] = "8pm – 9pm<br>DJ Golds";
DH[6][21] = "9pm – 10pm<br>Loan Woolf";
DH[6][22] = "10pm – 12am<br>Baby Jayne";

// SUNDAY (7)
DH[7][8]  = "8am - 10am<br>DJ Queen Dani";
DH[7][11] = "11am – 12pm<br>HotShot DJ";
DH[7][12] = "12pm – 1pm<br>Paradice With DJ LUX";
DH[7][13] = "1pm – 3pm<br>Free";           
DH[7][17] = "5pm – 6pm<br>Sound-Invader";
DH[7][18] = "6pm – 8pm<br>Jim";
DH[7][20] = "8pm - 9pm<br>DJ EchoFalls";
DH[7][21] = "10pm – 12am<br>Andrew";




// ----------------- NOW ON -----------------
function NowON() {
  const ukNow = getUKNow();
  const day = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // 1..7 (Sun=7)
  const hour = ukNow.getUTCHours();

  const pill = document.getElementById("live-pill");
  const t = document.getElementById("np-title");
  const a = document.getElementById("np-artist");
  if (!pill || !t || !a) return;

  const show = DH[day][hour];

  if (show) {
    pill.textContent = "ON AIR";
    pill.classList.add("onair");
    const [slot, dj] = show.split("<br>");
    t.textContent = slot;
    a.textContent = dj;
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    t.textContent = "No current broadcast";
    a.textContent = "Schedule resumes soon";
  }

  // Debug line (remove later)
  console.log("UK Day:", day, "UK Hour:", hour, "Show:", show || "(none)");
}

document.addEventListener("DOMContentLoaded", () => {
  NowON();
  setInterval(NowON, 60_000);
});



// === Load live listener reviews from Google Sheet via AllOrigins ===
const scriptURL = "https://script.google.com/macros/s/AKfycbwLdcwqzua8j9P1F2eaJg4SVTGSru8kaaeZytXz9CB9_09mpwUX-6iu7cVo5e5UN24/exec"; // your working Apps Script URL

fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(scriptURL))
  .then(res => res.json())
  .then(data => JSON.parse(data.contents))
  .then(reviews => {
    const box = document.querySelector(".review-grid");
    if (!box) return;
    box.innerHTML = "";

    reviews.slice(-3).reverse().forEach(r => {
      const div = document.createElement("div");
      div.className = "review glass";
      div.innerHTML = `${"⭐".repeat(r.stars || 0)}<br>"${r.review}" — ${r.name}`;
      box.appendChild(div);
    });
  }) // 
  .catch(err => console.error("Reviews load error:", err)); 
  
  // === function up next ===
 function updateUpNext() {
  const ukNow = getUKNow();               
  const hour = ukNow.getUTCHours();
  const jsDay = ukNow.getUTCDay();        

  // DH is 1..7 (Mon..Sun)
  const day = (jsDay === 0) ? 7 : jsDay;

  const el = document.getElementById("upNextShow");
  if (!el) return;

  const today = DH[day];
  if (!today) {
    el.textContent = "Auto / Free Rotation";
    return;
  }

  const hasCurrent = !!today[hour];
  const startFrom = hasCurrent ? hour + 1 : hour;

  const findNextIn = (d, fromHour) => {
    const data = DH[d];
    if (!data) return null;
    for (let h = fromHour; h <= 23; h++) {
      if (data[h]) return data[h];
    }
    return null;
  };

  // Later today
  let next = findNextIn(day, startFrom);

  // Tomorrow
  if (!next) {
    const tomorrow = (day === 7) ? 1 : day + 1;
    const t = findNextIn(tomorrow, 0);
    if (t) next = `Tomorrow — ${t}`;
  }

  el.innerHTML = next || "Auto / Free Rotation";
}

updateUpNext();
setInterval(updateUpNext, 60 * 1000); 

/* =========================
   🎉 SHOUT-OUT TICKER
   ========================= */

const SHOUTOUT_URL = "https://script.google.com/macros/s/AKfycbzqlI7Up1fPZpXM_yngVsdDrWOGZthFyKvMJgTgs7faJuC6XoUrvZ1gAKHhfxDJCUjgRw/exec";

// submit (creates PENDING)
const shoutForm = document.getElementById("shoutoutForm");
if (shoutForm) {
  shoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("shoutoutStatus");
    if (status) status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(shoutForm).entries());

    try {
      const res = await fetch(SHOUTOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });

      let out = {};
	  
	  try {
		  out = await res.json();
	  } catch (e) {}

      if (res.ok && (out.ok || out.pending)) {
        status.textContent = "✅ Sent for approval! Once LIVE it will show in the ticker.";
        shoutForm.reset();
      } else {
        status.textContent = "❌ " + (out.error || "Failed");
      }
    } catch (err) {
      if (status) status.textContent = "❌ Network error";
    }
  });
}

// ticker pull (shows only LIVE)
async function loadShoutouts() {
  const el = document.getElementById("tickerContent");
  if (!el) return;

  try {
    const res = await fetch(SHOUTOUT_URL, { cache: "no-store" });
    const data = await res.json();

    const msgs = Array.isArray(data)
      ? data.map(x => (typeof x === "string" ? x : x.message)).filter(Boolean)
      : [];

    el.textContent = msgs.length
      ? msgs.join(" 🔊 ")
      : "Send a shout-out on wildstyle.vip 🎉";
  } catch (e) {
    el.textContent = "Wildstyle Radio — United by Beats";
  }
}

loadShoutouts();
setInterval(loadShoutouts, 60000);

/* =========================
   Wildstyle - script.js
   Spreadsheet schedule + Now On + Up Next
   ========================= */

// ✅ Put your NEW /exec URL here
const SCHEDULE_API = "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Burger menu
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if (burger && nav) burger.addEventListener("click", () => nav.classList.toggle("open"));

/* -------------------------
   UK time (BST aware)
------------------------- */
function getUKNow() {
  const now = new Date(); // UTC baseline
  const y = now.getUTCFullYear();

  // BST: last Sunday in March -> last Sunday in October
  const bstStart = new Date(Date.UTC(y, 2, 31));
  bstStart.setUTCDate(31 - bstStart.getUTCDay()); // last Sunday in March

  const bstEnd = new Date(Date.UTC(y, 9, 31));
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay()); // last Sunday in October

  const inBST = now >= bstStart && now < bstEnd;
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600 * 1000);
}

/* -------------------------
   Helpers
------------------------- */
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_TO_NUM = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6, Sunday:7 };

function normDay(d) {
  const s = String(d || "").trim().toLowerCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(cap) ? cap : "";
}

function timeToMinutes(t) {
  const s = String(t || "").trim().toLowerCase().replace(/\s+/g, "");
  // matches "1am", "10pm", "1:30pm"
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];

  if (h === 12) h = 0;
  if (ap === "pm") h += 12;

  return h * 60 + mins;
}

function slotStartEndMinutes(slot) {
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);
  if (start === null || end === null) return null;

  // If end <= start, it crosses midnight (e.g., 10pm-12am or 10pm-2am)
  const crossesMidnight = end <= start;
  return { start, end, crossesMidnight };
}

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

/* -------------------------
   NOW ON + UP NEXT from slots
------------------------- */
function findCurrentSlot(slots, ukNow) {
  const dayNum = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // Mon=1..Sun=7
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  // Check today's slots + previous day slots that cross midnight
  const todayName = DAY_ORDER[dayNum - 1];
  const prevName = DAY_ORDER[(dayNum + 5) % 7];

  // Helper to test if now is inside a slot
  const isInSlot = (slotDayName, slot) => {
    const r = slotStartEndMinutes(slot);
    if (!r) return false;

    if (slotDayName === todayName) {
      if (!r.crossesMidnight) return minsNow >= r.start && minsNow < r.end;
      // crosses midnight: active if now >= start OR now < end
      return minsNow >= r.start || minsNow < r.end;
    }

    // previous day crossing midnight can still be active after midnight today
    if (slotDayName === prevName && r.crossesMidnight) {
      return minsNow < r.end; // after midnight part
    }

    return false;
  };

  // normalize
  const clean = slots.map(s => ({
    day: normDay(s.day),
    start: String(s.start || "").trim(),
    end: String(s.end || "").trim(),
    dj: String(s.dj || "").trim()
  })).filter(s => s.day && s.start && s.end && s.dj);

  // Check today first
  const todaySlots = clean.filter(s => s.day === todayName);
  for (const s of todaySlots) if (isInSlot(todayName, s)) return { ...s };

  // Then prev-day cross-midnight
  const prevSlots = clean.filter(s => s.day === prevName);
  for (const s of prevSlots) if (isInSlot(prevName, s)) return { ...s };

  return null;
}

function findUpNextSlot(slots, ukNow) {
  const dayNum = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // 1..7
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  const clean = slots.map(s => ({
    day: normDay(s.day),
    start: String(s.start || "").trim(),
    end: String(s.end || "").trim(),
    dj: String(s.dj || "").trim()
  })).filter(s => s.day && s.start && s.end && s.dj);

  // Build a list of candidate "next start times" over the next 7 days
  const candidates = [];

  for (let offset = 0; offset < 7; offset++) {
    const dIndex = (dayNum - 1 + offset) % 7;
    const dayName = DAY_ORDER[dIndex];
    const daySlots = clean.filter(s => s.day === dayName);

    for (const s of daySlots) {
      const startM = timeToMinutes(s.start);
      if (startM === null) continue;

      // Same day: only consider starts after now
      if (offset === 0 && startM <= minsNow) continue;

      candidates.push({
        offset,
        startM,
        slot: s
      });
    }
  }

  candidates.sort((a, b) => (a.offset - b.offset) || (a.startM - b.startM));
  return candidates.length ? candidates[0].slot : null;
}

function updateNowOnUI(current) {
  const pill = document.getElementById("live-pill");
  const t = document.getElementById("np-title");
  const a = document.getElementById("np-artist");
  if (!pill || !t || !a) return;

  if (current) {
    pill.textContent = "ON AIR";
    pill.classList.add("onair");
    t.textContent = `${current.start} – ${current.end}`;
    a.textContent = current.dj;
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    t.textContent = "No current broadcast";
    a.textContent = "Schedule resumes soon";
  }
}

function updateUpNextUI(next) {
  const el = document.getElementById("upNextShow");
  if (!el) return;
  if (!next) {
    el.textContent = "Auto / Free Rotation";
    return;
  }
  el.innerHTML = `${next.day} • ${next.start} – ${next.end} • <strong>${next.dj}</strong>`;
}

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
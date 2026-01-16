/* =========================
   Wildstyle — script.js (CLEAN)
   Mobile nav + player + UK time + NOW ON + UP NEXT
   ========================= */

/* ---------- Year ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* =========================
   ✅ ROOT Burger Menu System (mobile drawer)
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const mobileNav = document.getElementById("mobileNav");
  const backdrop = document.getElementById("navBackdrop");
  const closeBtn = document.getElementById("navClose");

  if (!burger || !mobileNav || !backdrop || !closeBtn) return;

  const openMenu = () => {
    document.body.classList.add("nav-open");
    burger.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    mobileNav.hidden = false;

    // allow transition to run
    requestAnimationFrame(() => mobileNav.classList.add("open"));
  };

  const closeMenu = () => {
    document.body.classList.remove("nav-open");
    burger.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");

    // wait for slide-out then hide
    setTimeout(() => {
      mobileNav.hidden = true;
      backdrop.hidden = true;
    }, 230);
  };

  const toggleMenu = () => {
    const isOpen = mobileNav.classList.contains("open");
    isOpen ? closeMenu() : openMenu();
  };

  burger.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleMenu(); };
  closeBtn.onclick = (e) => { e.preventDefault(); closeMenu(); };
  backdrop.onclick = () => closeMenu();

  // close when clicking a link in drawer
  mobileNav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  // escape to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav.classList.contains("open")) closeMenu();
  });
}); 


/* ---------- HLS Player ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const STREAM_URL = "https://streaming.live365.com/a50378";
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const muteBtn = document.getElementById("muteBtn");

  if (!audio) return;

  if (window.Hls && window.Hls.isSupported()) {
    const hls = new Hls({ lowLatencyMode: true });
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
        console.log("Playback blocked", e);
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

/* ---------- UK Time (BST aware, device-proof) ---------- */
function getUKNow() {
  const now = new Date(); // UTC baseline
  const y = now.getUTCFullYear();

  // BST: last Sunday in March -> last Sunday in October (UTC math)
  const bstStart = new Date(Date.UTC(y, 2, 31));
  bstStart.setUTCDate(31 - bstStart.getUTCDay());

  const bstEnd = new Date(Date.UTC(y, 9, 31));
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay());

  const inBST = now >= bstStart && now < bstEnd;
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600 * 1000);
}

/* ---------- Schedule as slots (THIS fixes your On Air) ---------- */
/*
  Day numbers: Mon=1 ... Sun=7
  Keep your DJs the same — just list the actual time ranges.
*/
const SLOTS = [
  // MONDAY (1)
  { day: 1, start: "1am",  end: "3am",  dj: "DJ Carrillo" },
  { day: 1, start: "6am",  end: "10am", dj: "Free" },
  { day: 1, start: "10am", end: "12pm", dj: "Free" },
  { day: 1, start: "12pm", end: "2pm",  dj: "DJ Dezzy Mac" },
  { day: 1, start: "3pm",  end: "5pm",  dj: "James Stephen" },
  { day: 1, start: "5pm",  end: "7pm",  dj: "Lewis" },
  { day: 1, start: "6pm",  end: "9pm",  dj: "FireDancer" },   // NOTE: overlaps 5–7
  { day: 1, start: "8pm",  end: "10pm", dj: "DJ Dezzy Mac" },
  { day: 1, start: "10pm", end: "12am", dj: "Jayden" },

  // TUESDAY (2)
  { day: 2, start: "2am",  end: "5am",  dj: "James - Wizard Of Rock" },
  { day: 2, start: "3am",  end: "6am",  dj: "DJ Queen Dani" }, // NOTE: overlaps 2–5
  { day: 2, start: "6am",  end: "10am", dj: "Steve" },
  { day: 2, start: "10am", end: "12pm", dj: "DJ Paul" },
  { day: 2, start: "6pm",  end: "8pm",  dj: "Free" },
  { day: 2, start: "8pm",  end: "10pm", dj: "Free" },
  { day: 2, start: "10pm", end: "12am", dj: "Andrew" },

  // WEDNESDAY (3)
  { day: 3, start: "10am", end: "12pm", dj: "DJ Nala" },
  { day: 3, start: "12pm", end: "2pm",  dj: "Free" },
  { day: 3, start: "2pm",  end: "4pm",  dj: "Free" },
  { day: 3, start: "4pm",  end: "6pm",  dj: "Tee" },
  { day: 3, start: "6pm",  end: "7pm",  dj: "Daniel Parker" },
  { day: 3, start: "7pm",  end: "8pm",  dj: "Strange" },
  { day: 3, start: "8pm",  end: "9pm",  dj: "DJ Eliseo" },
  { day: 3, start: "10pm", end: "12am", dj: "DJ Nitro" },

  // THURSDAY (4)
  { day: 4, start: "12am", end: "1am",  dj: "DJ Mary" },
  { day: 4, start: "10am", end: "12pm", dj: "DJ Salty" },
  { day: 4, start: "1pm",  end: "3pm",  dj: "Free" },
  { day: 4, start: "3pm",  end: "4pm",  dj: "Charlotte" },
  { day: 4, start: "4pm",  end: "7pm",  dj: "DJ JohnT" },
  { day: 4, start: "7pm",  end: "8pm",  dj: "DJ EchoFalls" },
  { day: 4, start: "8pm",  end: "10pm", dj: "Strange" },
  { day: 4, start: "10pm", end: "12am", dj: "DJ Indigo Riz" },
  { day: 4, start: "12am", end: "3am",  dj: "Ejay Hill" }, // NOTE: this is actually Friday 12–3 unless you mean Thurs night

  // FRIDAY (5)
  { day: 5, start: "8am",  end: "10am", dj: "Paradice With DJ LUX" },
  { day: 5, start: "10am", end: "12pm", dj: "DJ Queen Dani" },
  { day: 5, start: "12pm", end: "3pm",  dj: "DJ Nala" },
  { day: 5, start: "3pm",  end: "5pm",  dj: "Free" },
  { day: 5, start: "5pm",  end: "6pm",  dj: "Monet" },
  { day: 5, start: "6pm",  end: "8pm",  dj: "Baby Jayne" },
  { day: 5, start: "8pm",  end: "10pm", dj: "DJ Mix N Match" }, // combined
  { day: 5, start: "10pm", end: "12am", dj: "Tom" },
  { day: 5, start: "12am", end: "3am",  dj: "FireDancer" }, // NOTE: this is actually Saturday 12–3 unless you mean Fri night

  // SATURDAY (6)
  { day: 6, start: "12am", end: "2am",  dj: "DJ Songbird" },
  { day: 6, start: "2am",  end: "4am",  dj: "Amar - AJ" },
  { day: 6, start: "4am",  end: "6am",  dj: "DJ OldSkool" },
  { day: 6, start: "6am",  end: "10am", dj: "Leo" },
  { day: 6, start: "10am", end: "12pm", dj: "DJ Queen Dani" },
  { day: 6, start: "4pm",  end: "6pm",  dj: "DJ Keyes" },
  { day: 6, start: "6pm",  end: "7pm",  dj: "Laura - DJ LilDevil" },
  { day: 6, start: "7pm",  end: "8pm",  dj: "DJ Sonic J" },
  { day: 6, start: "8pm",  end: "9pm",  dj: "DJ Golds" },
  { day: 6, start: "9pm",  end: "10pm", dj: "Loan Woolf" },
  { day: 6, start: "10pm", end: "12am", dj: "Baby Jayne" },

  // SUNDAY (7)
  { day: 7, start: "8am",  end: "10am", dj: "DJ Queen Dani" },
  { day: 7, start: "11am", end: "12pm", dj: "HotShot DJ" },
  { day: 7, start: "12pm", end: "1pm",  dj: "Paradice With DJ LUX" },
  { day: 7, start: "1pm",  end: "3pm",  dj: "Free" },
  { day: 7, start: "5pm",  end: "6pm",  dj: "Sound-Invader" },
  { day: 7, start: "6pm",  end: "8pm",  dj: "Jim" },
  { day: 7, start: "8pm",  end: "9pm",  dj: "DJ EchoFalls" },
  { day: 7, start: "10pm", end: "12am", dj: "Andrew" },
];

/* ---------- Time helpers ---------- */
function timeToMinutes(t) {
  const s = String(t || "").trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];

  if (h === 12) h = 0;
  if (ap === "pm") h += 12;

  return h * 60 + mins;
}

function inSlot(nowMins, startMins, endMins) {
  if (startMins === null || endMins === null) return false;
  // cross-midnight
  if (endMins <= startMins) return nowMins >= startMins || nowMins < endMins;
  return nowMins >= startMins && nowMins < endMins;
}

/* ---------- NOW ON + UP NEXT ---------- */
function getDayNumFromUK(ukNow) {
  // JS getUTCDay: Sun=0..Sat=6  => we want Mon=1..Sun=7
  const d = ukNow.getUTCDay();
  return d === 0 ? 7 : d;
}

function findCurrentSlot() {
  const ukNow = getUKNow();
  const day = getDayNumFromUK(ukNow);
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  const today = SLOTS.filter(s => s.day === day);
  const prevDay = day === 1 ? 7 : day - 1;
  const prev = SLOTS.filter(s => s.day === prevDay);

  // today slots
  for (const s of today) {
    const sm = timeToMinutes(s.start);
    const em = timeToMinutes(s.end);
    if (inSlot(minsNow, sm, em)) return { ...s, ukNow };
  }

  // previous day cross-midnight slots
  for (const s of prev) {
    const sm = timeToMinutes(s.start);
    const em = timeToMinutes(s.end);
    if (em !== null && sm !== null && em <= sm) {
      // only valid after midnight part
      if (minsNow < em) return { ...s, ukNow };
    }
  }

  return null;
}

function findUpNextSlot() {
  const ukNow = getUKNow();
  const day = getDayNumFromUK(ukNow);
  const minsNow = ukNow.getUTCHours() * 60 + ukNow.getUTCMinutes();

  const candidates = [];

  for (let offset = 0; offset < 7; offset++) {
    const d = ((day - 1 + offset) % 7) + 1;
    const daySlots = SLOTS.filter(s => s.day === d);

    for (const s of daySlots) {
      const sm = timeToMinutes(s.start);
      if (sm === null) continue;
      if (offset === 0 && sm <= minsNow) continue; // later than now only
      candidates.push({ offset, sm, slot: s });
    }
  }

  candidates.sort((a, b) => (a.offset - b.offset) || (a.sm - b.sm));
  return candidates[0]?.slot || null;
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

  const dayNames = {1:"Monday",2:"Tuesday",3:"Wednesday",4:"Thursday",5:"Friday",6:"Saturday",7:"Sunday"};
  el.innerHTML = `${dayNames[next.day]} • ${next.start} – ${next.end} • <strong>${next.dj}</strong>`;
}

function tickSchedule() {
  const current = findCurrentSlot();
  const next = findUpNextSlot();
  updateNowOnUI(current);
  updateUpNextUI(next);
}

document.addEventListener("DOMContentLoaded", () => {
  tickSchedule();
  setInterval(tickSchedule, 60_000);
});

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

/ === Load live listener reviews from Google Sheet via AllOrigins ===
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
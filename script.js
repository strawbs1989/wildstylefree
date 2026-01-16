/* =====================================================
   WILDSTYLE RADIO — SCRIPT.JS (FIXED & CLEAN)
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- YEAR ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- MOBILE BURGER NAV (WORKS) ---------- */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("open");
      burger.classList.toggle("open");
    });

    nav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.classList.remove("open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove("open");
        burger.classList.remove("open");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        nav.classList.remove("open");
        burger.classList.remove("open");
      }
    });
  }

  /* ---------- HLS PLAYER ---------- */
  const STREAM_URL = "https://streaming.live365.com/a50378";
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const muteBtn = document.getElementById("muteBtn");

  if (audio) {
    if (window.Hls && Hls.isSupported()) {
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
        } catch (err) {
          console.warn("Playback blocked", err);
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
      });
    }
  }

  /* ---------- SHOUT-OUT TICKER ---------- */
  const SHOUTOUT_URL =
    "https://script.google.com/macros/s/AKfycbzqlI7Up1fPZpXM_yngVsdDrWOGZthFyKvMJgTgs7faJuC6XoUrvZ1gAKHhfxDJCUjgRw/exec";

  async function loadShoutouts() {
    const el = document.getElementById("tickerContent");
    if (!el) return;
    try {
      const res = await fetch(SHOUTOUT_URL, { cache: "no-store" });
      const data = await res.json();
      el.textContent = data.length
        ? data.map(x => x.message).join(" 🔊 ")
        : "Send a shout-out on wildstyle.vip 🎉";
    } catch {
      el.textContent = "Wildstyle Radio — United by Beats";
    }
  }

  loadShoutouts();
  setInterval(loadShoutouts, 60000);

  /* ---------- SCHEDULE (APPS SCRIPT) ---------- */


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
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
  const SCHEDULE_API =
    "https://script.google.com/macros/s/AKfycbzCOKSJ-PkTa_1unRKMrlhtE5v1MZPvctKrqBgWJ9bcjsfaSgxUoGYJ8vt8ut96U5Y/exec";

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function getUKNow() {
    return new Date(
      new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })
    );
  }

  function timeToMins(t) {
    const m = t.match(/(\d+)(?::(\d+))?(am|pm)/i);
    if (!m) return null;
    let h = +m[1] % 12 + (m[3].toLowerCase() === "pm" ? 12 : 0);
    return h * 60 + (+m[2] || 0);
  }

  function inRange(now, start, end) {
    return end <= start
      ? now >= start || now < end
      : now >= start && now < end;
  }

  async function loadSchedule() {
    try {
      const res = await fetch(SCHEDULE_API);
      const data = await res.json();
      return data.slots || [];
    } catch {
      return [];
    }
  }

  function updateNowAndNext(slots) {
    const now = getUKNow();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();

    const today = slots.filter(s => DAY_NAMES.indexOf(s.day) === day);
    let current = null;

    for (const s of today) {
      if (inRange(mins, timeToMins(s.start), timeToMins(s.end))) {
        current = s;
        break;
      }
    }

    const pill = document.getElementById("live-pill");
    const title = document.getElementById("np-title");
    const artist = document.getElementById("np-artist");

    if (current) {
      pill.textContent = "ON AIR";
      pill.classList.add("onair");
      title.textContent = `${current.start} – ${current.end}`;
      artist.textContent = current.dj;
    } else {
      pill.textContent = "OFF AIR";
      pill.classList.remove("onair");
      title.textContent = "No current broadcast";
      artist.textContent = "Schedule resumes soon";
    }
  }

  loadSchedule().then(slots => {
    updateNowAndNext(slots);
    setInterval(() => updateNowAndNext(slots), 60000);
  });

}); 

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
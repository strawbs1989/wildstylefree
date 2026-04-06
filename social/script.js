const DJ_SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const djSearch = document.getElementById("djSearch");
const filterButtons = document.querySelectorAll(".filter-btn");
const djCards = document.querySelectorAll(".dj-card");
const djCount = document.getElementById("djCount");

let currentFilter = "all";

function normaliseText(value) {
  return String(value || "").trim().toLowerCase();
}

function normaliseDay(value) {
  const v = normaliseText(value);
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function updateDjCount() {
  const visible = [...djCards].filter(card => !card.classList.contains("hidden")).length;
  if (djCount) {
    djCount.textContent = `${visible} DJ${visible === 1 ? "" : "s"}`;
  }
}

function filterDjCards() {
  const term = normaliseText(djSearch?.value);
  djCards.forEach(card => {
    const category = normaliseText(card.dataset.category);
    const haystack = normaliseText(card.dataset.search);

    const matchesFilter = currentFilter === "all" || category === currentFilter;
    const matchesSearch = !term || haystack.includes(term);

    card.classList.toggle("hidden", !(matchesFilter && matchesSearch));
  });

  updateDjCount();
}

if (djSearch) {
  djSearch.addEventListener("input", filterDjCards);
}

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter || "all";
    filterDjCards();
  });
});

function setDjSlot(card, slots) {
  const slotEl = card.querySelector(".slot");
  if (!slotEl) return;

  if (!slots.length) {
    slotEl.innerHTML = `Schedule TBC<small>Check back soon for updated show times</small>`;
    return;
  }

  if (slots.length === 1) {
    const s = slots[0];
    slotEl.innerHTML = `${s.day} • ${s.start}–${s.end}<small>${s.note}</small>`;
    return;
  }

  const first = slots[0];
  const extra = slots
    .slice(1)
    .map(s => `${s.day} ${s.start}–${s.end}`)
    .join(" • ");

  slotEl.innerHTML = `${first.day} • ${first.start}–${first.end}<small>${extra}</small>`;
}

function buildDjScheduleMap(slots) {
  const map = {};

  slots.forEach(slot => {
    const dj = String(slot.dj || "").trim();
    if (!dj || dj.toLowerCase() === "free") return;

    if (!map[dj]) map[dj] = [];

    map[dj].push({
      day: normaliseDay(slot.day),
      start: slot.start,
      end: slot.end,
      note: "Live on Wildstyle Radio"
    });
  });

  Object.keys(map).forEach(name => {
    map[name].sort((a, b) => {
      const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
  });

  return map;
}

async function loadDjTimes() {
  try {
    const res = await fetch(DJ_SCHEDULE_URL + "?v=" + Date.now());
    const data = await res.json();
    const slots = data.slots || [];
    const map = buildDjScheduleMap(slots);

    djCards.forEach(card => {
      const djName = card.dataset.dj;
      const slotsForDj = map[djName] || [];
      setDjSlot(card, slotsForDj);
    });
  } catch (err) {
    console.error("DJ schedule load failed:", err);
  }
}

filterDjCards();
loadDjTimes(); 

/* ===============================
   Schedule
   =============================== */

 const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

    const DAY_ORDER = [
      "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
    ];

    function normDay(day) {
      const s = String(day || "").trim().toLowerCase();
      const fixed = s.charAt(0).toUpperCase() + s.slice(1);
      return DAY_ORDER.includes(fixed) ? fixed : "";
    }

    function parseTime(t) {
      t = String(t || "").trim().toLowerCase();
      const m = t.match(/(\\d{1,2})(?::(\\d{2}))?(am|pm)/);
      if (!m) return null;

      let h = parseInt(m[1], 10);
      const mins = parseInt(m[2] || "0", 10);
      const ampm = m[3];

      if (ampm === "pm" && h !== 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;

      return h * 60 + mins;
    }

    function getUKNow() {
      return new Date(new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London"
      }));
    }

    function getNowMinutes() {
      const now = getUKNow();
      return {
        dayNum: now.getDay() === 0 ? 7 : now.getDay(),
        mins: now.getHours() * 60 + now.getMinutes()
      };
    }

    function slotRange(slot) {
      const start = parseTime(slot.start);
      const end = parseTime(slot.end);

      if (start == null || end == null) return null;

      return {
        start,
        end,
        crossesMidnight: end <= start
      };
    }

    function findCurrentSlot(slots) {
      const { dayNum, mins } = getNowMinutes();
      const today = DAY_ORDER[dayNum - 1];
      const prev = DAY_ORDER[(dayNum + 5) % 7];

      for (const s of slots) {
        const r = slotRange(s);
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

      for (let offset = 0; offset < 7; offset++) {
        const day = DAY_ORDER[(dayNum - 1 + offset) % 7];

        for (const s of slots.filter(x => x.day === day)) {
          if ((s.dj || "").toLowerCase() === "free") continue;

          const r = slotRange(s);
          if (!r) continue;

          if (offset === 0) {
            if (!r.crossesMidnight && r.start > mins) list.push({ offset, start: r.start, s });
            if (r.crossesMidnight && mins < r.start) list.push({ offset, start: r.start, s });
          } else {
            list.push({ offset, start: r.start, s });
          }
        }
      }

      list.sort((a, b) => a.offset - b.offset || a.start - b.start);
      return list[0]?.s || null;
    }

    function renderSchedule(slots) {
      const grid = document.getElementById("scheduleGrid");
      const count = document.getElementById("scheduleCount");
      if (!grid) return;

      const grouped = {};
      DAY_ORDER.forEach(day => grouped[day] = []);

      slots.forEach(slot => {
        const day = normDay(slot.day);
        if (!day) return;

        grouped[day].push({
          start: slot.start,
          end: slot.end,
          dj: slot.dj || "Free"
        });
      });

      DAY_ORDER.forEach(day => {
        grouped[day].sort((a, b) => (parseTime(a.start) ?? 9999) - (parseTime(b.start) ?? 9999));
      });

      grid.innerHTML = DAY_ORDER.map(day => `
        <div class="schedule-day glass">
          <h3>${day}</h3>
          ${
            grouped[day].length
              ? grouped[day].map(slot => `
                  <div class="slot">
                    <div class="time">${slot.start} – ${slot.end}</div>
                    <div class="show">${slot.dj}</div>
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

      if (count) {
        const total = slots.filter(s => (s.dj || "").toLowerCase() !== "free").length;
        count.textContent = `${total} live slot${total === 1 ? "" : "s"}`;
      }
    }

    function updateNowNext(slots) {
      const nowEl = document.getElementById("scheduleNowOn");
      const nextEl = document.getElementById("scheduleUpNext");

      const now = findCurrentSlot(slots);
      const next = findUpNextSlot(slots);

      if (nowEl) {
        nowEl.textContent = now
          ? `Now On: ${now.dj} (${now.start}–${now.end})`
          : "Now On: Off Air";
      }

      if (nextEl) {
        nextEl.textContent = next
          ? `${next.dj} (${next.start}–${next.end})`
          : "No upcoming shows";
      }
    }

    async function loadSchedule() {
      try {
        const res = await fetch(SCHEDULE_URL + "?v=" + Date.now());
        const data = await res.json();

        const slots = (data.slots || []).map(slot => ({
          day: normDay(slot.day),
          start: slot.start,
          end: slot.end,
          dj: slot.dj || "Free"
        }));

        renderSchedule(slots);
        updateNowNext(slots);
        setInterval(() => updateNowNext(slots), 60000);
      } catch (err) {
        console.error("Schedule load failed:", err);
        const grid = document.getElementById("scheduleGrid");
        if (grid) {
          grid.innerHTML = "Schedule unavailable right now.";
        }
      }
    }

    loadSchedule();
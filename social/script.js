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

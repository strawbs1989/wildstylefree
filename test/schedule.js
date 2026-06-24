/* =====================================
   WILDSTYLE SCHEDULE SYSTEM
===================================== */

const TEST_SCHEDULE_URL =
"https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

/* =====================================
   LOAD SCHEDULE
===================================== */

async function loadSchedule() {

  try {

    const response = await fetch(
      TEST_SCHEDULE_URL + "?v=" + Date.now(),
      { cache: "no-store" }
    );

    const data = await response.json();

    console.log("SCHEDULE LOADED", data);

    return Array.isArray(data.slots)
      ? data.slots
      : [];

  } catch (err) {

    console.error("Schedule Load Failed", err);

    return [];

  }

}

/* =====================================
   TIME HELPERS
===================================== */

function convertTimeToMinutes(timeString) {

  if (!timeString) return 0;

  const parts = String(timeString).split(":");

  if (parts.length === 2) {

    return (
      parseInt(parts[0], 10) * 60 +
      parseInt(parts[1], 10)
    );

  }

  return 0;

}

/* =====================================
   CURRENT SHOW
===================================== */

function getCurrentShow(schedule) {

  const now = new Date();

  const today =
    DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const currentMinutes =
    (now.getHours() * 60) +
    now.getMinutes();

  return schedule.find(show => {

    if (show.day !== today) return false;

    const start =
      convertTimeToMinutes(show.start);

    const end =
      convertTimeToMinutes(show.end);

    return (
      currentMinutes >= start &&
      currentMinutes < end
    );

  });

}

/* =====================================
   HERO
===================================== */

function updateHero(show) {

  const heroShowName =
    document.getElementById("heroShowName");

  const heroShowTime =
    document.getElementById("heroShowTime");

  const heroDJ =
    document.getElementById("heroDJ");

  if (!show) {

    if (heroShowName)
      heroShowName.textContent =
      "No Live Show";

    if (heroShowTime)
      heroShowTime.textContent =
      "Check Weekly Schedule";

    return;

  }

  if (heroShowName)
    heroShowName.textContent =
    show.dj;

  if (heroShowTime)
    heroShowTime.textContent =
    `${show.start} - ${show.end}`;

  if (heroDJ)
    heroDJ.src = "/images/wildy.png";

}

/* =====================================
   WILDY RECOMMENDS
===================================== */

function updateWildy(show) {

  if (!show) return;

  const image =
    document.getElementById("wildyDjImage");

  const name =
    document.getElementById("wildyDjName");

  const text =
    document.getElementById("wildyDjText");

  const time =
    document.getElementById("wildyDjTime");

  if (image)
    image.src = "/images/wildy.png";

  if (name)
    name.textContent = show.dj;

  if (text)
    text.textContent =
    "Wildy recommends tuning into this show.";

  if (time)
    time.textContent =
    `${show.start} - ${show.end}`;

}

/* =====================================
   WEEKLY SCHEDULE GRID
===================================== */

function renderSchedule(schedule) {

  const grid = document.getElementById("scheduleGrid");

console.log("GRID =", grid);

if (!grid) return;

  let html = "";

  DAYS.forEach(day => {

    const dayShows =
      schedule.filter(
        show => show.day === day
      );

    html += `
      <div class="schedule-day">
        <h2>${day}</h2>
    `;

    if (!dayShows.length) {

      html += `
        <div class="slot">
          Available Slots
        </div>
      `;

    } else {

      dayShows.forEach(show => {

        html += `
          <div class="slot">
            <strong>${show.dj}</strong><br>
            ${show.start} - ${show.end}
          </div>
        `;

      });

    }

    html += `
      </div>
    `;

  });

  grid.innerHTML = html;

}

/* =====================================
   HOME PAGE NOW ON
===================================== */

function updateNowOn(show) {

  const nowOn =
    document.getElementById("nowon");

  if (!nowOn) return;

  if (!show) {

    nowOn.textContent =
      "Currently Off Air";

    return;

  }

  nowOn.textContent =
    `${show.dj} (${show.start}-${show.end})`;

}

/* =====================================
   INIT
===================================== */

async function initSchedule() {

  const schedule =
    await loadSchedule();

  console.log(schedule);

  if (!schedule.length) return;

  const currentShow =
    getCurrentShow(schedule);

  updateHero(currentShow);

  updateWildy(
    currentShow || schedule[0]
  );

  updateNowOn(currentShow);

  renderSchedule(schedule);

}

document.addEventListener(
  "DOMContentLoaded",
  initSchedule
);
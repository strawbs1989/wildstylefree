/* =====================================
   WILDSTYLE SCHEDULE SYSTEM
===================================== */

const SCHEDULE_URL =
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
      SCHEDULE_URL + "?v=" + Date.now(),
      { cache: "no-store" }
    );

    const data = await response.json();

    console.log("SCHEDULE LOADED", data);

    return data;

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

  const match =
    String(timeString)
      .toLowerCase()
      .trim()
      .match(/(\d+)(?::(\d+))?(am|pm)/);

  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2] || 0);

  if (match[3] === "pm" && hours !== 12) {
    hours += 12;
  }

  if (match[3] === "am" && hours === 12) {
    hours = 0;
  }

  return (hours * 60) + minutes;

}

/* =====================================
   CURRENT SHOW
===================================== */

function getCurrentShow(schedule) {

  const now = new Date();

  const today =
    DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const currentMinutes =
    (now.getHours() * 60) + now.getMinutes();

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

    if (heroShowName) {
      heroShowName.textContent =
        "No Live Show";
    }

    if (heroShowTime) {
      heroShowTime.textContent =
        "Check Weekly Schedule";
    }

    return;

  }

  if (heroShowName) {
    heroShowName.textContent =
      show.dj;
  }

  if (heroShowTime) {
    heroShowTime.textContent =
      show.start + " - " + show.end;
  }

  if (heroDJ) {

    const djName =
      show.dj.toLowerCase();

    if (djName.includes("echo")) {
      heroDJ.src = "/images/echo1.png";
    } else if (djName.includes("kai")) {
      heroDJ.src = "/images/kai.jpg";
    } else {
      heroDJ.src = "/images/wildy.png";
    }

  }

}

/* =====================================
   WILDY RECOMMENDS
===================================== */

function updateWildy(show) {

  const image =
    document.getElementById("wildyDjImage");

  const name =
    document.getElementById("wildyDjName");

  const text =
    document.getElementById("wildyDjText");

  const time =
    document.getElementById("wildyDjTime");

  if (!show) return;

  if (image) {
    image.src = "/images/wildy.png";
  }

  if (name) {
    name.textContent = show.dj;
  }

  if (text) {
    text.textContent =
      "Wildy recommends tuning into this show today.";
  }

  if (time) {
    time.textContent =
      show.start + " - " + show.end;
  }

}

/* =====================================
   WEEKLY SCHEDULE GRID
===================================== */

function renderSchedule(schedule) {

  const grid =
    document.getElementById("scheduleGrid");

  if (!grid) {
    console.log("NO CONTAINER FOUND");
    return;
  }

  let html = "";

  DAYS.forEach(day => {

    const dayShows =
      schedule.filter(
        show => show.day === day
      );

    html += `
      <div class="schedule-day">
        <h2 class="schedule-day-title">
          ${day}
        </h2>

        <div class="dj-grid">
    `;

    if (!dayShows.length) {

      html += `
        <article class="dj-card">

          <div class="dj-body">

            <h3>Available Slots</h3>

            <p>No DJs booked yet.</p>

          </div>

        </article>
      `;

    } else {

      dayShows.forEach(show => {

        html += `
          <article class="dj-card">

            <div class="dj-body">

              <h3>${show.dj}</h3>

              <div class="slot">

                ${show.start}
                -
                ${show.end}

              </div>

            </div>

          </article>
        `;

      });

    }

    html += `
        </div>
      </div>
    `;

  });

  grid.innerHTML = html;

}

/* =====================================
   INIT
===================================== */

async function initSchedule() {

  const schedule =
    await loadSchedule();

  if (!schedule.length) return;

  const currentShow =
    getCurrentShow(schedule);

  updateHero(currentShow);

  updateWildy(
    currentShow || schedule[0]
  );

  renderSchedule(schedule);

}

document.addEventListener(
  "DOMContentLoaded",
  initSchedule
);
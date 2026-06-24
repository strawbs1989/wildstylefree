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

async function loadSchedule() {

  try {

    const response = await fetch(
      SCHEDULE_URL + "?v=" + Date.now()
    );

    const data = await response.json();

    console.log("Schedule Data:", data);

    return data;

  } catch (err) {

    console.error("Schedule Error:", err);

    return [];

  }

}

function renderSchedule(data) {

  const grid =
    document.getElementById("scheduleGrid");

  if (!grid) return;

  let html = "";

  DAYS.forEach(day => {

    const shows =
      data.filter(
        show => show.day === day
      );

    html += `
      <div class="schedule-day">

        <h2 class="schedule-day-title">
          ${day}
        </h2>

        <div class="dj-grid">
    `;

    if (!shows.length) {

      html += `
        <article class="dj-card">

          <div class="dj-body">

            <h3>
              Available Slots
            </h3>

            <p>
              No shows scheduled.
            </p>

          </div>

        </article>
      `;

    } else {

      shows.forEach(show => {

        html += `
          <article class="dj-card">

            <div class="dj-body">

              <h3>${show.dj}</h3>

              <div class="slot">
                ${show.start} - ${show.end}
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

function updateHero(data) {

  const heroName =
    document.getElementById("heroShowName");

  const heroTime =
    document.getElementById("heroShowTime");

  const heroImage =
    document.getElementById("heroDJ");

  if (!data.length) return;

  const show = data[0];

  if (heroName)
    heroName.textContent = show.dj;

  if (heroTime)
    heroTime.textContent =
      show.start + " - " + show.end;

  if (heroImage)
    heroImage.src = "/images/wildy.png";

}

function updateWildy(data) {

  const image =
    document.getElementById("wildyDjImage");

  const name =
    document.getElementById("wildyDjName");

  const text =
    document.getElementById("wildyDjText");

  const time =
    document.getElementById("wildyDjTime");

  if (!data.length) return;

  const show = data[0];

  if (image)
    image.src = "/images/wildy.png";

  if (name)
    name.textContent = show.dj;

  if (text)
    text.textContent =
      "Wildy recommends tuning into this show today.";

  if (time)
    time.textContent =
      show.start + " - " + show.end;

}

async function initSchedule() {

  const schedule =
    await loadSchedule();

  renderSchedule(schedule);

  updateHero(schedule);

  updateWildy(schedule);

}

document.addEventListener(
  "DOMContentLoaded",
  initSchedule
);
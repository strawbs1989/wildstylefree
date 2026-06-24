const SCHEDULE_URL =
"https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
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

const res = await fetch(
  SCHEDULE_URL + "?v=" + Date.now()
);

const data = await res.json();

return Array.isArray(data)
  ? data
  : [];

} catch (err) {

console.error(err);
return [];

}

}

function renderSchedule(slots) {

const grid =
document.getElementById("scheduleGrid");

if (!grid) return;

let html = "";

DAY_ORDER.forEach(day => {

const dayShows =
  slots.filter(
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

        <h3>
          Available Slots
        </h3>

        <p>
          No DJs scheduled.
        </p>

      </div>

    </article>
  `;

} else {

  dayShows.forEach(show => {

    html += `
      <article class="dj-card">

        <div class="dj-body">

          <h3>
            ${show.dj}
          </h3>

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

function updateHero(slots) {

const heroShowName =
document.getElementById("heroShowName");

const heroShowTime =
document.getElementById("heroShowTime");

const heroDJ =
document.getElementById("heroDJ");

if (!slots.length) return;

const featured = slots[0];

if (heroShowName)
heroShowName.textContent =
featured.dj;

if (heroShowTime)
heroShowTime.textContent =
featured.start +
" - " +
featured.end;

if (heroDJ)
heroDJ.src =
"/images/wildy.png";

}

function updateWildy(slots) {

const img =
document.getElementById("wildyDjImage");

const name =
document.getElementById("wildyDjName");

const text =
document.getElementById("wildyDjText");

const time =
document.getElementById("wildyDjTime");

if (!slots.length) return;

const show = slots[0];

if (img)
img.src = "/images/wildy.png";

if (name)
name.textContent = show.dj;

if (text)
text.textContent =
"Wildy recommends this show.";

if (time)
time.textContent =
show.start +
" - " +
show.end;

}

async function initSchedule() {

const slots =
await loadSchedule();

renderSchedule(slots);

updateHero(slots);

updateWildy(slots);

}

document.addEventListener(
"DOMContentLoaded",
initSchedule
);
const schedule = [
{
  dj: "Chanel",
  start: "18:00",
  end: "20:00",
  image: "/images/chanel.png"
  },
{
  dj: "stephan",
  start: "20:00",
  end: "22:00",
  image: "/images/don.jpg"
},
{
  dj: "Free",
  start: "22:00",
  end: "00:00",
  image: "/images/mouse.jpeg"
},
{
  dj: "Stormzy",
  start: "14:00",
  end: "16:00",
  image: "/images/spark.jpeg"
},
];


function updateHeroDJ() {

  const heroDJ = document.getElementById("heroDJ");

  if (!heroDJ) return;

  const now = new Date();

  const currentTime =
    now.getHours().toString().padStart(2,"0") +
    ":" +
    now.getMinutes().toString().padStart(2,"0");

  const currentShow = schedule.find(show =>
    currentTime >= show.start &&
    currentTime < show.end
  );

  if (currentShow && currentShow.image) {

    heroDJ.src = currentShow.image;

  }

}

document.addEventListener("DOMContentLoaded", () => {

  updateHeroDJ();



  setInterval(updateHeroDJ, 60000);

});


function buildScheduleWidget() {

  const list = document.getElementById("liveScheduleList");

  if (!list) return;

  const now = new Date();

  const currentTime =
    now.getHours().toString().padStart(2,"0") +
    ":" +
    now.getMinutes().toString().padStart(2,"0");

  let currentIndex = -1;

  schedule.forEach((show,index) => {

    if(
      currentTime >= show.start &&
      currentTime < show.end
    ){
      currentIndex = index;
    }

  });

  let html = "";

  schedule.forEach((show,index) => {

    let badge = "";

    if(index === currentIndex){
      badge = `<span class="schedule-live">LIVE</span>`;
    }

    if(index === currentIndex + 1){
      badge = `<span class="schedule-next">NEXT</span>`;
    }

    html += `
      <div class="schedule-row">

        <img src="${show.image}" alt="${show.dj}">

        <div class="schedule-info">

          ${badge}

          <div class="schedule-name">
            ${show.dj}
          </div>

          <div class="schedule-time">
            ${show.start} - ${show.end}
          </div>

        </div>

      </div>
    `;

  });

  list.innerHTML = html;

}

function updateWildyRecommendation() {

  const djImage = document.getElementById("wildyDjImage");
  const djName = document.getElementById("wildyDjName");
  const djText = document.getElementById("wildyDjText");
  const djTime = document.getElementById("wildyDjTime");

  if (!djImage || !djName || !djText || !djTime) return;

  const now = new Date();

  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  let currentShow = schedule.find(show =>
    currentTime >= show.start &&
    currentTime < show.end
  );

  if (!currentShow) {
    currentShow = schedule[0];
  }

  djImage.src = currentShow.image;
  djName.textContent = currentShow.dj;
  djText.textContent =
    "Wildy recommends tuning into this show today.";
  djTime.textContent =
    currentShow.start + " - " + currentShow.end;
}

document.addEventListener("DOMContentLoaded", () => {
  updateWildyRecommendation();
});
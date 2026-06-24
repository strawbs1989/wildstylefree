const schedule = [
{
day: "Saturday",
dj: "Chanel",
start: "18:00",
end: "20:00",
image: "/images/chanel.png"
},
{
day: "Saturday",
dj: "stephan",
start: "20:00",
end: "22:00",
image: "/images/golds.jpg"
},
{
day: "Saturday",
dj: "Free",
start: "22:00",
end: "00:00",
image: "/images/mouse.jpeg"
},
{
day: "Sunday",
dj: "Don",
start: "12:00",
end: "14:00",
image: "/images/don.jpg"
},
{
day: "Tuesday",
dj: "DJ Mystic",
start: "20:00",
end: "22:00",
image: "/images/joanne.jpg"
},
{
day: "Sunday",
dj: "Micky J",
start: "17:00",
end: "18:00",
image: "/images/mickeyjay.jpeg"
},
{
day: "Sunday",
dj: "Kai",
start: "18:00",
end: "19:00",
image: "/images/kai.jpg"
},
{
day: "Sunday",
dj: "EchoFalls",
start: "19:00",
end: "20:00",
image: "/images/echo1.png"
},
{
day: "Sunday",
dj: "HotShotDj",
start: "20:00",
end: "22:00",
image: "/images/hotshot.jpg"
},
{
dj: "Free",
start: "22:00",
end: "00:00",
image: "/images/"
},
];

function updateHeroDJ() {

const heroShowName =
document.getElementById("heroShowName");

const heroShowTime =
document.getElementById("heroShowTime");

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

if (currentShow) {

if (currentShow.image) {
heroDJ.src = currentShow.image;
}

if (heroShowName) {
heroShowName.textContent = currentShow.dj;
}

if (heroShowTime) {
heroShowTime.textContent =
currentShow.start + " - " + currentShow.end;
}

}

}

document.addEventListener("DOMContentLoaded", () => {

updateHeroDJ();

setInterval(updateHeroDJ, 60000);

});

function buildScheduleWidget() {

console.log("Schedule widget running");

const list = document.getElementById("liveScheduleList");

if (!list) {
console.log("liveScheduleList not found");
return;
}

// rest of code...
}

function buildScheduleWidget() {

const list = document.getElementById("liveScheduleList");

if (!list) return;

let html = "";

const today = new Date().toLocaleDateString(
  "en-GB",
  { weekday: "long" }
);

schedule
  .filter(show => show.day === today)
  .forEach(show => { 

html += `  
  <div class="schedule-row">  

    <img src="${show.image}" alt="${show.dj}">  

    <div class="schedule-info">  
      <div class="schedule-name">${show.dj}</div>  
      <div class="schedule-time">  
        ${show.start} - ${show.end}  
      </div>  
    </div>  

  </div>  
`;

});

list.innerHTML = html;

}

document.addEventListener("DOMContentLoaded", () => {

buildScheduleWidget();

});

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
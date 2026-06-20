const schedule = [
{
  dj: "Chanel",
  start: "18:00",
  end: "29:00",
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
  image: "/images/spark.jpg"
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
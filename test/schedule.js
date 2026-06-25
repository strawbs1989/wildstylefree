const schedule = [
  // --- MONDAY ---
  { day: "Monday", dj: "Free Slot", start: "00:00", end: "02:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "02:00", end: "04:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "04:00", end: "06:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "06:00", end: "08:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "08:00", end: "10:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "10:00", end: "11:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "HotShotDj", start: "11:00", end: "12:00", image: "/images/graham.jpg" },
  { day: "Monday", dj: "DJ States", start: "12:00", end: "14:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "14:00", end: "16:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "Free Slot", start: "16:00", end: "17:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "DJ Lewis", start: "17:00", end: "19:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "DJ SUZY", start: "19:00", end: "21:00", image: "/images/default-dj.jpg" },
  { day: "Monday", dj: "DJ Gaby", start: "19:00", end: "20:00", image: "/images/default-dj.jpg" },

  // --- TUESDAY ---
  { day: "Tuesday", dj: "Free Slot", start: "00:00", end: "02:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "02:00", end: "04:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "04:00", end: "06:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Shakes - DJ Flincho", start: "06:00", end: "08:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "08:00", end: "10:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "10:00", end: "12:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Thomas Deane", start: "12:00", end: "13:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "HotShot Dj", start: "13:00", end: "14:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "14:00", end: "16:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "16:00", end: "17:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "Free Slot", start: "17:00", end: "18:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "DJ Marty", start: "18:00", end: "20:00", image: "/images/default-dj.jpg" },
  { day: "Tuesday", dj: "DJ Mystic", start: "20:00", end: "22:00", image: "/images/joanne.jpeg" },
  { day: "Tuesday", dj: "Free Slot", start: "22:00", end: "00:00", image: "/images/default-dj.jpg" },

  // --- WEDNESDAY ---
  { day: "Wednesday", dj: "Free", start: "00:00", end: "02:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Free", start: "02:00", end: "04:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Free", start: "04:00", end: "06:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Free", start: "06:00", end: "08:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Free", start: "08:00", end: "10:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Leanne - DJ Nala", start: "10:00", end: "12:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Stephan", start: "12:00", end: "16:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "Free", start: "16:00", end: "17:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "🎯HotShotDj", start: "17:00", end: "19:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "DJ Suzy", start: "19:00", end: "21:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "DJ ALLYBEE", start: "19:00", end: "20:00", image: "/images/default-dj.jpg" },
  { day: "Wednesday", dj: "DJ Simon Pro", start: "20:00", end: "00:00", image: "/images/default-dj.jpg" },

  // --- THURSDAY ---
  { day: "Thursday", dj: "Free", start: "00:00", end: "03:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Free", start: "03:00", end: "06:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Free", start: "06:00", end: "08:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Free", start: "08:00", end: "10:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "DJ Serenity", start: "10:00", end: "12:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Free", start: "12:00", end: "14:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "HotShotDj", start: "14:00", end: "15:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Stephan", start: "15:00", end: "18:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "Free", start: "18:00", end: "19:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "DJ Ruckus", start: "19:00", end: "20:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "HotShot DJ", start: "20:00", end: "22:00", image: "/images/default-dj.jpg" },
  { day: "Thursday", dj: "DJ Ruckus", start: "22:00", end: "00:00", image: "/images/default-dj.jpg" },

  // --- FRIDAY ---
  { day: "Friday", dj: "DJ EchoFalls", start: "20:00", end: "22:00", image: "/images/echo1.png" },

  // --- SATURDAY ---
  { day: "Saturday", dj: "Chanel", start: "18:00", end: "20:00", image: "/images/chanel.png" },
  { day: "Saturday", dj: "stephan", start: "20:00", end: "22:00", image: "/images/golds.jpg" },
  { day: "Saturday", dj: "Free", start: "22:00", end: "00:00", image: "/images/mouse.jpeg" },

  // --- SUNDAY ---
  { day: "Sunday", dj: "Don", start: "12:00", end: "14:00", image: "/images/don.jpg" },
  { day: "Sunday", dj: "Micky J", start: "17:00", end: "18:00", image: "/images/mickeyjay.jpeg" },
  { day: "Sunday", dj: "Kai", start: "18:00", end: "19:00", image: "/images/kai.jpg" },
  { day: "Sunday", dj: "EchoFalls", start: "19:00", end: "20:00", image: "/images/echo1.png" },
  { day: "Sunday", dj: "HotShotDj", start: "20:00", end: "22:00", image: "/images/hotshot.jpg" },
  { day: "Sunday", dj: "Free", start: "22:00", end: "23:59", image: "/images/mouse.jpeg" }
]; // <-- This closing bracket was missing!

// 1. Updates the "What's On Air" Hero banner
function updateHeroDJ() {
  const heroShowName = document.getElementById("heroShowName");
  const heroShowTime = document.getElementById("heroShowTime");
  const heroDJ = document.getElementById("heroDJ");
  if (!heroShowName || !heroShowTime || !heroDJ) return;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];

  const currentShow = schedule.find(show => show.day === today && currentTime >= show.start && currentTime < show.end);

  if (!currentShow) {
    heroShowName.textContent = "No Live Show";
    heroShowTime.textContent = "Check Weekly Schedule";
    heroDJ.src = "/images/wildy.png";
    return;
  }

  heroShowName.textContent = currentShow.dj;
  heroShowTime.textContent = `${currentShow.start} - ${currentShow.end}`;
  heroDJ.src = currentShow.image || "/images/wildy.png";
}

// 2. Builds and filters the schedule grid depending on the chosen day
function displayScheduleForDay(dayName) {
  const container = document.getElementById("liveSchedulelist");
  if (!container) return;

  const dayShows = schedule.filter(show => show.day === dayName);

  if (dayShows.length === 0) {
    container.innerHTML = `
      <div class="no-shows">
        <h3>Available Slots</h3>
        <p>No DJs booked for ${dayName} yet.</p>
      </div>`;
    return;
  }

  let html = `<div class="dj-grid">`;
  dayShows.forEach(show => {
    html += `
      <article class="dj-card">
        <div class="dj-image-wrap">
          <img src="${show.image}" alt="${show.dj}">
        </div>
        <div class="dj-body">
          <h3>${show.dj}</h3>
          <span class="tag">${show.start} - ${show.end}</span>
        </div>
      </article>`;
  });
  html += `</div>`;

  container.innerHTML = html;
}

// 3. Hooks up click events to the day buttons
function setupDayTabs() {
  const buttons = document.querySelectorAll(".day-tabs button");
  
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      document.querySelector(".day-tabs button.active")?.classList.remove("active");
      button.classList.add("active");
      
      const selectedDay = button.textContent.trim();
      displayScheduleForDay(selectedDay);
    });
  });
}

// 4. Updates the "Wildy Recommends" box
function updateWildyRecommendation() {
  const djImage = document.getElementById("wildyDjImage");
  const djName = document.getElementById("wildyDjName");
  const djText = document.getElementById("wildyDjText");
  const djTime = document.getElementById("wildyDjTime");
  if (!djImage || !djName || !djText || !djTime) return;

  if (schedule.length > 0) {
    djImage.src = schedule[0].image;
    djName.textContent = schedule[0].dj;
    djText.textContent = "Wildy recommends tuning into this show today.";
    djTime.textContent = `${schedule[0].start} - ${schedule[0].end}`;
  }
}

// Initialization Runner
document.addEventListener("DOMContentLoaded", () => {
  updateHeroDJ();
  updateWildyRecommendation();
  setupDayTabs();
  
  displayScheduleForDay("Monday");
  
  setInterval(updateHeroDJ, 60000);
});

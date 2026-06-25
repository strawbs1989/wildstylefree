const schedule = [
  // --- TUESDAY ---
  {
    day: "Tuesday",
    dj: "DJ Mystic",
    start: "20:00",
    end: "22:00",
    image: "/images/joanne.jpeg"
  },

  // --- FRIDAY ---
  {
    day: "Friday",
    dj: "DJ EchoFalls",
    start: "20:00",
    end: "22:00",
    image: "/images/echo1.png"
  },

  // --- SATURDAY ---
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

  // --- SUNDAY ---
  {
    day: "Sunday",
    dj: "Don",
    start: "12:00",
    end: "14:00",
    image: "/images/don.jpg"
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
    day: "Sunday",
    dj: "Free",
    start: "22:00",
    end: "23:59",
    image: "/images/mouse.jpeg"
  }
];


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
  // Finds your <div id="liveSchedulelist"> container
  const container = document.getElementById("liveSchedulelist");
  if (!container) return;

  // Filter the array down to just matches for this day
  const dayShows = schedule.filter(show => show.day === dayName);

  if (dayShows.length === 0) {
    container.innerHTML = `
      <div class="no-shows">
        <h3>Available Slots</h3>
        <p>No DJs booked for ${dayName} yet.</p>
      </div>`;
    return;
  }

  // Generate HTML for the booked slots
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
      // Remove active class from old button, give it to the clicked one
      document.querySelector(".day-tabs button.active")?.classList.remove("active");
      button.classList.add("active");
      
      // Refresh the lower timetable grid for this specific day!
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
  
  // Default to showing Monday's lineup on initial load
  displayScheduleForDay("Monday");
  
  setInterval(updateHeroDJ, 60000);
});

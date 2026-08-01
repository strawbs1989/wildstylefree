console.log("NEW SCHEDULE.JS LOADED");


const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const djImages = {
  "joanne": "/images/joanne.jpeg",
  "stephan": "/images/golds.jpg",
  "mouse": "/images/default-dj.jpg",
  "chanel": "/images/chanel.png",
  "echofalls": "/images/echo1.png",
  "hotshot": "/images/hotshot.jpg",
  "anthony": "/images/anthony.png",
  "micky j": "/images/mickeyjay.jpeg",
  "headhunter": "/images/headhunter.jpeg",
  "dj don": "/images/don.jpg",
  "dj junie": "/images/gary.jpeg",
  "luic": "/images/luic.jpeg",
  "andrew": "/images/andrew.jpg",
  "curator kitty": "/images/megan.jpeg",
  "kai": "/images/kai.jpg",
  "envy": "/images/envy.jpeg",
  "allybee": "/images/ally.jpg",
  "brookstyle": "/images/brookstyle.jpeg",
  "mr gvo": "/images/gvo.jpg",
  "sonny": "/images/sonny.jpeg",
  "pat": "/images/pat.jpg",
  "colin": "/images/coffee.jpeg",
  "tina": "/images/tina.jpeg",
  "muggz": "/images/muggz.jpg",
  "birbal": "/images/birbal.jpg",
  "donk": "/images/donk.jpeg",
  "gabby": "/images/gabby.jpg",
  "suzy": "/images/djsuzy.jpg",
  "alex": "/images/alex.jpeg",
  "3rd": "/images/tom.jpg",
  "lewis": "/images/lewis.jpg",
  "mix&match": "/images/rebecca.jpg",
  "leslie": "/images/leslie.jpeg",
  "flincho": "/images/flincho.jpg",
  "nala": "/images/djnala.jpg",
  "tom": "/images/tom.jpeg",
  "john": "/images/john.jpeg",
  "keekerz": "/images/keekerz.png",
  "katlady": "/images/katlady.jpeg",
  "truth": "/images/truth.jpeg",
  "aaron": "/images/aron.jpg",
  "blvck": "/images/supa.jpeg",
  "jamy": "/images/jamy.jpeg",
  "cody": "/images/cody.jpeg",
  "michelle": "/images/michelle.png",
  "rabzza": "/images/rabzza.jpg",
  "sergey": "/images/sergey.jpg",
  "tuan": "/images/tuan.jpeg",
  "ivan": "/images/ivan.jpeg",
  "denver": "/images/denver.jpg",
  "yinka": "/images/yinka.jpg",
  "djwes": "/images/djwes.jpg",
};

let schedule = [];

async function loadScheduleFromGoogle() {
  try {
    console.log("1. Starting fetch...");

    const response = await fetch(`${SCHEDULE_URL}?v=${Date.now()}`);
    console.log("2. Response:", response.status);

    const data = await response.json();
    console.log("3. Data:", data);

    const slots = Array.isArray(data) ? data : data.slots || [];
    console.log("4. Slots:", slots.length);

    schedule = slots.map(slot => {
      const djName = (slot.dj || "Free Slot").trim().toLowerCase();

      let djImage = "/images/wildy.png";

      for (const key in djImages) {
        if (djName.includes(key)) {
          djImage = djImages[key];
          break;
        }
      }

      return {
        day: slot.day || "Monday",
        dj: slot.dj || "Free Slot",
        start: formatTo24Hour(slot.start),
        end: formatTo24Hour(slot.end),
        image: djImage
      };
    });

    console.log("5. Schedule:", schedule.length);

    return true;

  } catch (err) {
    console.error("Failed to load live Google Sheet schedule:", err);
    return false;
  }
}
      
  

// Helper: Makes sure spreadsheet times like "11am" or "2pm" match our 24hr logic smoothly
function formatTo24Hour(timeStr) {
  if (!timeStr) return "00:00";
  let str = String(timeStr).trim().toLowerCase();

  if (str.includes(":")) {
    return str.split(":")[0].length === 1 ? "0" + str : str;
  }

  const match = str.match(/(\d+)\s*(am|pm)/);
  if (match) {
    let hours = parseInt(match[1]);
    const ampm = match[2];
    if (ampm === "pm" && hours !== 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    return String(hours).padStart(2, "0") + ":00";
  }
  return str;
}

// 2. Updates the "What's On Air" Hero banner based on the UK Timezone
function updateHeroDJ() {
  const heroShowName = document.getElementById("heroShowName");
  const heroShowTime = document.getElementById("heroShowTime");
  const heroDJ = document.getElementById("heroDJ");
  if (!heroShowName || !heroShowTime || !heroDJ) return;

  const now = new Date();

  // Hardcode UK timezone strings so your phone matches your server's logic perfectly!
  const optionsTime = { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false };
  const currentTime = now.toLocaleTimeString("en-GB", optionsTime); 

  const optionsDay = { timeZone: "Europe/London", weekday: "long" };
  const today = now.toLocaleDateString("en-GB", optionsDay); 

  const currentShow = schedule.find(show => 
    show.day.toLowerCase() === today.toLowerCase() && 
    currentTime >= show.start && 
    currentTime < show.end
  );

  if (!currentShow) {
    heroShowName.textContent = "No Live Show";
    heroShowTime.textContent = "Check Weekly Schedule";
    heroDJ.src = "/images/mouse.jpeg";
    return;
  }

  heroShowName.textContent = currentShow.dj;
  heroShowTime.textContent = `${currentShow.start} - ${currentShow.end}`;
  heroDJ.src = currentShow.image || "/images/mouse.jpeg";
}

// 3. Builds and filters the schedule grid depending on the chosen day
function displayScheduleForDay(dayName) {
  const container = document.getElementById("liveSchedulelist");
  if (!container) return;

  const dayShows = schedule.filter(show => show.day.toLowerCase() === dayName.toLowerCase());

  if (dayShows.length === 0) {
    container.innerHTML = `
      <div class="no-shows">
        <h3>Available Slots</h3>
        <p>No DJs booked for ${dayName} yet.</p>
      </div>`;
    return;
  }

  dayShows.sort((a, b) => a.start.localeCompare(b.start));

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

// 4. Hooks up click events to the day buttons
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

// 5. Updates the "Wildy Recommends" box
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

// Initialization Async Runner
document.addEventListener("DOMContentLoaded", async () => {
  setupDayTabs();

  const menuBtn = document.getElementById("mobileMenuBtn");
  const leftSidebar = document.querySelector(".sidebar");

  if (menuBtn && leftSidebar) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      leftSidebar.classList.toggle("mobile-active");
    });

    document.addEventListener("click", (e) => {
      if (!leftSidebar.contains(e.target) && leftSidebar.classList.contains("mobile-active")) {
        leftSidebar.classList.remove("mobile-active");
      }
    });
  }

  const success = await loadScheduleFromGoogle();

  if (success && schedule.length > 0) {
    updateHeroDJ();
    updateWildyRecommendation();

    // Use UK Timezone for selecting the initial tab default state too!
    const optionsDay = { timeZone: "Europe/London", weekday: "long" };
    const currentDay = new Date().toLocaleDateString("en-GB", optionsDay);

    const activeBtn = Array.from(document.querySelectorAll(".day-tabs button")).find(b => b.textContent.trim().toLowerCase() === currentDay.toLowerCase());

    if (activeBtn) {
      document.querySelector(".day-tabs button.active")?.classList.remove("active");
      activeBtn.classList.add("active");
      displayScheduleForDay(activeBtn.textContent.trim());
    } else {
      displayScheduleForDay("Monday");
    }
  } else {
    displayScheduleForDay("Monday");
  }

  setInterval(updateHeroDJ, 60000);
});
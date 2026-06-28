const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Stores the schedule array after download
let schedule = [];

// 1. Fetch live data from your Google Sheet API
async function loadScheduleFromGoogle() {
  try {
    const response = await fetch(`${SCHEDULE_URL}?v=${Date.now()}`);
    const data = await response.json();

    const fetchedSlots = data.slots || data.schedule || data || [];

    // Clean up times and automatically match local images based on the DJ name column
    schedule = fetchedSlots.map(slot => {
      const djName = (slot.dj || "Free Slot").trim().toLowerCase();
      let djImage = "/images/default-dj.jpg"; // Default fallback image

      // Check the text from your "DJ" column and map it to your local filenames
      if (djName.includes("mystic")) {
        djImage = "/images/joanne.jpeg";
      } else if (djName.includes("stephan") || djName.includes("gold")) {
        djImage = "/images/golds.jpg";
      } else if (djName.includes("chanel")) {
        djImage = "/images/chanel.png";
      } else if (djName.includes("echofalls")) {
        djImage = "/images/echo1.png";
      } else if (djName.includes("hotshot")) {
        djImage = "/images/hotshot.jpg";
      } else if (djName.includes("mouse") || djName.includes("free")) {
        djImage = "/images/mouse.jpeg";
      } else if (djName.includes("micky")) {
        djImage = "/images/mickeyjay.jpeg";
      } else if (djName.includes("don")) {
        djImage = "/images/don.jpg";
      } else if (djName.includes("kai")) {
        djImage = "/images/kai.jpg";
      } else if (djName.includes("serenity")) {
        djImage = "/images/default-dj.jpg"; 
      } else if (djName.includes("ruckus")) {
        djImage = "/images/default-dj.jpg"; 
      } else if (djName.includes("pat")) {
        djImage = "/images/pat.jpg";
      } else if (djName.includes("gabby")) {
        djImage = "/images/gabby.jpg";
      } else if (djName.includes("suzy")) {
        djImage = "/images/djsuzy.jpg";
      } else if (djName.includes("alex")) {
        djImage = "/images/alex.jpg";
      } else if (djName.includes("lewis")) {
        djImage = "/images/lewis.jpg";
      } else if (djName.includes("mix&match")) {
        djImage = "/images/rebecca.jpg";
      } else if (djName.includes("dj flincho")) {
        djImage = "/images/flincho.jpg";
      } else if (djName.includes("dj nala")) {
        djImage = "/images/djnala.jpg";
      } else if (djName.includes("dj spara")) { 
        djImage = "/images/spara.jpeg";
      } else if (djName.includes("dj tom")) {
        djImage = "/images/tom.jpeg";
      } else if (djName.includes("dj kiki")) {
        djImage = "/images/keekerz.png";
      } else if (djName.includes("dj katlady")) {
        djImage = "/images/katlady.jpeg";
      }

      return {
        day: slot.day || "Monday",
        dj: slot.dj || "Free Slot",
        start: formatTo24Hour(slot.start),
        end: formatTo24Hour(slot.end),
        image: djImage
      };
    });

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
    heroDJ.src = "/images/wildy.png";
    return;
  }

  heroShowName.textContent = currentShow.dj;
  heroShowTime.textContent = `${currentShow.start} - ${currentShow.end}`;
  heroDJ.src = currentShow.image || "/images/wildy.png";
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
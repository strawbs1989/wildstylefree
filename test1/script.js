// Year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Burger menu
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
if (burger && nav){ burger.addEventListener("click", ()=> nav.classList.toggle("open")); }

// HLS player
const STREAM_URL = "https://streaming.live365.com/a50378";
const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const muteBtn = document.getElementById("muteBtn");

if (audio){
  if (window.Hls && window.Hls.isSupported()) {
    const hls = new Hls({lowLatencyMode:true});
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
  } else {
    audio.src = STREAM_URL;
  }
  let playing = false;
  if (playBtn){
    playBtn.addEventListener("click", async () => {
      try {
        if (!playing) {
          await audio.play();
          playing = true;
          playBtn.textContent = "⏸ Pause";
        } else {
          audio.pause();
          playing = false;
          playBtn.textContent = "▶ Listen Live";
        }
      } catch (e) { console.log("Playback blocked", e); }
    });
  }
  if (muteBtn){ muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted; muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
    });
  }
}

// Subtle animated background
const canvas = document.getElementById("bgCanvas");
if (canvas){
  const ctx = canvas.getContext("2d");
  function resize(){ canvas.width = window.innerWidth; canvas.height = 240; }
  window.addEventListener("resize", resize); resize();
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<90;i++){
      const y = (i/90)*canvas.height;
      const grd = ctx.createLinearGradient(0,y,canvas.width,y);
      grd.addColorStop(0,"rgba(42,123,255,0)");
      grd.addColorStop(0.5,"rgba(42,123,255,0.15)");
      grd.addColorStop(1,"rgba(255,42,109,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0,y,canvas.width,2);
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// UK-Time Schedule + Live Indicator
const DH = Array.from({ length: 8 }, () => Array(24).fill(""));

// MONDAY
DH[1][12] = "12pm – 2pm<br>James-Wizard Of Rock";
DH[1][14] = "2pm – 4pm<br>BabyJane";
DH[1][15] = "3pm – 5pm<br>James Stephen";
DH[1][17] = "5pm – 7pm<br>Lewis";
DH[1][19] = "7pm – 10pm<br>DJ Dezzy – Mix Set";
DH[1][22] = "10pm – 12am<br>DJ Jayden Mac – Grime";

// TUESDAY
DH[2][1] = "1am – 2am<br>Wizard Of Rock";
DH[2][3] = "3am – 6am<br>Dani - DJ Queen Dani";
DH[2][10] = "10am – 12pm<br>HothotDJ";
DH[2][15] = "3pm – 5pm<br>James Stephen";
DH[2][20] = "8pm – 10pm<br>Dj Lewis";

// WEDNESDAY
DH[3][15] = "3pm – 5pm<br>James Stephen";
DH[3][18] = "6pm – 7pm<br>Auto";
DH[3][20] = "8pm – 10pm<br>Steve DJ Smith";
DH[3][22] = "10pm – 12am<br>Reece";

// THURSDAY
DH[4][0]  = "12am – 4am<br>Auto";
DH[4][8]  = "8am – 10am<br>Coll";
DH[4][10] = "10am – 12pm<br>Gordan";
DH[4][15] = "3pm – 4pm<br>James Stephen";
DH[4][19] = "7pm – 8pm<br>Echofalls (DJ Strawbs)";
DH[4][22] = "10pm – 11pm<br>MottMuzik";

// FRIDAY
DH[5][0]  = "12am – 4am<br>SteveG";
DH[5][10] = "10am – 12pm<br>Vish";
DH[5][15] = "3pm – 5pm<br>James Stephen";
DH[5][16] = "4pm – 8pm<br>StevenD";
DH[5][20] = "8pm – 10pm<br>Wendall";
DH[5][22] = "10pm – 11pm<br>Rebecca - DJ Mix&Match";

// SATURDAY
DH[6][0]  = "12am – 2am<br>Auto";
DH[6][2]  = "2am – 4am<br>DJ AJ";
DH[6][6]  = "6am – 10am<br>Cam";
DH[6][10] = "10am – 12pm<br>DJ Nero";
DH[6][16] = "4pm – 6pm<br>The Byrdman";
DH[6][18] = "6pm – 8pm<br>DJ LiL Devil";
DH[6][19] = "7pm – 8pm<br>Sonic-Recorded";
DH[6][20] = "8pm – 9pm<br>Daniel";
DH[6][22] = "10pm – 12am<br>DJ Nero";

// SUNDAY
DH[7][8]  = "8am – 10am<br>The Byrdman";
DH[7][11] = "11am – 12pm<br>HotShot - 80's 90's";
DH[7][13] = "1pm – 3pm<br>JK";
DH[7][17] = "5pm – 7pm<br>DJ Lewis";
DH[7][19] = "7pm – 8pm<br>DJ Eddie";
DH[7][20] = "8pm – 9pm<br>BIG BOSS DJ Echofalls";
DH[7][21] = "9pm – 12am<br>Popped Radio";

function NowON() {
  const ukNow = new Date(new Date().toLocaleString("en-GB", { timeZone: "Europe/London" }));
  const day = ukNow.getDay() === 0 ? 7 : ukNow.getDay();
  const hour = ukNow.getHours();

  const livePill = document.getElementById("live-pill");
  const npTitle = document.getElementById("np-title");
  const npArtist = document.getElementById("np-artist");
  if (!livePill || !npTitle || !npArtist) return;

  const show = DH[day][hour];

  if (show && show !== "") {
    livePill.textContent = "ON AIR";
    livePill.classList.add("onair");
    npTitle.innerHTML = show.split("<br>")[0];
    npArtist.innerHTML = show.split("<br>")[1];
  } else {
    livePill.textContent = "OFF AIR";
    livePill.classList.remove("onair");
    npTitle.innerHTML = "No current broadcast";
    npArtist.innerHTML = "Schedule resumes soon";
  }
}
NowON();
setInterval(NowON, 60000);

// === Load live listener reviews from Google Sheet via AllOrigins ===
const scriptURL = "https://script.google.com/macros/s/AKfycbwLdcwqzua8j9P1F2eaJg4SVTGSru8kaaeZytXz9CB9_09mpwUX-6iu7cVo5e5UN24/exec"; // your working Apps Script URL

fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(scriptURL))
  .then(res => res.json())
  .then(data => JSON.parse(data.contents))
  .then(reviews => {
    const box = document.querySelector(".review-grid");
    if (!box) return;
    box.innerHTML = "";

    reviews.slice(-3).reverse().forEach(r => {
      const div = document.createElement("div");
      div.className = "review glass";
      div.innerHTML = `${"⭐".repeat(r.stars || 0)}<br>"${r.review}" — ${r.name}`;
      box.appendChild(div);
    });
  }) // 
  .catch(err => console.error("Reviews load error:", err)); 

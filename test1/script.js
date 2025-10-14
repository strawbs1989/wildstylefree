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

// ----------------- UK CLOCK (device-proof) -----------------
function getUKNow() {
  const now = new Date(); // UTC baseline
  const y = now.getUTCFullYear();

  // BST: last Sunday in March -> last Sunday in October (UTC math)
  const bstStart = new Date(Date.UTC(y, 2, 31)); // Mar 31 UTC
  bstStart.setUTCDate(31 - bstStart.getUTCDay()); // last Sunday Mar
  const bstEnd = new Date(Date.UTC(y, 9, 31)); // Oct 31 UTC
  bstEnd.setUTCDate(31 - bstEnd.getUTCDay()); // last Sunday Oct

  const inBST = now >= bstStart && now < bstEnd;
  // UK time = UTC + (BST ? 1h : 0h)
  return new Date(now.getTime() + (inBST ? 1 : 0) * 3600 * 1000);
}

// ----------------- SCHEDULE (DH[1..7][0..23]) -----------------
const DH = Array.from({ length: 8 }, () => Array(24).fill(""));

// MONDAY (1)
DH[1][12] = "12pm – 2pm<br>James-Wizard Of Rock";
DH[1][14] = "2pm – 4pm<br>BabyJane";
DH[1][15] = "3pm – 5pm<br>James Stephen";
DH[1][17] = "5pm – 7pm<br>Lewis";
DH[1][19] = "7pm – 10pm<br>DJ Dezzy – Mix Set";
DH[1][22] = "10pm – 12am<br>DJ Jayden Mac – Grime";

// TUESDAY (2)
DH[2][1]  = "1am – 3am<br>James - Wizard Of Rock";
DH[2][3]  = "3am – 6am<br>Dani - DJ Queen Dani";
DH[2][6]  = "6am – 8am<br>Autodj";
DH[2][10] = "10am – 12pm<br>HothotDJ";
DH[2][15] = "3pm – 5pm<br>James Stephen";
DH[2][20] = "8pm – 10pm<br>DJ Lewis";
DH[2][21] = "9pm – 10pm<br>Auto";
DH[2][22] = "10pm – 12am<br>Autodj";

// WEDNESDAY (3)
DH[3][0]  = "12am – 2am<br>Dani - DJ Queen Dani";
DH[3][15] = "3pm – 5pm<br>DJ Dezza";
DH[3][18] = "6pm – 7pm<br>Auto";
DH[3][19] = "7pm – 8pm<br>Auto";
DH[3][20] = "8pm – 10pm<br>Steve DJ Smith";
DH[3][22] = "10pm – 12am<br>Reece";


// THURSDAY (4)
DH[4][0]  = "12am – 4am<br>Auto";
DH[4][8]  = "8am – 10am<br>Coll";
DH[4][10] = "10am – 12pm<br>Gordan";
DH[4][12]  = "12pm – 3pm<br>Christina";
DH[4][15] = "3pm – 4pm<br>DJ Dezza";
DH[4][19] = "7pm – 8pm<br>Echofalls (DJ Strawbs)";
DH[4][20] = "8pm – 10pm<br>Rebecca - DJ MixnMatch";
DH[4][22] = "10pm – 12am<br>Auto";



// FRIDAY (5)
DH[5][0]  = "12am – 4am<br>Steve G";
DH[5][10] = "10am – 12pm<br>Vish";
DH[5][15] = "3pm – 5pm<br>James Stephen";
DH[5][16] = "4pm – 8pm<br>Steven D";
DH[5][20] = "8pm – 10pm<br>Auto";
DH[5][22] = "10pm – 11pm<br>Rebecca - DJ Mix&Match";


// SATURDAY (6)
DH[6][0]  = "12am – 2am<br>Auto";
DH[6][2]  = "2am – 4am<br>DJ AJ";
DH[6][6]  = "6am – 10am<br>Cam";
DH[6][10] = "10am – 12pm<br>DJ Nero";
DH[6][16] = "4pm – 6pm<br>The Byrdman";
DH[6][18] = "6pm – 8pm<br>DJ LiL Devil";
DH[6][19] = "7pm – 8pm<br>Sonic-Recorded";
DH[6][20] = "8pm – 9pm<br>Daniel";


// SUNDAY (7)
DH[7][8]  = "8am – 10am<br>Auto";
DH[7][11] = "11am – 12pm<br>HotShot - 80's 90's";
DH[7][13] = "1pm – 3pm<br>JK";
DH[7][15] = "3pm – 5pm<br>DJ Fraser";
DH[7][17] = "5pm – 7pm<br>DJ Lewis";
DH[7][19] = "7pm – 8pm<br>DJ Eddie";
DH[7][20] = "8pm – 9pm<br>BIG BOSS DJ Echofalls";
DH[7][21] = "9pm – 12am<br>Popped Radio";


// ----------------- NOW ON -----------------
function NowON() {
  const ukNow = getUKNow();
  const day = ukNow.getUTCDay() === 0 ? 7 : ukNow.getUTCDay(); // 1..7 (Sun=7)
  const hour = ukNow.getUTCHours();

  const pill = document.getElementById("live-pill");
  const t = document.getElementById("np-title");
  const a = document.getElementById("np-artist");
  if (!pill || !t || !a) return;

  const show = DH[day][hour];

  if (show) {
    pill.textContent = "ON AIR";
    pill.classList.add("onair");
    const [slot, dj] = show.split("<br>");
    t.textContent = slot;
    a.textContent = dj;
  } else {
    pill.textContent = "OFF AIR";
    pill.classList.remove("onair");
    t.textContent = "No current broadcast";
    a.textContent = "Schedule resumes soon";
  }

  // Debug line (remove later)
  console.log("UK Day:", day, "UK Hour:", hour, "Show:", show || "(none)");
}

document.addEventListener("DOMContentLoaded", () => {
  NowON();
  setInterval(NowON, 60_000);
});



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

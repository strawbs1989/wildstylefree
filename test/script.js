/* -----------------------
   Play / Pause main play button
   ----------------------- */
function togglePlayer(){
  const player = document.getElementById('livePlayer');
  const btn = document.getElementById('playBtn');
  if(player.paused){
    player.play().catch(()=>{}); // autoplay block may apply
    btn.textContent = '⏸ Pause Player';
  } else {
    player.pause();
    btn.textContent = '▶ Live Player';
  }
}

/* -----------------------
   Now Playing schedule logic
   - A robust mapping: scheduleMap keyed by weekday names
   - Will show a sensible "Now On" string
   ----------------------- */
const scheduleMap = {
  Monday: {
    0: "", 1: "12am – 2am: DJ Riddler - Riddlers Killer Rockshow",
    12: "12pm – 2pm: James - Wizard Of Rock",
    14: "2pm – 4pm: BabyJane",
    15: "3pm – 5pm: James Stephen",
    17: "5pm – 7pm: Lewis - Mix",
    19: "7pm – 10pm: DJ Dezzy Mac - Mixture",
    22: "10pm – 12am: DJ Jaydon Mac - Grime"
  },
  Tuesday: {
    1: "1am – 2am: Wizard Of Rock",
    3: "3am – 6am: Dani - DJ Queen Dani",
    6: "6am – 8am: Dj Dave – 60's - 70's",
    15: "3pm – 5pm: James Stephen",
    20: "8pm – 10pm: Dj Lewis",
    10: "10am – 12pm: HothotDJ"
  },
  Wednesday: {
    15: "3pm – 5pm: James Stephen",
    18: "6pm – 7pm: DJ European BOB",
    20: "8pm – 10pm: Steve DJ Smith",
    22: "10pm – 12pm: Reece"
  },
  Thursday: {
    4: "4am – 6am: Dani - DJ Queen Dani",
    8: "8am – 10am: Coll",
    0: "12am – 4am: Steve Gunn",
    10: "10am – 12pm: Gordan",
    15: "3pm – 4pm: James Stephen",
    17: "5pm – 7pm: DJ Flash",
    19: "7pm – 8pm: Echofalls (DJ Strawbs)",
    20: "8pm – 10pm: Moofie",
    22: "10pm – 11pm: MottMuzik"
  },
  Friday: {
    4: "4am – 6am: Dani - DJ Queen Dani",
    0: "12am – 4am: SteveG",
    10: "10am – 12pm: Vish",
    15: "3pm – 5pm: James Stephen",
    16: "4pm – 8pm: StevenD",
    20: "8pm – 10pm: Wendall",
    22: "10pm – 11pm: Rebecca - DJ Mix&Match"
  },
  Saturday: {
    0: "12am – 2am: Trevor Nannab",
    2: "2am – 4am: DJ AJ",
    6: "6am – 10am: Cam",
    10: "10am – 12am: Kevin Lee",
    16: "4pm – 6pm: The Byrdman",
    20: "8pm – 9pm: Daniel"
  },
  Sunday: {
    8: "8am – 10am: The Byrdman",
    10: "10am – 12pm: HotShot - 80's 90's",
    11: "11am – 1pm: JimmyD",
    13: "1pm – 3pm: JK",
    17: "5pm – 7pm: DJ Lewis",
    19: "7pm – 8pm: DJ European Bob",
    20: "8pm – 9pm: BIG BOSS Dj Echofalls",
    21: "9pm – 12am: Popped Radio"
  }
};

function getNowShow(){
  const now = new Date();
  // map JS weekday (0 Sun..6 Sat) to name
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = dayNames[now.getDay()];
  const hour = now.getHours();
  const daySchedule = scheduleMap[dayName] || {};
  // find exact hour match, or find the latest entry before current hour
  if(daySchedule[hour]) return `${dayName} ${formatHour(hour)} — ${daySchedule[hour]}`;
  // search backwards to find most recent scheduled time <= hour
  const keys = Object.keys(daySchedule).map(k=>parseInt(k)).sort((a,b)=>a-b);
  for(let i = keys.length-1; i>=0; i--){
    if(keys[i] <= hour && keys[i] !== 0){ // honor entry
      return `${dayName} ${formatHour(keys[i])} — ${daySchedule[keys[i]]}`;
    }
    if(keys[i] === 0 && hour < 6){ // midnight-early morning slot
      return `${dayName} 00:00 — ${daySchedule[0]}`;
    }
  }
  return `No Show Scheduled — check the schedule`;
}
function formatHour(h){
  // simple label for display: return e.g. 22:00 or 00:00
  return (h<10?'0'+h:h)+':00';
}
function refreshNowOn(){
  const nowText = getNowShow();
  document.getElementById('NowOn').textContent = nowText;
  document.getElementById('nowMeta').innerHTML = nowText;
}
refreshNowOn();
setInterval(refreshNowOn, 60_000); // update every minute

/* -----------------------
   Live listeners from realtime.csv
   - expects realtime.csv in same folder
   - shows active_session_count > 0
   - pulses counter when new listeners join
   ----------------------- */
let lastCount = 0;
async function updateListeners(){
  try{
    const res = await fetch('realtime.csv?_=' + Date.now()); // cache buster
    const text = await res.text();
    // parse csv robustly enough for simple format (no embedded commas)
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length < 2){
      document.getElementById('listenerList').innerHTML = '<p style="color:var(--muted)">No data</p>';
      document.getElementById('listenerCount').textContent = '🎧 0';
      return;
    }
    // headers
    const headers = lines[0].split(',').map(h=>h.trim());
    const rows = lines.slice(1).map(line=>{
      // naive split: good for your CSV structure
      const cells = line.split(',').map(c=>c.trim());
      const obj = {};
      headers.forEach((h,i)=>obj[h]=cells[i]||'');
      return obj;
    });

    const active = rows.filter(r => parseInt(r.active_session_count||0) > 0);
    const count = active.length;
    // set badge
    const badge = document.getElementById('listenerCount');
    badge.textContent = `🎧 ${count}`;
    // pulse if count increased
    if(count > lastCount){
      badge.classList.add('pulse');
      setTimeout(()=>badge.classList.remove('pulse'), 1200);
    }
    lastCount = count;
    // also update small text in sidebar
    document.getElementById('liveListenersBadge').textContent = `${count} live`;

    if(count === 0){
      document.getElementById('listenerList').innerHTML = '<p style="color:var(--muted)">No active listeners right now 🔇</p>';
      return;
    }

    // build items
    const items = active.map(r=>{
      const country = r.country || 'Unknown';
      const region = r.region || '';
      const city = r.city || '';
      const platform = r.platform || 'Unknown';
      const durationSec = parseInt(r.duration||0);
      const durationMin = Math.max(1, Math.round(durationSec/60));
      return {country,region,city,platform,durationMin};
    });

    // make HTML
    const html = items.map(it=>`
      <div class="listener-item">
        <div class="listener-info">🌍 <strong>${it.country}</strong> — ${it.region}${it.city?(', ' + it.city):''}</div>
        <div style="text-align:right">
          <div class="listener-meta">💻 ${it.platform}</div>
          <div class="listener-meta">⏱ ${it.durationMin} min</div>
        </div>
      </div>
    `).join('');
    document.getElementById('listenerList').innerHTML = html;

  }catch(err){
    console.error('listeners error', err);
    document.getElementById('listenerList').innerHTML = '<p style="color:var(--muted)">Error loading listeners</p>';
  }
}

// start updates every 20s
updateListeners();
setInterval(updateListeners, 20_000);
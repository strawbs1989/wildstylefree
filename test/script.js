
function initPage(){
  refreshNowOn();
  updateListeners();
  setInterval(refreshNowOn, 60_000);
  setInterval(updateListeners, 20_000);
  setInterval(extractAndDisplayInfo, 30_000);
}

function togglePlayer(e){
  const player = document.getElementById('livePlayer');
  const btn = document.getElementById('playBtn');
  if(player.paused){ player.play().catch(()=>{}); btn.textContent='⏸ Pause Player'; }
  else { player.pause(); btn.textContent='▶ Live Player'; }
}

/* Schedule mapping */
const scheduleMap = {
  Monday: {12:'12pm – 2pm: James - Wizard Of Rock',14:'2pm – 4pm: BabyJane',15:'3pm – 5pm: James Stephen',17:'5pm – 7pm: Lewis',19:'7pm – 10pm: DJ Dezzy',22:'10pm – 12am: DJ Jayden Mac'},
  Tuesday:{1:'1am – 2am: Wizard Of Rock',3:'3am – 6am: Dani - DJ Queen Dani',6:'6am – 8am: Dj Dave',15:'3pm – 5pm: James Stephen',20:'8pm – 10pm: Dj Lewis'},
  Wednesday:{15:'3pm – 5pm: James Stephen',18:'6pm – 7pm: DJ European BOB',20:'8pm – 10pm: Steve DJ Smith',22:'10pm – 12pm: Reece'},
  Thursday:{4:'4am – 6am: Dani',8:'8am – 10am: Coll',0:'12am – 4am: Steve Gunn',10:'10am – 12pm: Gordan',15:'3pm – 4pm: James Stephen',17:'5pm – 7pm: DJ Flash',19:'7pm – 8pm: Echofalls',20:'8pm – 10pm: Moofie',22:'10pm – 11pm: MottMuzik'},
  Friday:{4:'4am – 6am: Dani',0:'12am – 4am: SteveG',10:'10am – 12pm: Vish',15:'3pm – 5pm: James Stephen',16:'4pm – 8pm: StevenD',20:'8pm – 10pm: Wendall',22:'10pm – 11pm: Rebecca'},
  Saturday:{0:'12am – 2am: Trevor Nannab',2:'2am – 4am: DJ AJ',6:'6am – 10am: Cam',10:'10am – 12am: Kevin Lee',16:'4pm – 6pm: The Byrdman',20:'8pm – 9pm: Daniel'},
  Sunday:{8:'8am – 10am: The Byrdman',10:'10am – 12pm: HotShot',11:'11am – 1pm: JimmyD',13:'1pm – 3pm: JK',17:'5pm – 7pm: DJ Lewis',19:'7pm – 8pm: DJ European Bob',20:'8pm – 9pm: BIG BOSS',21:'9pm – 12am: Popped Radio'}
};

function getNowShow(){
  const now = new Date();
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = dayNames[now.getDay()];
  const hour = now.getHours();
  const daySchedule = scheduleMap[dayName] || {};
  if(daySchedule[hour]) return `${dayName} ${formatHour(hour)} — ${daySchedule[hour]}`;
  const keys = Object.keys(daySchedule).map(k=>parseInt(k)).sort((a,b)=>a-b);
  for(let i = keys.length-1; i>=0; i--){
    if(keys[i] <= hour && keys[i] !== 0) return `${dayName} ${formatHour(keys[i])} — ${daySchedule[keys[i]]}`;
    if(keys[i] === 0 && hour < 6) return `${dayName} 00:00 — ${daySchedule[0]}`;
  }
  return 'No Show Scheduled';
}
function formatHour(h){ return (h<10?'0'+h:h)+':00'; }
function refreshNowOn(){ const nowText = getNowShow(); const el = document.getElementById('NowOn'); if(el) el.textContent = nowText; }

/* listeners from realtime.csv */
let lastCount=0;
async function updateListeners(){
  try{
    const res = await fetch('realtime.csv?_=' + Date.now());
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length<2){ document.getElementById('listenerList').innerHTML='<p style="color:#999">No data</p>'; document.getElementById('listenerCount').textContent='🎧 0'; return; }
    const headers = lines[0].split(',').map(h=>h.trim());
    const rows = lines.slice(1).map(l=>{ const cells=l.split(',').map(c=>c.trim()); const o={}; headers.forEach((h,i)=>o[h]=cells[i]||''); return o; });
    const active = rows.filter(r=>parseInt(r.active_session_count||0)>0);
    const count = active.length;
    const badge = document.getElementById('listenerCount'); if(badge) badge.textContent=`🎧 ${count}`;
    if(count>lastCount){ badge?.classList.add('pulse'); setTimeout(()=>badge?.classList.remove('pulse'),1200); }
    lastCount=count;
    if(count===0){ document.getElementById('listenerList').innerHTML='<p style="color:#999">No active listeners right now</p>'; return; }
    const items = active.map(r=>{ const durationSec=parseInt(r.duration||0); return {country:r.country||'Unknown',region:r.region||'',city:r.city||'',platform:r.platform||'Unknown',durationMin:Math.max(1,Math.round(durationSec/60))}; });
    const html = items.map(it=>`<div class="listener-item"><div class="listener-info">🌍 <strong>${it.country}</strong> — ${it.region}${it.city?(', '+it.city):''}</div><div style="text-align:right"><div class="listener-meta">💻 ${it.platform}</div><div class="listener-meta">⏱ ${it.durationMin} min</div></div></div>`).join('');
    document.getElementById('listenerList').innerHTML=html;
  }catch(e){ console.error(e); document.getElementById('listenerList').innerHTML='<p style="color:#999">Error loading listeners</p>'; }
}

/* XR Info extractor placeholder */
function extractAndDisplayInfo(){
  const loadDiv = document.querySelector('#load_xrinfo');
  if(!loadDiv){ document.getElementById('infoCard').innerHTML='<p>No XR data available</p>'; return; }
  const links = loadDiv.querySelectorAll('a');
  const listenerLocation = links[1]?.textContent.trim()||'N/A';
  document.getElementById('infoCard').innerHTML=`<p><strong>Listener Location:</strong> ${listenerLocation}</p><p><strong>Recent Question:</strong> N/A</p><p><strong>Number of Likes:</strong> N/A</p>`;
}

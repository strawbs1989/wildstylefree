// Play / Pause behaviour
function togglePlayer(){
  const player = document.getElementById('livePlayer');
  const btn = document.getElementById('playBtn');
  try {
    if (player.paused) {
      player.play().catch(()=>{}); // may be blocked by browsers if not user-initiated
      btn.textContent = '⏸ Pause';
    } else {
      player.pause();
      btn.textContent = '▶ Live Player';
    }
  } catch(e){ console.warn('Player error', e); }
}

// Schedule fallback map
const scheduleMap = {
  Monday: {12:'12pm – 2pm: James - Wizard Of Rock',14:'2pm – 4pm: BabyJane',15:'3pm – 5pm: James Stephen',17:'5pm – 7pm: Lewis',19:'7pm – 10pm: DJ Dezzy',22:'10pm – 12am: DJ Jayden Mac'},
  Tuesday: {1:'1am – 2am: Wizard Of Rock',3:'3am – 6am: Dani - DJ Queen Dani',6:"6am – 8am: Dj Dave – 60's - 70's",15:'3pm – 5pm: James Stephen',20:'8pm – 10pm: Dj Lewis'},
  Wednesday: {15:'3pm – 5pm: James Stephen',18:'6pm – 7pm: DJ European BOB',20:'8pm – 10pm: Steve DJ Smith',22:'10pm – 12pm: Reece'},
  Thursday: {4:'4am – 6am: Dani - DJ Queen Dani',8:'8am – 10am: Coll',0:'12am – 4am: Steve Gunn',10:'10am – 12pm: Gordan',15:'3pm – 4pm: James Stephen',17:'5pm – 7pm: DJ Flash',19:'7pm – 8pm: Echofalls (DJ Strawbs)',20:'8pm – 10pm: Moofie',22:'10pm – 11pm: MottMuzik'},
  Friday: {4:'4am – 6am: Dani - DJ Queen Dani',0:'12am – 4am: SteveG',10:'10am – 12pm: Vish',15:'3pm – 5pm: James Stephen',16:'4pm – 8pm: StevenD',20:'8pm – 10pm: Wendall',22:'10pm – 11pm: Rebecca - DJ Mix&Match'},
  Saturday: {0:'12am – 2am: Trevor Nannab',2:'2am – 4am: DJ AJ',6:'6am – 10am: Cam',10:'10am – 12am: Kevin Lee',16:'4pm – 6pm: The Byrdman',20:'8pm – 9pm: Daniel'},
  Sunday: {8:'8am – 10am: The Byrdman',10:'10am – 12pm: HotShot - 80's 90's',11:'11am – 1pm: JimmyD',13:'1pm – 3pm: JK',17:'5pm – 7pm: DJ Lewis',19:'7pm – 8pm: DJ European Bob',20:'8pm – 9pm: BIG BOSS Dj Echofalls',21:'9pm – 12am: Popped Radio'}
};

// Refresh Now On using schedule fallback
function refreshNowOn(){
  const now = new Date();
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const day = dayNames[now.getDay()];
  const hour = now.getHours();
  const daySch = scheduleMap[day] || {};
  const show = daySch[hour] || 'No Show Scheduled';
  document.getElementById('NowOn').textContent = show;
  const nm = document.getElementById('nowMeta');
  if(nm) nm.textContent = show;
}

// Fetch Now Playing from proxy /nowplaying (optional). Falls back to schedule.
async function fetchNowPlaying(){
  try {
    const res = await fetch('/nowplaying?_=' + Date.now());
    const j = await res.json();
    if(j && (j.title || j.fallback)){
      const text = j.title ? ((j.artist ? (j.artist + ' — ') : '') + j.title) : j.fallback;
      document.getElementById('NowOn').textContent = text;
      const nm = document.getElementById('nowMeta');
      if(nm) nm.textContent = text;
      return;
    }
  } catch(e) {
    // ignore and fallback
  }
  refreshNowOn();
}

// Parse realtime.csv to show listeners (expects file in same folder)
async function updateListeners(){
  try {
    const res = await fetch('realtime.csv?_=' + Date.now());
    if(!res.ok){ document.getElementById('listenerList').textContent = 'No listener data'; return; }
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length < 2){ document.getElementById('listenerList').textContent = 'No listener data'; return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(l => {
      const parts = l.split(',').map(p => p.trim());
      const o = {};
      headers.forEach((h,i) => o[h] = parts[i] || '');
      return o;
    });
    const active = rows.filter(r => parseInt(r.active_session_count || 0) > 0);
    document.getElementById('listenerCount').textContent = '🎧 ' + active.length;
    if(active.length === 0){ document.getElementById('listenerList').textContent = 'No active listeners'; return; }
    const html = active.map(a => {
      const city = a.city ? (' — ' + a.city) : '';
      const country = a.country ? a.country : 'Unknown';
      const mins = Math.max(1, Math.round((parseInt(a.duration || 0) || 0) / 60));
      return `<div class="listener-item">🌍 <strong>${country}</strong>${city} <div class="meta-muted small">${mins} min</div></div>`;
    }).join('');
    document.getElementById('listenerList').innerHTML = html;
  } catch(err){
    document.getElementById('listenerList').textContent = 'Error loading listeners';
    console.warn(err);
  }
}

// Birthdays: store in localStorage, update XR info and open mailto to notify station
function loadBirthdays(){
  const list = JSON.parse(localStorage.getItem('ws_birthdays') || '[]');
  renderBirthdays(list);
  if(list.length) document.getElementById('infoCard').innerHTML = `<p><strong>Latest Shoutout:</strong> ${list[list.length-1].name}</p>`;
}

function renderBirthdays(list){
  const el = document.getElementById('birthdayList');
  if(!el) return;
  if(list.length === 0){ el.innerHTML = '<div class="meta-muted">No birthdays yet.</div>'; return; }
  el.innerHTML = list.map(it => `<div class="py-1"><strong>${it.name}</strong> — ${it.req || ''}</div>`).join('');
}

document.addEventListener('DOMContentLoaded', ()=> {
  // initial loads
  fetchNowPlaying();
  updateListeners();
  loadBirthdays();

  // intervals
  setInterval(fetchNowPlaying, 15000);
  setInterval(updateListeners, 20000);

  // birthday form handling
  const form = document.getElementById('birthdayForm');
  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('b-name').value.trim();
      const req = document.getElementById('b-req').value.trim();
      const mail = document.getElementById('b-mail').value.trim();
      if(!name || !mail) return alert('Please provide name and email');
      const list = JSON.parse(localStorage.getItem('ws_birthdays') || '[]');
      list.push({name, req, mail, ts: Date.now()});
      localStorage.setItem('ws_birthdays', JSON.stringify(list));
      renderBirthdays(list);
      // update XR info
      document.getElementById('infoCard').innerHTML = `<p><strong>Latest Shoutout:</strong> ${name}</p>`;
      // open mail client to send to station inbox
      const mailto = `mailto:wildstyleradio1@gmail.com?subject=${encodeURIComponent('Birthday shoutout for ' + name)}&body=${encodeURIComponent('Name: ' + name + '\\nRequest: ' + req + '\\nEmail: ' + mail)}`;
      window.open(mailto);
      form.reset();
    });
  }
});

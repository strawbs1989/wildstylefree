
/* script.js
 - togglePlayer: play/pause main stream
 - fetchNowPlaying: tries proxy at /nowplaying, falls back to schedule-based NowOn
 - updateListeners: reads realtime.csv and shows active listeners
 - birthday form: stores submissions in localStorage, updates XR info panel
*/

function togglePlayer(){
  const player = document.getElementById('livePlayer');
  const btn = document.getElementById('playBtn');
  if(player.paused){
    player.play().catch(()=>{});
    btn.textContent = '⏸ Pause Player';
  } else {
    player.pause();
    btn.textContent = '▶ Live Player';
  }
}

async function fetchNowPlaying(){
  try{
    const res = await fetch('/nowplaying?_=' + Date.now());
    const j = await res.json();
    if(j && (j.title || j.fallback)){
      const text = j.title ? ((j.artist? (j.artist + ' — ') : '') + j.title) : j.fallback;
      document.getElementById('NowOn').textContent = text;
      document.getElementById('nowMeta').textContent = text;
      return;
    }
  }catch(e){
    // ignore, fallback to schedule
  }
  refreshNowOn();
}

const scheduleMap = {
  Monday: {12:'12pm – 2pm: James - Wizard Of Rock',14:'2pm – 4pm: BabyJane',15:'3pm – 5pm: James Stephen',17:'5pm – 7pm: Lewis',19:'7pm – 10pm: DJ Dezzy',22:'10pm – 12am: DJ Jayden Mac'}
};

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

async function updateListeners(){
  try{
    const res = await fetch('realtime.csv?_=' + Date.now());
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length < 2){ document.getElementById('listenerList').innerHTML = '<div class="muted">No data</div>'; document.getElementById('listenerCount').textContent='🎧 0'; return; }
    const headers = lines[0].split(',').map(h=>h.trim());
    const rows = lines.slice(1).map(l=>{ const cells=l.split(',').map(c=>c.trim()); const o={}; headers.forEach((h,i)=>o[h]=cells[i]||''); return o; });
    const active = rows.filter(r => parseInt(r.active_session_count||0) > 0);
    document.getElementById('listenerCount').textContent = '🎧 ' + active.length;
    if(active.length === 0){ document.getElementById('listenerList').innerHTML = '<div class="muted">No active listeners</div>'; return; }
    const html = active.map(a=>'<div class="listener-item">🌍 <strong>' + (a.country||'Unknown') + '</strong>' + (a.city?(' — '+a.city):'') + '<div class="muted small">' + (Math.max(1,Math.round((parseInt(a.duration)||0)/60)) + ' min') + '</div></div>').join('');
    document.getElementById('listenerList').innerHTML = html;
  }catch(e){ document.getElementById('listenerList').innerHTML = '<div class="muted">Error loading</div>'; }
}

function loadBirthdays(){
  const list = JSON.parse(localStorage.getItem('ws_birthdays') || '[]');
  renderBirthdays(list);
  if(list.length) document.getElementById('infoCard').innerHTML = '<p><strong>Latest Shoutout:</strong> ' + list[list.length-1].name + '</p>';
}

function renderBirthdays(list){
  const el = document.getElementById('birthdayList');
  if(!el) return;
  if(!list.length){ el.innerHTML = '<div class="muted">No birthdays yet.</div>'; return; }
  el.innerHTML = list.map(it=>'<div class="py-1"><strong>'+it.name+'</strong> — '+(it.req||'')+'</div>').join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  fetchNowPlaying();
  updateListeners();
  loadBirthdays();
  setInterval(fetchNowPlaying, 15000);
  setInterval(updateListeners, 20000);

  const form = document.getElementById('birthdayForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('b-name').value.trim();
      const req = document.getElementById('b-req').value.trim();
      const mail = document.getElementById('b-mail').value.trim();
      if(!name || !mail) return alert('Please provide name and email');
      const list = JSON.parse(localStorage.getItem('ws_birthdays')||'[]');
      list.push({name,req,mail,ts:Date.now()});
      localStorage.setItem('ws_birthdays', JSON.stringify(list));
      renderBirthdays(list);
      document.getElementById('infoCard').innerHTML = '<p><strong>Latest Shoutout:</strong> ' + name + '</p>';
      const mailto = 'mailto:wildstyleradio1@gmail.com?subject=' + encodeURIComponent('Birthday shoutout for ' + name) + '&body=' + encodeURIComponent('Name: ' + name + '\nRequest: ' + req + '\nEmail: ' + mail);
      window.open(mailto);
      form.reset();
    });
  }
});

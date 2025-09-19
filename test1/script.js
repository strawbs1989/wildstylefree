// Basic player logic
const streamUrl = 'https://streaming.live365.com/a50378';
const audio = document.getElementById('player');
audio.src = streamUrl;
audio.crossOrigin = 'anonymous';

const playBtn = document.getElementById('playPause');
playBtn.addEventListener('click', ()=>{
  if(audio.paused){
    audio.play().catch(e=>console.warn('play failed',e));
    playBtn.textContent='Pause';
  } else { audio.pause(); playBtn.textContent='Play'; }
});

document.getElementById('openPlayer').addEventListener('click', ()=>{ 
  audio.paused?audio.play():audio.pause(); 
  playBtn.textContent = audio.paused? 'Play':'Pause' 
});

// Nav links smooth scroll + active state
document.querySelectorAll('.navlink').forEach(a=>{
  a.addEventListener('click', ()=>{
    document.querySelectorAll('.navlink').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
  });
});

// Fetch XR info (static placeholders)
const xrTopEl = document.getElementById('xrTop');
const xrStatsEl = document.getElementById('xrStats');
xrTopEl.innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';

// Now Playing + Last Played fetch from Live365
const nowMeta = document.getElementById('nowMeta');
async function fetchNowPlaying() {
  try {
    const res = await fetch('https://live365.com/embeds/v1/played/a50378?s');
    const data = await res.json();
    if (data && data.length > 0) {
      nowMeta.innerHTML = '';

      // Now Playing track
      const current = data[0];
      const nowDiv = document.createElement('div');
      nowDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <img src="${current.art || 'placeholder.png'}" 
               alt="art" style="width:48px;height:48px;object-fit:cover;border-radius:4px;">
          <div>
            <div style="font-weight:600;">${current.title || 'Unknown Title'}</div>
            <div style="color:var(--muted);font-size:13px;">${current.artist || 'Unknown Artist'}</div>
          </div>
        </div>`;
      nowMeta.appendChild(nowDiv);

      // Divider
      const divider = document.createElement('hr');
      divider.style.border = '0';
      divider.style.borderTop = '1px solid var(--border)';
      divider.style.margin = '8px 0';
      nowMeta.appendChild(divider);

      // Last Played tracks (4)
      data.slice(1,5).forEach(track => {
        const li = document.createElement('div');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '8px';
        li.style.marginBottom = '6px';
        li.innerHTML = `
          <img src="${track.art || 'placeholder.png'}" 
               alt="art" style="width:36px;height:36px;object-fit:cover;border-radius:4px;">
          <div>
            <div style="font-size:14px;">${track.title || 'Unknown Title'}</div>
            <div style="color:var(--muted);font-size:12px;">${track.artist || 'Unknown Artist'}</div>
          </div>`;
        nowMeta.appendChild(li);
      });
    } else {
      nowMeta.textContent = 'Track info unavailable';
    }
  } catch (e) {
    nowMeta.textContent = 'Track info unavailable';
  }
}
fetchNowPlaying();
setInterval(fetchNowPlaying, 30000);

// Populate DJ page roster (copied)
const djSection = document.getElementById('djs');
const djList = [
  'HotShot DJ','EchoFalls','Ben','Wizard','Lewis','JK','Nkabie','DJ Dezzy','King Kenny','Rob','DJBlackNight','Moofie','Trebor Nannab','Steve','DJ Blade Sparx','Steve G','DJ Nocturnlx','JD','Kevin','Mark','Dawn','Laura','BabyJayne','Mary'
];
const ul = document.createElement('ul');
djList.forEach(name=>{const li=document.createElement('li');li.textContent=name;ul.appendChild(li)});
djSection.appendChild(ul);

// Who's listening & shoutouts placeholders
document.getElementById('location').textContent = 'United Kingdom (estimated)';
const shoutouts = document.getElementById('shoutouts'); shoutouts.innerHTML='';
['Jay from Cornwall','Laura in Plymouth','Hannah - sending love'].forEach(s=>{
  const li=document.createElement('li');li.textContent=s;shoutouts.appendChild(li)
});

// Accessibility: stop audio when user navigates away
window.addEventListener('pagehide', ()=>{ audio.pause(); playBtn.textContent='Play' });
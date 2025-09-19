// Wildstyle Radio - script.js with HLS.js integration and styled tracks
const audio = document.getElementById('player');

function initPlayer() {
  const streamUrl = 'https://streaming.live365.com/a50378/playlist.m3u8';
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(audio);
  } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
    audio.src = streamUrl;
  } else {
    audio.src = 'https://streaming.live365.com/a50378';
  }
}
initPlayer();

const playBtn = document.getElementById('playPause');
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(e => console.warn('play failed', e));
    playBtn.textContent = 'Pause';
  } else {
    audio.pause();
    playBtn.textContent = 'Play';
  }
});

document.getElementById('openPlayer').addEventListener('click', () => {
  audio.paused ? audio.play() : audio.pause();
  playBtn.textContent = audio.paused ? 'Play' : 'Pause';
});

// Nav link active state
document.querySelectorAll('.navlink').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelectorAll('.navlink').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});

// WSR Info placeholders
document.getElementById('xrTop').innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
document.getElementById('xrStats').innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';

// Now Playing + Last Played
const nowMeta = document.getElementById('nowMeta');
async function fetchNowPlaying() {
  try {
    const res = await fetch('https://live365.com/embeds/v1/played/a50378?s');
    const data = await res.json();
    if (data && data.length > 0) {
      nowMeta.innerHTML = '';

      // Now Playing
      const current = data[0];
      const nowDiv = document.createElement('div');
      nowDiv.classList.add('track');
      nowDiv.innerHTML = `
        <img src="${current.art || 'placeholder.png'}" alt="art">
        <div class="info">
          <div class="title">${current.title || 'Unknown Title'}</div>
          <div class="artist">${current.artist || 'Unknown Artist'}</div>
        </div>`;
      nowMeta.appendChild(nowDiv);

      // Divider
      const divider = document.createElement('hr');
      divider.style.border = '0';
      divider.style.borderTop = '1px solid var(--border)';
      divider.style.margin = '8px 0';
      nowMeta.appendChild(divider);

      // Last Played (4 tracks)
      data.slice(1,5).forEach(track => {
        const li = document.createElement('div');
        li.classList.add('track','small');
        li.innerHTML = `
          <img src="${track.art || 'placeholder.png'}" alt="art">
          <div class="info">
            <div class="title">${track.title || 'Unknown Title'}</div>
            <div class="artist">${track.artist || 'Unknown Artist'}</div>
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
setInterval(fetchNowPlaying,30000);

// DJ Roster
const djSection = document.getElementById('djs');
const djList = ['HotShot DJ','EchoFalls','Ben','Wizard','Lewis','JK','Nkabie','DJ Dezzy','King Kenny','Rob','DJBlackNight','Moofie','Trebor Nannab','Steve','DJ Blade Sparx','Steve G','DJ Nocturnlx','JD','Kevin','Mark','Dawn','Laura','BabyJayne','Mary'];
const ul = document.createElement('ul');
djList.forEach(name=>{const li=document.createElement('li');li.textContent=name;ul.appendChild(li)});
djSection.appendChild(ul);

// Who's Listening placeholders
document.getElementById('location').textContent = 'United Kingdom (estimated)';
const shoutouts = document.getElementById('shoutouts'); shoutouts.innerHTML='';
['Jay from Cornwall','Laura in Plymouth','Hannah - sending love'].forEach(s=>{const li=document.createElement('li');li.textContent=s;shoutouts.appendChild(li)});

// Stop audio when leaving
window.addEventListener('pagehide', ()=>{ audio.pause(); playBtn.textContent='Play' });
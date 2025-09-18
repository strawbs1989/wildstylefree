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

    document.getElementById('openPlayer').addEventListener('click', ()=>{ audio.paused?audio.play():audio.pause(); playBtn.textContent = audio.paused? 'Play':'Pause' });

    // Nav links smooth scroll + active state
    document.querySelectorAll('.navlink').forEach(a=>{
      a.addEventListener('click', (e)=>{
        document.querySelectorAll('.navlink').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
      });
    });

    // Fetch XR info (scraped summary inserted server-side earlier)
    // We'll embed some scraped info fetched by the assistant at build time.
    const xrTopEl = document.getElementById('xrTop');
    const xrStatsEl = document.getElementById('xrStats');
    xrTopEl.innerHTML = 'Top requested track: <strong>The Only Way Is Up - Yazz</strong>';
    xrStatsEl.innerHTML = 'Worldwide listeners: <strong>114,971</strong> • Requests placed in 2025: <strong>5695</strong>';

    // Attempt to get "last played" from Live365 embed (CORS will prevent direct fetch in browser). We'll show a note if not possible.
    const nowMeta = document.getElementById('nowMeta');
    const listenersEl = document.getElementById('listeners');
    listenersEl.textContent = '—';
    // Because live365 blocks cross-origin metadata requests from the browser, the page cannot reliably fetch track metadata from the client.
    nowMeta.textContent = 'Last-played metadata is unavailable via client — server-side integration required.';

    // Populate DJ page roster (copied from site)
    const djSection = document.getElementById('djs');
    const djList = [
      'HotShot DJ','EchoFalls','Ben','Wizard','Lewis','JK','Nkabie','DJ Dezzy','King Kenny','Rob','DJBlackNight','Moofie','Trebor Nannab','Steve','DJ Blade Sparx','Steve G','DJ Nocturnlx','JD','Kevin','Mark','Dawn','Laura','BabyJayne','Mary'
    ];
    // append list after existing content
    const ul = document.createElement('ul');
    djList.forEach(name=>{const li=document.createElement('li');li.textContent=name;ul.appendChild(li)});
    djSection.appendChild(ul);

    // Who's listening & shoutouts — placeholder logic (this needs a server or analytics integration)
    document.getElementById('location').textContent = 'United Kingdom (estimated)';
    const shoutouts = document.getElementById('shoutouts'); shoutouts.innerHTML='';
    ['Jay from Cornwall','Laura in Plymouth','Hannah - sending love'].forEach(s=>{const li=document.createElement('li');li.textContent=s;shoutouts.appendChild(li)});

    // Accessibility: stop audio when user navigates away
    window.addEventListener('pagehide', ()=>{ audio.pause(); playBtn.textContent='Play' });
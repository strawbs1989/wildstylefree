(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const SKEY = 'rjp_config_v1';

  const defaultConfig = {
    brandName: 'Radio DJ Panel',
    logo: '🎧',
    streamUrl: '',
    timezone: 'Europe/London',
    nowPlayingUrl: '',
    requestWebhook: '',
    adminUser: 'admin',
    adminPassHash: '',
    djs: [ { name: 'DJ EchoFalls' }, { name: 'DJ Lewis' } ],
    schedule: {
      Mon: [{ start:'19:00', end:'20:00', show:'Frequency Shift', dj:'DJ EchoFalls' }],
      Thu: [{ start:'19:00', end:'20:00', show:'Frequency Shift', dj:'DJ EchoFalls' }],
      Sun: [{ start:'20:00', end:'21:00', show:'Frequency Shift', dj:'DJ EchoFalls' }]
    }
  };

  function getConfig(){
    const raw = localStorage.getItem(SKEY);
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  }
  function setConfig(cfg){ localStorage.setItem(SKEY, JSON.stringify(cfg)); }
  async function hash(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function fmtTime(d){ return d.toTimeString().slice(0,5) }
  function tzDate(tz){ return new Date(new Date().toLocaleString('en-US', { timeZone: tz })) }

  function fillPublic(){
    const cfg = getConfig(); if(!cfg) return;
    $('#brandName')?.append(document.createTextNode(' • ' + cfg.brandName));
    if(cfg.logo){ $('#brandLogo').textContent = cfg.logo; }
    $('#player')?.setAttribute('src', cfg.streamUrl || '');
    $('#tzHint')?.append(document.createTextNode(`Timezone: ${cfg.timezone}`));

    // DJs
    const djUl = $('#djList'); if(djUl){
      djUl.innerHTML = '';
      (cfg.djs||[]).forEach(d => {
        const li = document.createElement('li');
        li.textContent = d.name; djUl.appendChild(li);
      });
    }

    // Today schedule
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = days[ tzDate(cfg.timezone).getDay() ];
    const list = (cfg.schedule?.[today]||[]);
    const ul = $('#todaySchedule');
    if(ul){
      ul.innerHTML = list.map(it => `<li><strong>${it.start}–${it.end}</strong> · ${it.show} <span class="muted">— ${it.dj}</span></li>`).join('') || '<li>No shows today.</li>';
    }

    // Now Playing
    if(cfg.nowPlayingUrl){
      const pull = async () => {
        try{
          const r = await fetch(cfg.nowPlayingUrl, { cache:'no-store' });
          const j = await r.json();
          $('#np-title').textContent = j.title || '—';
          $('#np-artist').textContent = j.artist || '—';
          $('#np-art').style.backgroundImage = j.art ? `url(${j.art})` : '';
          $('#np-updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        }catch(e){
          $('#np-title').textContent = 'Unable to load';
        }
      };
      pull(); setInterval(pull, 20000);
    }

    // Requests
    const form = $('#requestForm');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const status = $('#requestStatus');
      if(!cfg.requestWebhook){ status.textContent = 'No webhook configured.'; return; }
      try{
        await fetch(cfg.requestWebhook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...data, at: new Date().toISOString() })});
        status.textContent = '✅ Sent!'; form.reset();
      }catch(err){ status.textContent = '❌ Failed to send.' }
    });
  }

  function fillInstall(){
    const f = $('#installForm'); if(!f) return;
    f.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const cfg = structuredClone(defaultConfig);
      cfg.brandName = v.brandName; cfg.logo = v.logo; cfg.streamUrl = v.streamUrl; cfg.timezone = v.timezone;
      cfg.nowPlayingUrl = v.nowPlayingUrl; cfg.requestWebhook = v.requestWebhook; cfg.adminUser = v.adminUser;
      cfg.adminPassHash = await hash(v.adminPass);
      setConfig(cfg);
      location.href = 'admin.html';
    });
  }

  function fillAdmin(){
    const cfg = getConfig() || defaultConfig; setConfig(cfg);
    const login = $('#loginForm'); const body = $('#adminBody'); const msg = $('#loginMsg');
    login?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const v = Object.fromEntries(new FormData(login));
      const okUser = v.user === cfg.adminUser;
      const okPass = (cfg.adminPassHash ? await hash(v.pass) === cfg.adminPassHash : v.pass === 'admin');
      if(okUser && okPass){ login.classList.add('hidden'); body.classList.remove('hidden'); loadAdmin(cfg); }
      else { msg.textContent = 'Invalid credentials'; }
    });

    $$('.tab')?.forEach(b => b.addEventListener('click', () => {
      $$('.tab').forEach(t=>t.classList.remove('active')); b.classList.add('active');
      $$('.panel').forEach(p=>p.classList.add('hidden'));
      $('#tab-'+b.dataset.tab).classList.remove('hidden');
    }));

    function loadAdmin(c){
      $('#cfg-brandName').value = c.brandName; $('#cfg-logo').value = c.logo;
      $('#cfg-streamUrl').value = c.streamUrl; $('#cfg-timezone').value = c.timezone; $('#cfg-nowPlayingUrl').value = c.nowPlayingUrl;
      $('#cfg-requestWebhook').value = c.requestWebhook;
      $('#cfg-schedule').value = JSON.stringify(c.schedule, null, 2);
      $('#cfg-djs').value = JSON.stringify(c.djs, null, 2);

      document.body.addEventListener('click', async (e)=>{
        const btn = e.target.closest('[data-save]'); if(!btn) return;
        const t = btn.dataset.save;
        if(t==='brand'){ c.brandName=$('#cfg-brandName').value; c.logo=$('#cfg-logo').value; }
        if(t==='stream'){ c.streamUrl=$('#cfg-streamUrl').value; c.timezone=$('#cfg-timezone').value; c.nowPlayingUrl=$('#cfg-nowPlayingUrl').value; }
        if(t==='integrations'){ c.requestWebhook=$('#cfg-requestWebhook').value; }
        if(t==='schedule'){ try{ c.schedule=JSON.parse($('#cfg-schedule').value) }catch{ alert('Invalid schedule JSON') } }
        if(t==='djs'){ try{ c.djs=JSON.parse($('#cfg-djs').value) }catch{ alert('Invalid DJs JSON') } }
        setConfig(c); alert('Saved');
      });

      $('#exportBtn')?.addEventListener('click', ()=>{
        const blob = new Blob([JSON.stringify(c, null, 2)], {type:'application/json'});
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download:'radio-dj-panel-config.json' });
        a.click(); URL.revokeObjectURL(a.href);
      });
      $('#importFile')?.addEventListener('change', async (e)=>{
        const file = e.target.files?.[0]; if(!file) return; const text = await file.text();
        try{ const j = JSON.parse(text); setConfig(j); alert('Imported! Reloading.'); location.reload(); }catch{ alert('Invalid JSON'); }
      });
    }
  }

  // boot per page
  document.addEventListener('DOMContentLoaded', ()=>{
    if(location.pathname.endsWith('index.html') || location.pathname==='/' ) fillPublic();
    if(location.pathname.endsWith('install.html')) fillInstall();
    if(location.pathname.endsWith('admin.html')) fillAdmin();
  });
})();


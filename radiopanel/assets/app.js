(() => {
  // ---------- tiny helpers ----------
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // storage key (kept same so old configs still load)
  const SKEY = 'rjp_config_v2';
  const PKEY = 'rjp_played_v1';

  // default config (filled/merged with remote json on first visit)
  const defaultConfig = {
    brandName: 'WildStyleRadio',
    logo: '',
    streamUrl: 'https://streaming.live365.com/a50378',
    timezone: 'Europe/London',
    nowPlayingUrl: '',
    requestWebhook: '',
    requestsFeed: '',
    adminUser: 'admin',
    adminPassHash: '' // set to hash('wild123') at runtime if blank
  };

  // ---------- crypto ----------
  async function hash(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  // ---------- config load / save ----------
  async function ensureConfig(){
    // 1) try local
    let cfg = null;
    try { cfg = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch {}
    if (!cfg) {
      // 2) auto-load shared config (first visit on a device)
      try {
        const res = await fetch('https://wildstyle.vip/radiopanel/data/config.json', { cache:'no-store' });
        if (!res.ok) throw new Error(res.statusText);
        cfg = await res.json();
        console.log('Auto-loaded shared config from Wildstyle.vip');
      } catch (e) {
        console.warn('Auto-load failed, using defaults:', e);
        cfg = structuredClone(defaultConfig);
      }
      localStorage.setItem(SKEY, JSON.stringify(cfg));
    }

    // 3) make sure required keys exist (forward compatible)
    cfg = { ...structuredClone(defaultConfig), ...cfg };

    // 4) if no admin pass stored, default to 'wild123'
    if (!cfg.adminPassHash) {
      cfg.adminPassHash = await hash('wild123');
      localStorage.setItem(SKEY, JSON.stringify(cfg));
      console.log('Initialised admin password to default "wild123"');
    }
    return cfg;
  }
  function setConfig(cfg){ localStorage.setItem(SKEY, JSON.stringify(cfg)); }

  // ---------- simple utils ----------
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const tzDate = (tz) => new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

  function getPlayed(){
    try { return JSON.parse(localStorage.getItem(PKEY)||'{}') } catch { return {} }
  }
  function setPlayed(p){ localStorage.setItem(PKEY, JSON.stringify(p)) }

  // ---------- PUBLIC (index.html) ----------
  function fillPublic(){
    let cfg; try { cfg = JSON.parse(localStorage.getItem(SKEY)||'{}'); } catch {}
    if (!cfg) return;

    $('#brandName')?.append(document.createTextNode(' • ' + (cfg.brandName||'WildStyleRadio')));
    if (cfg.logo) $('#brandLogo').textContent = cfg.logo;
    if (cfg.streamUrl) $('#player')?.setAttribute('src', cfg.streamUrl);
    $('#tzHint')?.append(document.createTextNode('Timezone: ' + (cfg.timezone||'Europe/London')));

    // DJs list
    const djUl = $('#djList');
    if (djUl) {
      djUl.innerHTML = '';
      (cfg.djs||[]).forEach(d => {
        const li = document.createElement('li');
        li.textContent = d.name;
        djUl.appendChild(li);
      });
    }

    // Today schedule
    const today = days[ tzDate(cfg.timezone||'Europe/London').getDay() ];
    const list  = (cfg.schedule?.[today]||[]);
    const ul = $('#todaySchedule');
    if (ul) {
      ul.innerHTML = list.map(it =>
        `<li><strong>${it.start}–${it.end}</strong> · ${it.show} <span class="muted">— ${it.dj}</span></li>`
      ).join('') || '<li>No shows today.</li>';
    }

    // Now Playing (optional JSON endpoint)
    if (cfg.nowPlayingUrl) {
      const pull = async ()=>{
        try {
          const r = await fetch(cfg.nowPlayingUrl, { cache:'no-store' });
          const j = await r.json();
          $('#np-title').textContent  = j.title  || '—';
          $('#np-artist').textContent = j.artist || '—';
          if (j.art) $('#np-art').style.backgroundImage = `url(${j.art})`;
          $('#np-updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        } catch {
          $('#np-title').textContent = 'Unable to load';
        }
      };
      pull(); setInterval(pull, 20000);
    }

    // Requests form → webhook (optional)
    const form = $('#requestForm');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const status = $('#requestStatus');
      if (!cfg.requestWebhook) { status.textContent = 'No webhook configured.'; return; }
      const data = Object.fromEntries(new FormData(form));
      try{
        await fetch(cfg.requestWebhook, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ ...data, at: new Date().toISOString() })
        });
        status.textContent='✅ Sent!'; form.reset();
      }catch{ status.textContent='❌ Failed to send.' }
    });
  }

  // ---------- INSTALL (install.html) ----------
  function fillInstall(){
    const f = $('#installForm'); if (!f) return;
    f.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const cfgLocal = JSON.parse(localStorage.getItem(SKEY)||'{}');
      const cfg = { ...structuredClone(defaultConfig), ...cfgLocal };
      cfg.brandName = v.brandName;
      cfg.logo      = v.logo;
      cfg.streamUrl = v.streamUrl;
      cfg.timezone  = v.timezone;
      cfg.nowPlayingUrl = v.nowPlayingUrl;
      cfg.requestWebhook = v.requestWebhook;
      cfg.adminUser  = 'admin';
      cfg.adminPassHash = await hash('wild123'); // always default after install
      setConfig(cfg);
      location.href = 'admin.html';
    });
  }

  // ---------- ADMIN (admin.html) ----------
  async function fillAdmin(){
    const cfg = await ensureConfig();

    const login   = $('#loginForm');
    const msg     = $('#loginMsg');
    const body    = $('#adminBody');
    const whoBar  = $('#whoBar');
    const whoName = $('#whoName');
    const lockBtn = $('#lockBtn');

    // add Reset Password button dynamically (no HTML change required)
    let resetBtn = $('#resetBtn');
    if (!resetBtn && whoBar) {
      resetBtn = document.createElement('button');
      resetBtn.id = 'resetBtn';
      resetBtn.className = 'btn ghost';
      resetBtn.textContent = 'Reset Password';
      whoBar.querySelector('.row, .actions')?.appendChild(resetBtn) || whoBar.appendChild(resetBtn);
    }

    login?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const v = Object.fromEntries(new FormData(login));
  const u = (cfg.users || []).find(x => x.user.toLowerCase() === v.user.toLowerCase());
  const passOk = v.pass === "wild123" || (await hash(v.pass)) === u?.passHash;
  const isAdmin = v.user.toLowerCase() === (cfg.adminUser||"admin").toLowerCase() && v.pass === "wild123";
  if (passOk || isAdmin) {
    login.classList.add("hidden");
    body.classList.remove("hidden");
    whoBar.classList.remove("hidden");
    whoName.textContent = v.user;
    loadAdminPanels(cfg);
  } else {
    msg.textContent = "Invalid credentials or password not set.";
  }
}); 

    lockBtn?.addEventListener('click', ()=>location.reload());

    // reset to default password (wild123)
    resetBtn?.addEventListener('click', async ()=>{
      if (!confirm('Reset admin password back to "wild123"?')) return;
      const c = await ensureConfig();
      c.adminPassHash = await hash('wild123');
      setConfig(c);
      alert('✅ Password reset to wild123');
    });

    // tab switching
    $$('.tab')?.forEach(b => b.addEventListener('click', ()=>{
      $$('.tab').forEach(t=>t.classList.remove('active'));
      b.classList.add('active');
      $$('.panel').forEach(p=>p.classList.add('hidden'));
      $('#tab-'+b.dataset.tab)?.classList.remove('hidden');
    }));
  }

  function loadAdminPanels(cfg){
    // BRAND
    $('#cfg-brandName').value = cfg.brandName || '';
    $('#cfg-logo').value      = cfg.logo || '';

    // STREAM
    $('#cfg-streamUrl').value   = cfg.streamUrl || '';
    $('#cfg-timezone').value    = cfg.timezone || 'Europe/London';
    $('#cfg-nowPlayingUrl').value = cfg.nowPlayingUrl || '';

    // INTEGRATIONS
    $('#cfg-requestWebhook').value = cfg.requestWebhook || '';
    $('#cfg-requestsFeed').value   = cfg.requestsFeed   || '';

    // CONTENT
    $('#cfg-schedule').value = JSON.stringify(cfg.schedule || {}, null, 2);
    $('#cfg-djs').value      = JSON.stringify(cfg.djs || [], null, 2);

    // SAVE HANDLERS
    document.body.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-save]'); if (!btn) return;
      const t = btn.dataset.save;
      if (t==='brand'){ cfg.brandName=$('#cfg-brandName').value; cfg.logo=$('#cfg-logo').value; }
      if (t==='stream'){ cfg.streamUrl=$('#cfg-streamUrl').value; cfg.timezone=$('#cfg-timezone').value; cfg.nowPlayingUrl=$('#cfg-nowPlayingUrl').value; }
      if (t==='integrations'){ cfg.requestWebhook=$('#cfg-requestWebhook').value; cfg.requestsFeed=$('#cfg-requestsFeed').value; }
      if (t==='schedule'){ try{ cfg.schedule=JSON.parse($('#cfg-schedule').value) }catch{ return alert('Invalid schedule JSON') } }
      if (t==='djs'){ try{ cfg.djs=JSON.parse($('#cfg-djs').value) }catch{ return alert('Invalid DJs JSON') } }
      setConfig(cfg); alert('Saved');
    });

    // BACKUP: export / import
    $('#exportBtn')?.addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(cfg, null, 2)], {type:'application/json'});
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download:'radio-dj-panel-config.json' });
      a.click(); URL.revokeObjectURL(a.href);
    });
    $('#importFile')?.addEventListener('change', async (e)=>{
      const file = e.target.files?.[0]; if(!file) return;
      try{
        const text = await file.text();
        const j = JSON.parse(text);
        localStorage.setItem(SKEY, JSON.stringify(j));
        alert('Imported! Reloading.'); location.reload();
      }catch{ alert('Invalid JSON'); }
    });

    // SYNC CONFIG (pull from shared file)
    $('#syncBtn')?.addEventListener('click', async ()=>{
      if(!confirm('Pull latest config from Wildstyle.vip?\nThis will overwrite your local settings.')) return;
      try{
        const r = await fetch('https://wildstyle.vip/radiopanel/data/config.json', { cache:'no-store' });
        if(!r.ok) throw new Error(r.statusText);
        const j = await r.json();
        localStorage.setItem(SKEY, JSON.stringify(j));
        alert('✅ Synced successfully. Reloading...'); location.reload();
      }catch(err){ alert('❌ Failed to sync: ' + err.message); }
    });

    // DJ REQUESTS (read-only feed)
    initDJRequestsUI(cfg);
  }

  // ---------- DJ Requests ----------
  function initDJRequestsUI(cfg){
    const list = $('#reqList');
    const upd  = $('#reqUpdated');
    const btn  = $('#reqRefresh');
    if (!list) return;

    const played = getPlayed();
    const keyFor = (row) => `${row.name||''}|${row.song||row.message||''}|${row.at||row.time||''}`;

    function render(rows){
      list.innerHTML = rows.map(r=>{
        const k = keyFor(r);
        const done = !!played[k];
        return `
          <li style="display:flex;gap:12px;align-items:start;justify-content:space-between;padding:10px;border-bottom:1px dashed var(--border);opacity:${done?0.45:1}">
            <div>
              <div><strong>${r.name||'Anon'}</strong> — ${r.song||r.message||''}</div>
              <div class="tiny muted">${r.at||r.time||''}</div>
            </div>
            <label style="display:flex;gap:6px;align-items:center;cursor:pointer">
              <input type="checkbox" ${done?'checked':''} data-played="${encodeURIComponent(k)}">
              <span class="small">Played</span>
            </label>
          </li>`;
      }).join('') || '<li>No requests yet.</li>';
      upd && (upd.textContent = 'Last updated: ' + new Date().toLocaleTimeString());
    }

    async function fetchRows(){
      const url = (cfg.requestsFeed||'').trim();
      if (!url){ list.innerHTML = '<li>Requests Feed URL not set (Admin → Integrations).</li>'; return; }
      try{
        const r = await fetch(url, { cache:'no-store' });
        const j = await r.json();
        const rows = Array.isArray(j)
          ? j.map(x => (typeof x === 'object' && !Array.isArray(x)) ? x
                     : Array.isArray(x) ? { name:x[0], song:x[1], at:x[2] } : x)
          : [];
        render(rows);
      }catch{ list.innerHTML = '<li>Failed to load feed.</li>'; }
    }

    list.addEventListener('change', (e)=>{
      const cb = e.target.closest('[data-played]'); if(!cb) return;
      const k = decodeURIComponent(cb.dataset.played);
      played[k] = cb.checked ? 1 : 0;
      setPlayed(played);
      const lis = $$('#reqList li');
      lis.forEach(li=>{
        const input = li.querySelector('input[type="checkbox"]');
        li.style.opacity = input?.checked ? 0.45 : 1;
      });
    });

    btn?.addEventListener('click', fetchRows);
    fetchRows();
    setInterval(fetchRows, 30000);
  }

  // ---------- boot ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    const p = location.pathname;
    if (p.endsWith('index.html') || p === '/') fillPublic();
    if (p.endsWith('install.html'))           fillInstall();
    if (p.endsWith('admin.html'))             fillAdmin();
  });
})(); 

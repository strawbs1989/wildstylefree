(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SKEY = 'rjp_config_v2';
  const PKEY = 'rjp_played_v1'; // locally-marked "played" requests
  const defaultConfig = {
    brandName: 'Radio DJ Panel',
    logo: '🎧',
    streamUrl: '',
    timezone: 'Europe/London',
    nowPlayingUrl: '',
    requestWebhook: '',
    // NEW: requests feed (read-only JSON). Preload with Jay's feed for convenience:
    requestsFeed: 'https://script.google.com/macros/s/AKfycbyoAZ_BA9pmiPycdiI1xfrOTf7UG5lYaw7P50Y_E5TJ_2uxFd7H6_5GnRADTDPieVg/exec',
    // Admin backup from installer:
    adminUser: 'admin',
    adminPassHash: '',
    // NEW: multi-user logins
    users: [
      { user: 'EchoFalls', role: 'dj', passHash: '' },
      { user: 'Lewis',     role: 'dj', passHash: '' },
      { user: 'Graham',    role: 'dj', passHash: '' },
      { user: 'Christina', role: 'dj', passHash: '' }
    ],
    // content data
    djs: [ { name: 'DJ EchoFalls' }, { name: 'DJ Lewis' } ],
    schedule: {
      Thu: [{ start:'19:00', end:'20:00', show:'Frequency Shift', dj:'DJ EchoFalls' }],
      Sun: [{ start:'20:00', end:'21:00', show:'Frequency Shift', dj:'DJ EchoFalls' }]
    }
  };

  function getConfig() {
    const raw = localStorage.getItem(SKEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function setConfig(cfg) { localStorage.setItem(SKEY, JSON.stringify(cfg)); }
  function getPlayed() {
    const raw = localStorage.getItem(PKEY);
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  function setPlayed(p) { localStorage.setItem(PKEY, JSON.stringify(p)); }

  async function hash(str) {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const tzDate = (tz) => new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

  // ---------- PUBLIC (index.html) ----------
  function fillPublic(){
    const cfg = getConfig(); if(!cfg) return;
    $('#brandName')?.append(document.createTextNode(' • ' + cfg.brandName));
    if(cfg.logo){ $('#brandLogo').textContent = cfg.logo; }
    $('#player')?.setAttribute('src', cfg.streamUrl || '');
    $('#tzHint')?.append(document.createTextNode(`Timezone: ${cfg.timezone}`));

    // DJs
    const djUl = $('#djList');
    if(djUl){
      djUl.innerHTML = '';
      (cfg.djs||[]).forEach(d => {
        const li = document.createElement('li');
        li.textContent = d.name;
        djUl.appendChild(li);
      });
    }

    // Today schedule
    const today = days[ tzDate(cfg.timezone).getDay() ];
    const list = (cfg.schedule?.[today]||[]);
    const ul = $('#todaySchedule');
    if(ul){
      ul.innerHTML = list.map(it =>
        `<li><strong>${it.start}–${it.end}</strong> · ${it.show} <span class="muted">— ${it.dj}</span></li>`
      ).join('') || '<li>No shows today.</li>';
    }

    // Now Playing
    if(cfg.nowPlayingUrl){
      const pull = async () => {
        try{
          const r = await fetch(cfg.nowPlayingUrl, { cache: 'no-store' });
          const j = await r.json();
          $('#np-title').textContent = j.title || '—';
          $('#np-artist').textContent = j.artist || '—';
          if (j.art) { $('#np-art').style.backgroundImage = `url(${j.art})`; }
          $('#np-updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
        }catch(e){
          $('#np-title').textContent = 'Unable to load';
        }
      };
      pull(); setInterval(pull, 20000);
    }

    // Requests submit (POST webhook)
    const form = $('#requestForm');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const cfg = getConfig(); const status = $('#requestStatus');
      const data = Object.fromEntries(new FormData(form));
      if(!cfg?.requestWebhook){ status.textContent = 'No webhook configured.'; return; }
      try{
        await fetch(cfg.requestWebhook, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ ...data, at: new Date().toISOString() })
        });
        status.textContent = '✅ Sent!'; form.reset();
      }catch(err){ status.textContent = '❌ Failed to send.' }
    });
  }

  // ---------- INSTALL (install.html) ----------
  function fillInstall(){
    const f = $('#installForm'); if(!f) return;
    f.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const cfg = getConfig() || structuredClone(defaultConfig);
      cfg.brandName = v.brandName; cfg.logo = v.logo;
      cfg.streamUrl = v.streamUrl; cfg.timezone = v.timezone;
      cfg.nowPlayingUrl = v.nowPlayingUrl; cfg.requestWebhook = v.requestWebhook;
      cfg.adminUser = v.adminUser; cfg.adminPassHash = await hash(v.adminPass);
      setConfig(cfg);
      location.href = 'admin.html';
    });
  }

  // ---------- ADMIN / DJ (admin.html) ----------
  function fillAdmin(){
    const cfg = getConfig() || structuredClone(defaultConfig);
    // ensure all new keys exist if upgrading from v1
    for (const k in defaultConfig) if (cfg[k] === undefined) cfg[k] = defaultConfig[k];
    setConfig(cfg);

    const login = $('#loginForm');
    const body  = $('#adminBody');
    const who   = $('#whoBar');
    const whoName = $('#whoName');
    const whoRole = $('#whoRole');
    const lockBtn = $('#lockBtn');

    let currentUser = null; // {user, role}

    // role gating
    function applyRoleUI(role){
      // show body + who bar
      body.classList.remove('hidden');
      who.classList.remove('hidden');

      // hide admin-only tabs for non-admins
      const adminOnlyTabs = $$('.admin-only');
      adminOnlyTabs.forEach(btn => btn.style.display = (role === 'admin' ? '' : 'none'));

      // Allowed tabs for DJs: Brand/Stream/Schedule/DJs/Integrations/Backup -> admin only
      const restrict = ['brand','stream','schedule','djs','integrations','backup','users'];
      if(role !== 'admin'){
        restrict.forEach(id => $(`[data-tab="${id}"]`)?.classList.add('hidden'));
      }
      // Force-select DJ Requests for DJs on login
      if(role !== 'admin'){
        switchTab('djrequests');
      }
    }

    // tab switch helper
    function switchTab(key){
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.panel').forEach(p => p.classList.add('hidden'));
      $(`[data-tab="${key}"]`)?.classList.add('active');
      $(`#tab-${key}`)?.classList.remove('hidden');
    }

    login?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const v = Object.fromEntries(new FormData(login));
      const msg = $('#loginMsg');

      // 1) admin backup
      const isAdminUser = v.user === cfg.adminUser;
      const adminOk = isAdminUser && cfg.adminPassHash && (await hash(v.pass) === cfg.adminPassHash);

      // 2) dj or admin from users[]
      const u = (cfg.users || []).find(x => x.user === v.user);
      let djOk = false; let role = 'dj';
      if (u) {
        if (!u.passHash) {
          djOk = false; // no password set yet
        } else {
          djOk = (await hash(v.pass) === u.passHash);
          role = u.role || 'dj';
        }
      }

      if (adminOk || djOk) {
        currentUser = { user: v.user, role: adminOk ? 'admin' : role };
        login.classList.add('hidden');
        whoName.textContent = currentUser.user;
        whoRole.textContent = currentUser.role;
        applyRoleUI(currentUser.role);
        loadAdminPanels(cfg, currentUser);
      } else {
        msg.textContent = 'Invalid credentials or password not set.';
      }
    });

    lockBtn?.addEventListener('click', ()=>{
      currentUser = null;
      body.classList.add('hidden');
      who.classList.add('hidden');
      $('#loginMsg').textContent = '';
      $('#loginForm').reset();
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.panel').forEach(p => p.classList.add('hidden'));
      login.classList.remove('hidden');
    });

    // Tab switching
    $$('.tab')?.forEach(b => b.addEventListener('click', () => {
      if (b.classList.contains('hidden')) return;
      $$('.tab').forEach(t => t.classList.remove('active'));
      b.classList.add('active');
      $$('.panel').forEach(p => p.classList.add('hidden'));
      $('#tab-'+b.dataset.tab).classList.remove('hidden');
    }));
  }

  function loadAdminPanels(cfg, currentUser){
    // BRAND
    $('#cfg-brandName').value = cfg.brandName;
    $('#cfg-logo').value = cfg.logo;

    // STREAM
    $('#cfg-streamUrl').value = cfg.streamUrl;
    $('#cfg-timezone').value = cfg.timezone;
    $('#cfg-nowPlayingUrl').value = cfg.nowPlayingUrl;

    // INTEGRATIONS
    $('#cfg-requestWebhook').value = cfg.requestWebhook;
    $('#cfg-requestsFeed').value   = cfg.requestsFeed || '';

    // SCHEDULE + DJs
    $('#cfg-schedule').value = JSON.stringify(cfg.schedule, null, 2);
    $('#cfg-djs').value      = JSON.stringify(cfg.djs, null, 2);

    // SAVE HANDLERS
    document.body.addEventListener('click', async (e)=>{
      const btn = e.target.closest('[data-save]'); if(!btn) return;
      const t = btn.dataset.save;
      if (currentUser.role !== 'admin' && ['brand','stream','schedule','djs','integrations'].includes(t)) {
        alert('Admins only.'); return;
      }
      if(t==='brand'){ cfg.brandName=$('#cfg-brandName').value; cfg.logo=$('#cfg-logo').value; }
      if(t==='stream'){ cfg.streamUrl=$('#cfg-streamUrl').value; cfg.timezone=$('#cfg-timezone').value; cfg.nowPlayingUrl=$('#cfg-nowPlayingUrl').value; }
      if(t==='integrations'){ cfg.requestWebhook=$('#cfg-requestWebhook').value; cfg.requestsFeed=$('#cfg-requestsFeed').value; }
      if(t==='schedule'){ try{ cfg.schedule=JSON.parse($('#cfg-schedule').value) }catch{ return alert('Invalid schedule JSON') } }
      if(t==='djs'){ try{ cfg.djs=JSON.parse($('#cfg-djs').value) }catch{ return alert('Invalid DJs JSON') } }
      setConfig(cfg); alert('Saved');
    });

    // BACKUP
    $('#exportBtn')?.addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type:'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download:'radio-dj-panel-config.json' });
      a.click(); URL.revokeObjectURL(a.href);
    });
    $('#importFile')?.addEventListener('change', async (e)=>{
      const file = e.target.files?.[0]; if(!file) return;
      try{
        const text = await file.text();
        const j = JSON.parse(text);
        setConfig(j); alert('Imported! Reloading.'); location.reload();
      }catch{ alert('Invalid JSON'); }
    });

    // USERS (admins only)
    if (currentUser.role === 'admin') initUsersUI(cfg);

    // DJ REQUESTS (visible to admins + djs)
    initDJRequestsUI(cfg);
  }

  function initUsersUI(cfg){
    const list = $('#userList');
    const render = () => {
      list.innerHTML = (cfg.users||[]).map((u,i)=>`
        <li style="display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px dashed var(--border)">
          <div>
            <strong>${u.user}</strong> <span class="muted">(${u.role||'dj'})</span>
            <div class="tiny muted">${u.passHash ? '●●●●● (set)' : 'not set'}</div>
          </div>
          <div class="row">
            <button class="btn ghost" data-user-pass="${i}">Set Password</button>
            <button class="btn ghost" data-user-role="${i}">Toggle Role</button>
            <button class="btn ghost" data-user-del="${i}">Delete</button>
          </div>
        </li>`).join('') || '<li>No users yet.</li>';
    };
    render();

    list.addEventListener('click', async (e)=>{
      const passBtn = e.target.closest('[data-user-pass]');
      const roleBtn = e.target.closest('[data-user-role]');
      const delBtn  = e.target.closest('[data-user-del]');
      if(passBtn){
        const idx = +passBtn.dataset.userPass;
        const p = prompt(`Set password for ${cfg.users[idx].user}:`);
        if(p !== null){
          cfg.users[idx].passHash = p ? await hash(p) : '';
          setConfig(cfg); render(); alert('Password updated.');
        }
      }else if(roleBtn){
        const idx = +roleBtn.dataset.userRole;
        cfg.users[idx].role = (cfg.users[idx].role === 'admin' ? 'dj' : 'admin');
        setConfig(cfg); render();
      }else if(delBtn){
        const idx = +delBtn.dataset.userDel;
        if(confirm(`Remove ${cfg.users[idx].user}?`)){
          cfg.users.splice(idx,1); setConfig(cfg); render();
        }
      }
    });

    $('#addUserBtn')?.addEventListener('click', async ()=>{
      const u = $('#newUser').value.trim();
      const r = $('#newRole').value;
      if(!u) return alert('Username required.');
      if((cfg.users||[]).some(x => x.user.toLowerCase() === u.toLowerCase()))
        return alert('User already exists.');
      cfg.users.push({ user:u, role:r, passHash:'' });
      setConfig(cfg); $('#newUser').value=''; render();
    });
  }

  function initDJRequestsUI(cfg){
    const list = $('#reqList');
    const upd  = $('#reqUpdated');
    const btn  = $('#reqRefresh');
    const played = getPlayed();

    const keyFor = (row) => `${row.name||''}|${row.song||row.message||''}|${row.at||row.time||''}`;

    function render(rows){
      list.innerHTML = rows.map(r=>{
        const k = keyFor(r);
        const done = !!played[k];
        return `
          <li style="display:flex;gap:12px;align-items:start;justify-content:space-between;padding:10px;border-bottom:1px dashed var(--border);opacity:${done?0.45:1}">
            <div>
              <div><strong>${r.name || 'Anon'}</strong> — ${r.song || r.message || ''}</div>
              <div class="tiny muted">${r.at || r.time || ''}</div>
            </div>
            <div>
              <label style="display:flex;gap:6px;align-items:center;cursor:pointer">
                <input type="checkbox" ${done?'checked':''} data-played="${encodeURIComponent(k)}">
                <span class="small">Played</span>
              </label>
            </div>
          </li>
        `;
      }).join('') || '<li>No requests yet.</li>';
      upd.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    }

    async function fetchRows(){
      const url = (cfg.requestsFeed || '').trim();
      if(!url){ list.innerHTML = '<li>Requests Feed URL not set (Admin → Integrations).</li>'; return; }
      try{
        const r = await fetch(url, { cache:'no-store' });
        const j = await r.json();
        // Accept either array of objects or array of arrays
        const rows = Array.isArray(j) ? j.map(x=>{
          if (x && typeof x === 'object' && !Array.isArray(x)) return x;
          if (Array.isArray(x)) return { name: x[0], song: x[1], at: x[2] };
          return x;
        }) : [];
        render(rows);
      }catch(e){
        list.innerHTML = '<li>Failed to load feed.</li>';
      }
    }

    list.addEventListener('change', (e)=>{
      const cb = e.target.closest('[data-played]'); if(!cb) return;
      const k = decodeURIComponent(cb.dataset.played);
      played[k] = cb.checked ? 1 : 0;
      setPlayed(played);
      // fade by re-rendering current items (quick way)
      const lis = $$('#reqList li');
      lis.forEach(li=>{
        const input = li.querySelector('input[type="checkbox"]');
        if(!input) return;
        li.style.opacity = input.checked ? 0.45 : 1;
      });
    });

    btn?.addEventListener('click', fetchRows);

    // initial & auto refresh 30s
    fetchRows();
    setInterval(fetchRows, 30000);
  }

  // ---------- Boot per page ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    const path = location.pathname;
    if (path.endsWith('index.html') || path === '/' ) fillPublic();
    if (path.endsWith('install.html')) fillInstall();
    if (path.endsWith('admin.html')) fillAdmin();
  });
})();


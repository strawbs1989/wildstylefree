// =====================
    //  Firebase CONFIG 🔧
    // =====================
    const firebaseConfig = {
  apiKey: "AIzaSyC6c26rAeeCZZKgVMqhXbn1b-s8kdQRmQY",
  authDomain: "forums-4ede0.firebaseapp.com",
  projectId: "forums-4ede0",
  storageBucket: "forums-4ede0.firebasestorage.app",
  messagingSenderId: "773264522533",
  appId: "1:773264522533:web:bbd91d96b025f31f10eecc",
  measurementId: "G-D83TTX3JJT"
};

    // =====================
    //  Imports (v10 CDN)
    // =====================
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // =====================
    //  Wildstyle theme bits
    // =====================
    const CATEGORIES = [
      { id:'all', label:'All' },
      { id:'unsigned', label:'Unsigned Artists' },
      { id:'music', label:'Music Chat' },
      { id:'tech', label:'Tech Help' },
    ];

    const state = {
      user:null,
      roles:[],
      activeCat:'all',
      unsubscribe:null,
      threads:[],
      search:''
    };

    const el = (sel) => document.querySelector(sel);
    const els = (sel) => Array.from(document.querySelectorAll(sel));

    // Seed categories UI
    const catsBox = el('#cats');
    CATEGORIES.forEach(c => {
      const div = document.createElement('div');
      div.className = 'cat';
      div.setAttribute('data-cat', c.id);
      if(c.id==='all') div.setAttribute('aria-current','true');
      div.innerHTML = `<strong>${c.label}</strong>`;
      div.addEventListener('click', ()=> switchCategory(c.id));
      catsBox.appendChild(div);
    });

    function isImageUrl(u){
      try{
        const url = new URL(u);
        return /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(url.pathname);
      }catch{ return false }
    }

    function sanitize(text){
      // Strip HTML/script; allow plain text only (images come from validated field)
      return String(text||'').replace(/[\u0000-\u001F\u007F-\u009F]/g,'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function hasRole(r){ return state.roles.includes(r); }

    async function loadRoles(uid){
      state.roles = [];
      if(!uid) return;
      const snap = await getDoc(doc(db,'roles', uid));
      if(snap.exists()){
        const d = snap.data();
        state.roles = Array.isArray(d.roles) ? d.roles : [];
      }
    }

    function switchCategory(cat){
      state.activeCat = cat;
      els('.cat').forEach(n => n.setAttribute('aria-current', n.getAttribute('data-cat')===cat ? 'true' : 'false'));
      el('#activeCatLabel').innerHTML = `<strong>${CATEGORIES.find(x=>x.id===cat)?.label||'All'}</strong> threads`;
      bindThreadsListener();
    }

    function bindThreadsListener(){
      if(state.unsubscribe) state.unsubscribe();
      const base = collection(db,'threads');
      let qy;
      if(state.activeCat==='all'){
        qy = query(base, orderBy('pinned','desc'), orderBy('updatedAt','desc'), limit(100));
      }else{
        qy = query(base, where('category','==',state.activeCat), orderBy('pinned','desc'), orderBy('updatedAt','desc'), limit(100));
      }
      state.unsubscribe = onSnapshot(qy, (snap)=>{
        state.threads = snap.docs.map(d=> ({ id:d.id, ...d.data() }));
        renderThreads();
      });
    }

    function threadCard(t){
      const isOwner = state.user && t.authorUid === state.user.uid;
      const canMod = hasRole('admin') || hasRole('mod');
      const showStaff = canMod || isOwner;

      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="row">
          <img class="thumb" src="${isImageUrl(t.imageUrl) ? t.imageUrl : '/test1/placeholder.png'}" alt="thread image" />
          <div style="flex:1">
            <div class="meta">
              <span class="badge ${t.authorRoles?.includes('dj')?'dj':''}">${t.authorRoles?.includes('dj') ? 'DJ' : 'Member'}</span>
              <span title="Author">${t.authorName||'Unknown'}</span>
              <span>•</span>
              <span>${new Date(t.updatedAt?.toDate?.() || t.updatedAt || Date.now()).toLocaleString()}</span>
              ${t.pinned?'<span class="badge staff" title="Pinned">📌 Pinned</span>':''}
            </div>
            <h3 style="margin:6px 0 6px">${sanitize(t.title)}</h3>
            <p style="color:var(--muted); margin:0">${sanitize(t.body)}</p>
          </div>
          <div class="actions">
            <button class="action like" aria-pressed="false" data-like>❤️ <span>${t.likesCount||0}</span></button>
            ${showStaff?`<button class="action pin" aria-pressed="${t.pinned?'true':'false'}" data-pin>📌</button>`:''}
            ${(canMod || isOwner)?`<button class="action" data-edit>✏️</button><button class="action" data-del>🗑️</button>`:''}
          </div>
        </div>
        <div class="replies" data-replies></div>
        <div class="compose">
          <input data-reply-image placeholder="Image URL (required for embedded image)" />
          <input data-reply-text placeholder="Your message (text only)" />
          <button class="btn" data-reply>Reply</button>
          <textarea data-edit-body placeholder="Edit body…" style="display:none"></textarea>
        </div>
      `;

      // Likes
      div.querySelector('[data-like]')?.addEventListener('click', ()=> likeThread(t));

      // Pin, Edit, Delete
      const pinBtn = div.querySelector('[data-pin]');
      if(pinBtn){ pinBtn.addEventListener('click', ()=> togglePin(t)); }
      div.querySelector('[data-edit]')?.addEventListener('click', ()=> startEdit(div, t));
      div.querySelector('[data-del]')?.addEventListener('click', ()=> deleteThread(t));

      // Replies
      div.querySelector('[data-reply]')?.addEventListener('click', ()=> postReply(div, t));
      loadReplies(div, t.id);
      return div;
    }

    function renderThreads(){
      const box = el('#threads');
      box.innerHTML = '';
      const list = state.threads.filter(t=> !state.search || (t.title?.toLowerCase?.().includes(state.search) || t.body?.toLowerCase?.().includes(state.search)));
      if(list.length===0){ el('#empty').style.display='block'; return; } else { el('#empty').style.display='none'; }
      list.forEach(t => box.appendChild(threadCard(t)));
    }

    async function loadReplies(container, threadId){
      const repliesBox = container.querySelector('[data-replies]');
      repliesBox.innerHTML = '';
      const qy = query(collection(db,'threads', threadId, 'replies'), orderBy('createdAt','asc'), limit(50));
      const snap = await getDocs(qy);
      snap.forEach(d => {
        const r = d.data();
        const row = document.createElement('div');
        row.className = 'reply';
        row.innerHTML = `
          <div class="avatar">${(r.authorName||'?').slice(0,2).toUpperCase()}</div>
          <div>
            <div class="meta"><strong>${sanitize(r.authorName||'')}</strong> • ${new Date(r.createdAt?.toDate?.() || Date.now()).toLocaleString()}</div>
            <div>${sanitize(r.body||'')}</div>
            ${isImageUrl(r.imageUrl)?`<img class="embedded" src="${r.imageUrl}" alt="reply image" />`:''}
          </div>
        `;
        repliesBox.appendChild(row);
      });
    }

    async function postReply(container, t){
      if(!state.user){ return el('#authModal').showModal(); }
      const img = container.querySelector('[data-reply-image]').value.trim();
      const txt = sanitize(container.querySelector('[data-reply-text]').value.trim());
      if(!isImageUrl(img)){ alert('Replies must include a valid image URL (.png .jpg .jpeg .gif .webp).'); return; }
      await addDoc(collection(db,'threads', t.id, 'replies'), {
        imageUrl: img,
        body: txt,
        authorUid: state.user.uid,
        authorName: state.user.displayName || state.user.email,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db,'threads', t.id), { updatedAt: serverTimestamp() });
      container.querySelector('[data-reply-image]').value='';
      container.querySelector('[data-reply-text]').value='';
      loadReplies(container, t.id);
    }

    async function likeThread(t){
      if(!state.user){ return el('#authModal').showModal(); }
      const likeRef = doc(db,'threads', t.id, 'likes', state.user.uid);
      const snap = await getDoc(likeRef);
      if(snap.exists()){
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(doc(db,'threads', t.id), { likesCount: (t.likesCount||0) - 1 });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(doc(db,'threads', t.id), { likesCount: (t.likesCount||0) + 1 });
      }
    }

    async function togglePin(t){
      if(!(hasRole('admin') || hasRole('mod'))){ return alert('Mods/admins only'); }
      await updateDoc(doc(db,'threads', t.id), { pinned: !t.pinned, updatedAt: serverTimestamp() });
    }

    function startEdit(container, t){
      const area = container.querySelector('[data-edit-body]');
      const editing = area.style.display !== 'none';
      if(!editing){
        area.style.display = 'block';
        area.value = t.body||'';
        const save = document.createElement('button');
        save.className = 'btn';
        save.textContent = 'Save';
        save.addEventListener('click', async ()=>{
          await updateDoc(doc(db,'threads', t.id), { body: sanitize(area.value), updatedAt: serverTimestamp() });
          area.style.display = 'none';
          bindThreadsListener();
        });
        area.after(save);
      } else {
        area.style.display = 'none';
      }
    }

    async function deleteThread(t){
      if(!(hasRole('admin') || hasRole('mod') || (state.user && t.authorUid===state.user.uid))){ return alert('No permission'); }
      if(!confirm('Delete this thread?')) return;
      await deleteDoc(doc(db,'threads', t.id));
    }

    // =====================
    //  Create Thread
    // =====================
    el('#newThreadBtn').addEventListener('click', ()=>{
      if(!state.user){ el('#authModal').showModal(); return; }
      el('#threadModal').showModal();
    });

    el('#createThread').addEventListener('click', async ()=>{
      const cat = el('#threadCat').value;
      const title = sanitize(el('#threadTitle').value.trim());
      const image = el('#threadImage').value.trim();
      const body = sanitize(el('#threadBody').value.trim());
      if(!title) return alert('Title required');
      if(!isImageUrl(image)) return alert('Image URL required (.png .jpg .jpeg .gif .webp only).');
      const docRef = await addDoc(collection(db,'threads'), {
        category: cat,
        title, body, imageUrl: image,
        authorUid: state.user.uid,
        authorName: state.user.displayName || state.user.email,
        authorRoles: state.roles,
        pinned:false, likesCount:0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      el('#threadModal').close();
      switchCategory(cat);
    });

    // =====================
    //  Auth
    // =====================
    el('#loginBtn').addEventListener('click', ()=> el('#authModal').showModal());
    el('#logoutBtn').addEventListener('click', async ()=> { await signOut(auth); });

    el('#doLogin').addEventListener('click', async ()=>{
      try{
        const email = el('#authEmail').value.trim();
        const pass = el('#authPass').value;
        await signInWithEmailAndPassword(auth, email, pass);
        el('#authModal').close();
      }catch(e){ alert(e.message); }
    });
    el('#doSignup').addEventListener('click', async ()=>{
      try{
        const email = el('#authEmail').value.trim();
        const pass = el('#authPass').value;
        const name = el('#authName').value.trim();
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if(name){ await updateProfile(cred.user, { displayName: name }); }
        // default role: member; grant DJ/admin via roles collection (manual)
        el('#authModal').close();
      }catch(e){ alert(e.message); }
    });

    onAuthStateChanged(auth, async (user)=>{
      state.user = user || null;
      el('#logoutBtn').style.display = user? 'inline-flex':'none';
      el('#loginBtn').style.display = user? 'none':'inline-flex';
      await loadRoles(user?.uid);
      bindThreadsListener();
    });

    // =====================
    //  Search
    // =====================
    el('#searchInput').addEventListener('input', (e)=>{
      state.search = e.target.value.trim().toLowerCase();
      renderThreads();
    });

    // =====================
    //  Now On-Air (placeholder)
    //  Hook your existing Live365 logic here if desired.
    // =====================
    function setNowOnAir(text, on){
      const span = el('#nowOnAir');
      span.textContent = text;
      span.style.color = on ? 'white' : 'var(--muted)';
    }
    setNowOnAir('Off Air', false);

    // Start
    bindThreadsListener();
  </script>

  <!-- ===============================
       🔒 Firestore Rules (example)
       Paste into Firebase Console > Firestore > Rules
       And adjust to your needs.
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      function signedIn() { return request.auth != null; }
      function isAdmin() { return exists(/databases/$(database)/documents/roles/$(request.auth.uid)) && ("admin" in get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.roles); }
      function isMod() { return exists(/databases/$(database)/documents/roles/$(request.auth.uid)) && ("mod" in get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.roles); }

      match /roles/{uid} {
        allow read: if true; // public so badges work
        allow write: if isAdmin(); // only admins update roles
      }

      match /threads/{id} {
        allow read: if true;
        allow create: if signedIn() && request.resource.data.imageUrl.matches(".*\\.(png|jpg|jpeg|gif|webp)$") &&
          request.resource.data.title is string && request.resource.data.title.size() > 0;
        allow update: if signedIn() && (
          (request.auth.uid == resource.data.authorUid) || isAdmin() || isMod()
        );
        allow delete: if signedIn() && ((request.auth.uid == resource.data.authorUid) || isAdmin() || isMod());
      }

      match /threads/{id}/replies/{rid} {
        allow read: if true;
        allow create: if signedIn() && request.resource.data.imageUrl.matches(".*\\.(png|jpg|jpeg|gif|webp)$");
        allow update, delete: if signedIn() && ((request.auth.uid == resource.data.authorUid) || isAdmin() || isMod());
      }

      match /threads/{id}/likes/{uid} {
        allow read: if true;
        allow create: if signedIn() && request.auth.uid == uid;
        allow delete: if signedIn() && request.auth.uid == uid;
      }
    }
  }
  =============================== -->
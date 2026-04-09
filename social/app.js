import { firebaseConfig } from '/social/firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

/* =========================================
   CONFIG
========================================= */

const usingPlaceholders = Object.values(firebaseConfig).some(v => String(v).includes('PASTE_'));

let auth = null;
let db = null;
let currentUserProfile = null;
let unsubscribePosts = null;
const commentUnsubscribers = new Map();

if (!usingPlaceholders) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const REQUEST_STATUS_URL =
  'https://script.google.com/macros/s/AKfycbz4TY_tQZEsJflfzeKB8ALDR7aEDNVe6jjQhoGO-d8Rqv0Nr_yiIa2peKbC2-oaBZE/exec';

const REQUEST_TICKER_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTN3Wl2Tq0brZrYyKWkN-Dz1Ze4bjq3-S0iIL1O5Zo3CsT1S463y2surOifH4CLB2zHQHoR9paj0Mdk/pub?gid=0&single=true&output=csv';

const SCHEDULE_URL = "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

const DAY_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

function normDay(day) {
  const s = String(day || "").trim().toLowerCase();
  const fixed = s.charAt(0).toUpperCase() + s.slice(1);
  return DAY_ORDER.includes(fixed) ? fixed : "";
}

function getUKNow() {
  return new Date(new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London"
  }));
}

function getNowMinutes() {
  const now = getUKNow();
  return {
    dayNum: now.getDay() === 0 ? 7 : now.getDay(),
    mins: now.getHours() * 60 + now.getMinutes()
  };
}

function parseTime(t) {
  t = String(t || "").trim().toLowerCase();
  const m = t.match(/(\d{1,2})(?::(\d{2}))?(am|pm)/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || "0", 10);
  const ampm = m[3];

  if (ampm === "pm" && h !== 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;

  return h * 60 + mins;
}

function slotStartEndMinutes(slot) {
  const start = parseTime(slot.start);
  const end = parseTime(slot.end);
  if (start == null || end == null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

function findCurrentSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotStartEndMinutes(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crossesMidnight && mins >= r.start && mins < r.end) return s;
      if (r.crossesMidnight && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && mins < r.end) return s;
  }

  return null;
}

function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if ((s.dj || "").toLowerCase() === "free") continue;

      const r = slotStartEndMinutes(s);
      if (!r) continue;

      if (o === 0) {
        if (!r.crossesMidnight && r.start > mins) list.push({ o, start: r.start, s });
        if (r.crossesMidnight && mins < r.start) list.push({ o, start: r.start, s });
      } else {
        list.push({ o, start: r.start, s });
      }
    }
  }

  list.sort((a, b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

async function loadNowOnAndUpNext() {
  const nowEl = document.getElementById("nowon");
  const upNextEl = document.getElementById("upNext");
  const scheduleNowOn = document.getElementById("scheduleNowOn");
  const scheduleUpNext = document.getElementById("scheduleUpNext");

  if (!nowEl && !upNextEl && !scheduleNowOn && !scheduleUpNext) return;

  try {
    const res = await fetch(SCHEDULE_URL + "?v=" + Date.now());
    const data = await res.json();

    const slots = (data.slots || []).map(slot => ({
      day: normDay(slot.day),
      start: slot.start,
      end: slot.end,
      dj: slot.dj || "Free"
    }));

    const now = findCurrentSlot(slots);
    const next = findUpNextSlot(slots);

    if (nowEl) {
      nowEl.textContent = now
        ? `${now.dj} ${now.start}–${now.end}`
        : "Off Air";
    }

    if (upNextEl) {
      upNextEl.innerHTML = next
        ? `${next.dj}<br><span class="muted-inline">${next.start}–${next.end} UK</span>`
        : "No upcoming shows";
    }

    if (scheduleNowOn) {
      scheduleNowOn.textContent = now
        ? `Now On: ${now.dj} (${now.start}–${now.end})`
        : "Now On: Off Air";
    }

    if (scheduleUpNext) {
      scheduleUpNext.textContent = next
        ? `${next.dj} (${next.start}–${next.end})`
        : "No upcoming shows";
    }

  } catch (err) {
    console.error("Now On / Up Next load failed:", err);

    if (nowEl) nowEl.textContent = "Unavailable";
    if (upNextEl) upNextEl.textContent = "Unavailable";
    if (scheduleNowOn) scheduleNowOn.textContent = "Now On: Unavailable";
    if (scheduleUpNext) scheduleUpNext.textContent = "Unavailable";
  }
} 


function detectDesktopModeOnMobile() {
  const ua = navigator.userAgent || "";
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const looksDesktopUA =
    !/Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    ua.includes("X11") ||
    ua.includes("Windows NT") ||
    ua.includes("Macintosh");

  if (isTouchDevice && looksDesktopUA) {
    document.documentElement.classList.add("force-desktop-nav");
  } else {
    document.documentElement.classList.remove("force-desktop-nav");
  }
} 

/* =========================================
   ELEMENTS
========================================= */

const els = {
  // nav / burger
  burger: document.getElementById('burger'),
  navClose: document.getElementById('navClose'),
  navBackdrop: document.getElementById('navBackdrop'),
  mobileNav: document.getElementById('mobileNav'),

  // auth
  openAuthBtn: document.getElementById('openAuthBtn'),
  closeAuthBtn: document.getElementById('closeAuthBtn'),
  authOverlay: document.getElementById('authOverlay'),
  authModal: document.getElementById('authModal'),
  authTabs: document.querySelectorAll('.auth-tab'),
  authPanels: document.querySelectorAll('.auth-form'),
  authStatus: document.getElementById('authStatus'),
  loginForm: document.getElementById('loginForm'),
  signupForm: document.getElementById('signupForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  signupDisplayName: document.getElementById('signupDisplayName'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),

  // feed
  postInput: document.getElementById('postInput'),
  createPostBtn: document.getElementById('createPostBtn'),
  postStatus: document.getElementById('postStatus'),
  feedContainer: document.getElementById('feedContainer'),

  // profile
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileRole: document.getElementById('profileRole'),
  profileBio: document.getElementById('profileBio'),
  profilePosts: document.getElementById('profilePosts'),
  profileActions: document.getElementById('profileActions'),

  // requests ticker
  requestTickerText: document.getElementById('requestTickerText'),
  requestTickerClone: document.getElementById('requestTickerClone'),

  // now on
  nowOn: document.getElementById('nowon'),
  upNext: document.getElementById('upNext'),

  // request page
  requestForm: document.querySelector('.request-form-page'),
  requestSuccess: document.getElementById('requestSuccess'),
  requestClosed: document.getElementById('requestClosed'),

  // schedule page
  scheduleNowOn: document.getElementById('scheduleNowOn'),
  scheduleUpNext: document.getElementById('scheduleUpNext')
};

/* =========================================
   HELPERS
========================================= */

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initialsFromName(name = 'WS') {
  return name
    .split(' ')
    .map(p => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  return value?.toDate ? value.toDate().toLocaleString() : 'Just now';
}

function parseCSV(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function setAuthMessage(message, isError = false) {
  if (!els.authStatus) return;
  els.authStatus.textContent = message;
  els.authStatus.style.color = isError ? '#ff9eb8' : '#b8a9d6';
}

function setPostMessage(message, isError = false) {
  if (!els.postStatus) return;
  els.postStatus.textContent = message;
  els.postStatus.style.color = isError ? '#ff9eb8' : '#b8a9d6';
}

/* =========================================
   BURGER MENU
========================================= */

function openMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.add("active");
  if (navBackdrop) navBackdrop.hidden = false;
}

function closeMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const navBackdrop = document.getElementById("navBackdrop");
  if (mobileNav) mobileNav.classList.remove("active");
  if (navBackdrop) navBackdrop.hidden = true;
}





/* =========================================
   AUTH UI
========================================= */

function openAuth() {
  if (els.authOverlay) els.authOverlay.classList.add('open');
  if (els.authModal) {
    els.authModal.classList.add('open');
    els.authModal.setAttribute('aria-hidden', 'false');
  }
}

function closeAuth() {
  if (els.authOverlay) els.authOverlay.classList.remove('open');
  if (els.authModal) {
    els.authModal.classList.remove('open');
    els.authModal.setAttribute('aria-hidden', 'true');
  }
}

function switchAuthTab(tabName) {
  els.authTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.authTab === tabName);
  });

  els.authPanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.authPanel === tabName);
  });
}

function syncMobileLoginButton(isLoggedIn = false) {
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  if (!mobileLoginBtn) return;

  if (isLoggedIn) {
    mobileLoginBtn.textContent = 'Logout';
    mobileLoginBtn.classList.add('active');
  } else {
    mobileLoginBtn.textContent = 'Login';
    mobileLoginBtn.classList.remove('active');
  }
}

function bindSidebarButtons() {
  document.getElementById('sidebarLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('login');
    openAuth();
  });

  document.getElementById('sidebarSignupBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('signup');
    openAuth();
  });

  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (auth) await signOut(auth);
  });
}

function setLoggedOutState() {
  currentUserProfile = null;

  if (els.openAuthBtn) {
    els.openAuthBtn.textContent = 'Login';
    els.openAuthBtn.classList.remove('active');
  }

  syncMobileLoginButton(false);

  if (els.profileAvatar) els.profileAvatar.textContent = 'WL';
  if (els.profileName) els.profileName.textContent = 'Guest Listener';
  if (els.profileRole) els.profileRole.textContent = 'Listener • Not signed in';
  if (els.profileBio) {
    els.profileBio.textContent = 'Log in to post, comment, like, and build your Wildstyle profile.';
  }
  if (els.profilePosts) els.profilePosts.textContent = '0';

  if (els.profileActions) {
    els.profileActions.innerHTML = `
      <a href="#" class="btn-primary small-btn" id="sidebarLoginBtn">Login</a>
      <a href="#" class="btn-secondary small-btn" id="sidebarSignupBtn">Sign Up</a>
    `;
    bindSidebarButtons();
  }
}

async function updateProfilePostCount(uid) {
  if (!db || !els.profilePosts) return;

  try {
    const q = query(collection(db, 'posts'), where('uid', '==', uid));
    const snap = await getDocs(q);
    els.profilePosts.textContent = String(snap.size);
  } catch {
    els.profilePosts.textContent = '0';
  }
}

async function setLoggedInState(user) {
  let profileData = {
    displayName: user.displayName || user.email?.split('@')[0] || 'Wildstyle User',
    role: 'Listener',
    bio: 'Wildstyle community member.'
  };

  if (db) {
    const profileRef = doc(db, 'users', user.uid);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      profileData = { ...profileData, ...snap.data() };
    }
  }

  currentUserProfile = {
    uid: user.uid,
    displayName: profileData.displayName,
    role: profileData.role || 'Listener',
    bio: profileData.bio || 'Wildstyle community member.'
  };

  if (els.openAuthBtn) {
    els.openAuthBtn.textContent = 'Logout';
    els.openAuthBtn.classList.add('active');
  }

  syncMobileLoginButton(true);

  if (els.profileAvatar) els.profileAvatar.textContent = initialsFromName(profileData.displayName);
  if (els.profileName) els.profileName.textContent = profileData.displayName;
  if (els.profileRole) els.profileRole.textContent = `${profileData.role || 'Listener'} • Signed in`;
  if (els.profileBio) els.profileBio.textContent = profileData.bio || 'Wildstyle community member.';

  if (els.profileActions) {
    els.profileActions.innerHTML = `
      <a href="#" class="btn-primary small-btn">View Profile</a>
      <a href="#" class="btn-secondary small-btn" id="sidebarLogoutBtn">Logout</a>
    `;
    bindSidebarButtons();
  }

  await updateProfilePostCount(user.uid);
}

async function handleLogin(e) {
  e.preventDefault();

  if (usingPlaceholders || !auth) {
    setAuthMessage('Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage('Logging in...');

    await signInWithEmailAndPassword(
      auth,
      els.loginEmail.value.trim(),
      els.loginPassword.value
    );

    if (els.loginForm) els.loginForm.reset();
    closeAuth();
    setAuthMessage('Logged in.');
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/invalid-credential') {
      setAuthMessage('Incorrect email or password.', true);
    } else {
      setAuthMessage(error.message, true);
    }
  }
}

async function handleSignup(e) {
  e.preventDefault();

  if (usingPlaceholders || !auth || !db) {
    setAuthMessage('Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage('Creating account...');

    const displayName = els.signupDisplayName.value.trim();
    const email = els.signupEmail.value.trim();

    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      els.signupPassword.value
    );

    await updateProfile(cred.user, { displayName });

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      bio: 'New to Wildstyle Social Beta.',
      role: 'Listener',
      createdAt: serverTimestamp()
    });

    if (els.signupForm) els.signupForm.reset();
    closeAuth();
    setAuthMessage('Account created.');
  } catch (error) {
    console.error('Signup error:', error);
    setAuthMessage(error.message, true);
  }
}

function bindAuthUI() {
  if (els.openAuthBtn) {
    els.openAuthBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      if (els.openAuthBtn.textContent === 'Logout' && auth) {
        await signOut(auth);
      } else {
        switchAuthTab('login');
        openAuth();
      }
    });
  }

  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      closeMenu();

      if (mobileLoginBtn.textContent === 'Logout' && auth) {
        await signOut(auth);
      } else {
        switchAuthTab('login');
        openAuth();
      }
    });
  }

  if (els.closeAuthBtn) els.closeAuthBtn.addEventListener('click', closeAuth);
  if (els.authOverlay) els.authOverlay.addEventListener('click', closeAuth);

  els.authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab));
  });

  if (els.loginForm) els.loginForm.addEventListener('submit', handleLogin);
  if (els.signupForm) els.signupForm.addEventListener('submit', handleSignup);
} 



/* =========================================
   FEED / POSTS
========================================= */

function cleanupCommentListeners() {
  commentUnsubscribers.forEach((unsubscribe) => {
    try { unsubscribe(); } catch {}
  });
  commentUnsubscribers.clear();
}

function defaultPostsMarkup() {
  return `
    <article class="post">
      <div class="post-top">
        <div class="author">
          <div class="avatar">DJ</div>
          <div>
            <strong>DJ EchoFalls</strong>
            <small>Verified DJ • 7 mins ago</small>
          </div>
        </div>
        <span class="badge">Pinned Update</span>
      </div>
      <p>Going live tonight with a proper multi-genre workout. Drop your requests, jump in the chat, and let’s make it a madness 🔥</p>
      <div class="post-actions">
        <button class="like-btn" data-liked="false"><span class="like-count">128</span> Likes</button>
        <button class="comment-toggle" data-target="comments-demo-1">💬 <span class="comment-count">2</span> Comments</button>
        <button>📌 Pinned</button>
      </div>
      <div class="comments-box" id="comments-demo-1">
        <div class="comment-item"><strong>Laura:</strong> Can’t wait for tonight 🔥</div>
        <div class="comment-item"><strong>Mike:</strong> Requests locked and loaded!</div>
        <form class="comment-form">
          <input type="text" placeholder="Write a comment..." maxlength="140">
          <button type="submit">Post</button>
        </form>
      </div>
    </article>
  `;
}

function bindDemoInteractions() {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.like-count');
      if (!countEl) return;

      let count = Number(countEl.textContent || 0);
      const liked = btn.dataset.liked === 'true';

      if (liked) {
        count -= 1;
        btn.dataset.liked = 'false';
        btn.classList.remove('liked');
      } else {
        count += 1;
        btn.dataset.liked = 'true';
        btn.classList.add('liked');
      }

      countEl.textContent = String(count);
    });
  });

  document.querySelectorAll('.comment-toggle').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.toggle('open');
    });
  });

  document.querySelectorAll('.comment-form').forEach((form) => {
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const value = input?.value.trim();
      if (!value) return;

      const box = form.closest('.comments-box');
      const toggleBtn = box ? document.querySelector(`[data-target="${box.id}"]`) : null;
      const countEl = toggleBtn?.querySelector('.comment-count');

      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `<strong>You:</strong> ${escapeHtml(value)}`;
      form.before(item);

      if (input) input.value = '';
      if (countEl) countEl.textContent = String(Number(countEl.textContent || 0) + 1);
    });
  });
}

function listenForComments(postId) {
  if (!db || usingPlaceholders) return;

  const commentsList = document.getElementById(`comments-list-${postId}`);
  if (!commentsList) return;

  if (commentUnsubscribers.has(postId)) {
    commentUnsubscribers.get(postId)();
    commentUnsubscribers.delete(postId);
  }

  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    commentsList.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const comment = docSnap.data();

      commentsList.innerHTML += `
        <div class="comment-item">
          <strong>${escapeHtml(comment.authorName || 'User')}</strong>
          <div>${escapeHtml(comment.text || '')}</div>
          <small style="display:block;margin-top:6px;color:#b8a9d6;">${escapeHtml(formatDate(comment.createdAt))}</small>
        </div>
      `;
    });
  }, (error) => {
    console.error('Comments listener error:', error);
  });

  commentUnsubscribers.set(postId, unsubscribe);
}

function bindLivePostButtons() {
  document.querySelectorAll('.comment-toggle').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.toggle('open');
    });
  });

  document.querySelectorAll('.live-comment-submit').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      await addComment(btn.dataset.postId);
    });
  });

  document.querySelectorAll('.delete-post-btn').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      await deletePost(btn.dataset.postId);
    });
  });
}

function renderFeed(posts) {
  if (!els.feedContainer) return;

  cleanupCommentListeners();

  if (!posts.length) {
    els.feedContainer.innerHTML = defaultPostsMarkup();
    bindDemoInteractions();
    return;
  }

  els.feedContainer.innerHTML = '';

  posts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'post';

    const created = formatDate(post.createdAt);
    const canDelete = auth?.currentUser && post.uid === auth.currentUser.uid;

    article.innerHTML = `
      <div class="post-top">
        <div class="author">
          <div class="avatar">${initialsFromName(post.authorName || 'WS')}</div>
          <div>
            <strong>${escapeHtml(post.authorName || 'Wildstyle User')}</strong>
            <small>${escapeHtml(post.role || 'Listener')} • ${escapeHtml(created)}</small>
          </div>
        </div>
        <span class="badge">Live Post</span>
      </div>

      <p>${escapeHtml(post.text || '')}</p>

      <div class="post-actions">
        <button onclick="likePost('${post.id}')">
          ❤️ ${Number(post.likesCount || 0)} Likes
        </button>
        <button class="comment-toggle" data-target="comments-box-${post.id}">
          💬 Comments
        </button>
        ${canDelete ? `<button class="delete-post-btn" data-post-id="${post.id}">🗑 Delete</button>` : ''}
      </div>

      <div class="comments-box" id="comments-box-${post.id}">
        <div id="comments-list-${post.id}"></div>
        <div class="comment-form">
          <input
            type="text"
            id="comment-input-${post.id}"
            placeholder="Write a comment..."
            maxlength="140"
          />
          <button type="button" class="live-comment-submit" data-post-id="${post.id}">Post</button>
        </div>
      </div>
    `;

    els.feedContainer.appendChild(article);
  });

  bindLivePostButtons();

  posts.forEach((post) => {
    listenForComments(post.id);
  });
}

function listenForPosts() {
  if (!els.feedContainer) return;
  if (unsubscribePosts) unsubscribePosts();

  if (usingPlaceholders || !db) {
    renderFeed([]);
    return;
  }

  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(12)
  );

  unsubscribePosts = onSnapshot(q, async (snapshot) => {
    const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFeed(posts);

    if (auth?.currentUser) {
      await updateProfilePostCount(auth.currentUser.uid);
    }
  }, (error) => {
    console.error('Feed error:', error);
    renderFeed([]);
  });
}

async function createPost() {
  if (usingPlaceholders || !auth || !db) {
    setPostMessage('Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser || !currentUserProfile) {
    setPostMessage('Login to create a post.', true);
    openAuth();
    return;
  }

  const text = els.postInput?.value.trim();
  if (!text) {
    setPostMessage('Write something before posting.', true);
    return;
  }

  try {
    if (els.createPostBtn) {
      els.createPostBtn.disabled = true;
      els.createPostBtn.textContent = 'Posting...';
    }

    setPostMessage('');

    await addDoc(collection(db, 'posts'), {
      uid: auth.currentUser.uid,
      authorName: currentUserProfile.displayName,
      role: currentUserProfile.role || 'Listener',
      text,
      likesCount: 0,
      createdAt: serverTimestamp()
    });

    if (els.postInput) els.postInput.value = '';
    setPostMessage('✅ Post published!');
  } catch (error) {
    console.error('Create post error:', error);
    setPostMessage(error.message, true);
  } finally {
    if (els.createPostBtn) {
      els.createPostBtn.disabled = false;
      els.createPostBtn.textContent = 'Post Now';
    }
  }
}

async function addComment(postId) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage('Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser || !currentUserProfile) {
    setPostMessage('Login to comment.', true);
    openAuth();
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  const text = input?.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      uid: auth.currentUser.uid,
      authorName: currentUserProfile.displayName,
      text,
      createdAt: serverTimestamp()
    });

    input.value = '';
  } catch (error) {
    console.error('Add comment error:', error);
  }
}

async function likePost(postId) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage('Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser) {
    setPostMessage('Login to like posts.', true);
    openAuth();
    return;
  }

  const userId = auth.currentUser.uid;
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'posts', postId, 'likes', userId);

  try {
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      const likeSnap = await transaction.get(likeRef);

      if (!postSnap.exists()) throw new Error('Post not found.');

      const currentLikes = Number(postSnap.data().likesCount || 0);

      if (likeSnap.exists()) {
        transaction.delete(likeRef);
        transaction.update(postRef, {
          likesCount: Math.max(0, currentLikes - 1)
        });
      } else {
        transaction.set(likeRef, {
          uid: userId,
          createdAt: serverTimestamp()
        });
        transaction.update(postRef, {
          likesCount: currentLikes + 1
        });
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
  }
}

async function deletePost(postId) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage('Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser) {
    setPostMessage('Login to delete posts.', true);
    openAuth();
    return;
  }

  const ok = confirm('Delete this post?');
  if (!ok) return;

  try {
    await deleteDoc(doc(db, 'posts', postId));
    setPostMessage('🗑️ Post deleted.');
  } catch (error) {
    console.error('Delete post error:', error);
    setPostMessage(error.message, true);
  }
}

/* =========================================
   REQUESTS TICKER
========================================= */

async function loadRequestsTicker() {
  if (!els.requestTickerText || !els.requestTickerClone) return;

  try {
    const res = await fetch(REQUEST_TICKER_CSV + '&t=' + Date.now());
    const csv = await res.text();
    const rows = csv.trim().split('\n');
    rows.shift();

    const items = rows.map(row => {
      const cols = parseCSV(row);
      const name = cols[1] || 'Listener';
      const song = cols[2] || 'Unknown Song';
      const artist = cols[3] || 'Unknown Artist';
      return `${name} requested ${song} - ${artist}`;
    }).filter(Boolean).slice(-10);

    const text = items.length ? items.join(' • ') : 'No requests yet — be the first!';
    els.requestTickerText.textContent = text;
    els.requestTickerClone.textContent = text;
  } catch {
    els.requestTickerText.textContent = 'Requests unavailable right now.';
    els.requestTickerClone.textContent = els.requestTickerText.textContent;
  }
}

/* =========================================
   REQUEST PAGE STATUS
========================================= */

function showRequestSuccess() {
  setTimeout(() => {
    if (els.requestSuccess) {
      els.requestSuccess.classList.remove('hidden');
      setTimeout(() => els.requestSuccess?.classList.add('hidden'), 5000);
    }

    if (els.requestForm) els.requestForm.reset();
  }, 900);
}

async function checkRequestStatus() {
  if (!els.requestForm || !els.requestClosed) return;

  try {
    const res = await fetch(REQUEST_STATUS_URL + '?t=' + Date.now());
    const data = await res.json();

    const isOpen = String(data.requests || '').trim().toUpperCase() === 'ON';

    if (isOpen) {
      els.requestForm.style.display = 'flex';
      els.requestClosed.classList.add('hidden');
    } else {
      els.requestForm.style.display = 'none';
      els.requestSuccess?.classList.add('hidden');
      els.requestClosed.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Request status check failed:', err);
    els.requestForm.style.display = 'none';
    els.requestClosed.innerHTML = '⚠️ Request status unavailable right now.<br>Please try again later.';
    els.requestClosed.classList.remove('hidden');
  }
}

/* =========================================
   NOW ON / UP NEXT
========================================= */



function parseTime(t) {
  t = String(t || '').trim().toLowerCase();
  const m = t.match(/(\d{1,2})(?::(\d{2}))?(am|pm)/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2] || '0', 10);
  const ampm = m[3];

  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;

  return h * 60 + mins;
}

function slotStartEndMinutes(slot) {
  const start = parseTime(slot.start);
  const end = parseTime(slot.end);
  if (start == null || end == null) return null;

  return {
    start,
    end,
    crossesMidnight: end <= start
  };
}

function findCurrentSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const today = DAY_ORDER[dayNum - 1];
  const prev = DAY_ORDER[(dayNum + 5) % 7];

  for (const s of slots) {
    const r = slotStartEndMinutes(s);
    if (!r) continue;

    if (s.day === today) {
      if (!r.crossesMidnight && mins >= r.start && mins < r.end) return s;
      if (r.crossesMidnight && (mins >= r.start || mins < r.end)) return s;
    }

    if (s.day === prev && r.crossesMidnight && mins < r.end) return s;
  }

  return null;
}

function findUpNextSlot(slots) {
  const { dayNum, mins } = getNowMinutes();
  const list = [];

  for (let o = 0; o < 7; o++) {
    const day = DAY_ORDER[(dayNum - 1 + o) % 7];

    for (const s of slots.filter(x => x.day === day)) {
      if ((s.dj || '').toLowerCase() === 'free') continue;

      const r = slotStartEndMinutes(s);
      if (!r) continue;

      if (o === 0) {
        if (!r.crossesMidnight && r.start > mins) list.push({ o, start: r.start, s });
        if (r.crossesMidnight && mins < r.start) list.push({ o, start: r.start, s });
      } else {
        list.push({ o, start: r.start, s });
      }
    }
  }

  list.sort((a, b) => a.o - b.o || a.start - b.start);
  return list[0]?.s || null;
}

async function loadNowOnAndUpNext() {
  if (!els.nowOn && !els.upNext && !els.scheduleNowOn && !els.scheduleUpNext) return;

  try {
    const res = await fetch(SCHEDULE_URL + '?v=' + Date.now());
    const data = await res.json();

    const slots = (data.slots || []).map(slot => ({
      day: normDay(slot.day),
      start: slot.start,
      end: slot.end,
      dj: slot.dj || 'Free'
    }));

    const now = findCurrentSlot(slots);
    const next = findUpNextSlot(slots);

    if (els.nowOn) {
      els.nowOn.textContent = now
        ? `${now.dj} (${now.start}–${now.end})`
        : 'Off Air';
    }

    if (els.upNext) {
      els.upNext.textContent = next
        ? `${next.dj} (${next.start}–${next.end})`
        : 'No upcoming shows';
    }

    if (els.scheduleNowOn) {
      els.scheduleNowOn.textContent = now
        ? `Now On: ${now.dj} (${now.start}–${now.end})`
        : 'Now On: Off Air';
    }

    if (els.scheduleUpNext) {
      els.scheduleUpNext.textContent = next
        ? `${next.dj} (${next.start}–${next.end})`
        : 'No upcoming shows';
    }
  } catch (err) {
    console.error('Now On / Up Next load failed:', err);

    if (els.nowOn) els.nowOn.textContent = 'Unavailable';
    if (els.upNext) els.upNext.textContent = 'Unavailable';
    if (els.scheduleNowOn) els.scheduleNowOn.textContent = 'Now On: Unavailable';
    if (els.scheduleUpNext) els.scheduleUpNext.textContent = 'Unavailable';
  }
}

/* =========================================
   BINDINGS
========================================= */

function bindAuthUI() {
  els.authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.authTab));
  });

  els.openAuthBtn?.addEventListener('click', async (e) => {
    e.preventDefault();

    if (els.openAuthBtn.textContent === 'Logout' && auth) {
      await signOut(auth);
    } else {
      openAuth();
    }
  });

  els.closeAuthBtn?.addEventListener('click', closeAuth);
  els.authOverlay?.addEventListener('click', closeAuth);

  els.loginForm?.addEventListener('submit', handleLogin);
  els.signupForm?.addEventListener('submit', handleSignup);
}

function bindFeedUI() {
  els.createPostBtn?.addEventListener('click', createPost);
}

/* =========================================
   INIT
========================================= */

function initAuthState() {
  if (usingPlaceholders) {
    setLoggedOutState();
    listenForPosts();
    setAuthMessage('Paste your Firebase config first.');
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setLoggedInState(user);
    } else {
      setLoggedOutState();
    }
    listenForPosts();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("burger");
  const navClose = document.getElementById("navClose");
  const navBackdrop = document.getElementById("navBackdrop");

  detectDesktopModeOnMobile();
  window.addEventListener("resize", detectDesktopModeOnMobile);

  if (burger) burger.addEventListener("click", openMenu);
  if (navClose) navClose.addEventListener("click", closeMenu);
  if (navBackdrop) navBackdrop.addEventListener("click", closeMenu);

  bindAuthUI();
  bindSidebarButtons();

  loadNowOnAndUpNext();
  setInterval(loadNowOnAndUpNext, 60000);
}); 

/* =========================================
   GLOBALS FOR INLINE HTML
========================================= */

window.likePost = likePost;
window.addComment = addComment;
window.deletePost = deletePost;
window.showRequestSuccess = showRequestSuccess; 


/* =========================================
   GETUK NOW
========================================= */
function getUKNow() {
  const now = new Date();

  // BST calculation
  const startBST = new Date(Date.UTC(now.getUTCFullYear(), 2, 31));
  startBST.setUTCDate(31 - startBST.getUTCDay());

  const endBST = new Date(Date.UTC(now.getUTCFullYear(), 9, 31));
  endBST.setUTCDate(31 - endBST.getUTCDay());

  const isBST = now >= startBST && now < endBST;

  return new Date(now.getTime() + (isBST ? 3600000 : 0));
}

function updateUpNext() {
  const el = document.getElementById("upNext");
  if (!el) return;

  const now = getUKNow();
  const day = now.getDay() === 0 ? 7 : now.getDay(); // Sun = 7
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // 🔥 YOUR SCHEDULE (EDIT THIS)
  const schedule = {
    1: [ // Monday
      { start: 21 * 60, end: 22 * 60, name: "Matt Baker" }
    ],
    4: [ // Thursday
      { start: 19 * 60, end: 20 * 60, name: "DJ EchoFalls" }
    ],
    7: [ // Sunday
      { start: 20 * 60, end: 21 * 60, name: "DJ EchoFalls" }
    ]
  };

  const today = schedule[day] || [];

  let nextShow = null;

  for (let show of today) {
    if (show.start > minutesNow) {
      nextShow = show;
      break;
    }
  }

  // If no more shows today → get tomorrow
  if (!nextShow) {
    const nextDay = day === 7 ? 1 : day + 1;
    const tomorrow = schedule[nextDay] || [];
    if (tomorrow.length > 0) {
      nextShow = tomorrow[0];
    }
  }

  if (!nextShow) {
    el.innerHTML = "No upcoming shows";
    return;
  }

  const startHour = Math.floor(nextShow.start / 60);
  const endHour = Math.floor(nextShow.end / 60);

  el.innerHTML = `
    ${nextShow.name}<br>
    <span class="muted-inline">${formatTime(startHour)}–${formatTime(endHour)} UK</span>
  `;
}

function formatTime(hour) {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour % 12 || 12;
  return `${h}${suffix}`;
} 


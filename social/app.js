import { firebaseConfig } from '.https://wildstyle.vip/social/firebase-config.js'; 
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
  updateDoc,
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



const usingPlaceholders = Object.values(firebaseConfig).some(v => String(v).includes('PASTE_'));
let auth = null;
let db = null;
let currentUserProfile = null;
let unsubscribePosts = null;

if (!usingPlaceholders) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const els = {
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
  postInput: document.getElementById('postInput'),
  createPostBtn: document.getElementById('createPostBtn'),
  postStatus: document.getElementById('postStatus'),
  feedContainer: document.getElementById('feedContainer'),
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileRole: document.getElementById('profileRole'),
  profileBio: document.getElementById('profileBio'),
  profilePosts: document.getElementById('profilePosts'),
  profileActions: document.getElementById('profileActions'),
  requestTickerText: document.getElementById('requestTickerText'),
  requestTickerClone: document.getElementById('requestTickerClone')
};

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initialsFromName(name = 'WS') {
  return name.split(' ').map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
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

function openAuth() {
  els.authOverlay?.classList.add('open');
  els.authModal?.classList.add('open');
  els.authModal?.setAttribute('aria-hidden', 'false');
}

function closeAuth() {
  els.authOverlay?.classList.remove('open');
  els.authModal?.classList.remove('open');
  els.authModal?.setAttribute('aria-hidden', 'true');
}

function switchAuthTab(tabName) {
  els.authTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === tabName));
  els.authPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.authPanel === tabName));
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

  if (els.profileAvatar) els.profileAvatar.textContent = 'WL';
  if (els.profileName) els.profileName.textContent = 'Guest Listener';
  if (els.profileRole) els.profileRole.textContent = 'Listener • Not signed in';
  if (els.profileBio) els.profileBio.textContent = 'Log in to post, comment, like, and build your Wildstyle profile.';
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

  const profileRef = doc(db, 'users', user.uid);
  const snap = await getDoc(profileRef);
  if (snap.exists()) {
    profileData = { ...profileData, ...snap.data() };
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

function bindPostInteractions() {
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

function renderFeed(posts) {
  if (!els.feedContainer) return;

  if (!posts.length) {
    els.feedContainer.innerHTML = defaultPostsMarkup();
    bindPostInteractions();
    return;
  }

  els.feedContainer.innerHTML = '';

  posts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'post';

    const created = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Just now';

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
        <button class="post-like-btn" data-post-id="${post.id}" data-likes="${Number(post.likesCount || 0)}">
          ❤️ ${Number(post.likesCount || 0)} Likes
        </button>
      </div>
    `;

    els.feedContainer.appendChild(article);
  });

  const defaults = document.createElement('div');
  defaults.innerHTML = defaultPostsMarkup();
  while (defaults.firstChild) {
    els.feedContainer.appendChild(defaults.firstChild);
  }

  bindPostInteractions();
  bindRealtimeLikeButtons();
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

  unsubscribePosts = onSnapshot(q, (snapshot) => {
    els.feedContainer.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const article = document.createElement('div');
      article.className = 'post';

      article.innerHTML = `
        <div class="post-top">
          <div class="author">
            <div class="avatar">WS</div>
            <div>
              <strong>${escapeHtml(post.authorName || 'Wildstyle User')}</strong>
              <small>${escapeHtml(post.role || 'Listener')}</small>
            </div>
          </div>
        </div>

        <p>${escapeHtml(post.text || '')}</p>

        <div class="post-actions">
          <button onclick="likePost('${docSnap.id}', ${post.likesCount || 0})">
            ❤️ ${post.likesCount || 0} Likes
          </button>
        </div>
      `;

      els.feedContainer.appendChild(article);
    });

    if (auth?.currentUser) {
      updateProfilePostCount(auth.currentUser.uid);
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
    els.createPostBtn.disabled = true;
    els.createPostBtn.textContent = 'Posting...';
    setPostMessage('');

    await addDoc(collection(db, 'posts'), {
      uid: auth.currentUser.uid,
      authorName: currentUserProfile.displayName,
      role: currentUserProfile.role || 'Listener',
      text,
      likesCount: 0,
      createdAt: serverTimestamp()
    });

    els.postInput.value = '';
    setPostMessage('✅ Post published!');
  } catch (error) {
    console.error('Create post error:', error);
    setPostMessage(error.message, true);
  } finally {
    els.createPostBtn.disabled = false;
    els.createPostBtn.textContent = 'Post Now';
  }
}

async function likePost(postId, currentLikes = 0) {
  if (usingPlaceholders || !db) {
    setPostMessage('Paste your Firebase config first.', true);
    return;
  }

  try {
    const ref = doc(db, 'posts', postId);
    await updateDoc(ref, {
      likesCount: Number(currentLikes || 0) + 1
    });
  } catch (error) {
    console.error('Like post error:', error);
  }
}

function bindRealtimeLikeButtons() {
  document.querySelectorAll('.post-like-btn').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      const postId = btn.dataset.postId;
      const currentLikes = Number(btn.dataset.likes || 0);
      await likePost(postId, currentLikes);
    });
  });
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

async function loadRequestsTicker() {
  if (!els.requestTickerText || !els.requestTickerClone) return;

  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTN3Wl2Tq0brZrYyKWkN-Dz1Ze4bjq3-S0iIL1O5Zo3CsT1S463y2surOifH4CLB2zHQHoR9paj0Mdk/pub?gid=0&single=true&output=csv';

  try {
    const res = await fetch(url + '&t=' + Date.now());
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
els.createPostBtn?.addEventListener('click', createPost);

els.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (usingPlaceholders || !auth) {
    setAuthMessage('Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage('Logging in...');
    await signInWithEmailAndPassword(auth, els.loginEmail.value.trim(), els.loginPassword.value);
    els.loginForm.reset();
    closeAuth();
    setAuthMessage('Logged in.');
  } catch (error) {
    console.error('Login error:', error);
    setAuthMessage(error.message, true);
  }
});

els.signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (usingPlaceholders || !auth || !db) {
    setAuthMessage('Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage('Creating account...');

    const cred = await createUserWithEmailAndPassword(
      auth,
      els.signupEmail.value.trim(),
      els.signupPassword.value
    );

    await updateProfile(cred.user, {
      displayName: els.signupDisplayName.value.trim()
    });

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName: els.signupDisplayName.value.trim(),
      email: els.signupEmail.value.trim(),
      bio: 'New to Wildstyle Social Beta.',
      role: 'Listener',
      createdAt: serverTimestamp()
    });

    els.signupForm.reset();
    closeAuth();
    setAuthMessage('Account created.');
  } catch (error) {
    console.error('Signup error:', error);
    setAuthMessage(error.message, true);
  }
});

if (usingPlaceholders) {
  setLoggedOutState();
  listenForPosts();
  setAuthMessage('Paste your Firebase config first.');
} else {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setLoggedInState(user);
    } else {
      setLoggedOutState();
    }
    listenForPosts();
  });
}

window.likePost = likePost;

bindSidebarButtons();
bindPostInteractions();
bindRealtimeLikeButtons();
loadRequestsTicker();
setInterval(loadRequestsTicker, 15000); 


console.log
const container = document.getElementById("noticeboard");
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
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
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




/* =========================================
   ELEMENTS
========================================= */

const els = {
  // nav / burger
  burger: document.getElementById('burger'),
  navClose: document.getElementById('navClose'),
  navBackdrop: document.getElementById('navBackdrop'),
  mobileNav: document.getElementById('mobileNav'),
  mobileLoginBtn: document.getElementById('mobileLoginBtn'),

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

  
  // profile
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileRole: document.getElementById('profileRole'),
  profileBio: document.getElementById('profileBio'),
  profilePosts: document.getElementById('profilePosts'),
  profileActions: document.getElementById('profileActions'),

  
 

  
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
  return String(name)
    .split(' ')
    .map(p => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'WS';
}

function formatDate(value) {
  return value?.toDate ? value.toDate().toLocaleString() : 'Just now';
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

/* =========================================
   RESPONSIVE NAV / BURGER
========================================= */

document.addEventListener('DOMContentLoaded', () => {
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      const sidebar = document.querySelector('.sidebar');

      mobileMenuBtn.addEventListener('click', () => {
        // This toggles an 'active' class on both the sidebar and the button
        sidebar.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
      });
    });




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
  if (!els.mobileLoginBtn) return;

  if (isLoggedIn) {
    els.mobileLoginBtn.textContent = 'Logout';
    els.mobileLoginBtn.classList.add('active');
  } else {
    els.mobileLoginBtn.textContent = 'Login';
    els.mobileLoginBtn.classList.remove('active');
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

const captchaResponse = grecaptcha.getResponse();

if (!captchaResponse) {
  setAuthMessage(
    'Please complete the reCAPTCHA.',
    true
  );
  return;
}
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

  if (els.mobileLoginBtn) {
    els.mobileLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      closeMenu();

      if (els.mobileLoginBtn.textContent === 'Logout' && auth) {
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
   WILDPICKS
========================================= */
const wildyPicks = [
  {
    name: "DJ Nala",
    image: "/images/djnala.jpg",
    text: "Bringing the hottest genres every week with proper community energy."
  },
  {
    name: "DJ Marty",
    image: "/images/marty.jpg",
    text: "80s, 90s and today's biggest hits every Tuesday."
  },
  {
    name: "DJ Stormzy",
    image: "/images/spark.jpeg",
    text: "House and garage vibes with plenty of energy."
  },
  {
    name: "DJ EchoFalls",
    image: "/images/echo1.png",
    text: "Founder of Wildstyle Radio and master of multi-genre mayhem."
  },
{
    name: "HotShotDj",
    image: "/images/hotshot.jpg",
    text: "Co-Owner Of Wildstyle Radio Master Of All Genres."
  },
];

const today = new Date().getDate();
const pick = wildyPicks[today % wildyPicks.length];

document.getElementById("wildyDjName").textContent = pick.name;
document.getElementById("wildyDjImage").src = pick.image;
document.getElementById("wildyDjText").textContent = pick.text;


/*===================≠======================
NOTICEBOARD
==================≠===========≠============*/

const NOTICEBOARD_URL =
  "https://script.google.com/macros/s/AKfycbzHscoN4-nXH5PX9FlV0rqorP9SDD7_ZWf6-JSamyK5ylJ3ZoLN6DjoE3QrzBE6Fbw/exec";

async function loadNoticeboard() {

  const container = document.getElementById("noticeboard");

  if (!container) return;

  try {

    const res = await fetch(NOTICEBOARD_URL);
    const notices = await res.json();

    notices.shift(); // Remove header row

    container.innerHTML = notices.map(row => `
      <div class="notice-item">
        <small>${row[1]}</small>
        <strong>${row[2]}</strong>
        <p>${row[3]}</p>
      </div>
    `).join("");

  } catch (err) {

    console.error(err);

    container.innerHTML =
      "<div class='notice-item'>Unable to load notices.</div>";
  }
}

loadNoticeboard();

/* =========================================
   INITIAL BINDING
========================================= */

function bindCoreUI() {
  detectDesktopModeOnMobile();
  window.addEventListener('resize', detectDesktopModeOnMobile);

  if (els.burger) els.burger.addEventListener('click', openMenu);
  if (els.navClose) els.navClose.addEventListener('click', closeMenu);
  if (els.navBackdrop) els.navBackdrop.addEventListener('click', closeMenu);

  bindAuthUI();
  bindSidebarButtons();

  if (els.createPostBtn) els.createPostBtn.addEventListener('click', createPost);
}

/* =========================================
   AUTH STATE / STARTUP
========================================= */

document.addEventListener('DOMContentLoaded', () => {
  bindCoreUI();

  



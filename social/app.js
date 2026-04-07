import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import {
  openAuth,
  closeAuth,
  switchAuthTab,
  setLoggedOutState,
  setLoggedInState,
  updateProfilePostCount,
  handleLogin,
  handleSignup,
  bindSidebarButtons,
  setAuthMessage
} from './auth.js';

import {
  createPost,
  likePost,
  addComment,
  deletePost,
  startFeedListener,
  bindDemoInteractions
} from './feed.js';

import { loadRequestsTicker } from './requests.js';

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

function restartFeed() {
  if (unsubscribePosts) unsubscribePosts();

  unsubscribePosts = startFeedListener({
    auth,
    db,
    els,
    usingPlaceholders,
    currentUserProfile,
    openAuth: () => openAuth(els),
    onPostsUpdated: async () => {
      if (auth?.currentUser) {
        await updateProfilePostCount({ db, els, uid: auth.currentUser.uid });
      }
    }
  });
}

els.authTabs.forEach(tab => {
  tab.addEventListener('click', () => switchAuthTab(els, tab.dataset.authTab));
});

els.openAuthBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  if (els.openAuthBtn.textContent === 'Logout' && auth) {
    await signOut(auth);
  } else {
    openAuth(els);
  }
});

els.closeAuthBtn?.addEventListener('click', () => closeAuth(els));
els.authOverlay?.addEventListener('click', () => closeAuth(els));

els.createPostBtn?.addEventListener('click', async () => {
  await createPost({
    auth,
    db,
    els,
    usingPlaceholders,
    currentUserProfile,
    openAuth: () => openAuth(els)
  });
});

els.loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleLogin({ auth, els, usingPlaceholders });
});

els.signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleSignup({ auth, db, els, usingPlaceholders });
});

if (usingPlaceholders) {
  setLoggedOutState(els);
  restartFeed();
  setAuthMessage(els, 'Paste your Firebase config first.');
} else {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserProfile = await setLoggedInState({ db, els, user });
    } else {
      currentUserProfile = null;
      setLoggedOutState(els);
    }

    bindSidebarButtons({ els, auth });
    restartFeed();
  });
}

window.likePost = (postId) => likePost({
  auth,
  db,
  els,
  usingPlaceholders,
  openAuth: () => openAuth(els),
  postId
});

window.addComment = (postId) => addComment({
  auth,
  db,
  els,
  usingPlaceholders,
  currentUserProfile,
  openAuth: () => openAuth(els),
  postId
});

window.deletePost = (postId) => deletePost({
  auth,
  db,
  els,
  usingPlaceholders,
  openAuth: () => openAuth(els),
  postId
});

bindSidebarButtons({ els, auth });
bindDemoInteractions();
loadRequestsTicker(els);
setInterval(() => loadRequestsTicker(els), 15000); 

/* =========================
   NOW ON (UK station time)
========================= */

const SCHEDULE_URL =
  "https://script.google.com/macros/s/AKfycby2xfvFxbHKAizMqHrl-p-JqxsGR5D7n7BMKCZhZblDyAm-VHw6VyaXX8vVl7d27Bs/exec";

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

async function loadNowOn() {
  const nowEl = document.getElementById("nowon");
  if (!nowEl) return;

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

    nowEl.textContent = now
      ? `${now.dj} (${now.start}–${now.end})`
      : "Off Air";
  } catch (err) {
    console.error("Now On load failed:", err);
    nowEl.textContent = "Unavailable";
  }
}

loadNowOn();
setInterval(loadNowOn, 60000); 

/* -------------------------
   FETCH + INIT
------------------------- */
async function loadSchedule() {
  try {
    const res = await fetch(SCHEDULE_URL + "?v=" + Date.now(), { cache: "no-store" });
    const data = await res.json();

    // supports either {slots:[...]} or plain [...]
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.slots)) return data.slots;

    console.error("Unexpected schedule response:", data);
    return [];
  } catch (e) {
    console.error("Schedule load error:", e);
    return [];
  }
}

async function initSchedule() {
  const rawSlots = await loadSchedule();

  const slots = rawSlots.map(s => ({
    day: normDay(s.day),
    start: s.start,
    end: s.end,
    dj: s.dj || "Free"
  })).filter(s => s.day && s.start && s.end);

  window.ALL_SLOTS = slots;

  renderSchedule(slots);
  updateNowNext();

  setInterval(updateNowNext, 60000);
}

function updateNowNext() {
  if (!window.ALL_SLOTS) return;

  const now = findCurrentSlot(window.ALL_SLOTS);
  const next = findUpNextSlot(window.ALL_SLOTS);

  const nowEl = document.getElementById("nowon");
  const nextEl = document.getElementById("upnext");

  if (nowEl) {
    nowEl.innerHTML = now
      ? `${now.dj} <span>${cleanTime(now.start)}–${cleanTime(now.end)}</span>`
      : "Off Air";
  }

  if (nextEl) {
    nextEl.innerHTML = next
      ? `${next.dj} <span>${cleanTime(next.start)}–${cleanTime(next.end)}</span>`
      : "No upcoming shows";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSchedule();
});

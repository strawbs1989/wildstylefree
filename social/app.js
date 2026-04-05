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

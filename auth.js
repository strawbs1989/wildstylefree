import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

import { initialsFromName } from './utils.js';

export function setAuthMessage(els, message, isError = false) {
  if (!els.authStatus) return;
  els.authStatus.textContent = message;
  els.authStatus.style.color = isError ? '#ff9eb8' : '#b8a9d6';
}

export function openAuth(els) {
  els.authOverlay?.classList.add('open');
  els.authModal?.classList.add('open');
  els.authModal?.setAttribute('aria-hidden', 'false');
}

export function closeAuth(els) {
  els.authOverlay?.classList.remove('open');
  els.authModal?.classList.remove('open');
  els.authModal?.setAttribute('aria-hidden', 'true');
}

export function switchAuthTab(els, tabName) {
  els.authTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.authTab === tabName);
  });

  els.authPanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.authPanel === tabName);
  });
}

export function bindSidebarButtons({ els, auth }) {
  document.getElementById('sidebarLoginBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab(els, 'login');
    openAuth(els);
  });

  document.getElementById('sidebarSignupBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab(els, 'signup');
    openAuth(els);
  });

  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (auth) await signOut(auth);
  });
}

export function setLoggedOutState(els) {
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
  }
}

export async function updateProfilePostCount({ db, els, uid }) {
  if (!db || !els.profilePosts) return;

  try {
    const q = query(collection(db, 'posts'), where('uid', '==', uid));
    const snap = await getDocs(q);
    els.profilePosts.textContent = String(snap.size);
  } catch {
    els.profilePosts.textContent = '0';
  }
}

export async function setLoggedInState({ db, els, user }) {
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
  }

  return {
    uid: user.uid,
    displayName: profileData.displayName,
    role: profileData.role || 'Listener',
    bio: profileData.bio || 'Wildstyle community member.'
  };
}

export async function handleLogin({ auth, els, usingPlaceholders }) {
  if (usingPlaceholders || !auth) {
    setAuthMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage(els, 'Logging in...');
    await signInWithEmailAndPassword(auth, els.loginEmail.value.trim(), els.loginPassword.value);
    els.loginForm.reset();
    closeAuth(els);
    setAuthMessage(els, 'Logged in.');
  } catch (error) {
    console.error('Login error:', error);
    setAuthMessage(els, error.message, true);
  }
}

export async function handleSignup({ auth, db, els, usingPlaceholders }) {
  if (usingPlaceholders || !auth || !db) {
    setAuthMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  try {
    setAuthMessage(els, 'Creating account...');

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

    els.signupForm.reset();
    closeAuth(els);
    setAuthMessage(els, 'Account created.');
  } catch (error) {
    console.error('Signup error:', error);
    setAuthMessage(els, error.message, true);
  }
} 

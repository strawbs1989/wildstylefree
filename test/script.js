import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getDatabase, ref, set, push, onChildAdded, onValue, remove, onDisconnect, get } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdT86poHVUK7iB9QOwFn_qurb3Ni5lR9w",
  authDomain: "wildstylechat.firebaseapp.com",
  projectId: "wildstylechat",
  storageBucket: "wildstylechat.firebasestorage.app",
  messagingSenderId: "242179653343",
  appId: "1:242179653343:web:a1427743d25102b4a9736a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentUser = null;
window.currentRole = 'guest'; // 'admin' or 'guest'
window.isMuted = false;

window.showLogin = () => {
  document.getElementById('loginModal').style.display = 'block';
  document.getElementById('signupModal').style.display = 'none';
  document.getElementById('container').style.display = 'none';
};

window.showSignup = () => {
  document.getElementById('signupModal').style.display = 'block';
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('container').style.display = 'none';
};

window.login = async () => {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username) {
    alert('Please enter a username');
    return;
  }
  const adminRef = ref(db, 'admins/' + username);
  const snapshot = await get(adminRef);
  if (snapshot.exists()) {
    const adminData = snapshot.val();
    if (adminData.password === password) {
      loginSuccess(username, 'admin');
    } else {
      alert('Incorrect admin password');
    }
  } else {
    if (password) alert("Guests don't need passwords, ignoring it.");
    loginSuccess(username, 'guest');
  }
};

window.signup = async () => {
  const username = document.getElementById('signupUser').value.trim();
  const password = document.getElementById('signupPass').value;
  if (!username || !password) {
    alert('Username and password required for admin signup');
    return;
  }
  const adminRef = ref(db, 'admins/' + username);
  const snapshot = await get(adminRef);
  if (snapshot.exists()) {
    alert('Admin username already taken');
    return;
  }
  await set(adminRef, { password });
  alert('Admin signup successful! Please login.');
  showLogin();
};

function loginSuccess(username, role) {
  window.currentUser = username;
  window.currentRole = role;
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('signupModal').style.display = 'none';
  document.getElementById('container').style.display =

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getDatabase, ref, push, set, onChildAdded, remove
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

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

// User info
window.currentUser = null;
window.currentRole = 'guest';

function showLogin() {
  document.getElementById('loginModal').style.display = 'block';
  document.getElementById('signupModal').style.display = 'none';
  document.getElementById('container').style.display = 'none';
}

function showSignup() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('signupModal').style.display = 'block';
}

window.signup = function () {
  const username = document.getElementById('signupUser').value.trim();
  const password = document.getElementById('signupPass').value.trim();

  if (!username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  let admins = JSON.parse(localStorage.getItem("admins")) || {};
  if (admins[username]) {
    alert("Username already exists!");
    return;
  }

  admins[username] = password;
  localStorage.setItem("admins", JSON.stringify(admins));
  alert("Admin signed up!");
  showLogin();
};

window.login = function () {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const admins = JSON.parse(localStorage.getItem("admins")) || {};

  if (admins[username] && admins[username] === password) {
    window.currentUser = username;
    window.currentRole = 'admin';
    document.getElementById('admin-controls').style.display = 'block';
  } else if (password === "") {
    window.currentUser = username || 'Guest';
    window.currentRole = 'guest';
    document.getElementById('admin-controls').style.display = 'none';
  } else {
    alert("Invalid login.");
    return;
  }

  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('signupModal').style.display = 'none';
  document.getElementById('container').style.display = 'flex';

  updateAdminList();
};

function updateAdminList() {
  const adminList = document.getElementById('adminList');
  adminList.innerHTML = '';
  const admins = JSON.parse(localStorage.getItem("admins")) || {};
  for (let admin in admins) {
    const li = document.createElement('li');
    li.textContent = admin;
    adminList.appendChild(li);
  }
}

window.sendMessage = function () {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  const messagesRef = ref(db, 'messages');
  const newMsgRef = push(messagesRef);
  set(newMsgRef, {
    username: window.currentUser,
    role: window.currentRole,
    message: msg,
    timestamp: Date.now()
  });

  input.value = '';
};

const messagesRef = ref(db, 'messages');
onChildAdded(messagesRef, (snapshot) => {
  const data = snapshot.val();
  displayMessage(data);
});

function displayMessage(data) {
  const messagesDiv = document.getElementById('messages');
  const msgEl = document.createElement('div');
  msgEl.textContent = `${data.username} (${data.role}): ${data.message}`;
  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Optional: dummy admin controls
window.clearChat = function () {
  const messagesRef = ref(db, 'messages');
  remove(messagesRef);
  document.getElementById('messages').innerHTML = '';
};

window.toggleMuteAll = function () {
  alert("Mute feature not yet implemented.");
};

window.blockUser = function () {
  alert("Block feature not yet implemented.");
};

window.unblockUser = function () {
  alert("Unblock feature not yet implemented.");
};

window.changeName = function () {
  const newName = prompt("Enter new username:");
  if (newName) {
    window.currentUser = newName;
    alert("Name changed.");
  }
};

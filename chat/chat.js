/* jshint esversion: 8 */

/* =========================
   Firebase Init
========================= */
firebase.initializeApp({
  apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
  authDomain: "wildstyle-chat.firebaseapp.com",
  databaseURL: "https://wildstyle-chat-default-rtdb.firebaseio.com",
  projectId: "wildstyle-chat",
  storageBucket: "wildstyle-chat.firebasestorage.app",
  messagingSenderId: "259584470846",
  appId: "1:259584470846:web:81d005c0c68c6c2a1f466f"
});

const auth = firebase.auth();
const db   = firebase.database();

/* =========================
   DOM
========================= */
const authBox     = document.getElementById("auth-box");
const chatWrapper = document.getElementById("chat-wrapper");

const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("login-btn");
const registerBtn   = document.getElementById("register-btn");
const logoutBtn     = document.getElementById("logout-btn");
const authError     = document.getElementById("auth-error");

const userEmailSpan = document.getElementById("user-email");
const userRoleSpan  = document.getElementById("user-role");

const messagesDiv = document.getElementById("messages");
const msgInput    = document.getElementById("msg-input");
const sendBtn     = document.getElementById("send-btn");

const onlineUsersDiv = document.getElementById("online-users");

const adminBox  = document.getElementById("adminbox");
const adminList = document.getElementById("user-list");

/* =========================
   State
========================= */
let cachedRole = "pending";
let lastMsgTime = 0;

/* =========================
   Helpers
========================= */
function avatar(email) {
  const d = document.createElement("div");
  d.className = "avatar";
  d.textContent = (email || "?")[0].toUpperCase();
  return d;
}

function canSend() {
  const now = Date.now();
  if (now - lastMsgTime < 3000) return false;
  lastMsgTime = now;
  return true;
}

/* =========================
   AUTH
========================= */
registerBtn.onclick = async () => {
  try {
    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    if (!email || !pass) throw "Fill in all fields";

    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.sendEmailVerification();

    await db.ref("users/" + cred.user.uid).set({
      email,
      role: "pending",
      verified: false,
      bannedUntil: 0
    });

    alert("Check your email to verify your account.");
    auth.signOut();
  } catch (e) {
    authError.textContent = e.message || e;
  }
};

loginBtn.onclick = async () => {
  try {
    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    authError.textContent = e.message;
  }
};

logoutBtn.onclick = () => auth.signOut();

/* =========================
   AUTH STATE
========================= */
auth.onAuthStateChanged(async user => {
  if (!user) {
    authBox.classList.remove("hidden");
    chatWrapper.classList.add("hidden");
    return;
  }

  if (!user.emailVerified) {
    alert("Please verify your email.");
    auth.signOut();
    return;
  }

  const snap = await db.ref("users/" + user.uid).once("value");
  if (!snap.exists()) return auth.signOut();

  const data = snap.val();
  cachedRole = data.role || "pending";

  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");

  userEmailSpan.textContent = user.email;
  userRoleSpan.textContent  = cachedRole;

  adminBox.classList.toggle("hidden", cachedRole !== "admin");

  loadMessages();
  setupOnline(user);
  if (cachedRole === "admin") loadAdmin();
});

/* =========================
   MESSAGES
========================= */
function loadMessages() {
  messagesDiv.innerHTML = "";
  db.ref("messages").limitToLast(200).on("child_added", snap => {
    const m = snap.val();
    const row = document.createElement("div");
    row.className = "msg";

    const body = document.createElement("div");
    body.className = "msg-body";

    body.innerHTML = `
      <div class="msg-meta">${m.email}</div>
      <div class="msg-text">${m.text}</div>
    `;

    if (cachedRole === "admin") {
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.onclick = () => db.ref("messages/" + snap.key).remove();
      body.appendChild(del);
    }

    row.appendChild(avatar(m.email));
    row.appendChild(body);
    messagesDiv.appendChild(row);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

sendBtn.onclick = async () => {
  if (!canSend()) return alert("Slow down!");

  const user = auth.currentUser;
  const text = msgInput.value.trim();
  if (!text) return;

  const snap = await db.ref("users/" + user.uid).once("value");
  const u = snap.val();

  if (u.role === "pending") return alert("Awaiting admin approval.");
  if (u.bannedUntil && u.bannedUntil > Date.now()) return alert("You are banned.");

  await db.ref("messages").push({
    uid: user.uid,
    email: user.email,
    text: text.slice(0, 500),
    timestamp: Date.now()
  });

  msgInput.value = "";
};

msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

/* =========================
   ONLINE USERS
========================= */
function setupOnline(user) {
  const ref = db.ref("onlineUsers/" + user.uid);
  ref.set({ email: user.email });
  ref.onDisconnect().remove();

  db.ref("onlineUsers").on("value", snap => {
    onlineUsersDiv.innerHTML = "";
    snap.forEach(c => {
      const d = document.createElement("div");
      d.textContent = c.val().email;
      onlineUsersDiv.appendChild(d);
    });
  });
}

/* =========================
   ADMIN PANEL
========================= */
function loadAdmin() {
  db.ref("users").on("value", snap => {
    adminList.innerHTML = "";
    snap.forEach(c => {
      const u = c.val();
      const row = document.createElement("div");
      row.innerHTML = `
        ${u.email} (${u.role})
        <button onclick="approve('${c.key}')">Approve</button>
        <button onclick="makeAdmin('${c.key}')">Admin</button>
        <button onclick="ban('${c.key}',86400000)">Ban 24h</button>
      `;
      adminList.appendChild(row);
    });
  });
}

window.approve = uid =>
  db.ref("users/" + uid).update({ role: "user", verified: true });

window.makeAdmin = uid =>
  confirm("Promote to admin?") &&
  db.ref("users/" + uid + "/role").set("admin");

window.ban = (uid, time) =>
  db.ref("users/" + uid + "/bannedUntil").set(Date.now() + time);

/* radio tuner */

/* =========================
   RADIO PLAYER
========================= */

// CHANGE THIS TO YOUR REAL STREAM
const RADIO_STREAM = "https://streaming.live365.com/a50378";

const radioAudio  = document.getElementById("radio-audio");
const playRadio   = document.getElementById("play-radio");
const stopRadio   = document.getElementById("stop-radio");
const radioStatus = document.getElementById("radio-status");

let hls;

function startRadio() {
  radioStatus.textContent = "Loading…";

  if (radioAudio.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari / iOS
    radioAudio.src = RADIO_STREAM;
    radioAudio.play();
  } else if (window.Hls) {
    // Chrome / Firefox / Android
    hls = new Hls();
    hls.loadSource(RADIO_STREAM);
    hls.attachMedia(radioAudio);
    radioAudio.play();
  } else {
    alert("Your browser does not support live radio.");
    return;
  }

  playRadio.classList.add("hidden");
  stopRadio.classList.remove("hidden");
  radioStatus.textContent = "Live 🔴";
}

function stopRadioPlayer() {
  radioAudio.pause();
  radioAudio.src = "";
  if (hls) hls.destroy();

  playRadio.classList.remove("hidden");
  stopRadio.classList.add("hidden");
  radioStatus.textContent = "Stopped";
}

playRadio.onclick = startRadio;
stopRadio.onclick = stopRadioPlayer;

// Stop stream on logout
auth.onAuthStateChanged(user => {
  if (!user) stopRadioPlayer();
});

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

  // Email verification
  if (!user.emailVerified) {
    alert("Please verify your email before logging in.");
    auth.signOut();
    return;
  }

  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");
  userEmailSpan.textContent = user.email;

  const userRef = db.ref("users/" + user.uid);
  const snap = await userRef.once("value");

  // Create user record if missing
  if (!snap.exists()) {
    await userRef.set({
      email: user.email,
      role: "pending"
    });
  }

  // Role listener (THIS NOW GATES EVERYTHING)
  userRef.child("role").on("value", snap => {
    const role = snap.val() || "pending";
    cachedIsAdmin = role === "admin";
    userRoleSpan.textContent = role;

    if (role === "pending") {
      alert("Your account is awaiting admin approval.");
      return;
    }

    // Only approved users reach here
    loadMessages();
    setupTyping(user);
    setupOnlineUsers(user);

    if (cachedIsAdmin) {
      adminBox.classList.remove("hidden");
      loadUsersForAdmin();
    } else {
      adminBox.classList.add("hidden");
    }
  });
});


/* =========================
   MESSAGES
========================= */
function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const text = msgInput.value.trim();
  if (!text) return;

  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val();
    if (!data || data.role === "pending") {
      alert("You are not approved to chat yet.");
      return;
    }

    if (data.banExpires === "perm") {
      alert("You are permanently banned.");
      return;
    }

    if (typeof data.banExpires === "number" && data.banExpires > Date.now()) {
      const mins = Math.ceil((data.banExpires - Date.now()) / 60000);
      alert(`You are banned for ${mins} more minutes.`);
      return;
    }

    return db.ref("messages").push({
      userId: user.uid,
      userEmail: user.email,
      text: text.slice(0, 500),
      timestamp: Date.now()
    });
  }).then(() => {
    msgInput.value = "";
  }).catch(console.error);
}


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
	  const mins = Math.ceil((user.banExpires - Date.now()) / 60000);
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

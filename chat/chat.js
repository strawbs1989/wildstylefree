/* jshint esversion: 8 */

// ==============================
// Wildstyle Chat - FINAL CLEAN JS (Option C)
// ==============================

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
  authDomain: "wildstyle-chat.firebaseapp.com",
  databaseURL: "https://wildstyle-chat-default-rtdb.firebaseio.com",
  projectId: "wildstyle-chat",
  storageBucket: "wildstyle-chat.firebasestorage.app",
  messagingSenderId: "259584470846",
  appId: "1:259584470846:web:81d005c0c68c6c2a1f466f",
  measurementId: "G-M7MVE2CY8B"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// ==============================
// DOM ELEMENTS (MATCHES YOUR HTML)
// ==============================
const authBox       = document.getElementById("auth-box");
const chatWrapper   = document.getElementById("chat-wrapper");

const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("login-btn");
const registerBtn   = document.getElementById("register-btn");
const googleBtn     = document.getElementById("google-btn"); // optional
const forgotBtn     = document.getElementById("forgot-btn"); // optional
const authError     = document.getElementById("auth-error");

const logoutBtn     = document.getElementById("logout-btn");

const userEmailSpan = document.getElementById("user-email");
const userRoleSpan  = document.getElementById("user-role");

const messagesDiv   = document.getElementById("messages");
const msgInput      = document.getElementById("msg-input");
const sendBtn       = document.getElementById("send-btn");

const typingIndicator = document.getElementById("typing-indicator");
const onlineUsersDiv  = document.getElementById("online-users");

const adminBox      = document.getElementById("adminbox");
const userList      = document.getElementById("user-list");

const playRadioBtn  = document.getElementById("play-radio");
const stopRadioBtn  = document.getElementById("stop-radio");
const radioStatus   = document.getElementById("radio-status");
const radioAudio    = document.getElementById("radio-audio");

// ==============================
// STATE
// ==============================
let lastMessageTime = 0;
const MESSAGE_COOLDOWN_MS = 3000;

// ==============================
// AUTH STATE LISTENER
// ==============================
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    showAuth();
    return;
  }

  // Load or create user record
  const userRef = db.ref("users/" + user.uid);
  const snap = await userRef.once("value");

  if (!snap.exists()) {
    await userRef.set({
      email: user.email,
      role: "user",     // Option C default
      created: Date.now()
    });
  }

  const data = snap.val() || {};
  const role = data.role || "user";

  userEmailSpan.textContent = user.email;
  userRoleSpan.textContent = role;

  // Show admin panel for mods + admins
  if (role === "admin" || role === "mod") {
    adminBox.classList.remove("hidden");
    loadUsersForAdmin();
  } else {
    adminBox.classList.add("hidden");
  }

  // Show warnings once
  db.ref("users/" + user.uid + "/warning").once("value").then(snap => {
    if (snap.exists()) {
      alert(snap.val().message || "You have been cautioned by an admin.");
      db.ref("users/" + user.uid + "/warning").remove();
    }
  });

  showChat();
  listenMessages();
  setupOnlineUsers(user);
});

// ==============================
// UI SWITCHING
// ==============================
function showAuth() {
  authBox.classList.remove("hidden");
  chatWrapper.classList.add("hidden");
}

function showChat() {
  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");
}

// ==============================
// LOGIN
// ==============================
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value.trim();

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    authError.textContent = err.message;
  }
});

// ==============================
// REGISTER
// ==============================
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passwordInput.value.trim();

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);

    await db.ref("users/" + cred.user.uid).set({
      email: email,
      role: "user",
      created: Date.now()
    });

    alert("Account created. You can now log in.");
  } catch (err) {
    authError.textContent = err.message;
  }
});

// ==============================
// GOOGLE SIGN-IN (OPTIONAL)
// ==============================
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const cred = await auth.signInWithPopup(provider);

      const userRef = db.ref("users/" + cred.user.uid);
      const snap = await userRef.once("value");

      if (!snap.exists()) {
        await userRef.set({
          email: cred.user.email,
          role: "user",
          created: Date.now()
        });
      }
    } catch (err) {
      authError.textContent = err.message;
    }
  });
}

// ==============================
// FORGOT PASSWORD (OPTIONAL)
// ==============================
if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) return alert("Enter your email first.");

    try {
      await auth.sendPasswordResetEmail(email);
      alert("Password reset email sent.");
    } catch (err) {
      authError.textContent = err.message;
    }
  });
}

// ==============================
// LOGOUT
// ==============================
logoutBtn.addEventListener("click", () => auth.signOut());

// ==============================
// SEND MESSAGE (with perm-ban enforcement)
// ==============================
sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const now = Date.now();
  if (now - lastMessageTime < MESSAGE_COOLDOWN_MS) {
    alert("Slow down, no spamming!");
    return;
  }

  const text = msgInput.value.trim();
  if (!text) return;

  // Check for permanent ban
  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val() || {};

    if (data.role === "banned") {
      alert("You are permanently banned from sending messages.");
      return;
    }

    lastMessageTime = now;

    db.ref("messages").push({
      uid: user.uid,
      email: user.email,
      text: text,
      timestamp: now
    });

    msgInput.value = "";
  });
}

// ==============================
// LISTEN FOR MESSAGES
// ==============================
function listenMessages() {
  db.ref("messages").off();
  db.ref("messages").on("value", (snap) => {
    const msgs = snap.val() || {};
    messagesDiv.innerHTML = "";

    Object.keys(msgs).forEach(key => {
      const m = msgs[key];
      const row = document.createElement("div");
      row.className = "msg-row";
      row.innerHTML = `
        <b>${m.email}</b>: ${m.text}
        <span class="time">${new Date(m.timestamp).toLocaleTimeString()}</span>
      `;

      // Admin delete
      if (userRoleSpan.textContent === "admin") {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => db.ref("messages/" + key).remove();
        row.appendChild(del);
      }

      messagesDiv.appendChild(row);
    });
  });
}

// ==============================
// ONLINE USERS
// ==============================
function setupOnlineUsers(user) {
  const userRef = db.ref("onlineUsers/" + user.uid);

  userRef.set({
    email: user.email,
    timestamp: Date.now()
  });

  userRef.onDisconnect().remove();

  db.ref("onlineUsers").on("value", snap => {
    const users = snap.val() || {};
    onlineUsersDiv.innerHTML = "";

    Object.keys(users).forEach(uid => {
      const u = users[uid];
      const row = document.createElement("div");
      row.className = "online-user";
      row.textContent = u.email;
      onlineUsersDiv.appendChild(row);
    });
  });
}

// ==============================
// ADMIN PANEL (warnings + perm bans)
// ==============================
async function loadUsersForAdmin() {
  const snap = await db.ref("users").once("value");
  const users = snap.val() || {};

  userList.innerHTML = "";

  Object.keys(users).forEach(uid => {
    const u = users[uid];

    const row = document.createElement("div");
    row.className = "admin-user";

    row.innerHTML = `
      <span>${u.email}</span>
      <span>${u.role}</span>
    `;

    // Warn user
    const warn = document.createElement("button");
    warn.textContent = "Warn";
    warn.onclick = () => {
      db.ref("users/" + uid + "/warning").set({
        message: "You have been cautioned by an admin.",
        timestamp: Date.now()
      });
      alert("Warning sent.");
    };

    // Permanent ban
    const ban = document.createElement("button");
    ban.textContent = "Ban Perm";
    ban.onclick = () => {
      db.ref("users/" + uid).update({ role: "banned" });
    };

    // Unban
    const unban = document.createElement("button");
    unban.textContent = "Unban";
    unban.onclick = () => {
      db.ref("users/" + uid).update({ role: "user" });
    };

    // Promote to admin
    const promote = document.createElement("button");
    promote.textContent = "Make Admin";
    promote.onclick = () => {
      db.ref("users/" + uid).update({ role: "admin" });
    };

    // Demote to mod
    const demote = document.createElement("button");
    demote.textContent = "Make Mod";
    demote.onclick = () => {
      db.ref("users/" + uid).update({ role: "mod" });
    };

    row.appendChild(warn);
    row.appendChild(ban);
    row.appendChild(unban);
    row.appendChild(promote);
    row.appendChild(demote);

    userList.appendChild(row);
  });
}

// ==============================
// RADIO PLAYER
// ==============================
if (playRadioBtn && stopRadioBtn && radioAudio) {
  playRadioBtn.addEventListener("click", () => {
    radioAudio.src = "https://streaming.live365.com/a50378"; 
    radioAudio.play();
    radioStatus.textContent = "Live";
    playRadioBtn.classList.add("hidden");
    stopRadioBtn.classList.remove("hidden");
  });

  stopRadioBtn.addEventListener("click", () => {
    radioAudio.pause();
    radioAudio.src = "";
    radioStatus.textContent = "Offline";
    stopRadioBtn.classList.add("hidden");
    playRadioBtn.classList.remove("hidden");
  });
}

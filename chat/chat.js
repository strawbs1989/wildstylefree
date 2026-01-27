// ==============================
// Wildstyle Chat - FULL FIXED JS
// ==============================

// Firebase v8 compat
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

// DOM
const authBox = document.getElementById("auth-box");
const chatWrapper = document.getElementById("chat-wrapper");
const userEmailSpan = document.getElementById("user-email");
const userRoleSpan = document.getElementById("user-role");
const adminBox = document.getElementById("adminbox");
const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const googleBtn = document.getElementById("google-btn");
const forgotBtn = document.getElementById("forgot-btn");
const authError = document.getElementById("auth-error");

const playRadioBtn = document.getElementById("play-radio");
const radioPlayer = document.getElementById("radio-player");

// Spam protection
let lastMessageTime = 0;
const MESSAGE_COOLDOWN_MS = 3000; // 3 seconds

// -------------------------------
// AUTH LISTENERS
// -------------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    showAuth();
    return;
  }

  // require verified email
  if (!user.emailVerified) {
    auth.signOut();
    alert("Please verify your email before logging in.");
    return;
  }

  // load user role & approval
  const userRef = db.ref("users/" + user.uid);
  const snapshot = await userRef.once("value");
  const data = snapshot.val() || {};

  const role = data.role || "pending"; // default pending
  const approved = data.approved || false;

  userEmailSpan.textContent = user.email;
  userRoleSpan.textContent = role;

  if (!approved) {
    auth.signOut();
    alert("Your account is pending approval. Please wait for an admin to approve you.");
    return;
  }

  if (role === "admin") {
    adminBox.classList.remove("hidden");
    loadUsersForAdmin();
  } else {
    adminBox.classList.add("hidden");
  }

  showChat();
  listenMessages();
  setupOnlineUsers(user);
});

// -------------------------------
// SHOW UI
// -------------------------------
function showAuth() {
  authBox.classList.remove("hidden");
  chatWrapper.classList.add("hidden");
}

function showChat() {
  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");
}

// -------------------------------
// LOGIN / REGISTER / GOOGLE
// -------------------------------
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    authError.textContent = err.message;
  }
});

registerBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.sendEmailVerification();

    // save user
    await db.ref("users/" + cred.user.uid).set({
      email: email,
      role: "pending",
      approved: false
    });

    alert("Verification email sent. Check your inbox.");
    auth.signOut();
  } catch (err) {
    authError.textContent = err.message;
  }
});

googleBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const cred = await auth.signInWithPopup(provider);

    // if new user create pending record
    const userRef = db.ref("users/" + cred.user.uid);
    const snapshot = await userRef.once("value");
    if (!snapshot.exists()) {
      await userRef.set({
        email: cred.user.email,
        role: "pending",
        approved: false
      });
    }
  } catch (err) {
    authError.textContent = err.message;
  }
});

forgotBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  if (!email) return alert("Enter your email first.");

  try {
    await auth.sendPasswordResetEmail(email);
    alert("Password reset email sent.");
  } catch (err) {
    authError.textContent = err.message;
  }
});

// -------------------------------
// SEND MESSAGE
// -------------------------------
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

  lastMessageTime = now;

  db.ref("messages").push({
    uid: user.uid,
    email: user.email,
    text: text,
    timestamp: now
  });

  msgInput.value = "";
}

// -------------------------------
// LISTEN MESSAGES
// -------------------------------
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

      // admin delete
      const role = userRoleSpan.textContent;
      if (role === "admin") {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => db.ref("messages/" + key).remove();
        row.appendChild(del);
      }

      messagesDiv.appendChild(row);
    });
  });
}

// -------------------------------
// ONLINE USERS
// -------------------------------
function setupOnlineUsers(user) {
  const userRef = db.ref("onlineUsers/" + user.uid);

  userRef.set({
    email: user.email,
    timestamp: Date.now()
  });

  userRef.onDisconnect().remove();
}

// -------------------------------
// ADMIN PANEL
// -------------------------------
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
      <span>${u.approved ? "Approved" : "Pending"}</span>
    `;

    // approve button
    const approve = document.createElement("button");
    approve.textContent = "Approve";
    approve.onclick = () => {
      db.ref("users/" + uid).update({
        approved: true,
        role: "mod"
      });
    };

    // promote to admin
    const promote = document.createElement("button");
    promote.textContent = "Promote Admin";
    promote.onclick = () => {
      db.ref("users/" + uid).update({
        role: "admin"
      });
    };

    // ban user
    const ban = document.createElement("button");
    ban.textContent = "Ban";
    ban.onclick = () => {
      db.ref("users/" + uid).update({
        role: "banned",
        approved: false
      });
    };

    row.appendChild(approve);
    row.appendChild(promote);
    row.appendChild(ban);

    userList.appendChild(row);
  });
}

// -------------------------------
// RADIO PLAYER
// -------------------------------
playRadioBtn.addEventListener("click", () => {
  if (radioPlayer.paused) {
    radioPlayer.play();
    playRadioBtn.textContent = "Pause Radio";
  } else {
    radioPlayer.pause();
    playRadioBtn.textContent = "Play Radio";
  }
});

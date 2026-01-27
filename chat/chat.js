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
let cachedIsAdmin = false;
let lastMsgTime = 0;
let messagesLoaded = false;

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
   REGISTER
========================= */
registerBtn.onclick = async () => {
  try {
    authError.textContent = "";

    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    if (!email || !pass) throw "Fill in all fields";

    const cred = await auth.createUserWithEmailAndPassword(email, pass);

    // Send verification email
    await cred.user.sendEmailVerification();

    // Create pending user record
    await db.ref("users/" + cred.user.uid).set({
      email: email,
      role: "pending",
      bannedUntil: 0
    });

    alert("Verification email sent. Check your inbox.");
    auth.signOut();
  } catch (e) {
    authError.textContent = e.message || e;
  }
};

/* =========================
   LOGIN
========================= */
loginBtn.onclick = async () => {
  try {
    authError.textContent = "";

    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    if (!email || !pass) throw "Fill in all fields";

    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    authError.textContent = e.message || e;
  }
};

/* =========================
   LOGOUT
========================= */
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

  // Email verification check
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

  if (!snap.exists()) {
    await userRef.set({
      email: user.email,
      role: "pending",
      bannedUntil: 0
    });
  }

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
    setupOnline(user);

    if (cachedIsAdmin) {
      adminBox.classList.remove("hidden");
      loadAdmin();
    } else {
      adminBox.classList.add("hidden");
    }
  });
});

/* =========================
   SEND MESSAGE
========================= */
function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const text = msgInput.value.trim();
  if (!text) return;

  if (!canSend()) {
    alert("Slow down! Please wait 3 seconds between messages.");
    return;
  }

  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val();

    if (!data || data.role === "pending") {
      alert("You are not approved to chat yet.");
      return;
    }

    if (data.bannedUntil && data.bannedUntil > Date.now()) {
      const mins = Math.ceil((data.bannedUntil - Date.now()) / 60000);
      alert(`You are banned for ${mins} more minutes.`);
      return;
    }

    db.ref("messages").push({
      userId: user.uid,
      userEmail: user.email,
      text: text.slice(0, 500),
      timestamp: Date.now()
    });

    msgInput.value = "";
  }).catch(console.error);
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

/* =========================
   LOAD MESSAGES
========================= */
function appendChatMessage(key, msg, currentUser) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg";

  const avatarEl = avatar(msg.userEmail);

  const body = document.createElement("div");
  body.className = "msg-body";

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
  meta.textContent = `[${time}] ${msg.userEmail}`;

  const text = document.createElement("div");
  text.className = "msg-text";
  text.textContent = msg.text;

  body.appendChild(meta);
  body.appendChild(text);

  if (currentUser && (msg.userId === currentUser.uid || currentUser.isAdmin)) {
    const actions = document.createElement("div");
    actions.className = "msg-actions";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => db.ref("messages/" + key).remove();

    actions.appendChild(delBtn);
    body.appendChild(actions);
  }

  wrapper.appendChild(avatarEl);
  wrapper.appendChild(body);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function loadMessages() {
  if (messagesLoaded) return;
  messagesLoaded = true;

  messagesDiv.innerHTML = "";

  db.ref("messages").limitToLast(200).on("child_added", snap => {
    const msg = snap.val();
    const key = snap.key;
    const user = auth.currentUser;
    if (!user) return;

    appendChatMessage(key, msg, { uid: user.uid, isAdmin: cachedIsAdmin });
  });

  db.ref("messages").on("child_removed", () => {
    messagesDiv.innerHTML = "";
    db.ref("messages").limitToLast(200).once("value").then(snap2 => {
      snap2.forEach(child => {
        appendChatMessage(child.key, child.val(), { uid: auth.currentUser.uid, isAdmin: cachedIsAdmin });
      });
    });
  });
}

/* =========================
   TYPING
========================= */
function setupTyping(user) {
  const typingRef = db.ref("typing/" + user.uid);

  msgInput.addEventListener("input", () => {
    const isTyping = msgInput.value.trim().length > 0;
    typingRef.set(isTyping);
  });

  db.ref("typing").on("value", snap => {
    const typingData = snap.val() || {};
    const othersTyping = Object.keys(typingData).filter(uid => uid !== user.uid && typingData[uid]);
    document.getElementById("typing-indicator").textContent = othersTyping.length ? "Someone is typing..." : "";
  });
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
      row.className = "admin-user";

      const label = document.createElement("span");
      label.textContent = `${u.email} (${u.role})`;

      const approveBtn = document.createElement("button");
      approveBtn.textContent = "Approve";
      approveBtn.onclick = () => db.ref("users/" + c.key).update({ role: "user" });

      const makeAdminBtn = document.createElement("button");
      makeAdminBtn.textContent = "Make Admin";
      makeAdminBtn.onclick = () => {
        if (confirm("Promote to admin?")) {
          db.ref("users/" + c.key + "/role").set("admin");
        }
      };

      const ban24Btn = document.createElement("button");
      ban24Btn.textContent = "Ban 24h";
      ban24Btn.onclick = () => db.ref("users/" + c.key + "/bannedUntil").set(Date.now() + 24 * 60 * 60 * 1000);

      const unbanBtn = document.createElement("button");
      unbanBtn.textContent = "Unban";
      unbanBtn.onclick = () => db.ref("users/" + c.key + "/bannedUntil").remove();

      row.appendChild(label);
      row.appendChild(approveBtn);
      row.appendChild(makeAdminBtn);
      row.appendChild(ban24Btn);
      row.appendChild(unbanBtn);

      adminList.appendChild(row);
    });
  });
}

/* jshint esversion: 8 */
let cachedIsAdmin = false;

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
const db   = firebase.database();

// 2. DOM elements (matching your HTML)
const authBox       = document.getElementById("auth-box");
const chatWrapper   = document.getElementById("chat-wrapper");

const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("login-btn");
const registerBtn   = document.getElementById("register-btn");
const authError     = document.getElementById("auth-error");

const logoutBtn     = document.getElementById("logout-btn");

const userEmailSpan = document.getElementById("user-email");
const userRoleSpan  = document.getElementById("user-role");

const messagesDiv   = document.getElementById("messages");
const msgInput      = document.getElementById("msg-input");
const sendBtn       = document.getElementById("send-btn");

const typingIndicator = document.getElementById("typing-indicator");
const onlineUsersDiv  = document.getElementById("online-users");

const adminBox      = document.getElementById("adminbox");   // matches HTML
const adminUsersDiv = document.getElementById("user-list");  // matches HTML

// 3. State flags
let messagesListenerAttached    = false;
let typingListenerAttached      = false;
let onlineUsersListenerAttached = false;
let adminUsersListenerAttached  = false;

// 4. Helpers

function createAvatar(email) {
  const div = document.createElement("div");
  div.className = "avatar";
  const letter = (email || "?").charAt(0).toUpperCase();
  div.textContent = letter;
  return div;
}

function appendChatMessage(key, msg, currentUser) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg";

  const avatar = createAvatar(msg.userEmail);

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

  // Delete button (owner or admin)
  if (currentUser && (msg.userId === currentUser.uid || currentUser.isAdmin)) {
    const actions = document.createElement("div");
    actions.className = "msg-actions";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      db.ref("messages/" + key).remove().catch(console.error);
    };

    actions.appendChild(delBtn);
    body.appendChild(actions);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 5. Messages

function loadMessages() {
  if (messagesListenerAttached) return;
  messagesListenerAttached = true;

  messagesDiv.innerHTML = "";

  db.ref("messages").limitToLast(200).on("child_added", snap => {
    const msg = snap.val();
    const key = snap.key;
    const user = auth.currentUser;
    if (!user) return;

    appendChatMessage(key, msg, {
      uid: user.uid,
      isAdmin: cachedIsAdmin
    });
  });

  db.ref("messages").on("child_removed", () => {
    messagesDiv.innerHTML = "";
    const user = auth.currentUser;
    if (!user) return;

    db.ref("messages").limitToLast(200).once("value").then(snap2 => {
      snap2.forEach(child => {
        appendChatMessage(child.key, child.val(), {
          uid: user.uid,
          isAdmin: cachedIsAdmin
        });
      });
    });
  });
}


// 6. Ban enforcement + sending

function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const text = msgInput.value.trim();
  if (!text) return;

  db.ref("users/" + user.uid).once("value").then(snap => {
    const data = snap.val() || {};
    const banExpires = data.banExpires;

    // Permanent ban
    if (banExpires === "perm") {
      alert("You are permanently banned from sending messages.");
      return;
    }

    // Temporary ban
    if (typeof banExpires === "number" && banExpires > Date.now()) {
      const mins = Math.ceil((banExpires - Date.now()) / 60000);
      alert("You are banned for another " + mins + " minutes.");
      return;
    }

    // Auto-unban if expired
    if (typeof banExpires === "number" && banExpires <= Date.now()) {
      db.ref("users/" + user.uid + "/banExpires").remove();
    }

    const newMsgRef = db.ref("messages").push();
    return newMsgRef.set({
      userId: user.uid,
      userEmail: user.email,
      text: text.slice(0, 500),
      timestamp: Date.now()
    });
  }).then(() => {
    msgInput.value = "";
  }).catch(console.error);
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

// 7. Typing indicator

function setupTyping(user) {
  if (typingListenerAttached) return;
  typingListenerAttached = true;

  const typingRef = db.ref("typing/" + user.uid);

  msgInput.addEventListener("input", () => {
    const isTyping = msgInput.value.trim().length > 0;
    typingRef.set(isTyping).catch(console.error);
  });

  db.ref("typing").on("value", snap => {
    const typingData = snap.val() || {};
    const othersTyping = Object.keys(typingData).filter(uid => uid !== user.uid && typingData[uid]);
    typingIndicator.textContent = othersTyping.length > 0 ? "Someone is typing..." : "";
  });
}

// 8. Online users

function setupOnlineUsers(user) {
  if (onlineUsersListenerAttached) return;
  onlineUsersListenerAttached = true;

  const userRef = db.ref("onlineUsers/" + user.uid);

  userRef.set({
    email: user.email,
    timestamp: Date.now()
  }).catch(console.error);

  userRef.onDisconnect().remove();

  db.ref("onlineUsers").on("value", snap => {
    const users = snap.val() || {};
    onlineUsersDiv.innerHTML = "";

    Object.keys(users).forEach(uid => {
      const u = users[uid];
      const row = document.createElement("div");
      row.className = "online-user";

      const avatar = createAvatar(u.email);
      const span = document.createElement("span");
      span.textContent = u.email;

      row.appendChild(avatar);
      row.appendChild(span);
      onlineUsersDiv.appendChild(row);
    });
  });
}


// 9. Admin panel (roles, bans, warnings, badges)

function loadUsersForAdmin() {
  if (adminUsersListenerAttached) return;
  adminUsersListenerAttached = true;

  db.ref("users").on("value", snap => {
    const users = snap.val() || {};
    adminUsersDiv.innerHTML = "";

    if (!Object.keys(users).length) {
      adminUsersDiv.innerHTML = "<p>No users found.</p>";
      return;
    }

    Object.keys(users).forEach(uid => {
      const user = users[uid];

      const row = document.createElement("div");
      row.className = "admin-user";

      // Role badge
      const badge = document.createElement("span");
      badge.className = "role-badge " +
        (user.role === "admin" ? "role-admin" : "role-mod");

      // Ban status text
      let banStatus = "";
      if (user.banExpires === "perm") {
        banStatus = " [PERM BANNED]";
      } else if (typeof user.banExpires === "number" && user.banExpires > Date.now()) {
        const mins = Math.ceil((user.banExpires - Date.now()) / 60000);
        banStatus = ` [BANNED ${mins}m left]`;
      }

      const label = document.createElement("span");
      label.textContent = `${user.email} (${user.role || "user"})${banStatus}`;

      const actions = document.createElement("div");
      actions.className = "admin-actions";

      // Permanent ban
      const permBanBtn = document.createElement("button");
      permBanBtn.textContent = "Ban Perm";
      permBanBtn.onclick = () => {
        db.ref("users/" + uid + "/banExpires").set("perm");
      };

      // 24‑hour ban
      const ban24Btn = document.createElement("button");
      ban24Btn.textContent = "Ban 24h";
      ban24Btn.onclick = () => {
        const expires = Date.now() + 24 * 60 * 60 * 1000;
        db.ref("users/" + uid + "/banExpires").set(expires);
      };

      // 6‑hour ban
      const ban6Btn = document.createElement("button");
      ban6Btn.textContent = "Ban 6h";
      ban6Btn.onclick = () => {
        const expires = Date.now() + 6 * 60 * 60 * 1000;
        db.ref("users/" + uid + "/banExpires").set(expires);
      };

      // Unban
      const unbanBtn = document.createElement("button");
      unbanBtn.textContent = "Unban";
      unbanBtn.onclick = () => {
        db.ref("users/" + uid + "/banExpires").remove();
      };

      // Warn
      const warnBtn = document.createElement("button");
      warnBtn.textContent = "Warn";
      warnBtn.onclick = () => {
        db.ref("users/" + uid + "/warning").set({
          message: "You have been cautioned by an admin.",
          timestamp: Date.now()
        });
        alert("Warning sent.");
      };

      actions.appendChild(permBanBtn);
      actions.appendChild(ban24Btn);
      actions.appendChild(ban6Btn);
      actions.appendChild(unbanBtn);
      actions.appendChild(warnBtn);

      row.appendChild(badge);
      row.appendChild(label);
      row.appendChild(actions);

      adminUsersDiv.appendChild(row);
    });
  });
}

// 10. Auth buttons (login / register / logout)

if (registerBtn) {
  registerBtn.onclick = () => {
    authError.textContent = "";
    const email = (emailInput.value || "").trim();
    const pass  = (passwordInput.value || "").trim();
    if (!email || !pass) {
      authError.textContent = "Please enter email and password.";
      return;
    }
    auth.createUserWithEmailAndPassword(email, pass)
      .catch(err => {
        console.error(err);
        authError.textContent = err.message || "Registration failed.";
      });
  };
}

if (loginBtn) {
  loginBtn.onclick = () => {
    authError.textContent = "";
    const email = (emailInput.value || "").trim();
    const pass  = (passwordInput.value || "").trim();
    if (!email || !pass) {
      authError.textContent = "Please enter email and password.";
      return;
    }
    auth.signInWithEmailAndPassword(email, pass)
      .catch(err => {
        console.error(err);
        authError.textContent = err.message || "Login failed.";
      });
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    auth.signOut().catch(err => {
      console.error(err);
      alert("Logout failed.");
    });
  };
}

// 11. Auth state + role + warnings + wiring

auth.onAuthStateChanged(user => {
  if (!user) {
    authBox.classList.remove("hidden");
    chatWrapper.classList.add("hidden");
    return;
  }
  
  db.ref("users/" + user.uid + "/role").once("value").then(snap => {
  cachedIsAdmin = snap.val() === "admin";
});

  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");

  userEmailSpan.textContent = user.email;

  // Ensure user record exists
  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      return db.ref("users/" + user.uid).set({
        email: user.email,
        role: "mod",
        banned: false
      });
    }
  }).catch(console.error);

  // Show role + admin panel
  db.ref("users/" + user.uid + "/role").on("value", snap => {
    const role = snap.val() || "mod";
    userRoleSpan.textContent = role;
    if (role === "admin") {
      adminBox.classList.remove("hidden");
      loadUsersForAdmin();
    } else {
      adminBox.classList.add("hidden");
    }
  });

  // Show warning once
  db.ref("users/" + user.uid + "/warning").once("value").then(snap => {
    if (snap.exists()) {
      const data = snap.val();
      alert(data.message || "You have been cautioned by an admin.");
      db.ref("users/" + user.uid + "/warning").remove();
    }
  }).catch(console.error);

  // Setup features
  loadMessages();
  setupTyping(user);
  setupOnlineUsers(user);
});

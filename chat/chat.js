/* jshint esversion: 8 */

  apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
  authDomain: "wildstyle-chat.firebaseapp.com",
  databaseURL: "https://wildstyle-chat-default-rtdb.firebaseio.com",
  projectId: "wildstyle-chat",
  storageBucket: "wildstyle-chat.firebasestorage.app",
  messagingSenderId: "259584470846",
  appId: "1:259584470846:web:81d005c0c68c6c2a1f466f",
  measurementId: "G-M7MVE2CY8B"

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();

// 2. DOM elements
const authBox      = document.getElementById("auth-box");
const chatWrapper  = document.getElementById("chat-wrapper");
const userInfoSpan = document.getElementById("user-info");
const userRoleSpan = document.getElementById("user-role");

const messagesDiv  = document.getElementById("messages");
const msgInput     = document.getElementById("msg-input");
const sendBtn      = document.getElementById("send-btn");

const typingIndicator = document.getElementById("typing-indicator");
const onlineUsersDiv  = document.getElementById("online-users");

const adminBox    = document.getElementById("admin-box");
const adminUsersDiv = document.getElementById("adminUsers");

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

    db.ref("users/" + user.uid + "/role").once("value").then(roleSnap => {
      const isAdmin = roleSnap.val() === "admin";
      appendChatMessage(key, msg, { uid: user.uid, isAdmin });
    }).catch(console.error);
  });

  db.ref("messages").on("child_removed", () => {
    messagesDiv.innerHTML = "";
    const user = auth.currentUser;
    if (!user) return;

    db.ref("users/" + user.uid + "/role").once("value").then(roleSnap => {
      const isAdmin = roleSnap.val() === "admin";
      db.ref("messages").limitToLast(200).once("value").then(snap2 => {
        snap2.forEach(child => {
          appendChatMessage(child.key, child.val(), { uid: user.uid, isAdmin });
        });
      });
    }).catch(console.error);
  });
}

// 6. Ban enforcement + sending

function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const text = msgInput.value.trim();
  if (!text) return;

  // Ban check
  db.ref("users/" + user.uid + "/banned").once("value").then(snap => {
    if (snap.val() === true) {
      alert("You are banned from sending messages.");
      return;
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

  // Listen to others typing
  db.ref("typing").on("value", snap => {
    const typingData = snap.val() || {};
    const othersTyping = Object.keys(typingData).filter(uid => uid !== user.uid && typingData[uid]);
    if (othersTyping.length > 0) {
      typingIndicator.textContent = "Someone is typing...";
    } else {
      typingIndicator.textContent = "";
    }
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

      const label = document.createElement("span");
      label.textContent = `${user.email} (${user.role || "user"})` +
        (user.banned ? " [BANNED]" : "");

      const actions = document.createElement("div");
      actions.className = "admin-actions";

      // Promote
      const promoteBtn = document.createElement("button");
      promoteBtn.textContent = "Make Admin";
      promoteBtn.onclick = () => {
        db.ref("users/" + uid + "/role").set("admin").catch(console.error);
      };

      // Demote
      const demoteBtn = document.createElement("button");
      demoteBtn.textContent = "Make Mod";
      demoteBtn.onclick = () => {
        db.ref("users/" + uid + "/role").set("mod").catch(console.error);
      };

      // Ban
      const banBtn = document.createElement("button");
      banBtn.textContent = "Ban";
      banBtn.onclick = () => {
        db.ref("users/" + uid + "/banned").set(true).catch(console.error);
      };

      // Unban
      const unbanBtn = document.createElement("button");
      unbanBtn.textContent = "Unban";
      unbanBtn.onclick = () => {
        db.ref("users/" + uid + "/banned").set(false).catch(console.error);
      };

      // Warn
      const warnBtn = document.createElement("button");
      warnBtn.textContent = "Warn";
      warnBtn.onclick = () => {
        db.ref("users/" + uid + "/warning").set({
          message: "You have been cautioned by an admin.",
          timestamp: Date.now()
        }).then(() => {
          alert("Warning sent.");
        }).catch(console.error);
      };

      actions.appendChild(promoteBtn);
      actions.appendChild(demoteBtn);
      actions.appendChild(banBtn);
      actions.appendChild(unbanBtn);
      actions.appendChild(warnBtn);

      row.appendChild(badge);
      row.appendChild(label);
      row.appendChild(actions);

      adminUsersDiv.appendChild(row);
    });
  });
}

// 10. Auth + role + warnings + wiring

auth.onAuthStateChanged(user => {
  if (!user) {
    authBox.classList.remove("hidden");
    chatWrapper.classList.add("hidden");
    return;
  }

  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");

  userInfoSpan.textContent = user.email;

  // Ensure user record exists
  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      return db.ref("users/" + user.uid).set({
        email: user.email,
        role: "mod",   // default role
        banned: false
      });
    }
  }).catch(console.error);

  // Show role
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

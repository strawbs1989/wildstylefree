// 1. Firebase config (replace with your own)
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

// DOM elements
const authBox = document.getElementById("auth-box");
const chatWrapper = document.getElementById("chat-wrapper");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authError = document.getElementById("auth-error");

const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");

const userEmailSpan = document.getElementById("user-email");
const userRoleSpan = document.getElementById("user-role");

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");

const onlineUsersDiv = document.getElementById("online-users");
const adminBox = document.getElementById("admin-box");
const userListDiv = document.getElementById("user-list");
const typingIndicatorDiv = document.getElementById("typing-indicator");

// 2. Auth actions

loginBtn.onclick = () => {
  authError.textContent = "";
  auth
    .signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
    .catch(err => {
      authError.textContent = err.message;
    });
};

registerBtn.onclick = () => {
  authError.textContent = "";
  auth
    .createUserWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
    .then(cred => {
      const uid = cred.user.uid;
      db.ref("users").once("value").then(snap => {
        const isFirstUser = !snap.exists();
        const role = isFirstUser ? "admin" : "user";

        db.ref("users/" + uid).set({
          email: emailInput.value.trim(),
          role: role
        });
      });
    })
    .catch(err => {
      authError.textContent = err.message;
    });
};

logoutBtn.onclick = () => auth.signOut();

// 3. Auth state listener

let messagesListenerAttached = false;
let typingListenerAttached = false;
let onlineListenerAttached = false;
let adminUsersListenerAttached = false;

auth.onAuthStateChanged(user => {
  if (user) {
    authBox.classList.add("hidden");
    chatWrapper.classList.remove("hidden");
    userEmailSpan.textContent = user.email;

    setupPresence(user);
    loadMessages();
    loadOnlineUsers();
    setupTyping(user);
    checkAdmin(user.uid);
  } else {
    chatWrapper.classList.add("hidden");
    authBox.classList.remove("hidden");
    messagesDiv.innerHTML = "";
    onlineUsersDiv.innerHTML = "";
    userListDiv.innerHTML = "";
    typingIndicatorDiv.textContent = "";

    detachAllListeners();
  }
});

function detachAllListeners() {
  if (messagesListenerAttached) {
    db.ref("messages").off();
    messagesListenerAttached = false;
  }
  if (onlineListenerAttached) {
    db.ref("onlineUsers").off();
    onlineListenerAttached = false;
  }
  if (typingListenerAttached) {
    db.ref("typing").off();
    typingListenerAttached = false;
  }
  if (adminUsersListenerAttached) {
    db.ref("users").off();
    adminUsersListenerAttached = false;
  }
}

// 4. Presence (online user list)

function setupPresence(user) {
  const userStatusRef = db.ref("onlineUsers/" + user.uid);

  db.ref(".info/connected").on("value", snap => {
    if (snap.val() === false) return;

    userStatusRef
      .onDisconnect()
      .remove()
      .then(() => {
        userStatusRef.set({
          email: user.email,
          timestamp: Date.now()
        });
      });
  });
}

function loadOnlineUsers() {
  if (onlineListenerAttached) return;
  onlineListenerAttached = true;

  db.ref("onlineUsers").on("value", snap => {
    const users = snap.val() || {};
    onlineUsersDiv.innerHTML = "";

    Object.keys(users).forEach(uid => {
      const u = users[uid];
      const row = document.createElement("div");
      row.className = "online-user";

      const avatar = createAvatar(u.email);
      const label = document.createElement("span");
      label.textContent = u.email;

      row.appendChild(avatar);
      row.appendChild(label);
      onlineUsersDiv.appendChild(row);
    });
  });
}

// 5. Typing indicator

let typingTimeout = null;

function setupTyping(user) {
  if (typingListenerAttached) return;
  typingListenerAttached = true;

  const myTypingRef = db.ref("typing/" + user.uid);

  msgInput.addEventListener("input", () => {
    myTypingRef.set({
      email: user.email,
      timestamp: Date.now()
    });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      myTypingRef.remove();
    }, 3000);
  });

  db.ref("typing").on("value", snap => {
    const data = snap.val() || {};
    const currentUid = user.uid;
    const others = Object.keys(data)
      .filter(uid => uid !== currentUid)
      .map(uid => data[uid].email);

    if (others.length === 0) {
      typingIndicatorDiv.textContent = "";
    } else if (others.length === 1) {
      typingIndicatorDiv.textContent = `${others[0]} is typing...`;
    } else {
      typingIndicatorDiv.textContent = `${others.length} people are typing...`;
    }
  });
}

// 6. Messages

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
      db.ref("messages/" + key).remove();
    };

    actions.appendChild(delBtn);
    body.appendChild(actions);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

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
    });
  });

  db.ref("messages").on("child_removed", snap => {
    // Simple approach: reload list
    messagesDiv.innerHTML = "";
    db.ref("messages").limitToLast(200).once("value").then(snap2 => {
      const user = auth.currentUser;
      if (!user) return;
      db.ref("users/" + user.uid + "/role").once("value").then(roleSnap => {
        const isAdmin = roleSnap.val() === "admin";
        snap2.forEach(child => {
          appendChatMessage(child.key, child.val(), { uid: user.uid, isAdmin });
        });
      });
    });
  });
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const user = auth.currentUser;
  if (!user) return;

  const text = msgInput.value.trim();
  if (!text) return;

  const newMsgRef = db.ref("messages").push();
  newMsgRef.set({
    userId: user.uid,
    userEmail: user.email,
    text: text.slice(0, 500),
    timestamp: Date.now()
  });

  msgInput.value = "";
}

// 7. Admin logic (ban, unban, mute, unmute)

function checkAdmin(uid) {
  db.ref("users/" + uid + "/role").once("value").then(snap => {
    const role = snap.val();
    userRoleSpan.textContent = role ? `(${role})` : "";
    if (role === "admin") {
      adminBox.classList.remove("hidden");
      loadUsersForAdmin();
    } else {
      adminBox.classList.add("hidden");
    }
  });
}

function loadUsersForAdmin() {
  if (adminUsersListenerAttached) return;
  adminUsersListenerAttached = true;

  db.ref("users").on("value", async snap => {
    const users = snap.val() || {};
    userListDiv.innerHTML = "";

    const bansSnap = await db.ref("bans").once("value");
    const mutesSnap = await db.ref("mutes").once("value");
    const bans = bansSnap.val() || {};
    const mutes = mutesSnap.val() || {};

    Object.keys(users).forEach(uid => {
      const u = users[uid];
      const row = document.createElement("div");
      row.className = "user-row";

      const infoSpan = document.createElement("span");
      const banned = !!bans[uid];
      const muted = !!mutes[uid];
      infoSpan.textContent = `${u.email} (${u.role})${banned ? " [BANNED]" : ""}${muted ? " [MUTED]" : ""}`;

      const banBtn = document.createElement("button");
      banBtn.textContent = banned ? "Unban" : "Ban";
      banBtn.onclick = () => {
        if (banned) {
          db.ref("bans/" + uid).remove();
        } else {
          db.ref("bans/" + uid).set(true);
        }
      };

      const muteBtn = document.createElement("button");
      muteBtn.textContent = muted ? "Unmute" : "Mute";
      muteBtn.onclick = () => {
        if (muted) {
          db.ref("mutes/" + uid).remove();
        } else {
          db.ref("mutes/" + uid).set(true);
        }
      };

      row.appendChild(infoSpan);
      row.appendChild(banBtn);
      row.appendChild(muteBtn);

      userListDiv.appendChild(row);
    });
  });
}

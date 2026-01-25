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
      // First user becomes admin
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

auth.onAuthStateChanged(user => {
  if (user) {
    authBox.classList.add("hidden");
    chatWrapper.classList.remove("hidden");
    userEmailSpan.textContent = user.email;

    setupPresence(user);
    loadMessages();
    loadOnlineUsers();
    checkAdmin(user.uid);
  } else {
    chatWrapper.classList.add("hidden");
    authBox.classList.remove("hidden");
    messagesDiv.innerHTML = "";
    onlineUsersDiv.innerHTML = "";
    userListDiv.innerHTML = "";
  }
});

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
  db.ref("onlineUsers").on("value", snap => {
    const users = snap.val() || {};
    onlineUsersDiv.innerHTML = "";

    Object.keys(users).forEach(uid => {
      const u = users[uid];
      const div = document.createElement("div");
      div.className = "online-user";
      div.textContent = u.email;
      onlineUsersDiv.appendChild(div);
    });
  });
}

// 5. Messages

function appendSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "msg system";
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendChatMessage(msg) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg";

  const meta = document.createElement("div");
  meta.className = "msg-meta";
  const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
  meta.textContent = `[${time}] ${msg.userEmail}`;

  const text = document.createElement("div");
  text.className = "msg-text";
  text.textContent = msg.text;

  wrapper.appendChild(meta);
  wrapper.appendChild(text);
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function loadMessages() {
  messagesDiv.innerHTML = "";
  db.ref("messages").off(); // avoid duplicates

  db.ref("messages").limitToLast(200).on("child_added", snap => {
    const msg = snap.val();
    appendChatMessage(msg);
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

// 6. Admin logic

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
  db.ref("users").on("value", snap => {
    const users = snap.val() || {};
    userListDiv.innerHTML = "";

    Object.keys(users).forEach(uid => {
      const u = users[uid];

      const row = document.createElement("div");
      row.className = "user-row";

      const infoSpan = document.createElement("span");
      infoSpan.textContent = `${u.email} (${u.role})`;

      const banBtn = document.createElement("button");
      banBtn.textContent = "Ban";
      banBtn.onclick = () => db.ref("bans/" + uid).set(true);

      const muteBtn = document.createElement("button");
      muteBtn.textContent = "Mute";
      muteBtn.onclick = () => db.ref("mutes/" + uid).set(true);

      row.appendChild(infoSpan);
      row.appendChild(banBtn);
      row.appendChild(muteBtn);

      userListDiv.appendChild(row);
    });
  });
}

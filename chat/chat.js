/* jshint esversion: 8 */
let cachedIsAdmin = false;

/* =========================
   1. Firebase init
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
  authDomain: "wildstyle-chat.firebaseapp.com",
  databaseURL: "https://wildstyle-chat-default-rtdb.firebaseio.com",
  projectId: "wildstyle-chat",
  storageBucket: "wildstyle-chat.firebasestorage.app",
  messagingSenderId: "259584470846",
  appId: "1:259584470846:web:81d005c0c68c6c2a1f466f"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();

/* =========================
   2. DOM elements
========================= */
const authBox     = document.getElementById("auth-box");
const chatWrapper = document.getElementById("chat-wrapper");

const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("login-btn");
const registerBtn   = document.getElementById("register-btn");
const authError     = document.getElementById("auth-error");
const logoutBtn     = document.getElementById("logout-btn");

const userEmailSpan = document.getElementById("user-email");
const userRoleSpan  = document.getElementById("user-role");

const messagesDiv = document.getElementById("messages");
const msgInput    = document.getElementById("msg-input");
const sendBtn     = document.getElementById("send-btn");

const typingIndicator = document.getElementById("typing-indicator");
const onlineUsersDiv  = document.getElementById("online-users");

const adminBox      = document.getElementById("adminbox");
const adminUsersDiv = document.getElementById("user-list");

/* =========================
   3. State flags
========================= */
let messagesListenerAttached = false;
let typingListenerAttached = false;
let onlineUsersListenerAttached = false;
let adminUsersListenerAttached = false;

/* =========================
   4. Helpers
========================= */
function createAvatar(email) {
  const div = document.createElement("div");
  div.className = "avatar";
  div.textContent = (email || "?").charAt(0).toUpperCase();
  return div;
}

/* =========================
   5. Messages
========================= */
function loadMessages() {
  if (messagesListenerAttached) return;
  messagesListenerAttached = true;

  messagesDiv.innerHTML = "";

  db.ref("messages").limitToLast(200).on("child_added", snap => {
    const msg = snap.val();
    const key = snap.key;
    const user = auth.currentUser;
    if (!user) return;

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
    if (msg.userId === user.uid || cachedIsAdmin) {
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
  });

  // keep deleted messages in sync
  db.ref("messages").on("child_removed", () => {
    messagesDiv.innerHTML = "";
    messagesListenerAttached = false;
    loadMessages();
  });
}

/* =========================
   6. Online users
========================= */
function setupOnlineUsers(user) {
  if (onlineUsersListenerAttached) return;
  onlineUsersListenerAttached = true;

  const ref = db.ref("onlineUsers/" + user.uid);
  ref.set({ email: user.email });
  ref.onDisconnect().remove();

  db.ref("onlineUsers").on("value", snap => {
    onlineUsersDiv.innerHTML = "";
    Object.values(snap.val() || {}).forEach(u => {
      onlineUsersDiv.appendChild(createAvatar(u.email));
    });
  });
}

/* =========================
   7. Admin panel
========================= */
function loadUsersForAdmin() {
  if (!cachedIsAdmin || adminUsersListenerAttached) return;
  adminUsersListenerAttached = true;

  db.ref("users").on("value", snap => {
    adminUsersDiv.innerHTML = "";
    Object.entries(snap.val() || {}).forEach(([uid, user]) => {
      const row = document.createElement("div");
      row.textContent = `${user.email} (${user.role || "user"})`;
      adminUsersDiv.appendChild(row);
    });
  });
}

/* =========================
   8. Auth buttons
========================= */
registerBtn.onclick = () => {
  authError.textContent = "";
  auth.createUserWithEmailAndPassword(
    emailInput.value.trim(),
    passwordInput.value.trim()
  ).catch(err => authError.textContent = err.message);
};

loginBtn.onclick = () => {
  authError.textContent = "";
  auth.signInWithEmailAndPassword(
    emailInput.value.trim(),
    passwordInput.value.trim()
  ).catch(err => authError.textContent = err.message);
};

logoutBtn.onclick = () => auth.signOut();

/* =========================
   9. Auth state
========================= */
auth.onAuthStateChanged(user => {
  if (!user) {
    authBox.classList.remove("hidden");
    chatWrapper.classList.add("hidden");
    return;
  }

  authBox.classList.add("hidden");
  chatWrapper.classList.remove("hidden");

  userEmailSpan.textContent = user.email;

  db.ref("users/" + user.uid).once("value").then(snap => {
    if (!snap.exists()) {
      return db.ref("users/" + user.uid).set({
        email: user.email,
        role: "mod"
      });
    }
  });

  db.ref("users/" + user.uid + "/role").on("value", snap => {
    const role = snap.val() || "mod";
    cachedIsAdmin = role === "admin";
    userRoleSpan.textContent = role;

    if (cachedIsAdmin) {
      adminBox.classList.remove("hidden");
      loadUsersForAdmin();
    } else {
      adminBox.classList.add("hidden");
    }
  });

  loadMessages();
  setupOnlineUsers(user);
});

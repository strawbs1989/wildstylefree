import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const sendBtn = document.getElementById("send");

loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, email.value, password.value);
};

registerBtn.onclick = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value);
};

onAuthStateChanged(auth, user => {
  if (!user) return;
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");
  loadMessages();
});

sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    text,
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });

  messageInput.value = "";
};

function loadMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt"));
  onSnapshot(q, snap => {
    messages.innerHTML = "";
    snap.forEach(doc => {
      const m = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.textContent = m.text;
      messages.appendChild(div);
    });
  });
}


#chat {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 1fr auto;
  height: calc(100vh - 70px);
  gap: 10px;
}

#users {
  background:#0b1225;
  border-radius:8px;
  padding:10px;
}

#messages {
  grid-column: 2;
  overflow-y: auto;
}

#inputArea {
  grid-column: 1 / -1;
}

let lastMessageTime = 0;

sendBtn.onclick = async () => {
  const now = Date.now();
  if (now - lastMessageTime < 3000) {
    alert("Slow down 😅");
    return;
  }

  lastMessageTime = now;

  const text = messageInput.value.trim();
  if (!text || text.length > 300) return;

  await addDoc(collection(db, "messages"), {
    text,
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });

  messageInput.value = "";
};

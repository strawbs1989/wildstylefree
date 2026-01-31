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

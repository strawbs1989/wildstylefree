import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
apiKey: "AIzaSyADr8JTwvtlIgXG04JxeP8Q2LjQznyWwms",
authDomain: "wildstyle-chat.firebaseapp.com",
databaseURL: "https://wildstyle-chat-default-rtdb.firebaseio.com",
projectId: "wildstyle-chat"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


await signInAnonymously(auth);


const messagesRef = ref(db, "messages");


window.sendMsg = () => {
const input = document.getElementById("msg");
if (!input || !input.value.trim()) return;


push(messagesRef, {
uid: auth.currentUser.uid,
name: "Listener",
text: input.value,
timestamp: Date.now()
});


input.value = "";
};


onChildAdded(messagesRef, snap => {
const msg = snap.val();
const div = document.createElement("div");
div.className = "message";
div.innerHTML = `<b>${msg.name}</b>: ${msg.text}`;
document.getElementById("messages")?.appendChild(div);
});
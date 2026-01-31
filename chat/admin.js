import { auth, db } from "./firebase.js";
import {
  doc, updateDoc, collection, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const adminPanel = document.getElementById("adminPanel");
const userList = document.getElementById("userList");

onSnapshot(collection(db, "users"), snap => {
  userList.innerHTML = "";
  snap.forEach(docSnap => {
    const u = docSnap.data();
    const div = document.createElement("div");
    div.textContent = `${u.displayName} (${u.role})`;

    if (u.role !== "admin") {
      const banBtn = document.createElement("button");
      banBtn.textContent = "24h Ban";
      banBtn.onclick = () => {
        updateDoc(doc(db,"users",docSnap.id), {
          banned:true,
          banUntil: Date.now()+86400000
        });
      };
      div.appendChild(banBtn);
    }

    userList.appendChild(div);
  });
});

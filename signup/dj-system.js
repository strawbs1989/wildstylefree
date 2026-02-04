// dj-system.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = { 
apiKey: "AIzaSyDPW93dgJY0MUH9FldBlHIwoIRYaGMfxhU", 
authDomain: "dj-system-ce829.firebaseapp.com", 
projectId: "dj-system-ce829", 
storageBucket: "dj-system-ce829.firebasestorage.app", 
messagingSenderId: "600971208637", 
appId: "1:600971208637:web:a98dcfe251f91a327814d4" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authStatusEl = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const djApplicationCard = document.getElementById("djApplicationCard");
const djStatusCard = document.getElementById("djStatusCard");
const djStatusText = document.getElementById("djStatusText");
const submitDjApplicationBtn = document.getElementById("submitDjApplicationBtn");
const djApplicationStatus = document.getElementById("djApplicationStatus");

const adminDashboardCard = document.getElementById("adminDashboardCard");
const pendingDjsList = document.getElementById("pendingDjsList");
const approvedDjsList = document.getElementById("approvedDjsList");

// Admin check via Firestore: admins/{uid} = { isAdmin: true }
async function isAdmin(uid) {
  if (!uid) return false;
  const adminRef = doc(db, "admins", uid);
  const snap = await getDoc(adminRef);
  return snap.exists() && snap.data().isAdmin === true;
}

// Auth UI
loginBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error(err);
    alert("Login failed.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authStatusEl.textContent = "You are not logged in.";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    djApplicationCard.classList.add("hidden");
    djStatusCard.classList.add("hidden");
    adminDashboardCard.classList.add("hidden");
    return;
  }

  authStatusEl.textContent = `Logged in as ${user.email}`;
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");

  djApplicationCard.classList.remove("hidden");
  djStatusCard.classList.remove("hidden");
  loadDjStatus(user.uid);

  if (await isAdmin(user.uid)) {
    adminDashboardCard.classList.remove("hidden");
    initAdminDashboard();
  } else {
    adminDashboardCard.classList.add("hidden");
  }
});

// DJ application submit
submitDjApplicationBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to apply.");
    return;
  }

  const name = document.getElementById("djName").value.trim();
  const bio = document.getElementById("djBio").value.trim();
  const socials = document.getElementById("djSocials").value.trim();
  const demo = document.getElementById("djDemo").value.trim();

  if (!name || !bio) {
    alert("Please fill in at least your name and bio.");
    return;
  }

  try {
    const pendingRef = doc(db, "pending_djs", user.uid);
    await setDoc(pendingRef, {
      uid: user.uid,
      name,
      email: user.email,
      bio,
      socials,
      demoLink: demo,
      timestamp: Date.now()
    });

    djApplicationStatus.textContent = "Your DJ application has been submitted and is pending review.";
    djApplicationStatus.style.color = "#4caf50";
    loadDjStatus(user.uid);
  } catch (err) {
    console.error(err);
    djApplicationStatus.textContent = "Error submitting application.";
    djApplicationStatus.style.color = "#f44336";
  }
});

// Load DJ status
async function loadDjStatus(uid) {
  const pendingRef = doc(db, "pending_djs", uid);
  const djRef = doc(db, "djs", uid);

  const [pendingSnap, djSnap] = await Promise.all([
    getDoc(pendingRef),
    getDoc(djRef)
  ]);

  if (djSnap.exists()) {
    const data = djSnap.data();
    djStatusText.textContent = `Approved DJ: ${data.name} (role: ${data.role || "dj"})`;
  } else if (pendingSnap.exists()) {
    djStatusText.textContent = "Your application is pending admin review.";
  } else {
    djStatusText.textContent = "You have not applied as a DJ yet.";
  }
}

// Render pending DJs
function renderPendingDjs(snapshot) {
  pendingDjsList.innerHTML = "";
  if (snapshot.empty) {
    pendingDjsList.innerHTML = "<p>No pending applications.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "dj-item";
    div.innerHTML = `
      <strong>${data.name}</strong> <span class="badge">Pending</span><br>
      <small>${data.email}</small><br>
      <em>${data.bio || ""}</em><br>
      <small>Socials: ${data.socials || "N/A"}</small><br>
      <small>Demo: ${data.demoLink ? `<a href="${data.demoLink}" target="_blank">Listen</a>` : "N/A"}</small>
      <div class="actions">
        <button class="btn-primary" data-approve="${data.uid}">Approve</button>
        <button class="btn-secondary" data-reject="${data.uid}">Reject</button>
      </div>
    `;
    pendingDjsList.appendChild(div);
  });

  pendingDjsList.querySelectorAll("[data-approve]").forEach(btn => {
    btn.addEventListener("click", () => approveDJ(btn.getAttribute("data-approve")));
  });
  pendingDjsList.querySelectorAll("[data-reject]").forEach(btn => {
    btn.addEventListener("click", () => rejectDJ(btn.getAttribute("data-reject")));
  });
}

// Render approved DJs
function renderApprovedDjs(snapshot) {
  approvedDjsList.innerHTML = "";
  if (snapshot.empty) {
    approvedDjsList.innerHTML = "<p>No approved DJs yet.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "dj-item";
    div.innerHTML = `
      <strong>${data.name}</strong> <span class="badge">DJ</span><br>
      <small>${data.email}</small><br>
      <em>${data.bio || ""}</em><br>
      <small>Approved at: ${data.approvedAt ? new Date(data.approvedAt).toLocaleString() : "N/A"}</small>
    `;
    approvedDjsList.appendChild(div);
  });
}

// Admin dashboard listeners
function initAdminDashboard() {
  const pendingQuery = query(collection(db, "pending_djs"), orderBy("timestamp", "desc"));
  onSnapshot(pendingQuery, renderPendingDjs);

  const approvedQuery = query(collection(db, "djs"), orderBy("approvedAt", "desc"));
  onSnapshot(approvedQuery, renderApprovedDjs);
}

// Approve DJ
async function approveDJ(uid) {
  const adminUser = auth.currentUser;
  if (!adminUser || !(await isAdmin(adminUser.uid))) {
    alert("You are not authorized to approve DJs.");
    return;
  }

  const pendingRef = doc(db, "pending_djs", uid);
  const pendingSnap = await getDoc(pendingRef);
  if (!pendingSnap.exists()) return;

  const data = pendingSnap.data();
  const djRef = doc(db, "djs", uid);

  await setDoc(djRef, {
    ...data,
    role: "dj",
    approvedBy: adminUser.uid,
    approvedAt: Date.now()
  });

  await deleteDoc(pendingRef);
}

// Reject DJ
async function rejectDJ(uid) {
  const adminUser = auth.currentUser;
  if (!adminUser || !(await isAdmin(adminUser.uid))) {
    alert("You are not authorized to reject DJs.");
    return;
  }

  const pendingRef = doc(db, "pending_djs", uid);
  await deleteDoc(pendingRef);
}

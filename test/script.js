let admins = loadAdmins(); // { username: hashedPass }
let blockedUsers = [];
let muted = false;
let currentUser = null;

function showLogin() {
  document.getElementById("loginModal").style.display = "block";
  document.getElementById("signupModal").style.display = "none";
  document.getElementById("container").style.display = "none";
}

function showSignup() {
  document.getElementById("signupModal").style.display = "block";
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("container").style.display = "none";
}

function loadAdmins() {
  const stored = localStorage.getItem("chatAdmins");
  return stored ? JSON.parse(stored) : {};
}

function saveAdmins() {
  localStorage.setItem("chatAdmins", JSON.stringify(admins));
}

function hashPass(pass) {
  return btoa(pass); // simple encoding for demo only
}

function signup() {
  const user = document.getElementById("signupUser").value.trim();
  const pass = document.getElementById("signupPass").value;

  if (!user || !pass) {
    alert("Please enter username and password");
    return;
  }
  if (admins[user]) {
    alert("Username already taken");
    return;
  }
  admins[user] = hashPass(pass);
  saveAdmins();
  alert(`Admin "${user}" registered! You can now log in.`);
  showLogin();
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;

  if (!user) {
    alert("Please enter username");
    return;
  }

  if (admins[user]) {
    if (hashPass(pass) === admins[user]) {
      currentUser = { username: user, role: "admin" };
    } else {
      alert("Wrong password for admin.");
      return;
    }
  } else {
    currentUser = { username: user, role: "guest" };
  }

  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
  document.getElementById("container").style.display = "flex";

  updateAdminList();
  updateAdminControls();
  addSystemMessage(`${currentUser.username} logged in as ${currentUser.role}`);
}

function updateAdminList() {
  const list = document.getElementById("adminList");
  list.innerHTML = "";
  Object.keys(admins).forEach(admin => {
    const li = document.createElement("li");
    li.textContent = admin;
    list.appendChild(li);
  });
}

function updateAdminControls() {
  const controls = document.getElementById("admin-controls");
  controls.style.display = currentUser.role === "admin" ? "block" : "none";
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();

  if (!msg) return;
  if (muted && currentUser.role !== "admin") return alert("Chat is muted.");
  if (blockedUsers.includes(currentUser.username)) return alert("You are blocked.");

  const messages = document.getElementById("messages");
  const div = document.createElement("div");

  div.innerHTML = `
    <strong>${currentUser.username}</strong>
    ${currentUser.role === "admin" ? '<span class="admin-badge">Admin</span>' : ''}: 
    ${escapeHtml(msg)}
  `;
  messages.appendChild(div);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
}

function clearChat() {
  if (currentUser.role !== "admin") return;
  document.getElementById("messages").innerHTML = "";
}

function toggleMuteAll() {
  if (currentUser.role !== "admin") return;
  muted = !muted;
  alert(muted ? "All users muted." : "Users can send messages again.");
}

function blockUser() {
  if (currentUser.role !== "admin") return alert("Admins only.");
  const username = prompt("Enter username to block:");
  if (!username) return;
  if (blockedUsers.includes(username)) {
    alert(`${username} is already blocked.`);
    return;
  }
  blockedUsers.push(username);
  alert(`${username} has been blocked.`);
}

function unblockUser() {
  if (currentUser.role !== "admin") return alert("Admins only.");
  const username = prompt("Enter username to unblock:");
  if (!username) return;
  const idx = blockedUsers.indexOf(username);
  if (idx === -1) {
    alert(`${username} is not blocked.`);
    return;
  }
  blockedUsers.splice(idx, 1);
  alert(`${username} has been unblocked.`);
}

function changeName() {
  const newName = prompt("Enter your new username:");
  if (!newName) return;
  if (admins[newName]) {
    alert("Username already taken.");
    return;
  }
  if (currentUser.role === "admin") {
    // Rename admin in admins object
    admins[newName] = admins[currentUser.username];
    delete admins[currentUser.username];
    saveAdmins();
  }
  currentUser.username = newName;
  updateAdminList();
  addSystemMessage(`User changed name to ${newName}`);
}

function addSystemMessage(msg) {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.style.fontStyle = "italic";
  div.style.color = "gray";
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

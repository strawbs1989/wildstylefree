let currentUser = { username: "Jay", role: "admin" };
let muted = false;
let blockedUsers = ["UnknownUser1", "SpamBot"];
let admins = ["Jay", "Laura"];

function init() {
  updateAdminList();
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (isBlocked(currentUser.username) || (muted && currentUser.role !== "admin")) {
    alert("You are not allowed to send messages.");
    return;
  }

  displayMessage(currentUser.username, message);
  input.value = "";
}

function isBlocked(username) {
  return blockedUsers.includes(username);
}

function displayMessage(user, text) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${user}: ${text}`;
  document.getElementById("messages").appendChild(msgDiv);
}

function clearChat() {
  document.getElementById("messages").innerHTML = "";
}

function toggleMuteAll() {
  muted = !muted;
  alert(muted ? "All users are now muted." : "Users are unmuted.");
}

function blockUser() {
  if (currentUser.role !== "admin") {
    alert("Only admins can block users.");
    return;
  }
  const userToBlock = prompt("Enter the username to block:");
  if (userToBlock && !blockedUsers.includes(userToBlock)) {
    blockedUsers.push(userToBlock);
    alert(`${userToBlock} has been blocked.`);
  }
}

function unblockUser() {
  if (currentUser.role !== "admin") {
    alert("Only admins can unblock users.");
    return;
  }
  const userToUnblock = prompt("Enter the username to unblock:");
  if (userToUnblock && blockedUsers.includes(userToUnblock)) {
    blockedUsers = blockedUsers.filter(user => user !== userToUnblock);
    alert(`${userToUnblock} has been unblocked.`);
  }
}

function updateAdminList() {
  const adminList = document.getElementById("adminList");
  adminList.innerHTML = "";
  admins.forEach(admin => {
    const li = document.createElement("li");
    li.textContent = admin;
    adminList.appendChild(li);
  });
}

function changeName() {
  const newName = prompt("Enter your new display name:");
  if (newName) {
    const oldName = currentUser.username;
    currentUser.username = newName;
    if (currentUser.role === "admin") {
      const index = admins.indexOf(oldName);
      if (index !== -1) {
        admins[index] = newName;
      }
    }
    updateAdminList();
    alert(`Your name has been changed to ${newName}`);
  }
}

window.onload = init;

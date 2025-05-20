let currentUser = { username: "Jay", role: "admin" };
let muted = false;
let blockedUsers = ["UnknownUser1", "SpamBot"];

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (currentUser.role !== "admin" && (isBlocked(currentUser.username) || muted)) {
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
  const userToBlock = prompt("Enter the username to block:");
  if (userToBlock && !blockedUsers.includes(userToBlock)) {
    blockedUsers.push(userToBlock);
    alert(`${userToBlock} has been blocked.`);
  }
}

function unblockUser() {
  const userToUnblock = prompt("Enter the username to unblock:");
  if (userToUnblock && blockedUsers.includes(userToUnblock)) {
    blockedUsers = blockedUsers.filter(user => user !== userToUnblock);
    alert(`${userToUnblock} has been unblocked.`);
  }
}

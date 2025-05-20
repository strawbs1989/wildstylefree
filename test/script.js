let currentUser = { username: "Jay", role: "admin" };
let isMuted = false;
let blockedUsers = ["UnknownUser1", "SpamBot"];

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (isMuted) {
    alert("Chat is muted. Please wait.");
    return;
  }

  if (currentUser.role !== "admin" && isBlocked(currentUser.username)) {
    alert("You're blocked from chatting.");
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
  if (currentUser.role !== "admin") {
    alert("You do not have permission to clear the chat.");
    return;
  }
  document.getElementById("messages").innerHTML = "";
}

function muteAll() {
  if (currentUser.role !== "admin") {
    alert("You do not have permission to mute all users.");
    return;
  }
  isMuted = !isMuted;
  alert(isMuted ? "All users are muted." : "Users can send messages again.");
}

function blockUser(username) {
  if (currentUser.role !== "admin") {
    alert("You do not have permission to block users.");
    return;
  }
  if (blockedUsers.includes(username)) {
    alert(`${username} is already blocked.`);
    return;
  }
  blockedUsers.push(username);
  alert(`${username} has been blocked.`);
}

function unblockUser(username) {
  if (currentUser.role !== "admin") {
    alert("You do not have permission to unblock users.");
    return;
  }
  blockedUsers = blockedUsers.filter(user => user !== username);
  alert(`${username} has been unblocked.`);
}

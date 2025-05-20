let currentUser = { username: "Jay", role: "admin" };

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  if (currentUser.role !== "admin" && isBlocked(currentUser.username)) {
    alert("You're blocked from chatting.");
    return;
  }

  displayMessage(currentUser.username, message);
  input.value = "";
}

function isBlocked(username) {
  const blockedUsers = ["UnknownUser1", "SpamBot"];
  return blockedUsers.includes(username);
}

function displayMessage(user, text) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${user}: ${text}`;
  document.getElementById("messages").appendChild(msgDiv);
}

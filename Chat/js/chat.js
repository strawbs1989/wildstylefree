// ==========================================
// Wildstyle Community Chat
// ==========================================

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;

// ------------------------------------------
// Get Logged In User
// ------------------------------------------

async function getUser() {

    const { data } = await client.auth.getUser();

    if (!data.user) {

        window.location.href = "index.html";
        return;

    }

    currentUser = data.user;

}

// ------------------------------------------
// Load Messages
// ------------------------------------------

async function loadMessages() {

    const { data, error } = await client
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {

        console.error(error);
        return;

    }

    messagesDiv.innerHTML = "";

    data.forEach(addMessage);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

}

// ------------------------------------------
// Display Message
// ------------------------------------------

function addMessage(msg) {

    const div = document.createElement("div");

    div.className = "chat-message";

    const time = new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    div.innerHTML = `
        <div class="chat-user">
            👤 ${msg.user_id}
        </div>

        <div class="chat-text">
            ${escapeHtml(msg.message)}
        </div>

        <div class="chat-time">
            ${time}
        </div>
    `;

    messagesDiv.appendChild(div);

}

// ------------------------------------------
// Send Message
// ------------------------------------------

async function sendMessage() {

    const text = input.value.trim();

    if (text === "") return;

    const { error } = await client
        .from("messages")
        .insert([{

            user_id: currentUser.id,
            message: text

        }]);

    if (error) {

        alert(error.message);
        console.error(error);
        return;

    }

    input.value = "";

}

// ------------------------------------------
// Realtime Listener
// ------------------------------------------

client
.channel("community-chat")
.on(
    "postgres_changes",
    {
        event: "INSERT",
        schema: "public",
        table: "messages"
    },
    payload => {

        addMessage(payload.new);

        messagesDiv.scrollTop =
            messagesDiv.scrollHeight;

    }
)
.subscribe();

// ------------------------------------------
// Escape HTML
// ------------------------------------------

function escapeHtml(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

// ------------------------------------------
// Events
// ------------------------------------------

sendBtn.addEventListener(
    "click",
    sendMessage
);

// ------------------------------------------
// Start
// ------------------------------------------

(async () => {

    await getUser();

    await loadMessages();

})();

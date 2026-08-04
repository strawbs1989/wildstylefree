// =====================================================
// Wildstyle Community Chat
// =====================================================

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;

// ==========================================
// START
// ==========================================

(async function () {

    const { data: { user } } = await client.auth.getUser();

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    currentUser = user;

    await loadMessages();

    enableRealtime();

})();

// ==========================================
// LOAD OLD MESSAGES
// ==========================================

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

    data.forEach(showMessage);

    scrollBottom();

}

// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(msg) {

    const div = document.createElement("div");

    div.className = "chat-message";

    const time = new Date(msg.created_at)
        .toLocaleTimeString([], {

            hour: "2-digit",
            minute: "2-digit"

        });

    div.innerHTML = `

        <div class="chat-user">
            👤 ${msg.user_id.substring(0,8)}
        </div>

        <div class="chat-text">
            ${escapeHTML(msg.message)}
        </div>

        <div class="chat-time">
            ${time}
        </div>

    `;

    messagesDiv.appendChild(div);

}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const text = messageInput.value.trim();

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

    messageInput.value = "";

}

// ==========================================
// REALTIME
// ==========================================

function enableRealtime() {

    client

        .channel("wildstyle-chat")

        .on(

            "postgres_changes",

            {

                event: "INSERT",

                schema: "public",

                table: "messages"

            },

            payload => {

                showMessage(payload.new);

                scrollBottom();

            }

        )

        .subscribe();

}

// ==========================================
// SCROLL
// ==========================================

function scrollBottom() {

    messagesDiv.scrollTop =
        messagesDiv.scrollHeight;

}

// ==========================================
// SAFE HTML
// ==========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

// ==========================================
// EVENTS
// ==========================================

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", function(e){

    if(e.key==="Enter"){

        e.preventDefault();

        sendMessage();

    }

});

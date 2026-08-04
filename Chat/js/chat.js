// =====================================================
// Wildstyle Community Chat
// =====================================================

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let currentUser = null;

// Get logged in user
async function init() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    loadMessages();

    listenForMessages();

}

init();


// Load previous messages
async function loadMessages() {

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    messagesDiv.innerHTML = "";

    data.forEach(addMessage);

}


// Display one message
function addMessage(msg) {

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = `
        <strong>${msg.user_id.substring(0,8)}</strong><br>
        ${msg.message}
    `;

    messagesDiv.appendChild(div);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

}


// Send message
sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", e => {

    if (e.key === "Enter") {

        e.preventDefault();

        sendMessage();

    }

});


async function sendMessage() {

    const text = messageInput.value.trim();

    if (!text) return;

    const { error } = await supabase
        .from("messages")
        .insert({

            user_id: currentUser.id,

            message: text

        });

    if (error) {

        console.error(error);

        return;

    }

    messageInput.value = "";

}


// Listen for realtime messages
function listenForMessages() {

    supabase

        .channel("public:messages")

        .on(

            "postgres_changes",

            {

                event: "INSERT",

                schema: "public",

                table: "messages"

            },

            payload => {

                addMessage(payload.new);

            }

        )

        .subscribe();

}

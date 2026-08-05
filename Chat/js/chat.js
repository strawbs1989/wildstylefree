// =====================================================
// Wildstyle Community Chat
// =====================================================

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;
const usersList = document.getElementById("usersList");

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
    await client
    .from("online_users")
    .upsert({
        user_id: currentUser.id,
        last_seen: new Date().toISOString()
    });

loadOnlineUsers();

enableOnlineUsers();

    await loadMessages();

    enableRealtime();

})();

// ==========================================
// LOAD OLD MESSAGES
// ==========================================

async function loadMessages() {

    const { data, error } = await client

        .from("messages")

        .select(`
            *,
            profiles (
                display_name,
                avatar_url
            )
        `)

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

    const name =
        msg.profiles?.display_name || "Member";

    const avatar =
        msg.profiles?.avatar_url ||
        "/images/default-avatar.png";

    const time = new Date(msg.created_at)
        .toLocaleTimeString([], {

            hour: "2-digit",
            minute: "2-digit"

        });

    div.innerHTML = `

<div style="display:flex;gap:12px;align-items:flex-start;">

<img
src="${avatar}"
style="
width:48px;
height:48px;
border-radius:50%;
object-fit:cover;
">

<div style="flex:1;">

<div class="chat-user">
${name}
</div>

<div class="chat-text">
${escapeHTML(msg.message)}
</div>

<div class="chat-time">
${time}
</div>

</div>

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
            async (payload) => {

                const { data: profile } = await client
                    .from("profiles")
                    .select("display_name, avatar_url")
                    .eq("id", payload.new.user_id)
                    .single();

                payload.new.profiles = profile;

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
// ==========================================
// ONLINE USERS
// ==========================================

async function loadOnlineUsers() {

    const { data, error } = await client

        .from("online_users")

        .select(`
            *,
            profiles (
                display_name,
                avatar_url
            )
        `);

    if (error) {
        console.error(error);
        return;
    }

    usersList.innerHTML = "";

    data.forEach(user => {

        usersList.innerHTML += `
            <div class="user">
                🟢 ${user.profiles?.display_name || "Member"}
            </div>
        `;

    });

}

function enableOnlineUsers() {

    client

        .channel("online-users")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "online_users"
            },
            () => loadOnlineUsers()
        )

        .subscribe();

}

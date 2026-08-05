// =====================================================
// Wildstyle Community Chat
// =====================================================
const typingIndicator = document.getElementById("typingIndicator");

let typingTimeout;

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
    let badge = "";

switch (msg.role) {

    case "owner":
        badge = "👑 Owner";
        break;

    case "admin":
        badge = "🛡️ Admin";
        break;

    case "dj":
        badge = "🎧 DJ";
        break;

    case "vip":
        badge = "⭐ VIP";
        break;

    default:
        badge = "👤 Member";
}

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

    <span class="role-badge">
        ${badge}
    </span>

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
        const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

const { error } = await supabase
    .from("messages")
    .insert([{

        user_id: currentUser.id,
        message: text,
        role: profile?.role || "member"

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
// TYPING DETECTION
// ==========================================

messageInput.addEventListener("input", async () => {

    if (!currentUser) return;

    await supabase
        .from("typing_users")
        .upsert({
            user_id: currentUser.id,
            updated_at: new Date().toISOString()
        });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(async () => {

        await supabase
            .from("typing_users")
            .delete()
            .eq("user_id", currentUser.id);

    }, 2000);

});
// ==========================================
// ONLINE USERS
// ==========================================

async function loadOnlineUsers() {

    const { data, error } = await supabase

        .from("online_users")

        .select(`
            user_id,
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

        const name =
            user.profiles?.display_name || "Member";

        const avatar =
            user.profiles?.avatar_url || "";

        usersList.innerHTML += `

<div class="user">

    <img
        src="${avatar}"
        class="online-avatar">

    <span>
        🟢 ${name}
    </span>

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

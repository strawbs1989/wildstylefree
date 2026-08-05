// =====================================================
// Wildstyle Community Chat
// =====================================================
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

const typingIndicator = document.getElementById("typingIndicator");

let typingTimeout;

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;


let typing = false;
let typingTimer = null;
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
    await client
.from("chat_events")
.insert([{
    message: "🎉 " + currentUser.email + " joined the chat"
}]);

loadOnlineUsers();

enableOnlineUsers();

    await loadMessages();

    enableRealtime();
    enableTypingIndicator();

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
<button
    class="delete-btn"
    onclick="deleteMessage(${msg.id}, '${msg.user_id}')">
    🗑️
</button>

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

    const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    const { error } = await client
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

    typing = false;

    updateTyping(false);

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
// START / STOP TYPING
// ==========================================

async function updateTyping(isTyping) {

    if (!currentUser) return;

    if (isTyping) {

        await supabase
            .from("typing_users")
            .upsert({
                user_id: currentUser.id,
                updated_at: new Date().toISOString()
            });

    } else {

        await supabase
            .from("typing_users")
            .delete()
            .eq("user_id", currentUser.id);

    }

}
function enableTypingIndicator() {

    supabase

        .channel("typing")

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table: "typing_users"

            },

            async () => {

                const { data } = await supabase

                    .from("typing_users")

                    .select(`
                        user_id,
                        profiles(display_name)
                    `);

                const others = data.filter(
                    u => u.user_id !== currentUser.id
                );

                if (others.length === 0) {

                    typingIndicator.textContent = "";

                    return;

                }

                if (others.length === 1) {

                    typingIndicator.textContent =
                        `✍️ ${others[0].profiles.display_name} is typing...`;

                } else {

                    typingIndicator.textContent =
                        `✍️ ${others.length} people are typing...`;

                }

            }

        )

        .subscribe();

}
async function deleteMessage(messageId, ownerId) {

    if (ownerId !== currentUser.id) {

        alert("You can only delete your own messages.");

        return;

    }

    const { error } = await client
        .from("messages")
        .delete()
        .eq("id", messageId);

    if (error) {

        alert(error.message);
        return;

    }

    await loadMessages();

}
// ==========================================
// EMOJI PICKER
// ==========================================

emojiBtn.addEventListener("click", () => {

    emojiPicker.classList.toggle("open");

});

emojiPicker.innerHTML = emojiPicker.innerHTML
    .split(" ")
    .map(e => `<span>${e}</span>`)
    .join("");

emojiPicker.querySelectorAll("span").forEach(span => {

    span.addEventListener("click", () => {

        messageInput.value += span.textContent;

        messageInput.focus();

    });

});
// ==========================================
// EVENTS
// ==========================================

// Send button
sendBtn.addEventListener("click", sendMessage);

// Press Enter to send
messageInput.addEventListener("keydown", function(e){

    if(e.key==="Enter"){

        e.preventDefault();

        sendMessage();

    }

});

// Logout button
document
    .getElementById("logoutBtn")
    .addEventListener("click", logout);

// Typing detection
messageInput.addEventListener("input", () => {

    if (!typing) {

        typing = true;

        updateTyping(true);

    }

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {

        typing = false;

        updateTyping(false);

    }, 1500);

});

// ==========================================
// TYPING DETECTION
// ==========================================

messageInput.addEventListener("input", () => {

    if (!typing) {

        typing = true;

        updateTyping(true);

    }

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {

        typing = false;

        updateTyping(false);

    }, 1500);

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
    avatar_url,
    status
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
        ${statusIcon(user.profiles?.status)}
${name}
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

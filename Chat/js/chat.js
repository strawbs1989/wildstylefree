// =====================================================
// Wildstyle Community Chat
// =====================================================
const ownerPanel = document.getElementById("ownerPanel");
const closeOwnerPanel = document.getElementById("closeOwnerPanel");

let selectedUser = {

id: null,  

name: "",  

avatar: "",  

role: "",  

status: ""

};

const ownerAvatar =
document.getElementById("ownerAvatar");

const ownerName =
document.getElementById("ownerName");

const ownerRole =
document.getElementById("ownerRole");

const ownerStatus =
document.getElementById("ownerStatus");

const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

const typingIndicator = document.getElementById("typingIndicator");

let typingTimeout;

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;
let currentUserRole = "member";

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
const {
    data: profile,
    error: profileError
} = await client
    .from("profiles")
    .select("role, status, banned, ban_reason")
    .eq("id", user.id)
    .single();

if (profile?.banned) {

    alert(
        "🚫 You have been banned from Wildstyle Community.\n\n" +
        "Reason:\n" +
        (profile.ban_reason || "No reason supplied.")
    );

    await client.auth.signOut();

    window.location.href = "index.html";

    return;
}

if (profileError) {
    console.error(profileError);
}

currentUserRole = profile?.role || "member";
presenceStatus =
    profile?.status || "Online";

updateStatusButton(presenceStatus);
await client
.from("online_users")
.upsert({
user_id: currentUser.id,
last_seen: new Date().toISOString()
});

// ==========================================
// ONLINE HEARTBEAT
// ==========================================

setInterval(async () => {

    if (!currentUser) return;

    const { error } = await client
        .from("online_users")
        .upsert({
            user_id: currentUser.id,
            last_seen: new Date().toISOString()
        });

    if (error) {
        console.error("Online heartbeat error:", error);
    }

}, 30000);



await client
.from("chat_events")
.insert([{
message: "🎉 " + currentUser.email + " joined the chat"
}]);

loadOnlineUsers();

await loadMessages();  

enableRealtime();

enableTypingIndicator();
enableChatEvents();

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
        avatar_url,
        role
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

/* ==========================================
   MOBILE / DESKTOP USER SELECTION
   ========================================== */

div.addEventListener("click", function(e) {

    // Don't open a profile when clicking the delete button
    if (e.target.closest(".delete-btn")) {
        return;
    }

    // 📱 Mobile = MSN-style profile card
    // 💻 Desktop = Owner moderation panel
    if (window.innerWidth <= 768) {
        openMobileProfile(msg.user_id);
    } else {
        openOwnerPanel(msg.user_id);
    }

});
const name =  
    msg.profiles?.display_name || "Member";  
let badge = "";

switch (msg.profiles?.role) {

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
let deleteButton = "";

if (

currentUser.id === msg.user_id ||

currentUserRole === "owner" ||

currentUserRole === "admin"

){

deleteButton=`

`;

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

<div style="display:flex;gap:12px;align-items:flex-start;">  <img  
src="${avatar}"  
style="  
width:48px;  
height:48px;  
border-radius:50%;  
object-fit:cover;  
">

<div style="flex:1;">  <div class="chat-user">  ${name}  

<span class="role-badge">  
    ${badge}  
</span>

</div>  <div class="chat-text">  
${escapeHTML(msg.message)}  
</div>  <div class="chat-time">  
${time}  
</div>  
${deleteButton}  
<button  
    class="delete-btn"  
    onclick="deleteMessage(${msg.id}, '${msg.user_id}')">  
    🗑️  
</button>  </div>  </div>  `;

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

console.log(error);

if (error) {
    alert(JSON.stringify(error));
    console.error(error);
    return;
}



messageInput.value = "";  

typing = false;  

updateTyping(false);

}


// ==========================================
// LOAD TYPING USERS
// ==========================================

async function loadTypingUsers() {

    const { data, error } = await client
        .from("typing_users")
        .select(`
            user_id,
            is_typing,
            profiles (
                display_name
            )
        `)
        .eq("is_typing", true);

    if (error) {
        console.error("Typing users error:", error);
        return;
    }

    // Remove old typing indicator
    const existing = document.getElementById("typing-indicator");

    if (existing) {
        existing.remove();
    }

    if (!data || data.length === 0) {
        return;
    }

    // Don't show ourselves as typing
    const otherUsers = data.filter(
        user => user.user_id !== currentUser?.id
    );

    if (otherUsers.length === 0) {
        return;
    }

    const names = otherUsers.map(
        user => user.profiles?.display_name || "Someone"
    );

    const indicator = document.createElement("div");

    indicator.id = "typing-indicator";
    indicator.className = "typing-indicator";

    indicator.innerHTML = `
        ✍️ ${names.join(", ")}
        ${names.length === 1 ? "is" : "are"} typing...
    `;

    // Put the indicator above the message input
    const inputArea =
        document.querySelector(".chat-input") ||
        document.querySelector(".input-area") ||
        document.querySelector(".message-input");

    if (inputArea) {
        inputArea.parentNode.insertBefore(
            indicator,
            inputArea
        );
    }
}



// ==========================================
// REALTIME
// ==========================================

function enableRealtime() {

    // ==========================================
    // CHAT MESSAGES REALTIME
    // ==========================================

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
                    .select("display_name, avatar_url, role")
                    .eq("id", payload.new.user_id)
                    .single();

                payload.new.profiles = profile;

                showMessage(payload.new);

                scrollBottom();
            }
        )

        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "messages"
            },
            () => {

                loadMessages();

            }
        )

        .subscribe();


    // ==========================================
    // TYPING USERS REALTIME
    // ==========================================

    client
        .channel("wildstyle-typing")

        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "typing_users"
            },
            (payload) => {

                console.log("Typing change:", payload);

                loadTypingUsers();

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

    await client  
        .from("typing_users")  
        .upsert({  
            user_id: currentUser.id,  
            updated_at: new Date().toISOString()  
        });  

} else {  

    await client  
        .from("typing_users")  
        .delete()  
        .eq("user_id", currentUser.id);  

}

}
function enableTypingIndicator() {

client  

    .channel("typing")  

    .on(  

        "postgres_changes",  

        {  

            event: "*",  

            schema: "public",  

            table: "typing_users"  

        },  

        async () => {  

            const { data } = await client  

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
function enableChatEvents(){

client

.channel("chat-events")

.on(

"postgres_changes",

{

event:"INSERT",

schema:"public",

table:"chat_events"

},

(payload)=>{

const div=document.createElement("div");

div.className="system-message";

div.innerHTML=`

<div class="system-pill">  ${payload.new.message}

</div>  `;

messagesDiv.appendChild(div);

scrollBottom();

}

)

.subscribe();

}
async function deleteMessage(id) {

if (!confirm("Delete this message?")) return;  

const { error } = await client  
    .from("messages")  
    .delete()  
    .eq("id", id);  

if (error) {  

    alert(error.message);  

    return;  

}

}
document.addEventListener("keydown", function(e){

if(e.key==="F10" && currentUserRole==="owner"){  

    ownerPanel.classList.remove("hidden");  

}

});
if (closeOwnerPanel) {

closeOwnerPanel.addEventListener("click", () => {  

    ownerPanel.classList.remove("open");  

    document  
        .getElementById("ownerOverlay")  
        .classList.remove("show");  

    setTimeout(() => {  

        ownerPanel.classList.add("hidden");  

    }, 350);  

});

}

async function openOwnerPanel(userId){



if(currentUserRole !== "owner"){  

    alert("You are not the owner!");  
    return;  

}  

const { data, error } = await client  
    .from("profiles")  
    .select("*")  
    .eq("id", userId)  
    .single();  

if(error){  

    console.error(error);  
    alert("Database error: " + error.message);  
    return;  

}  

if(!data){  

    alert("User not found.");  
    return;  

}  

selectedUser = data;  

ownerAvatar.src =  
    data.avatar_url || "/images/default-avatar.png";  

ownerName.textContent =  
    data.display_name || "Unknown";  

ownerRole.textContent =  
    "Role: " + (data.role || "member");  

ownerStatus.textContent =  
    "Status: " + (data.status || "Online");  

ownerPanel.classList.remove("hidden");  

requestAnimationFrame(() => {  

    ownerPanel.classList.add("open");  

});  

document  
    .getElementById("ownerOverlay")  
    .classList.add("show");  



}

window.openOwnerPanel = openOwnerPanel;
function statusIcon(status){

    switch(status){

        case "Away":
            return "🟡 ";

        case "Busy":
            return "🔴 ";

        case "Be Right Back":
            return "🟠 ";

        default:
            return "🟢 ";
    }
}

// =====================================================
// MSN STYLE MOBILE PROFILE
// =====================================================

const mobileProfileCard =
    document.getElementById("mobileProfileCard");

const mobileProfileOverlay =
    document.getElementById("mobileProfileOverlay");

const mobileProfileClose =
    document.getElementById("mobileProfileClose");

const mobileProfileAvatar =
    document.getElementById("mobileProfileAvatar");

const mobileProfileName =
    document.getElementById("mobileProfileName");

const mobileProfileStatus =
    document.getElementById("mobileProfileStatus");

const mobileProfileRole =
    document.getElementById("mobileProfileRole");

const mobileModerationTools =
    document.getElementById("mobileModerationTools");


// =====================================================
// OPEN MOBILE PROFILE
// =====================================================

async function openMobileProfile(userId){

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if(error){

        console.error(error);

        alert("Could not load user profile.");

        return;
    }

    if(!data){

        alert("User not found.");

        return;
    }

    selectedUser = data;


    // Avatar

    mobileProfileAvatar.src =
        data.avatar_url ||
        "/images/default-avatar.png";


    // Name

    mobileProfileName.textContent =
        data.display_name || "Member";


    // Status

    const status =
        data.status || "Online";

    mobileProfileStatus.textContent =
        statusIcon(status) + status;


    // Role

    let roleBadge = "👤 Member";

    switch(data.role){

        case "owner":
            roleBadge = "👑 Owner";
            break;

        case "admin":
            roleBadge = "🛡️ Admin";
            break;

        case "dj":
            roleBadge = "🎧 DJ";
            break;

        case "vip":
            roleBadge = "⭐ VIP";
            break;

    }

    mobileProfileRole.textContent =
        roleBadge;

   // ==========================================
// PRIVATE MESSAGE BUTTON
// ==========================================

const privateMessageBtn =
    document.getElementById("mobilePrivateMessageBtn");

if (privateMessageBtn) {

    privateMessageBtn.style.display = "block";

    privateMessageBtn.onclick = () => {

        openPrivateChat(
            data.id,
            data.display_name,
            data.avatar_url
        );

    };

}

    // Owner tools

    if(currentUserRole === "owner"){

        mobileModerationTools.style.display =
            "block";

    } else {

        mobileModerationTools.style.display =
            "none";

    }


    // Show card

    mobileProfileOverlay.classList.add("show");

    mobileProfileCard.classList.add("open");

}


// =====================================================
// CLOSE MOBILE PROFILE
// =====================================================

function closeMobileProfile(){

    mobileProfileCard.classList.remove("open");

    mobileProfileOverlay.classList.remove("show");

}


mobileProfileClose.addEventListener(
    "click",
    closeMobileProfile
);


mobileProfileOverlay.addEventListener(
    "click",
    closeMobileProfile
);


// =====================================================
// VIEW PROFILE
// =====================================================

function mobileViewProfile(){

    if(!selectedUser || !selectedUser.id){
        return;
    }

    window.location.href =
        "profile.html?id=" +
        encodeURIComponent(selectedUser.id);
}

window.openMobileProfile = openMobileProfile;
window.mobileViewProfile = mobileViewProfile;
window.closeMobileProfile = closeMobileProfile;

/* =====================================================
   OPEN PRIVATE CHAT
===================================================== */

async function openPrivateChat(
    userId,
    displayName,
    avatarUrl
){

    console.log(
        "Opening private chat with:",
        userId,
        displayName
    );

    /* Don't message yourself */

    if(currentUser && userId === currentUser.id){

        alert("You cannot send a private message to yourself.");

        return;
    }


    if(!currentUser){

        alert("Please log in first.");

        return;
    }


    privateChatRecipient = userId;


    /* Update header */

    const nameEl =
        document.getElementById(
            "privateChatName"
        );

    const avatarEl =
        document.getElementById(
            "privateChatAvatar"
        );


    if(nameEl){

        nameEl.textContent =
            displayName || "Member";

    }


    if(avatarEl){

        avatarEl.src =
            avatarUrl ||
            "/images/default-avatar.png";

    }


    /* Close the profile card */

    if(typeof closeMobileProfile === "function"){

        closeMobileProfile();

    }


    /* Open private chat */

    const overlay =
        document.getElementById(
            "privateChatOverlay"
        );


    if(!overlay){

        console.error(
            "privateChatOverlay not found"
        );

        return;
    }


    overlay.classList.add("open");


    /* Load messages */

    await loadPrivateMessages();


    /* Start realtime */

    enablePrivateChatRealtime();


    /* Focus input */

    setTimeout(() => {

        document
            .getElementById("privateChatInput")
            ?.focus();

    },100);

}


/* =====================================================
   CLOSE PRIVATE CHAT
===================================================== */

function closePrivateChat(){

    const overlay =
        document.getElementById(
            "privateChatOverlay"
        );


    if(overlay){

        overlay.classList.remove("open");

    }


    privateChatRecipient = null;


    if(privateChatChannel){

        client.removeChannel(
            privateChatChannel
        );

        privateChatChannel = null;

    }

}


/* =====================================================
   LOAD PRIVATE MESSAGES
===================================================== */

async function loadPrivateMessages(){

    if(!currentUser ||
       !privateChatRecipient){

        return;
    }


    const container =
        document.getElementById(
            "privateChatMessages"
        );


    if(!container){

        return;
    }


    container.innerHTML = `
        <div class="private-chat-loading">
            Loading conversation...
        </div>
    `;


    const { data, error } = await client

        .from("private_messages")

        .select("*")

        .or(
            `and(sender_id.eq.${currentUser.id},recipient_id.eq.${privateChatRecipient}),and(sender_id.eq.${privateChatRecipient},recipient_id.eq.${currentUser.id})`
        )

        .order(
            "created_at",
            {
                ascending:true
            }
        );


    if(error){

        console.error(
            "Private message load error:",
            error
        );


        container.innerHTML = `
            <div class="private-chat-loading">
                ❌ Could not load messages.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    if(!data || data.length === 0){

        container.innerHTML = `
            <div class="private-chat-loading">
                👋 No messages yet.<br>
                Start the conversation!
            </div>
        `;

        return;
    }


    data.forEach(
        showPrivateMessage
    );


    scrollPrivateMessages();

}


/* =====================================================
   DISPLAY PRIVATE MESSAGE
===================================================== */

function showPrivateMessage(msg){

    const container =
        document.getElementById(
            "privateChatMessages"
        );


    if(!container){

        return;
    }


    const div =
        document.createElement("div");


    const mine =
        msg.sender_id === currentUser.id;


    div.className =
        "private-message " +
        (mine ? "mine" : "theirs");


    const safeText =
        escapeHTML(
            msg.message
        );


    const time =
        new Date(
            msg.created_at
        ).toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );


    div.innerHTML = `
        ${safeText}

        <span class="private-message-time">
            ${time}
        </span>
    `;


    container.appendChild(div);

}


/* =====================================================
   SEND PRIVATE MESSAGE
===================================================== */

async function sendPrivateMessage(){

    if(!currentUser){

        alert("Please log in.");

        return;
    }


    if(!privateChatRecipient){

        return;
    }


    const input =
        document.getElementById(
            "privateChatInput"
        );


    if(!input){

        return;
    }


    const text =
        input.value.trim();


    if(!text){

        return;
    }


    /* Prevent accidental self-message */

    if(
        privateChatRecipient ===
        currentUser.id
    ){

        return;
    }


    input.disabled = true;


    const { data, error } =
        await client

        .from("private_messages")

        .insert({

            sender_id:
                currentUser.id,

            recipient_id:
                privateChatRecipient,

            message:
                text

        })

        .select()

        .single();


    input.disabled = false;


    if(error){

        console.error(
            "Private message send error:",
            error
        );


        alert(
            "Could not send private message.\n\n" +
            error.message
        );

        return;
    }


    input.value = "";


    /*
       Realtime normally displays this.
       But displaying it immediately also
       makes the interface feel instant.
    */

    if(data){

        showPrivateMessage(data);

        scrollPrivateMessages();

    }


    input.focus();

}


/* =====================================================
   REALTIME PRIVATE MESSAGES
===================================================== */

function enablePrivateChatRealtime(){

    if(!currentUser ||
       !privateChatRecipient){

        return;
    }


    /* Remove old channel */

    if(privateChatChannel){

        client.removeChannel(
            privateChatChannel
        );

        privateChatChannel = null;

    }


    const recipient =
        privateChatRecipient;


    privateChatChannel =

        client

        .channel(
            "private-chat-" +
            currentUser.id +
            "-" +
            recipient
        )

        .on(

            "postgres_changes",

            {

                event:"INSERT",

                schema:"public",

                table:"private_messages"

            },

            payload => {

                const msg =
                    payload.new;


                /*
                   Only show messages belonging
                   to this conversation.
                */

                const belongsToChat =

                    (
                        msg.sender_id ===
                        currentUser.id &&

                        msg.recipient_id ===
                        recipient
                    )

                    ||

                    (
                        msg.sender_id ===
                        recipient &&

                        msg.recipient_id ===
                        currentUser.id
                    );


                if(!belongsToChat){

                    return;
                }


                /*
                   Don't duplicate our own
                   message because we already
                   displayed it immediately.
                */

                if(
                    msg.sender_id ===
                    currentUser.id
                ){

                    return;

                }


                showPrivateMessage(msg);

                scrollPrivateMessages();

            }

        )

        .subscribe();

}


/* =====================================================
   SCROLL PRIVATE CHAT
===================================================== */

function scrollPrivateMessages(){

    const container =
        document.getElementById(
            "privateChatMessages"
        );


    if(!container){

        return;
    }


    container.scrollTop =
        container.scrollHeight;

}


/* =====================================================
   PRIVATE CHAT EVENTS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeBtn =
            document.getElementById(
                "privateChatClose"
            );


        const sendBtn =
            document.getElementById(
                "privateChatSend"
            );


        const input =
            document.getElementById(
                "privateChatInput"
            );


        const overlay =
            document.getElementById(
                "privateChatOverlay"
            );


        if(closeBtn){

            closeBtn.addEventListener(
                "click",
                closePrivateChat
            );

        }


        if(sendBtn){

            sendBtn.addEventListener(
                "click",
                sendPrivateMessage
            );

        }


        if(input){

            input.addEventListener(
                "keydown",
                e => {

                    if(
                        e.key === "Enter"
                    ){

                        e.preventDefault();

                        sendPrivateMessage();

                    }

                }
            );

        }


        /*
           Clicking the dark background
           closes the private chat.
        */

        if(overlay){

            overlay.addEventListener(
                "click",
                e => {

                    if(
                        e.target === overlay
                    ){

                        closePrivateChat();

                    }

                }
            );

        }

    }
);


/* Make function available to
   the existing profile button */

window.openPrivateChat =
    openPrivateChat;


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

    const { data, error } = await client
        .from("online_users")
        .select(`
            user_id,
            last_seen,
            profiles (
                display_name,
                avatar_url,
                status,
                role
            )
        `);

    if (error) {
        console.error("Online users error:", error);
        return;
    }

    usersList.innerHTML = "";

    const now = Date.now();

    data.forEach(user => {

        const lastSeen =
            new Date(user.last_seen).getTime();

        const secondsSinceLastSeen =
            (now - lastSeen) / 1000;

        // Only consider users active
        // within the last 60 seconds
        if (secondsSinceLastSeen > 60) {
            return;
        }

        const name =
            user.profiles?.display_name || "Member";

        const avatar =
            user.profiles?.avatar_url ||
            "/images/default-avatar.png";

        const status =
            user.profiles?.status || "Online";

        const div =
            document.createElement("div");

        div.className = "user";

        div.innerHTML = `
            <img
                src="${avatar}"
                class="online-avatar">

            <span>
                ${statusIcon(status)}
                ${name}
            </span>
        `;

        div.addEventListener("click", () => {

    if (window.innerWidth <= 768) {
        // 📱 Mobile
        openMobileProfile(user.user_id);
        return;
    }

    // 💻 Desktop
    openOwnerPanel(user.user_id);

});

        usersList.appendChild(div);

    });

}

// ==========================================
// REFRESH ONLINE USERS
// ==========================================

setInterval(() => {

    if (currentUser) {
        loadOnlineUsers();
    }

}, 30000);

// ==========================================
// ROLE BUTTONS
// ==========================================

async function setRole(role) {

    if (currentUserRole !== "owner") {
        alert("Only the owner can change roles.");
        return;
    }

    if (!selectedUser || !selectedUser.id) {
        alert("Select a user first.");
        return;
    }

    const { error } = await client
        .from("profiles")
        .update({ role: role })
        .eq("id", selectedUser.id);

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    selectedUser.role = role;

    ownerRole.textContent =
        "Role: " +
        role.charAt(0).toUpperCase() +
        role.slice(1);

    await loadOnlineUsers();
    await loadMessages();

    alert(selectedUser.display_name + " is now " + role + ".");

}

document
    .getElementById("btnMakeAdmin")
    .addEventListener("click", () => setRole("admin"));

document
    .getElementById("btnMakeDJ")
    .addEventListener("click", () => setRole("dj"));

document
    .getElementById("btnMakeVIP")
    .addEventListener("click", () => setRole("vip"));

document
    .getElementById("btnMember")
    .addEventListener("click", () => setRole("member"));

document
    .getElementById("btnDeleteMessages")
    .addEventListener("click", deleteAllMessages);

document
    .getElementById("btnBan")
    .addEventListener("click", banUser);

// ==========================================
// BAN USER
// ==========================================

async function banUser() {

    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
        alert("You don't have permission.");
        return;
    }

    if (!selectedUser || !selectedUser.id) {
        alert("Select a user first.");
        return;
    }

    if (!confirm("Ban " + selectedUser.display_name + "?")) {
        return;
    }

    const reason = prompt("Reason for banning this user?");

    if (reason === null) return;
    
alert(
    "Selected User:\n\n" +
    selectedUser.display_name +
    "\n\nID:\n" +
    selectedUser.id
);
    
    const { data, error } = await client
    .from("profiles")
    .update({
        banned: true,
        ban_reason: reason
    })
    .eq("id", selectedUser.id)
    .select();

console.log(data);
console.log(error);

alert(
    "Rows updated: " +
    (data ? data.length : 0) +
    "\nError: " +
    JSON.stringify(error)
);

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    await client
        .from("chat_events")
        .insert([{
            message:
                "🚫 " +
                selectedUser.display_name +
                " has been banned.\nReason: " +
                reason
        }]);

    alert(selectedUser.display_name + " has been banned.");

    await loadOnlineUsers();
}

// ==========================================
// DELETE ALL USER MESSAGES
// ==========================================

async function deleteAllMessages() {

    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
        alert("You don't have permission.");
        return;
    }

    if (!selectedUser || !selectedUser.id) {
        alert("Select a user first.");
        return;
    }

    if (!confirm("Delete ALL messages from " + selectedUser.display_name + "?")) {
        return;
    }

    const { error } = await client
        .from("messages")
        .delete()
        .eq("user_id", selectedUser.id);

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    await client
        .from("chat_events")
        .insert([{
            message: "🗑️ " + selectedUser.display_name + "'s messages were deleted."
        }]);

    await loadMessages();

    alert("Messages deleted successfully.");

}



// =====================================================
// MSN STYLE STATUS SELECTOR
// =====================================================

const statusButton =
    document.getElementById("statusButton");

const statusMenu =
    document.getElementById("statusMenu");


// Open / close menu

statusButton.addEventListener("click", (event) => {

    event.stopPropagation();

    statusMenu.classList.toggle("open");

});


// Choose status

statusMenu
    .querySelectorAll("button[data-status]")
    .forEach(button => {

        button.addEventListener("click", async () => {

            const status =
                button.dataset.status;

            await setManualStatus(status);

            statusMenu.classList.remove("open");

        });

    });


// Close when clicking elsewhere

document.addEventListener("click", () => {

    statusMenu.classList.remove("open");

});


// =====================================================
// SET MANUAL STATUS
// =====================================================

async function setManualStatus(status) {

    if (!currentUser) return;

    const { error } = await client
        .from("profiles")
        .update({
            status: status
        })
        .eq("id", currentUser.id);

    if (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(error.message);

        return;
    }

    presenceStatus = status;

    updateStatusButton(status);

    await loadOnlineUsers();

}


// =====================================================
// UPDATE STATUS BUTTON
// =====================================================

function updateStatusButton(status) {

    let label = "🟢 Online";

    switch (status) {

        case "Online":
            label = "🟢 Online";
            break;

        case "Away":
            label = "🟡 Away";
            break;

        case "Busy":
            label = "🔴 Busy";
            break;

        case "Be Right Back":
            label = "🟠 Be Right Back";
            break;

        case "Invisible":
            label = "⚫ Invisible";
            break;

    }

    statusButton.textContent = label;

}

// =====================================================
// PRIVATE MESSAGING
// =====================================================

let privateChatUser = null;
let privateChatChannel = null;


// =====================================================
// OPEN PRIVATE CHAT
// =====================================================

async function openPrivateChat(userId, name, avatar) {

    if (!currentUser) return;

    // Don't message yourself
    if (userId === currentUser.id) {
        alert("You can't send a private message to yourself.");
        return;
    }

    privateChatUser = {
        id: userId,
        name: name || "Member",
        avatar: avatar || "/images/default-avatar.png"
    };

    // Close mobile profile
    if (typeof closeMobileProfile === "function") {
        closeMobileProfile();
    }

    createPrivateChatWindow();

    await loadPrivateMessages();

    enablePrivateRealtime();

    document
        .getElementById("privateMessageInput")
        ?.focus();
}


// =====================================================
// CREATE PRIVATE CHAT WINDOW
// =====================================================

function createPrivateChatWindow() {

    // Already exists
    if (document.getElementById("privateChatOverlay")) {
        document
            .getElementById("privateChatOverlay")
            .classList.add("open");

        updatePrivateChatHeader();
        return;
    }

    const overlay = document.createElement("div");

    overlay.id = "privateChatOverlay";

    overlay.innerHTML = `

        <div class="private-chat-window">

            <div class="private-chat-header">

                <button
                    id="privateChatBack"
                    class="private-chat-back">
                    ←
                </button>

                <img
                    id="privateChatAvatar"
                    src="/images/default-avatar.png"
                    class="private-chat-avatar">

                <div class="private-chat-user-info">

                    <strong id="privateChatName">
                        Member
                    </strong>

                    <span id="privateChatStatus">
                        🟢 Private Conversation
                    </span>

                </div>

                <button
                    id="privateChatClose"
                    class="private-chat-close">
                    ✕
                </button>

            </div>


            <div
                id="privateMessages"
                class="private-messages">

                <div class="private-chat-loading">
                    Loading conversation...
                </div>

            </div>


            <div class="private-message-input-area">

                <input
                    type="text"
                    id="privateMessageInput"
                    placeholder="Type a private message..."
                    autocomplete="off">

                <button
                    id="privateEmojiBtn"
                    type="button">
                    😊
                </button>

                <button
                    id="privateSendBtn"
                    type="button">
                    Send
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add("open");
    });


    // Close buttons

    document
        .getElementById("privateChatClose")
        .addEventListener("click", closePrivateChat);


    document
        .getElementById("privateChatBack")
        .addEventListener("click", closePrivateChat);


    // Send

    document
        .getElementById("privateSendBtn")
        .addEventListener(
            "click",
            sendPrivateMessage
        );


    // Enter to send

    document
        .getElementById("privateMessageInput")
        .addEventListener("keydown", function(e) {

            if (e.key === "Enter") {

                e.preventDefault();

                sendPrivateMessage();

            }

        });


    updatePrivateChatHeader();
}


// =====================================================
// UPDATE HEADER
// =====================================================

function updatePrivateChatHeader() {

    if (!privateChatUser) return;

    const avatar =
        document.getElementById("privateChatAvatar");

    const name =
        document.getElementById("privateChatName");

    if (avatar) {
        avatar.src =
            privateChatUser.avatar ||
            "/images/default-avatar.png";
    }

    if (name) {
        name.textContent =
            privateChatUser.name;
    }

}


// =====================================================
// LOAD PRIVATE MESSAGES
// =====================================================

async function loadPrivateMessages() {

    if (!privateChatUser || !currentUser) return;

    const privateMessages =
        document.getElementById("privateMessages");

    if (!privateMessages) return;

    const { data, error } = await client

        .from("private_messages")

        .select("*")

        .or(
            `and(sender_id.eq.${currentUser.id},recipient_id.eq.${privateChatUser.id}),and(sender_id.eq.${privateChatUser.id},recipient_id.eq.${currentUser.id})`
        )

        .order("created_at", {
            ascending: true
        });


    if (error) {

        console.error(
            "Private messages error:",
            error
        );

        privateMessages.innerHTML = `
            <div class="private-chat-error">
                Unable to load private messages.
            </div>
        `;

        return;
    }


    privateMessages.innerHTML = "";


    if (!data || data.length === 0) {

        privateMessages.innerHTML = `
            <div class="private-chat-empty">
                💜 No private messages yet.<br>
                Start the conversation!
            </div>
        `;

        return;
    }


    data.forEach(
        showPrivateMessage
    );


    scrollPrivateMessages();

    await markPrivateMessagesRead();

}


// =====================================================
// SHOW PRIVATE MESSAGE
// =====================================================

function showPrivateMessage(msg) {

    const container =
        document.getElementById("privateMessages");

    if (!container) return;


    const mine =
        msg.sender_id === currentUser.id;


    const div =
        document.createElement("div");


    div.className =
        mine
            ? "private-message mine"
            : "private-message received";


    const bubble =
        document.createElement("div");


    bubble.className =
        "private-message-bubble";


    bubble.textContent =
        msg.message;


    const time =
        document.createElement("div");


    time.className =
        "private-message-time";


    time.textContent =
        new Date(
            msg.created_at
        ).toLocaleTimeString([], {

            hour: "2-digit",

            minute: "2-digit"

        });


    div.appendChild(bubble);

    div.appendChild(time);

    container.appendChild(div);

}


// =====================================================
// SEND PRIVATE MESSAGE
// =====================================================

async function sendPrivateMessage() {

    if (!currentUser || !privateChatUser) {
        return;
    }


    const input =
        document.getElementById(
            "privateMessageInput"
        );


    if (!input) return;


    const text =
        input.value.trim();


    if (!text) return;


    const { data, error } =
        await client

            .from("private_messages")

            .insert({

                sender_id:
                    currentUser.id,

                recipient_id:
                    privateChatUser.id,

                message:
                    text

            })

            .select()

            .single();


    if (error) {

        console.error(
            "Private message send error:",
            error
        );

        alert(
            "Could not send message:\n" +
            error.message
        );

        return;
    }


    input.value = "";


    if (data) {

        showPrivateMessage(data);

        scrollPrivateMessages();

    }

}


// =====================================================
// PRIVATE REALTIME
// =====================================================

function enablePrivateRealtime() {

    if (!currentUser || !privateChatUser) {
        return;
    }


    // Remove previous channel

    if (privateChatChannel) {

        client.removeChannel(
            privateChatChannel
        );

    }


    privateChatChannel =
        client

            .channel(
                "private-chat-" +
                currentUser.id +
                "-" +
                privateChatUser.id
            )

            .on(

                "postgres_changes",

                {

                    event: "INSERT",

                    schema: "public",

                    table: "private_messages",

                    filter:
                        "recipient_id=eq." +
                        currentUser.id

                },

                async (payload) => {

                    if (
                        payload.new.sender_id !==
                        privateChatUser.id
                    ) {

                        return;

                    }


                    showPrivateMessage(
                        payload.new
                    );


                    scrollPrivateMessages();


                    await markPrivateMessagesRead();

                }

            )

            .subscribe();

}


// =====================================================
// MARK MESSAGES AS READ
// =====================================================

async function markPrivateMessagesRead() {

    if (!currentUser || !privateChatUser) {
        return;
    }


    const { error } =
        await client

            .from("private_messages")

            .update({
                is_read: true
            })

            .eq(
                "sender_id",
                privateChatUser.id
            )

            .eq(
                "recipient_id",
                currentUser.id
            )

            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(
            "Private read error:",
            error
        );

    }

}


// =====================================================
// SCROLL PRIVATE CHAT
// =====================================================

function scrollPrivateMessages() {

    const box =
        document.getElementById(
            "privateMessages"
        );

    if (!box) return;


    box.scrollTop =
        box.scrollHeight;

}


// =====================================================
// CLOSE PRIVATE CHAT
// =====================================================

function closePrivateChat() {

    const overlay =
        document.getElementById(
            "privateChatOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }


    if (privateChatChannel) {

        client.removeChannel(
            privateChatChannel
        );

        privateChatChannel = null;

    }


    privateChatUser = null;

}


/* =========================================================
   WILDSTYLE PRIVATE CHAT - FINAL FIX
   ========================================================= */

(function () {

    let wsPrivateUser = null;
    let wsPrivateChannel = null;

    window.openPrivateChat = async function (userId, displayName, avatarUrl) {

        console.log("Wildstyle PM opening:", userId, displayName);

        if (!window.currentUser && typeof currentUser !== "undefined") {
            window.currentUser = currentUser;
        }

        if (!currentUser) {
            alert("Please log in first.");
            return;
        }

        if (!userId) {
            console.error("Private chat: missing user ID");
            alert("Unable to open private chat.");
            return;
        }

        if (userId === currentUser.id) {
            alert("You cannot message yourself.");
            return;
        }

        wsPrivateUser = {
            id: userId,
            name: displayName || "Member",
            avatar: avatarUrl || "/images/default-avatar.png"
        };

        /* Remove old window */
        const old = document.getElementById("wsPrivateChatOverlay");

        if (old) {
            old.remove();
        }

        /* Remove old realtime channel */
        if (wsPrivateChannel) {
            try {
                await client.removeChannel(wsPrivateChannel);
            } catch (e) {
                console.warn(e);
            }

            wsPrivateChannel = null;
        }

        /* Create window */
        const overlay = document.createElement("div");

        overlay.id = "wsPrivateChatOverlay";
        overlay.className = "private-chat-overlay open";

        overlay.innerHTML = `
            <div class="private-chat-window">

                <div class="private-chat-header">

                    <button
                        type="button"
                        id="wsPrivateBack"
                        class="private-chat-back">
                        ←
                    </button>

                    <img
                        src="${wsPrivateUser.avatar}"
                        class="private-chat-avatar"
                        onerror="this.src='/images/default-avatar.png';">

                    <div class="private-chat-user-info">

                        <strong>
                            ${escapeHtml(wsPrivateUser.name)}
                        </strong>

                        <span>
                            🟢 Private Conversation
                        </span>

                    </div>

                    <button
                        type="button"
                        id="wsPrivateClose"
                        class="private-chat-close">
                        ✕
                    </button>

                </div>

                <div
                    id="wsPrivateMessages"
                    class="private-messages">

                    <div class="private-chat-loading">
                        Loading conversation...
                    </div>

                </div>

                <div class="private-message-input-area">

                    <button
                        type="button"
                        id="wsPrivateEmoji"
                        class="private-emoji-btn">
                        😊
                    </button>

                    <input
                        type="text"
                        id="wsPrivateInput"
                        placeholder="Type a private message..."
                        autocomplete="off">

                    <button
                        type="button"
                        id="wsPrivateSend"
                        class="private-send-btn">
                        Send
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        /* Close */
        document
            .getElementById("wsPrivateClose")
            .onclick = closeWsPrivateChat;

        document
            .getElementById("wsPrivateBack")
            .onclick = closeWsPrivateChat;

        /* Send */
        document
            .getElementById("wsPrivateSend")
            .onclick = sendWsPrivateMessage;

        /* Enter */
        document
            .getElementById("wsPrivateInput")
            .addEventListener("keydown", function (e) {

                if (e.key === "Enter") {

                    e.preventDefault();

                    sendWsPrivateMessage();

                }

            });

        /* Load */
        await loadWsPrivateMessages();

        /* Realtime */
        startWsPrivateRealtime();

        setTimeout(() => {

            document
                .getElementById("wsPrivateInput")
                ?.focus();

        }, 100);

    };


    async function loadWsPrivateMessages() {

        const box =
            document.getElementById("wsPrivateMessages");

        if (!box || !wsPrivateUser || !currentUser) {
            return;
        }

        const { data, error } = await client
            .from("private_messages")
            .select("*")
            .or(
                `and(sender_id.eq.${currentUser.id},recipient_id.eq.${wsPrivateUser.id}),and(sender_id.eq.${wsPrivateUser.id},recipient_id.eq.${currentUser.id})`
            )
            .order("created_at", {
                ascending: true
            });

        if (error) {

            console.error(
                "Private message load error:",
                error
            );

            box.innerHTML = `
                <div class="private-chat-error">
                    Unable to load private messages.
                </div>
            `;

            return;
        }

        box.innerHTML = "";

        if (!data || data.length === 0) {

            box.innerHTML = `
                <div class="private-chat-empty">
                    💜 No private messages yet.<br>
                    Start the conversation!
                </div>
            `;

            return;
        }

        data.forEach(wsShowPrivateMessage);

        box.scrollTop = box.scrollHeight;

    }


    function wsShowPrivateMessage(msg) {

        const box =
            document.getElementById("wsPrivateMessages");

        if (!box) return;

        const mine =
            msg.sender_id === currentUser.id;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            mine
                ? "private-message mine"
                : "private-message received";

        const bubble =
            document.createElement("div");

        bubble.className =
            "private-message-bubble";

        bubble.textContent =
            msg.message || "";

        const time =
            document.createElement("div");

        time.className =
            "private-message-time";

        time.textContent =
            msg.created_at
                ? new Date(msg.created_at)
                    .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                : "";

        wrapper.appendChild(bubble);
        wrapper.appendChild(time);

        box.appendChild(wrapper);

    }


    async function sendWsPrivateMessage() {

        if (!currentUser || !wsPrivateUser) {
            return;
        }

        const input =
            document.getElementById("wsPrivateInput");

        if (!input) return;

        const text =
            input.value.trim();

        if (!text) return;

        const { data, error } = await client
            .from("private_messages")
            .insert({
                sender_id: currentUser.id,
                recipient_id: wsPrivateUser.id,
                message: text
            })
            .select()
            .single();

        if (error) {

            console.error(
                "Private message send error:",
                error
            );

            alert(
                "Could not send message:\n" +
                error.message
            );

            return;
        }

        input.value = "";

        if (data) {
            wsShowPrivateMessage(data);

            const box =
                document.getElementById(
                    "wsPrivateMessages"
                );

            if (box) {
                box.scrollTop =
                    box.scrollHeight;
            }
        }

        input.focus();

    }


    function startWsPrivateRealtime() {

        if (!currentUser || !wsPrivateUser) {
            return;
        }

        if (wsPrivateChannel) {

            client.removeChannel(
                wsPrivateChannel
            );

            wsPrivateChannel = null;
        }

        wsPrivateChannel =
            client
                .channel(
                    "wildstyle-private-" +
                    currentUser.id +
                    "-" +
                    wsPrivateUser.id
                )
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "private_messages"
                    },
                    payload => {

                        const msg =
                            payload.new;

                        const belongs =
                            (
                                msg.sender_id ===
                                wsPrivateUser.id &&
                                msg.recipient_id ===
                                currentUser.id
                            )
                            ||
                            (
                                msg.sender_id ===
                                currentUser.id &&
                                msg.recipient_id ===
                                wsPrivateUser.id
                            );

                        if (!belongs) {
                            return;
                        }

                        /* Don't duplicate our own message */
                        if (
                            msg.sender_id ===
                            currentUser.id
                        ) {
                            return;
                        }

                        wsShowPrivateMessage(msg);

                        const box =
                            document.getElementById(
                                "wsPrivateMessages"
                            );

                        if (box) {
                            box.scrollTop =
                                box.scrollHeight;
                        }

                    }
                )
                .subscribe();

    }


    async function closeWsPrivateChat() {

        const overlay =
            document.getElementById(
                "wsPrivateChatOverlay"
            );

        if (overlay) {
            overlay.remove();
        }

        if (wsPrivateChannel) {

            try {
                await client.removeChannel(
                    wsPrivateChannel
                );
            } catch (e) {
                console.warn(e);
            }

            wsPrivateChannel = null;
        }

        wsPrivateUser = null;

    }


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value || "";

        return div.innerHTML;

    }

})();
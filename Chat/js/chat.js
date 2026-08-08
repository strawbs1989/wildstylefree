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

    // Don't open the owner panel when clicking
    // the delete button
    if (e.target.closest(".delete-btn")) {
        return;
    }

    openOwnerPanel(msg.user_id);

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

    if (currentUser && userId === currentUser.id) {

        privateMessageBtn.style.display = "none";

    } else {

        privateMessageBtn.style.display = "block";

        privateMessageBtn.onclick = () => {

            openPrivateChat(
                data.id,
                data.display_name,
                data.avatar_url
            );

        };

    }

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

            if (window.innerWidth <= 720) {

                openMobileProfile(user.user_id);

            } else {

                openOwnerPanel(user.user_id);

            }

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
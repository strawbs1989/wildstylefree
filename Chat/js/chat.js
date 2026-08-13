// =====================================================
// WILDSTYLE COMMUNITY CHAT
// CLEAN + SECURE CLIENT
// =====================================================

"use strict";

// =====================================================
// DOM
// =====================================================

const ownerPanel =
    document.getElementById("ownerPanel");

const closeOwnerPanel =
    document.getElementById("closeOwnerPanel");

const ownerAvatar =
    document.getElementById("ownerAvatar");

const ownerName =
    document.getElementById("ownerName");

const ownerRole =
    document.getElementById("ownerRole");

const ownerStatus =
    document.getElementById("ownerStatus");

const messagesDiv =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const usersList =
    document.getElementById("usersList");

const emojiBtn =
    document.getElementById("emojiBtn");

const emojiPicker =
    document.getElementById("emojiPicker");

const typingIndicator =
    document.getElementById("typingIndicator");

const statusButton =
    document.getElementById("statusButton");

const statusMenu =
    document.getElementById("statusMenu");

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
// STATE
// =====================================================

let currentUser = null;
let currentUserRole = "member";
let currentUserProfile = null;

let selectedUser = null;

let typing = false;
let typingTimer = null;

let presenceStatus = "Online";

let privateChatUser = null;
let privateChatChannel = null;

let chatChannel = null;
let typingChannel = null;
let eventsChannel = null;


// =====================================================
// SECURITY HELPERS
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null ? "" : String(value);

    return div.innerHTML;
}


// Safely set an image without trusting HTML
function setSafeImage(img, url) {

    if (!img) return;

    const fallback =
        "/images/default-avatar.png";

    img.src = fallback;

    if (
        typeof url === "string" &&
        /^https?:\/\//i.test(url)
    ) {

        img.src = url;

    } else if (
        typeof url === "string" &&
        url.startsWith("/")
    ) {

        img.src = url;
    }

    img.onerror = () => {
        img.src = fallback;
    };
}


// =====================================================
// ROLE HELPERS
// =====================================================

function roleBadge(role) {

    switch (role) {

        case "owner":
            return "👑 Owner";

        case "admin":
            return "🛡️ Admin";

        case "dj":
            return "🎧 DJ";

        case "vip":
            return "⭐ VIP";

        default:
            return "👤 Member";
    }
}


function statusIcon(status) {

    switch (status) {

        case "Away":
            return "🟡 ";

        case "Busy":
            return "🔴 ";

        case "Be Right Back":
            return "🟠 ";

        case "Invisible":
            return "⚫ ";

        default:
            return "🟢 ";
    }
}


function isOwner() {

    return currentUserRole === "owner";
}


function isAdmin() {

    return (
        currentUserRole === "owner" ||
        currentUserRole === "admin"
    );
}


// =====================================================
// START APPLICATION
// =====================================================

(async function startChat() {

    try {

        if (
            typeof client === "undefined" ||
            !client
        ) {

            console.error(
                "Supabase client is not available."
            );

            return;
        }


        const {
            data: {
                user
            },
            error: authError
        } =
            await client.auth.getUser();


        if (authError) {

            console.error(
                "Authentication error:",
                authError
            );

            return;
        }


        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        currentUser =
            user;


        // Make available for any existing UI code
        window.currentUser =
            currentUser;


        // =================================================
        // LOAD CURRENT PROFILE
        // =================================================

        const {
            data: profile,
            error: profileError
        } =
            await client

                .from("profiles")

                .select(
                    "id,display_name,avatar_url,role,status,banned,ban_reason"
                )

                .eq(
                    "id",
                    user.id
                )

                .single();


        if (profileError) {

            console.error(
                "Profile error:",
                profileError
            );

            return;
        }


        if (!profile) {

            console.error(
                "No profile found."
            );

            return;
        }


        currentUserProfile =
            profile;


        currentUserRole =
            profile.role || "member";


        presenceStatus =
            profile.status || "Online";


        // =================================================
        // BAN CHECK
        // =================================================

        if (profile.banned === true) {

            alert(
                "🚫 You have been banned from Wildstyle Community.\n\n" +
                "Reason:\n" +
                (
                    profile.ban_reason ||
                    "No reason supplied."
                )
            );

            await client.auth.signOut();

            window.location.href =
                "index.html";

            return;
        }


        updateStatusButton(
            presenceStatus
        );


        // =================================================
        // ONLINE STATUS
        // =================================================

        await updateOnlinePresence();


        // =================================================
        // LOAD CHAT
        // =================================================

        await loadOnlineUsers();

        await loadMessages();

        loadTypingUsers();

        enableRealtime();

        enableTyping();

        enableChatEvents();

        setupUI();


    } catch (error) {

        console.error(
            "Chat startup error:",
            error
        );

    }

})();


// =====================================================
// ONLINE PRESENCE
// =====================================================

async function updateOnlinePresence() {

    if (!currentUser) return;


    const {
        error
    } =
        await client

            .from("online_users")

            .upsert(
                {
                    user_id:
                        currentUser.id,

                    last_seen:
                        new Date().toISOString()
                },
                {
                    onConflict:
                        "user_id"
                }
            );


    if (error) {

        console.error(
            "Presence error:",
            error
        );
    }
}


// Heartbeat
setInterval(
    async () => {

        if (!currentUser) return;

        await updateOnlinePresence();

    },
    30000
);


// ==========================================
// LOAD OLD MESSAGES
// ==========================================

async function loadMessages() {

    if (!currentUser) {
        console.error("Chat: currentUser not ready");
        return;
    }

    console.log("Chat: loading messages...");

    // Get messages WITHOUT the profiles join
    const { data: messages, error } = await client
        .from("messages")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error("❌ MESSAGE LOAD ERROR:", error);
        return;
    }

    console.log(
        "✅ Messages loaded:",
        messages?.length || 0
    );

    messagesDiv.innerHTML = "";

    if (!messages || messages.length === 0) {
        messagesDiv.innerHTML = `
            <div class="chat-empty">
                💬 No messages yet.<br>
                Be the first to say hello!
            </div>
        `;
        return;
    }

    // Get the users separately
    const userIds = [
        ...new Set(
            messages
                .map(msg => msg.user_id)
                .filter(Boolean)
        )
    ];

    let profiles = [];

    if (userIds.length > 0) {

        const { data, error: profileError } = await client
            .from("profiles")
            .select(
                "id, display_name, avatar_url, role"
            )
            .in("id", userIds);

        if (profileError) {
            console.error(
                "Profile loading error:",
                profileError
            );
        } else {
            profiles = data || [];
        }
    }

    // Attach profiles to messages
    messages.forEach(msg => {

        msg.profiles =
            profiles.find(
                profile =>
                    profile.id === msg.user_id
            ) || null;

        showMessage(msg);

    });

    scrollBottom();
}
// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(msg) {

    if (!msg) return;

    const div = document.createElement("div");

    div.className = "chat-message";


    const profile =
        msg.profiles || {};


    const name =
        profile.display_name ||
        "Member";


    const role =
        profile.role ||
        msg.role ||
        "member";


    const avatar =
        profile.avatar_url ||
        "/images/default-avatar.png";


    const time =
        msg.created_at
            ? new Date(
                msg.created_at
            ).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
            : "";


    // =================================================
    // USER CLICK
    // =================================================

    div.addEventListener(
        "click",
        function (event) {

            if (
                event.target.closest(
                    ".delete-btn"
                )
            ) {
                return;
            }


            if (
                window.innerWidth <= 768
            ) {

                openMobileProfile(
                    msg.user_id
                );

            } else {

                openOwnerPanel(
                    msg.user_id
                );
            }

        }
    );


    // =================================================
    // MESSAGE LAYOUT
    // =================================================

    const row =
        document.createElement("div");

    row.style.display =
        "flex";

    row.style.gap =
        "12px";

    row.style.alignItems =
        "flex-start";


    const img =
        document.createElement("img");

    img.style.width =
        "48px";

    img.style.height =
        "48px";

    img.style.borderRadius =
        "50%";

    img.style.objectFit =
        "cover";


    setSafeImage(
        img,
        avatar
    );


    const content =
        document.createElement("div");

    content.style.flex =
        "1";


    const userLine =
        document.createElement("div");

    userLine.className =
        "chat-user";


    userLine.textContent =
        name + " ";


    const badge =
        document.createElement("span");

    badge.className =
        "role-badge";

    badge.textContent =
        roleBadge(role);


    userLine.appendChild(
        badge
    );


    const text =
        document.createElement("div");

    text.className =
        "chat-text";

    // textContent = SAFE
    text.textContent =
        msg.message || "";


    const timeDiv =
        document.createElement("div");

    timeDiv.className =
        "chat-time";

    timeDiv.textContent =
        time;


    content.appendChild(
        userLine
    );

    content.appendChild(
        text
    );

    content.appendChild(
        timeDiv
    );


    // =================================================
    // DELETE BUTTON
    // =================================================

    const canDelete =
        currentUser &&
        (
            currentUser.id ===
            msg.user_id ||
            isAdmin()
        );


    if (canDelete) {

        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "delete-btn";

        deleteButton.textContent =
            "🗑️ Delete";


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                deleteMessage(
                    msg.id
                );

            }
        );


        content.appendChild(
            deleteButton
        );
    }


    row.appendChild(
        img
    );

    row.appendChild(
        content
    );

    div.appendChild(
        row
    );

    messagesDiv.appendChild(
        div
    );
}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    if (!currentUser) return;

    if (!messageInput) return;


    const text =
        messageInput.value.trim();


    if (!text) return;


    // Basic client-side limit
    if (text.length > 2000) {

        alert(
            "Message is too long. Maximum 2000 characters."
        );

        return;
    }


    sendBtn.disabled =
        true;


    try {

        const {
            error
        } =
            await client

                .from("messages")

                .insert(
                    {
                        user_id:
                            currentUser.id,

                        message:
                            text,

                        role:
                            currentUserRole
                    }
                );


        if (error) {

            console.error(
                "Send message error:",
                error
            );

            alert(
                "Could not send message.\n\n" +
                error.message
            );

            return;
        }


        messageInput.value =
            "";


        typing =
            false;


        await updateTyping(
            false
        );


    } finally {

        sendBtn.disabled =
            false;

        messageInput.focus();
    }
}


// =====================================================
// DELETE MESSAGE
// =====================================================

async function deleteMessage(id) {

    if (!id) return;


    if (!confirm(
        "Delete this message?"
    )) {

        return;
    }


    const {
        error
    } =
        await client

            .from("messages")

            .delete()

            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Delete message error:",
            error
        );

        alert(
            "Could not delete message.\n\n" +
            error.message
        );

        return;
    }


    await loadMessages();
}


// Make available if HTML still calls it
window.deleteMessage =
    deleteMessage;


// =====================================================
// REALTIME CHAT
// =====================================================

function enableRealtime() {

    if (chatChannel) {

        client.removeChannel(
            chatChannel
        );

    }


    chatChannel =
        client

            .channel(
                "wildstyle-chat"
            )

            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages"
                },
                async payload => {

                    const {
                        data: profile
                    } =
                        await client

                            .from("profiles")

                            .select(
                                "display_name,avatar_url,role"
                            )

                            .eq(
                                "id",
                                payload.new.user_id
                            )

                            .single();


                    const message =
                        {
                            ...payload.new,
                            profiles:
                                profile
                        };


                    showMessage(
                        message
                    );


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

            .subscribe(
                status => {

                    console.log(
                        "Chat realtime:",
                        status
                    );

                }
            );
}


// =====================================================
// SCROLL
// =====================================================

function scrollBottom() {

    if (!messagesDiv) return;

    messagesDiv.scrollTop =
        messagesDiv.scrollHeight;
}


// =====================================================
// TYPING
// =====================================================

async function updateTyping(
    isTyping
) {

    if (!currentUser) return;


    if (isTyping) {

        const {
            error
        } =
            await client

                .from("typing_users")

                .upsert(
                    {
                        user_id:
                            currentUser.id,

                        is_typing:
                            true,

                        updated_at:
                            new Date().toISOString()
                    },
                    {
                        onConflict:
                            "user_id"
                    }
                );


        if (error) {

            console.error(
                "Typing update error:",
                error
            );
        }


    } else {

        const {
            error
        } =
            await client

                .from("typing_users")

                .delete()

                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "Typing delete error:",
                error
            );
        }
    }
}


// =====================================================
// LOAD TYPING USERS
// =====================================================

async function loadTypingUsers() {

    if (!currentUser) return;


    const {
        data,
        error
    } =
        await client

            .from("typing_users")

            .select(`
                user_id,
                is_typing,
                profiles (
                    display_name
                )
            `)

            .eq(
                "is_typing",
                true
            );


    if (error) {

        console.error(
            "Typing users error:",
            error
        );

        return;
    }


    if (!typingIndicator) return;


    const others =
        (data || []).filter(
            user =>
                user.user_id !==
                currentUser.id
        );


    if (
        others.length ===
        0
    ) {

        typingIndicator.textContent =
            "";

        return;
    }


    const names =
        others.map(
            user =>
                user.profiles?.display_name ||
                "Someone"
        );


    typingIndicator.textContent =
        `✍️ ${names.join(", ")} ` +
        (
            names.length === 1
                ? "is"
                : "are"
        ) +
        " typing...";
}


// =====================================================
// TYPING REALTIME
// =====================================================

function enableTyping() {

    if (typingChannel) {

        client.removeChannel(
            typingChannel
        );

    }


    typingChannel =
        client

            .channel(
                "wildstyle-typing"
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "typing_users"
                },
                () => {

                    loadTypingUsers();

                }
            )

            .subscribe();
}


// =====================================================
// CHAT EVENTS
// =====================================================
//
// IMPORTANT:
// These are displayed as plain text.
// They are NEVER executed as JavaScript.
// There is deliberately NO alert() here.
// =====================================================

function enableChatEvents() {

    if (eventsChannel) {

        client.removeChannel(
            eventsChannel
        );

    }


    eventsChannel =
        client

            .channel(
                "wildstyle-chat-events"
            )

            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_events"
                },
                payload => {

                    if (!messagesDiv) return;


                    const div =
                        document.createElement(
                            "div"
                        );

                    div.className =
                        "system-message";


                    const pill =
                        document.createElement(
                            "div"
                        );

                    pill.className =
                        "system-pill";


                    // SAFE: never innerHTML
                    pill.textContent =
                        payload.new.message ||
                        "";


                    div.appendChild(
                        pill
                    );


                    messagesDiv.appendChild(
                        div
                    );


                    scrollBottom();

                }
            )

            .subscribe();
}


// =====================================================
// ONLINE USERS
// =====================================================

async function loadOnlineUsers() {

    if (!usersList) return;


    const {
        data,
        error
    } =
        await client

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

        console.error(
            "Online users error:",
            error
        );

        return;
    }


    usersList.innerHTML =
        "";


    const now =
        Date.now();


    (data || []).forEach(
        user => {

            const lastSeen =
                new Date(
                    user.last_seen
                ).getTime();


            const seconds =
                (
                    now -
                    lastSeen
                ) / 1000;


            if (
                seconds >
                60
            ) {

                return;
            }


            const profile =
                user.profiles || {};


            const name =
                profile.display_name ||
                "Member";


            const avatar =
                profile.avatar_url ||
                "/images/default-avatar.png";


            const status =
                profile.status ||
                "Online";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "user";


            const img =
                document.createElement(
                    "img"
                );


            img.className =
                "online-avatar";


            setSafeImage(
                img,
                avatar
            );


            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                statusIcon(status) +
                name;


            div.appendChild(
                img
            );

            div.appendChild(
                span
            );


            div.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <=
                        768
                    ) {

                        openMobileProfile(
                            user.user_id
                        );

                    } else {

                        openOwnerPanel(
                            user.user_id
                        );
                    }

                }
            );


            usersList.appendChild(
                div
            );

        }
    );
}


// Refresh online list
setInterval(
    () => {

        if (currentUser) {

            loadOnlineUsers();

        }

    },
    30000
);


// =====================================================
// MOBILE PROFILE
// =====================================================

async function openMobileProfile(
    userId
) {

    if (!userId) return;


    const {
        data,
        error
    } =
        await client

            .from("profiles")

            .select(`
                id,
                display_name,
                avatar_url,
                role,
                status
            `)

            .eq(
                "id",
                userId
            )

            .single();


    if (error) {

        console.error(
            "Mobile profile error:",
            error
        );

        return;
    }


    if (!data) return;


    selectedUser =
        data;


    if (mobileProfileAvatar) {

        setSafeImage(
            mobileProfileAvatar,
            data.avatar_url
        );
    }


    if (mobileProfileName) {

        mobileProfileName.textContent =
            data.display_name ||
            "Member";
    }


    if (mobileProfileStatus) {

        const status =
            data.status ||
            "Online";

        mobileProfileStatus.textContent =
            statusIcon(status) +
            status;
    }


    if (mobileProfileRole) {

        mobileProfileRole.textContent =
            roleBadge(
                data.role
            );
    }


    // Owner tools
    if (mobileModerationTools) {

        mobileModerationTools.style.display =
            isOwner()
                ? "block"
                : "none";
    }


    if (mobileProfileOverlay) {

        mobileProfileOverlay.classList.add(
            "show"
        );
    }


    if (mobileProfileCard) {

        mobileProfileCard.classList.add(
            "open"
        );
    }
}


window.openMobileProfile =
    openMobileProfile;


// =====================================================
// CLOSE MOBILE PROFILE
// =====================================================

function closeMobileProfile() {

    if (mobileProfileCard) {

        mobileProfileCard.classList.remove(
            "open"
        );
    }


    if (mobileProfileOverlay) {

        mobileProfileOverlay.classList.remove(
            "show"
        );
    }
}


window.closeMobileProfile =
    closeMobileProfile;


// =====================================================
// VIEW PROFILE
// =====================================================

function mobileViewProfile() {

    if (
        !selectedUser ||
        !selectedUser.id
    ) {

        return;
    }


    window.location.href =
        "profile.html?id=" +
        encodeURIComponent(
            selectedUser.id
        );
}


window.mobileViewProfile =
    mobileViewProfile;


// =====================================================
// OWNER PANEL
// =====================================================

async function openOwnerPanel(
    userId
) {

    if (!isOwner()) {

        return;
    }


    if (!userId) return;


    const {
        data,
        error
    } =
        await client

            .from("profiles")

            .select(`
                id,
                display_name,
                avatar_url,
                role,
                status,
                banned,
                ban_reason
            `)

            .eq(
                "id",
                userId
            )

            .single();


    if (error) {

        console.error(
            "Owner panel error:",
            error
        );

        return;
    }


    if (!data) return;


    selectedUser =
        data;


    if (ownerAvatar) {

        setSafeImage(
            ownerAvatar,
            data.avatar_url
        );
    }


    if (ownerName) {

        ownerName.textContent =
            data.display_name ||
            "Unknown";
    }


    if (ownerRole) {

        ownerRole.textContent =
            "Role: " +
            (
                data.role ||
                "member"
            );
    }


    if (ownerStatus) {

        ownerStatus.textContent =
            "Status: " +
            (
                data.status ||
                "Online"
            );
    }


    if (ownerPanel) {

        ownerPanel.classList.remove(
            "hidden"
        );

        requestAnimationFrame(
            () => {

                ownerPanel.classList.add(
                    "open"
                );

            }
        );
    }


    const overlay =
        document.getElementById(
            "ownerOverlay"
        );


    if (overlay) {

        overlay.classList.add(
            "show"
        );
    }
}


window.openOwnerPanel =
    openOwnerPanel;


// =====================================================
// CLOSE OWNER PANEL
// =====================================================

function closeOwnerPanelNow() {

    if (!ownerPanel) return;


    ownerPanel.classList.remove(
        "open"
    );


    const overlay =
        document.getElementById(
            "ownerOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );
    }


    setTimeout(
        () => {

            ownerPanel.classList.add(
                "hidden"
            );

        },
        350
    );
}


if (closeOwnerPanel) {

    closeOwnerPanel.addEventListener
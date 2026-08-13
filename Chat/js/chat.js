// =====================================================
// WILDSTYLE COMMUNITY CHAT
// CLEAN / STABLE CHAT CLIENT
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

let chatChannel = null;
let typingChannel = null;
let eventsChannel = null;

let privateChatUser = null;
let privateChatChannel = null;

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

function setSafeImage(img, url) {

    if (!img) return;

    const fallback =
        "/images/default-avatar.png";

    img.src = fallback;

    if (
        typeof url === "string" &&
        (
            /^https?:\/\//i.test(url) ||
            url.startsWith("/")
        )
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

function isOwner() {

    return currentUserRole === "owner";

}

function isAdmin() {

    return (
        currentUserRole === "owner" ||
        currentUserRole === "admin"
    );

}

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

// =====================================================
// START CHAT
// =====================================================

(async function startChat() {

    try {

        console.log(
            "🔥 Wildstyle Chat starting..."
        );

        if (
            typeof client === "undefined" ||
            !client
        ) {

            console.error(
                "Supabase client not available."
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

        window.currentUser =
            currentUser;

        console.log(
            "✅ Logged in:",
            currentUser.email
        );

        // =================================================
        // LOAD PROFILE
        // =================================================

        const {
            data: profile,
            error: profileError
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
                    currentUser.id
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

        console.log(
            "👑 Role:",
            currentUserRole
        );

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
        // INITIAL PRESENCE
        // =================================================

        await updateOnlinePresence();

        // =================================================
        // LOAD CHAT
        // =================================================

        await loadOnlineUsers();

        await loadMessages();

        await loadTypingUsers();

        enableRealtime();

        enableTypingRealtime();

        enableChatEvents();

        setupUI();

        console.log(
            "✅ Wildstyle Chat ready."
        );

    } catch (error) {

        console.error(
            "❌ Chat startup error:",
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

// =====================================================
// LOAD MESSAGES
// =====================================================

async function loadMessages() {

    if (!currentUser) return;

    console.log(
        "💬 Loading messages..."
    );

    const {
        data: messages,
        error
    } =
        await client
            .from("messages")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "❌ MESSAGE LOAD ERROR:",
            error
        );

        return;
    }

    if (!messagesDiv) return;

    messagesDiv.innerHTML = "";

    if (
        !messages ||
        messages.length === 0
    ) {

        messagesDiv.innerHTML = `
            <div class="chat-empty">
                💬 No messages yet.<br>
                Be the first to say hello!
            </div>
        `;

        return;
    }

    // -------------------------------------------------
    // Load profiles separately.
    // This avoids the profile relationship breaking
    // the entire chat query.
    // -------------------------------------------------

    const userIds = [
        ...new Set(
            messages
                .map(
                    message =>
                        message.user_id
                )
                .filter(Boolean)
        )
    ];

    let profiles = [];

    if (userIds.length) {

        const {
            data,
            error: profileError
        } =
            await client
                .from("profiles")
                .select(`
                    id,
                    display_name,
                    avatar_url,
                    role
                `)
                .in(
                    "id",
                    userIds
                );

        if (profileError) {

            console.error(
                "Profile loading error:",
                profileError
            );

        } else {

            profiles =
                data || [];

        }
    }

    messages.forEach(
        message => {

            message.profiles =
                profiles.find(
                    profile =>
                        profile.id ===
                        message.user_id
                ) || null;

            showMessage(
                message
            );

        }
    );

    scrollBottom();

}

// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(msg) {

    if (!messagesDiv || !msg) return;

    const div =
        document.createElement("div");

    div.className =
        "chat-message";

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

    // -------------------------------------------------
    // Click user
    // -------------------------------------------------

    div.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".delete-btn"
                )
            ) {

                return;
            }

            if (!msg.user_id) return;

            if (
                window.innerWidth <= 768
            ) {

                openMobileProfile(
                    msg.user_id
                );

            } else {

                if (isOwner()) {

                    openOwnerPanel(
                        msg.user_id
                    );

                }

            }

        }
    );

    // -------------------------------------------------
    // Row
    // -------------------------------------------------

    const row =
        document.createElement("div");

    row.style.display =
        "flex";

    row.style.gap =
        "12px";

    row.style.alignItems =
        "flex-start";

    // -------------------------------------------------
    // Avatar
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Content
    // -------------------------------------------------

    const content =
        document.createElement("div");

    content.style.flex =
        "1";

    // User

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

    // Message

    const text =
        document.createElement("div");

    text.className =
        "chat-text";

    // SAFE
    text.textContent =
        msg.message || "";

    // Time

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

    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------

    const canDelete =
        currentUser &&
        (
            currentUser.id ===
            msg.user_id ||
            isAdmin()
        );

    if (canDelete) {

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.type =
            "button";

        deleteButton.className =
            "delete-btn";

        deleteButton.textContent =
            "🗑️ Delete";

        deleteButton.addEventListener(
            "click",
            event => {

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

    if (text.length > 2000) {

        alert(
            "Message is too long. Maximum 2000 characters."
        );

        return;
    }

    if (sendBtn) {

        sendBtn.disabled =
            true;

    }

    try {

        const {
            error
        } =
            await client
                .from("messages")
                .insert({
                    user_id:
                        currentUser.id,

                    message:
                        text,

                    role:
                        currentUserRole
                });

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

        if (sendBtn) {

            sendBtn.disabled =
                false;

        }

        messageInput.focus();

    }

}

// =====================================================
// DELETE ONE MESSAGE
// =====================================================

async function deleteMessage(id) {

    if (!currentUser || !id) return;

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
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "messages"
                },

                async payload => {

                    const {
                        data: profile
                    } =
                        await client
                            .from("profiles")
                            .select(`
                                display_name,
                                avatar_url,
                                role
                            `)
                            .eq(
                                "id",
                                payload.new.user_id
                            )
                            .single();

                    showMessage({
                        ...payload.new,
                        profiles:
                            profile
                    });

                    scrollBottom();

                }
            )

            .on(
                "postgres_changes",
                {
                    event:
                        "DELETE",

                    schema:
                        "public",

                    table:
                        "messages"
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
                "Typing error:",
                error
            );

        }

    } else {

        await client
            .from("typing_users")
            .delete()
            .eq(
                "user_id",
                currentUser.id
            );

    }

}

async function loadTypingUsers() {

    if (!currentUser) return;

    if (!typingIndicator) return;

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

    const others =
        (data || [])
            .filter(
                user =>
                    user.user_id !==
                    currentUser.id
            );

    if (!others.length) {

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

function enableTypingRealtime() {

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
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "typing_users"
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
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "chat_events"
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

                    // SAFE
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

            if (seconds > 60) {
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

                    } else if (
                        isOwner()
                    ) {

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

    setSafeImage(
        mobileProfileAvatar,
        data.avatar_url
    );

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

    setSafeImage(
        ownerAvatar,
        data.avatar_url
    );

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

function closeOwnerPanelNow() {

    if (ownerPanel) {

        ownerPanel.classList.remove(
            "open"
        );

        setTimeout(
            () => {

                ownerPanel.classList.add(
                    "hidden"
                );

            },
            350
        );

    }

    const overlay =
        document.getElementById(
            "ownerOverlay"
        );

    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}

// =====================================================
// ROLE MANAGEMENT
// =====================================================

async function setRole(
    role
) {

    if (!isOwner()) {

        alert(
            "Only the owner can change roles."
        );

        return;
    }

    if (
        !selectedUser ||
        !selectedUser.id
    ) {

        alert(
            "Select a user first."
        );

        return;
    }

    // Never allow the owner account to be
    // changed through this panel.

    if (
        selectedUser.id ===
        currentUser.id
    ) {

        alert(
            "You cannot change your own owner role."
        );

        return;
    }

    const {
        error
    } =
        await client
            .from("profiles")
            .update({
                role:
                    role
            })
            .eq(
                "id",
                selectedUser.id
            );

    if (error) {

        console.error(
            "Role update error:",
            error
        );

        alert(
            error.message
        );

        return;
    }

    selectedUser.role =
        role;

    if (ownerRole) {

        ownerRole.textContent =
            "Role: " +
            role.charAt(0).toUpperCase() +
            role.slice(1);

    }

    await loadOnlineUsers();

    await loadMessages();

    alert(
        selectedUser.display_name +
        " is now " +
        role +
        "."
    );

}

// =====================================================
// BAN USER
// =====================================================

async function banUser() {

    if (!isOwner()) {

        alert(
            "Only the owner can ban users."
        );

        return;
    }

    if (
        !selectedUser ||
        !selectedUser.id
    ) {

        alert(
            "Select a user first."
        );

        return;
    }

    if (
        selectedUser.id ===
        currentUser.id
    ) {

        alert(
            "You cannot ban yourself."
        );

        return;
    }

    if (
        !confirm(
            "Ban " +
            selectedUser.display_name +
            "?"
        )
    ) {

        return;
    }

    const reason =
        prompt(
            "Reason for banning this user?"
        );

    if (reason === null) return;

    const {
        error
    } =
        await client
            .from("profiles")
            .update({
                banned:
                    true,

                ban_reason:
                    reason
            })
            .eq(
                "id",
                selectedUser.id
            );

    if (error) {

        console.error(
            "Ban error:",
            error
        );

        alert(
            error.message
        );

        return;
    }

    await client
        .from("chat_events")
        .insert({
            message:
                "🚫 " +
                selectedUser.display_name +
                " has been banned."
        });

    alert(
        selectedUser.display_name +
        " has been banned."
    );

    await loadOnlineUsers();

}

// =====================================================
// DELETE ALL USER MESSAGES
// =====================================================

async function deleteAllMessages() {

    if (!isOwner()) {

        alert(
            "Only the owner can delete all messages."
        );

        return;
    }

    if (
        !selectedUser ||
        !selectedUser.id
    ) {

        alert(
            "Select a user first."
        );

        return;
    }

    if (
        !confirm(
            "Delete ALL messages from " +
            selectedUser.display_name +
            "?"
        )
    ) {

        return;
    }

    const {
        error
    } =
        await client
            .from("messages")
            .delete()
            .eq(
                "user_id",
                selectedUser.id
            );

    if (error) {

        console.error(
            "Delete all messages error:",
            error
        );

        alert(
            error.message
        );

        return;
    }

    await loadMessages();

    alert(
        "Messages deleted successfully."
    );

}

// =====================================================
// STATUS
// =====================================================

async function setManualStatus(
    status
) {

    if (!currentUser) return;

    const {
        error
    } =
        await client
            .from("profiles")
            .update({
                status:
                    status
            })
            .eq(
                "id",
                currentUser.id
            );

    if (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            error.message
        );

        return;
    }

    presenceStatus =
        status;

    updateStatusButton(
        status
    );

    await loadOnlineUsers();

}

function updateStatusButton(
    status
) {

    if (!statusButton) return;

    let label =
        "🟢 Online";

    switch (status) {

        case "Online":
            label =
                "🟢 Online";
            break;

        case "Away":
            label =
                "🟡 Away";
            break;

        case "Busy":
            label =
                "🔴 Busy";
            break;

        case "Be Right Back":
            label =
                "🟠 Be Right Back";
            break;

        case "Invisible":
            label =
                "⚫ Invisible";
            break;

    }

    statusButton.textContent =
        label;

}

// =====================================================
// PRIVATE MESSAGES
// =====================================================

async function openPrivateChat(
    userId,
    name,
    avatar
) {

    if (!currentUser) {

        alert(
            "Please log in first."
        );

        return;
    }

    if (!userId) return;

    if (
        userId ===
        currentUser.id
    ) {

        alert(
            "You cannot message yourself."
        );

        return;
    }

    privateChatUser = {
        id:
            userId,

        name:
            name ||
            "Member",

        avatar:
            avatar ||
            "/images/default-avatar.png"
    };

    const overlay =
        document.getElementById(
            "privateChatOverlay"
        );

    if (!overlay) {

        console.error(
            "privateChatOverlay not found."
        );

        return;
    }

    const nameEl =
        document.getElementById(
            "privateChatName"
        );

    const avatarEl =
        document.getElementById(
            "privateChatAvatar"
        );

    if (nameEl) {

        nameEl.textContent =
            privateChatUser.name;

    }

    setSafeImage(
        avatarEl,
        privateChatUser.avatar
    );

    overlay.classList.add(
        "open"
    );

    await loadPrivateMessages();

    enablePrivateRealtime();

    document
        .getElementById(
            "privateChatInput"
        )
        ?.focus();

}

window.openPrivateChat =
    openPrivateChat;

// =====================================================
// LOAD PRIVATE MESSAGES
// =====================================================

async function loadPrivateMessages() {

    if (
        !currentUser ||
        !privateChatUser
    ) {

        return;
    }

    const box =
        document.getElementById(
            "privateChatMessages"
        );

    if (!box) return;

    const {
        data,
        error
    } =
        await client
            .from("private_messages")
            .select("*")
            .or(
                `and(sender_id.eq.${currentUser.id},recipient_id.eq.${privateChatUser.id}),and(sender_id.eq.${privateChatUser.id},recipient_id.eq.${currentUser.id})`
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        console.error(
            "Private message load error:",
            error
        );

        box.innerHTML =
            `
            <div class="private-chat-error">
                Unable to load messages.
            </div>
            `;

        return;
    }

    box.innerHTML =
        "";

    if (
        !data ||
        data.length === 0
    ) {

        box.innerHTML =
            `
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

}

// =====================================================
// SHOW PRIVATE MESSAGE
// =====================================================

function showPrivateMessage(
    msg
) {

    const box =
        document.getElementById(
            "privateChatMessages"
        );

    if (!box) return;

    const wrapper =
        document.createElement(
            "div"
        );

    const mine =
        msg.sender_id ===
        currentUser.id;

    wrapper.className =
        mine
            ? "private-message mine"
            : "private-message received";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "private-message-bubble";

    bubble.textContent =
        msg.message || "";

    const time =
        document.createElement(
            "div"
        );

    time.className =
        "private-message-time";

    time.textContent =
        msg.created_at
            ? new Date(
                msg.created_at
            ).toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            )
            : "";

    wrapper.appendChild(
        bubble
    );

    wrapper.appendChild(
        time
    );

    box.appendChild(
        wrapper
    );

}

// =====================================================
// SEND PRIVATE MESSAGE
// =====================================================

async function sendPrivateMessage() {

    if (
        !currentUser ||
        !privateChatUser
    ) {

        return;
    }

    const input =
        document.getElementById(
            "privateChatInput"
        );

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;

    const {
        data,
        error
    } =
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
            "Could not send private message.\n\n" +
            error.message
        );

        return;
    }

    input.value =
        "";

    if (data) {

        showPrivateMessage(
            data
        );

        scrollPrivateMessages();

    }

    input.focus();

}

// =====================================================
// PRIVATE REALTIME
// =====================================================

function enablePrivateRealtime() {

    if (
        !currentUser ||
        !privateChatUser
    ) {

        return;
    }

    if (privateChatChannel) {

        client.removeChannel(
            privateChatChannel
        );

    }

    privateChatChannel =
        client
            .channel(
                "wildstyle-private-" +
                currentUser.id +
                "-" +
                privateChatUser.id
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "private_messages"
                },
                payload => {

                    const msg =
                        payload.new;

                    const belongs =
                        (
                            msg.sender_id ===
                            privateChatUser.id &&
                            msg.recipient_id ===
                            currentUser.id
                        ) ||
                        (
                            msg.sender_id ===
                            currentUser.id &&
                            msg.recipient_id ===
                            privateChatUser.id
                        );

                    if (!belongs) return;

                    if (
                        msg.sender_id ===
                        currentUser.id
                    ) {

                        return;
                    }

                    showPrivateMessage(
                        msg
                    );

                    scrollPrivateMessages();

                }
            )
            .subscribe();

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

        privateChatChannel =
            null;

    }

    privateChatUser =
        null;

}

// =====================================================
// SCROLL PRIVATE
// =====================================================

function scrollPrivateMessages() {

    const box =
        document.getElementById(
            "privateChatMessages"
        );

    if (!box) return;

    box.scrollTop =
        box.scrollHeight;

}

// =====================================================
// UI SETUP
// =====================================================

function setupUI() {

    // -------------------------------------------------
    // SEND
    // -------------------------------------------------

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );

    }

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

        messageInput.addEventListener(
            "input",
            () => {

                if (!typing) {

                    typing =
                        true;

                    updateTyping(
                        true
                    );

                }

                clearTimeout(
                    typingTimer
                );

                typingTimer =
                    setTimeout(
                        () => {

                            typing =
                                false;

                            updateTyping(
                                false
                            );

                        },
                        1500
                    );

            }
        );

    }

    // -------------------------------------------------
    // LOGOUT
    // -------------------------------------------------

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                await client.auth.signOut();

                window.location.href =
                    "index.html";

            }
        );

    }

    // -------------------------------------------------
    // OWNER PANEL
    // -------------------------------------------------

    if (closeOwnerPanel) {

        closeOwnerPanel.addEventListener(
            "click",
            closeOwnerPanelNow
        );

    }

    const ownerOverlay =
        document.getElementById(
            "ownerOverlay"
        );

    if (ownerOverlay) {

        ownerOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    ownerOverlay
                ) {

                    closeOwnerPanelNow();

                }

            }
        );

    }

    // -------------------------------------------------
    // ROLE BUTTONS
    // -------------------------------------------------

    const roleButtons = [
        [
            "btnMakeAdmin",
            "admin"
        ],
        [
            "btnMakeDJ",
            "dj"
        ],
        [
            "btnMakeVIP",
            "vip"
        ],
        [
            "btnMember",
            "member"
        ]
    ];

    roleButtons.forEach(
        ([id, role]) => {

            const button =
                document.getElementById(
                    id
                );

            if (button) {

                button.addEventListener(
                    "click",
                    () => setRole(
                        role
                    )
                );

            }

        }
    );

    // -------------------------------------------------
    // MODERATION
    // -------------------------------------------------

    const deleteAllBtn =
        document.getElementById(
            "btnDeleteMessages"
        );

    if (deleteAllBtn) {

        deleteAllBtn.addEventListener(
            "click",
            deleteAllMessages
        );

    }

    const banBtn =
        document.getElementById(
            "btnBan"
        );

    if (banBtn) {

        banBtn.addEventListener(
            "click",
            banUser
        );

    }

    // -------------------------------------------------
    // STATUS MENU
    // -------------------------------------------------

    if (
        statusButton &&
        statusMenu
    ) {

        statusButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                statusMenu.classList.toggle(
                    "open"
                );

            }
        );

        statusMenu
            .querySelectorAll(
                "button[data-status]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            await setManualStatus(
                                button.dataset.status
                            );

                            statusMenu.classList.remove(
                                "open"
                            );

                        }
                    );

                }
            );

        document.addEventListener(
            "click",
            () => {

                statusMenu.classList.remove(
                    "open"
                );

            }
        );

    }

    // -------------------------------------------------
    // MOBILE PROFILE
    // -------------------------------------------------

    if (mobileProfileClose) {

        mobileProfileClose.addEventListener(
            "click",
            closeMobileProfile
        );

    }

    if (mobileProfileOverlay) {

        mobileProfileOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    mobileProfileOverlay
                ) {

                    closeMobileProfile();

                }

            }
        );

    }

    // -------------------------------------------------
    // PRIVATE CHAT
    // -------------------------------------------------

    const privateClose =
        document.getElementById(
            "privateChatClose"
        );

    const privateSend =
        document.getElementById(
            "privateChatSend"
        );

    const privateInput =
        document.getElementById(
            "privateChatInput"
        );

    if (privateClose) {

        privateClose.addEventListener(
            "click",
            closePrivateChat
        );

    }

    if (privateSend) {

        privateSend.addEventListener(
            "click",
            sendPrivateMessage
        );

    }

    if (privateInput) {

        privateInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendPrivateMessage();

                }

            }
        );

    }

    // -------------------------------------------------
    // EMOJI
    // -------------------------------------------------

    if (
        emojiBtn &&
        emojiPicker
    ) {

        emojiBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                emojiPicker.classList.toggle(
                    "open"
                );

            }
        );

        emojiPicker
            .querySelectorAll(
                "span"
            )
            .forEach(
                span => {

                    span.addEventListener(
                        "click",
                        () => {

                            if (
                                messageInput
                            ) {

                                messageInput.value +=
                                    span.textContent;

                                messageInput.focus();

                            }

                        }
                    );

                }
            );

    }

}

// =====================================================
// GLOBAL FUNCTIONS FOR HTML
// =====================================================

window.sendMessage =
    sendMessage;

window.deleteMessage =
    deleteMessage;

window.openOwnerPanel =
    openOwnerPanel;

window.openMobileProfile =
    openMobileProfile;

window.closeMobileProfile =
    closeMobileProfile;

window.mobileViewProfile =
    mobileViewProfile;

window.openPrivateChat =
    openPrivateChat;

window.closePrivateChat =
    closePrivateChat;
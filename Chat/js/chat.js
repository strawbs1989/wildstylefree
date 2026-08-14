// =====================================================
// WILDSTYLE COMMUNITY CHAT
// FINAL STABLE VERSION
// =====================================================

"use strict";

(function () {

    console.log("🔥 WILDSTYLE CHAT.JS LOADED");

    // =================================================
    // STATE
    // =================================================

    let currentUser = null;
    let currentUserProfile = null;
    let currentUserRole = "member";

    let selectedUser = null;

    let typing = false;
    let typingTimer = null;

    let presenceStatus = "Online";

    let chatChannel = null;
    let typingChannel = null;
    let eventsChannel = null;
    let privateChatChannel = null;

    let privateChatUser = null;

    // =================================================
    // DOM
    // =================================================

    let ownerPanel;
    let closeOwnerPanel;
    let ownerAvatar;
    let ownerName;
    let ownerRole;
    let ownerStatus;

    let messagesDiv;
    let messageInput;
    let sendBtn;
    let usersList;

    let emojiBtn;
    let emojiPicker;

    let typingIndicator;

    let statusButton;
    let statusMenu;

    let mobileProfileCard;
    let mobileProfileOverlay;
    let mobileProfileClose;
    let mobileProfileAvatar;
    let mobileProfileName;
    let mobileProfileStatus;
    let mobileProfileRole;
    let mobileModerationTools;

    // =================================================
    // SUPABASE
    // =================================================

    function getClient() {

        if (
            typeof window.client !== "undefined" &&
            window.client
        ) {
            return window.client;
        }

        if (
            typeof client !== "undefined" &&
            client
        ) {
            return client;
        }

        if (
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }

        return null;
    }

    // =================================================
    // DOM CACHE
    // =================================================

    function cacheDOM() {

        ownerPanel =
            document.getElementById("ownerPanel");

        closeOwnerPanel =
            document.getElementById("closeOwnerPanel");

        ownerAvatar =
            document.getElementById("ownerAvatar");

        ownerName =
            document.getElementById("ownerName");

        ownerRole =
            document.getElementById("ownerRole");

        ownerStatus =
            document.getElementById("ownerStatus");

        messagesDiv =
            document.getElementById("messages");

        messageInput =
            document.getElementById("messageInput");

        sendBtn =
            document.getElementById("sendBtn");

        usersList =
            document.getElementById("usersList");

        emojiBtn =
            document.getElementById("emojiBtn");

        emojiPicker =
            document.getElementById("emojiPicker");

        typingIndicator =
            document.getElementById("typingIndicator");

        statusButton =
            document.getElementById("statusButton");

        statusMenu =
            document.getElementById("statusMenu");

        mobileProfileCard =
            document.getElementById("mobileProfileCard");

        mobileProfileOverlay =
            document.getElementById("mobileProfileOverlay");

        mobileProfileClose =
            document.getElementById("mobileProfileClose");

        mobileProfileAvatar =
            document.getElementById("mobileProfileAvatar");

        mobileProfileName =
            document.getElementById("mobileProfileName");

        mobileProfileStatus =
            document.getElementById("mobileProfileStatus");

        mobileProfileRole =
            document.getElementById("mobileProfileRole");

        mobileModerationTools =
            document.getElementById("mobileModerationTools");

        console.log("🔎 DOM CHECK:", {
            messages: !!messagesDiv,
            input: !!messageInput,
            send: !!sendBtn,
            users: !!usersList,
            status: !!statusButton
        });
    }

    // =================================================
    // SECURITY
    // =================================================

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

        img.onerror = function () {
            img.src = fallback;
        };
    }

    // =================================================
    // ROLES
    // =================================================

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

    // =================================================
    // CHAT ERROR
    // =================================================

    function showChatError(message) {

        if (!messagesDiv) return;

        messagesDiv.innerHTML = "";

        const box =
            document.createElement("div");

        box.className =
            "system-message";

        box.style.padding =
            "20px";

        box.style.color =
            "#ff6b9d";

        box.textContent =
            "⚠️ " + message;

        messagesDiv.appendChild(box);
    }

    // =================================================
    // START CHAT
    // =================================================

    async function startChat() {

        console.log("🚀 STARTING WILDSTYLE CHAT");

        // VERY IMPORTANT
        // Cache DOM before doing anything else.
        cacheDOM();

        if (!messagesDiv) {

            console.error(
                "❌ #messages was not found."
            );

            return;
        }

        const db =
            getClient();

        if (!db) {

            console.error(
                "❌ Supabase client not found."
            );

            showChatError(
                "Chat could not connect to the server."
            );

            return;
        }

        console.log(
            "✅ Supabase client found."
        );

        try {

            // =============================================
            // WAIT FOR WILDSTYLE AUTH TO FINISH
            // =============================================
            // auth.js creates window.wildstyleAuthReady and
            // restores/checks the Supabase session. Chat must
            // NOT call getUser() before that promise settles.
            // This prevents the app WebView race that produced:
            // "Unable to check your login."

            if (
                window.wildstyleAuthReady &&
                typeof window.wildstyleAuthReady.then === "function"
            ) {
                try {
                    await window.wildstyleAuthReady;
                } catch (authReadyError) {
                    console.warn(
                        "⚠️ Wildstyle authentication did not become ready:",
                        authReadyError
                    );

                    // auth.js handles the redirect to index.html.
                    return;
                }
            }

            // =============================================
            // AUTH
            // =============================================

            const {
                data,
                error
            } =
                await db.auth.getUser();

            if (error) {

                console.error(
                    "❌ AUTH ERROR:",
                    error
                );

                showChatError(
                    "Unable to check your login."
                );

                return;
            }

            currentUser =
                data?.user || null;

            if (!currentUser) {

                console.warn(
                    "⚠️ No logged-in user."
                );

                window.location.href =
                    "index.html";

                return;
            }

            window.currentUser =
                currentUser;

            console.log(
                "✅ USER:",
                currentUser.id
            );

            // =============================================
            // PROFILE
            // =============================================

            const {
                data: profile,
                error: profileError
            } =
                await db
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
                    .maybeSingle();

            if (profileError) {

                console.error(
                    "❌ PROFILE ERROR:",
                    profileError
                );

                showChatError(
                    "Your community profile could not be loaded."
                );

                return;
            }

            if (!profile) {

                console.error(
                    "❌ NO PROFILE FOUND"
                );

                showChatError(
                    "No community profile was found for your account."
                );

                return;
            }

            currentUserProfile =
                profile;

            currentUserRole =
                profile.role ||
                "member";

            presenceStatus =
                profile.status ||
                "Online";

            console.log(
                "👤 PROFILE:",
                profile.display_name,
                currentUserRole
            );

            // =============================================
            // BAN CHECK
            // =============================================

            if (profile.banned === true) {

                alert(
                    "🚫 You have been banned from Wildstyle Community.\n\n" +
                    "Reason:\n" +
                    (
                        profile.ban_reason ||
                        "No reason supplied."
                    )
                );

                await db.auth.signOut();

                window.location.href =
                    "index.html";

                return;
            }

            updateStatusButton(
                presenceStatus
            );

            // =============================================
            // PRESENCE
            // =============================================

            try {

                await updateOnlinePresence();

            } catch (error) {

                console.warn(
                    "Presence unavailable:",
                    error
                );
            }

            // =============================================
            // LOAD CHAT
            // =============================================

            await loadMessages();

            // =============================================
            // ONLINE USERS
            // =============================================

            try {

                await loadOnlineUsers();

            } catch (error) {

                console.warn(
                    "Online users unavailable:",
                    error
                );
            }

            // =============================================
            // TYPING
            // =============================================

            try {

                await loadTypingUsers();

            } catch (error) {

                console.warn(
                    "Typing unavailable:",
                    error
                );
            }

            // =============================================
            // REALTIME
            // =============================================

            enableRealtime();

            enableTypingRealtime();

            enableChatEvents();

            // =============================================
            // UI
            // =============================================

            setupUI();

            console.log(
                "🎉 WILDSTYLE CHAT READY"
            );

        } catch (error) {

            console.error(
                "💥 CHAT STARTUP ERROR:",
                error
            );

            showChatError(
                "The chat encountered an error. Check the browser console."
            );
        }
    }

    // =================================================
    // PRESENCE
    // =================================================

    async function updateOnlinePresence() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser
        ) {
            return;
        }

        const {
            error
        } =
            await db
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

    setInterval(
        function () {

            if (currentUser) {

                updateOnlinePresence()
                    .catch(
                        console.error
                    );

            }

        },
        30000
    );

    // =================================================
    // LOAD MESSAGES
    // =================================================

    async function loadMessages() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !messagesDiv
        ) {
            return;
        }

        console.log(
            "💬 Loading messages..."
        );

        const {
            data: messages,
            error
        } =
            await db
                .from("messages")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );

        if (error) {

            console.error(
                "❌ MESSAGE LOAD ERROR:",
                error
            );

            showChatError(
                "Unable to load the community chat."
            );

            return;
        }

        messagesDiv.innerHTML =
            "";

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

        const ids =
            [
                ...new Set(
                    messages
                        .map(
                            m =>
                                m.user_id
                        )
                        .filter(Boolean)
                )
            ];

        let profiles = [];

        if (ids.length) {

            const {
                data,
                error: profileError
            } =
                await db
                    .from("profiles")
                    .select(`
                        id,
                        display_name,
                        avatar_url,
                        role,
                        status
                    `)
                    .in(
                        "id",
                        ids
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
            function (message) {

                const profile =
                    profiles.find(
                        p =>
                            p.id ===
                            message.user_id
                    ) || null;

                showMessage(
                    message,
                    profile
                );
            }
        );

        scrollBottom();
    }

    // =================================================
    // SHOW MESSAGE
    // =================================================

    function showMessage(
        msg,
        suppliedProfile
    ) {

        if (
            !messagesDiv ||
            !msg
        ) {
            return;
        }

        const profile =
            suppliedProfile ||
            msg.profiles ||
            {};

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

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "chat-message";

        if (msg.id) {

            wrapper.dataset.messageId =
                msg.id;
        }

        wrapper.addEventListener(
            "click",
            function (event) {

                if (
                    event.target.closest(
                        ".delete-btn"
                    )
                ) {
                    return;
                }

                if (!msg.user_id) {
                    return;
                }

                if (
                    window.innerWidth <=
                    768
                ) {

                    openMobileProfile(
                        msg.user_id
                    );

                } else if (
                    isOwner()
                ) {

                    openOwnerPanel(
                        msg.user_id
                    );
                }
            }
        );

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

        text.textContent =
            msg.message || "";

        const time =
            document.createElement("div");

        time.className =
            "chat-time";

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

        content.appendChild(
            userLine
        );

        content.appendChild(
            text
        );

        content.appendChild(
            time
        );

        // =============================================
        // DELETE
        // =============================================

        if (
            currentUser &&
            (
                currentUser.id ===
                msg.user_id ||
                isAdmin()
            )
        ) {

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

        wrapper.appendChild(
            row
        );

        messagesDiv.appendChild(
            wrapper
        );
    }

    // =================================================
    // SEND MESSAGE
    // =================================================

    async function sendMessage() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !messageInput
        ) {
            return;
        }

        const text =
            messageInput.value.trim();

        if (!text) {
            return;
        }

        if (
            text.length >
            2000
        ) {

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
                await db
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

    // =================================================
    // DELETE MESSAGE
    // =================================================

    async function deleteMessage(id) {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !id
        ) {
            return;
        }

        if (
            !confirm(
                "Delete this message?"
            )
        ) {
            return;
        }

        const {
            error
        } =
            await db
                .from("messages")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {

            console.error(
                "Delete error:",
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

    // =================================================
    // REALTIME CHAT
    // =================================================

    function enableRealtime() {

        const db =
            getClient();

        if (!db) return;

        if (chatChannel) {

            db.removeChannel(
                chatChannel
            );
        }

        chatChannel =
            db
                .channel(
                    "wildstyle-chat-" +
                    Date.now()
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
                    async function (
                        payload
                    ) {

                        const {
                            data: profile
                        } =
                            await db
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
                                .maybeSingle();

                        showMessage(
                            payload.new,
                            profile
                        );

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
                    function () {

                        loadMessages();
                    }
                )

                .subscribe(
                    function (status) {

                        console.log(
                            "💬 CHAT REALTIME:",
                            status
                        );
                    }
                );
    }

    // =================================================
    // SCROLL
    // =================================================

    function scrollBottom() {

        if (!messagesDiv) {
            return;
        }

        messagesDiv.scrollTop =
            messagesDiv.scrollHeight;
    }

    // =================================================
    // TYPING
    // =================================================

    async function updateTyping(
        isTyping
    ) {

        const db =
            getClient();

        if (
            !db ||
            !currentUser
        ) {
            return;
        }

        if (isTyping) {

            const {
                error
            } =
                await db
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

                console.warn(
                    "Typing update:",
                    error
                );
            }

        } else {

            await db
                .from("typing_users")
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                );
        }
    }

    async function loadTypingUsers() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !typingIndicator
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await db
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

            console.warn(
                "Typing users:",
                error
            );

            return;
        }

        const others =
            (data || []).filter(
                function (user) {

                    return (
                        user.user_id !==
                        currentUser.id
                    );
                }
            );

        if (!others.length) {

            typingIndicator.textContent =
                "";

            return;
        }

        const names =
            others.map(
                function (user) {

                    return (
                        user.profiles?.display_name ||
                        "Someone"
                    );
                }
            );

        typingIndicator.textContent =
            "✍️ " +
            names.join(", ") +
            (
                names.length === 1
                    ? " is"
                    : " are"
            ) +
            " typing...";
    }

    function enableTypingRealtime() {

        const db =
            getClient();

        if (!db) return;

        if (typingChannel) {

            db.removeChannel(
                typingChannel
            );
        }

        typingChannel =
            db
                .channel(
                    "wildstyle-typing-" +
                    Date.now()
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
                    function () {

                        loadTypingUsers();
                    }
                )
                .subscribe();
    }

    // =================================================
    // CHAT EVENTS
    // =================================================

    function enableChatEvents() {

        const db =
            getClient();

        if (!db) return;

        if (eventsChannel) {

            db.removeChannel(
                eventsChannel
            );
        }

        eventsChannel =
            db
                .channel(
                    "wildstyle-events-" +
                    Date.now()
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
                    function (payload) {

                        if (!messagesDiv) {
                            return;
                        }

                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "system-message";

                        div.textContent =
                            payload.new.message ||
                            "";

                        messagesDiv.appendChild(
                            div
                        );

                        scrollBottom();
                    }
                )
                .subscribe();
    }

    // =================================================
    // ONLINE USERS
    // =================================================

    async function loadOnlineUsers() {

        const db =
            getClient();

        if (
            !db ||
            !usersList
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await db
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

            console.warn(
                "Online users:",
                error
            );

            return;
        }

        usersList.innerHTML =
            "";

        const now =
            Date.now();

        (data || []).forEach(
            function (user) {

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
                    user.profiles ||
                    {};

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
                    profile.avatar_url
                );

                const span =
                    document.createElement(
                        "span"
                    );

                span.textContent =
                    statusIcon(
                        profile.status
                    ) +
                    (
                        profile.display_name ||
                        "Member"
                    );

                div.appendChild(
                    img
                );

                div.appendChild(
                    span
                );

                div.addEventListener(
                    "click",
                    function () {

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
        function () {

            if (currentUser) {

                loadOnlineUsers()
                    .catch(
                        console.error
                    );
            }

        },
        30000
    );

    // =================================================
    // MOBILE PROFILE
    // =================================================

    async function openMobileProfile(
        userId
    ) {

        const db =
            getClient();

        if (
            !db ||
            !userId
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await db
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
                .maybeSingle();

        if (error || !data) {

            console.error(
                "Mobile profile:",
                error
            );

            return;
        }

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

            mobileProfileStatus.textContent =
                statusIcon(
                    data.status
                ) +
                (
                    data.status ||
                    "Online"
                );
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

    // =================================================
    // OWNER PANEL
    // =================================================

    async function openOwnerPanel(
        userId
    ) {

        const db =
            getClient();

        if (
            !db ||
            !isOwner() ||
            !userId
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await db
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
                .maybeSingle();

        if (error || !data) {

            console.error(
                "Owner panel:",
                error
            );

            return;
        }

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
                function () {

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
                function () {

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

    // =================================================
    // ROLE MANAGEMENT
    // =================================================

    async function setRole(
        role
    ) {

        const db =
            getClient();

        if (!db || !isOwner()) {

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
            await db
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

            alert(
                error.message
            );

            return;
        }

        selectedUser.role =
            role;

        await loadOnlineUsers();

        await loadMessages();

        alert(
            selectedUser.display_name +
            " is now " +
            role +
            "."
        );
    }

    window.setRole =
        setRole;

    // =================================================
    // BAN
    // =================================================

    async function banUser() {

        const db =
            getClient();

        if (
            !db ||
            !isOwner()
        ) {

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

        if (
            reason ===
            null
        ) {
            return;
        }

        const {
            error
        } =
            await db
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

            alert(
                error.message
            );

            return;
        }

        try {

            await db
                .from("chat_events")
                .insert({
                    message:
                        "🚫 " +
                        selectedUser.display_name +
                        " has been banned."
                });

        } catch (e) {

            console.warn(
                "Chat event unavailable:",
                e
            );
        }

        await loadOnlineUsers();

        alert(
            selectedUser.display_name +
            " has been banned."
        );
    }

    window.banUser =
        banUser;

    // =================================================
    // DELETE ALL USER MESSAGES
    // =================================================

    async function deleteAllMessages() {

        const db =
            getClient();

        if (
            !db ||
            !isOwner()
        ) {

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
            await db
                .from("messages")
                .delete()
                .eq(
                    "user_id",
                    selectedUser.id
                );

        if (error) {

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

    window.deleteAllMessages =
        deleteAllMessages;

    // =================================================
    // STATUS
    // =================================================

    async function setManualStatus(
        status
    ) {

        const db =
            getClient();

        if (
            !db ||
            !currentUser
        ) {
            return;
        }

        const {
            error
        } =
            await db
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

        if (!statusButton) {
            return;
        }

        statusButton.textContent =
            statusIcon(status) +
            (
                status ||
                "Online"
            );
    }

    // =================================================
    // PRIVATE CHAT
    // =================================================

    async function openPrivateChat(
        userId,
        name,
        avatar
    ) {

        if (
            !currentUser ||
            !userId
        ) {
            return;
        }

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

        const input =
            document.getElementById(
                "privateChatInput"
            );

        if (input) {
            input.focus();
        }
    }

    window.openPrivateChat =
        openPrivateChat;

    // =================================================
    // PRIVATE MESSAGE LOADING
    // =================================================

    async function loadPrivateMessages() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) {
            return;
        }

        const box =
            document.getElementById(
                "privateChatMessages"
            );

        if (!box) {
            return;
        }

        const {
            data,
            error
        } =
            await db
                .from("private_messages")
                .select("*")
                .or(
                    "and(sender_id.eq." +
                    currentUser.id +
                    ",recipient_id.eq." +
                    privateChatUser.id +
                    "),and(sender_id.eq." +
                    privateChatUser.id +
                    ",recipient_id.eq." +
                    currentUser.id +
                    ")"
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
                "Private messages:",
                error
            );

            box.innerHTML = `
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

            box.innerHTML = `
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

    // =================================================
    // SHOW PRIVATE MESSAGE
    // =================================================

    function showPrivateMessage(
        msg
    ) {

        const box =
            document.getElementById(
                "privateChatMessages"
            );

        if (
            !box ||
            !currentUser
        ) {
            return;
        }

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

    // =================================================
    // SEND PRIVATE MESSAGE
    // =================================================

    async function sendPrivateMessage() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) {
            return;
        }

        const input =
            document.getElementById(
                "privateChatInput"
            );

        if (!input) {
            return;
        }

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        if (
            text.length >
            2000
        ) {

            alert(
                "Private message is too long."
            );

            return;
        }

        const {
            data,
            error
        } =
            await db
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
                "Private message:",
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

    // =================================================
    // PRIVATE REALTIME
    // =================================================

    function enablePrivateRealtime() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) {
            return;
        }

        if (privateChatChannel) {

            db.removeChannel(
                privateChatChannel
            );
        }

        privateChatChannel =
            db
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
                    function (payload) {

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

                        if (!belongs) {
                            return;
                        }

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

    // =================================================
    // CLOSE PRIVATE CHAT
    // =================================================

    function closePrivateChat() {

        const db =
            getClient();

        const overlay =
            document.getElementById(
                "privateChatOverlay"
            );

        if (overlay) {

            overlay.classList.remove(
                "open"
            );
        }

        if (
            db &&
            privateChatChannel
        ) {

            db.removeChannel(
                privateChatChannel
            );

            privateChatChannel =
                null;
        }

        privateChatUser =
            null;
    }

    window.closePrivateChat =
        closePrivateChat;

    function scrollPrivateMessages() {

        const box =
            document.getElementById(
                "privateChatMessages"
            );

        if (!box) {
            return;
        }

        box.scrollTop =
            box.scrollHeight;
    }

    // =================================================
    // OPEN PRIVATE CHAT FOR SELECTED USER
    // =================================================

    function privateMessageSelectedUser() {

        if (
            !selectedUser ||
            !selectedUser.id
        ) {
            alert(
                "Select a user first."
            );

            return;
        }

        openPrivateChat(
            selectedUser.id,
            selectedUser.display_name,
            selectedUser.avatar_url
        );
    }

    // =================================================
    // UI SETUP
    // =================================================

    function setupUI() {

        // =============================================
        // SEND BUTTON
        // =============================================

        if (sendBtn) {

            sendBtn.addEventListener(
                "click",
                sendMessage
            );
        }

        // =============================================
        // MESSAGE INPUT
        // =============================================

        if (messageInput) {

            messageInput.addEventListener(
                "keydown",
                function (event) {

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
                function () {

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
                            function () {

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

        // =============================================
        // LOGOUT
        // =============================================

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                async function () {

                    const db =
                        getClient();

                    if (db) {

                        await db.auth.signOut();
                    }

                    window.location.href =
                        "index.html";
                }
            );
        }

        // =============================================
        // OWNER PANEL
        // =============================================

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
                function (event) {

                    if (
                        event.target ===
                        ownerOverlay
                    ) {

                        closeOwnerPanelNow();
                    }
                }
            );
        }

        // =============================================
        // OWNER PRIVATE MESSAGE
        // =============================================

        const desktopPrivate =
            document.getElementById(
                "desktopPrivateMessageBtn"
            );

        if (desktopPrivate) {

            desktopPrivate.addEventListener(
                "click",
                privateMessageSelectedUser
            );
        }

        // =============================================
        // MOBILE PRIVATE MESSAGE
        // =============================================

        const mobilePrivate =
            document.getElementById(
                "mobilePrivateMessageBtn"
            );

        if (mobilePrivate) {

            mobilePrivate.addEventListener(
                "click",
                privateMessageSelectedUser
            );
        }

        // =============================================
        // ROLE BUTTONS
        // =============================================

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
            function ([id, role]) {

                const button =
                    document.getElementById(
                        id
                    );

                if (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            setRole(
                                role
                            );
                        }
                    );
                }
            }
        );

        // =============================================
        // BAN
        // =============================================

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

        // =============================================
        // DELETE ALL
        // =============================================

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

        // =============================================
        // STATUS
        // =============================================

        if (
            statusButton &&
            statusMenu
        ) {

            statusButton.addEventListener(
                "click",
                function (event) {

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
                    function (button) {

                        button.addEventListener(
                            "click",
                            async function () {

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
                function () {

                    statusMenu.classList.remove(
                        "open"
                    );
                }
            );
        }

        // =============================================
        // MOBILE PROFILE
        // =============================================

        if (mobileProfileClose) {

            mobileProfileClose.addEventListener(
                "click",
                closeMobileProfile
            );
        }

        if (mobileProfileOverlay) {

            mobileProfileOverlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        mobileProfileOverlay
                    ) {

                        closeMobileProfile();
                    }
                }
            );
        }

        // =============================================
        // PRIVATE CHAT CLOSE
        // =============================================

        const privateClose =
            document.getElementById(
                "privateChatClose"
            );

        if (privateClose) {

            privateClose.addEventListener(
                "click",
                closePrivateChat
            );
        }

        // =============================================
        // PRIVATE CHAT SEND
        // =============================================

        const privateSend =
            document.getElementById(
                "privateChatSend"
            );

        if (privateSend) {

            privateSend.addEventListener(
                "click",
                sendPrivateMessage
            );
        }

        // =============================================
        // PRIVATE CHAT ENTER
        // =============================================

        const privateInput =
            document.getElementById(
                "privateChatInput"
            );

        if (privateInput) {

            privateInput.addEventListener(
                "keydown",
                function (event) {

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

        // =============================================
        // EMOJI
        // =============================================

        if (
            emojiBtn &&
            emojiPicker
        ) {

            emojiBtn.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    emojiPicker.classList.toggle(
                        "open"
                    );
                }
            );

            emojiPicker.addEventListener(
                "click",
                function (event) {

                    const target =
                        event.target;

                    if (
                        target ===
                        emojiPicker
                    ) {
                        return;
                    }

                    const emoji =
                        target.textContent ||
                        "";

                    if (
                        messageInput &&
                        emoji
                    ) {

                        messageInput.value +=
                            emoji.trim();

                        messageInput.focus();
                    }
                }
            );
        }
    }

    // =================================================
    // GLOBAL FUNCTIONS
    // =================================================

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

    window.sendPrivateMessage =
        sendPrivateMessage;

    window.setRole =
        setRole;

    window.banUser =
        banUser;

    window.deleteAllMessages =
        deleteAllMessages;

    // =================================================
    // START AFTER DOM
    // =================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startChat
        );

    } else {

        startChat();

    }

})();
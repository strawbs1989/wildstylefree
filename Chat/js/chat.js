// =====================================================
// WILDSTYLE COMMUNITY CHAT
// STABLE CLIENT
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

    let uiReady = false;

    const renderedMessageIds = new Set();

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
    // GET SUPABASE CLIENT
    // =================================================

    function getClient() {

        if (
            typeof client !== "undefined" &&
            client
        ) {
            return client;
        }

        if (
            window.client
        ) {
            return window.client;
        }

        if (
            window.supabaseClient
        ) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            window.SUPABASE_URL &&
            window.SUPABASE_ANON_KEY
        ) {

            return window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY
            );

        }

        return null;
    }

    // =================================================
    // DOM CACHE
    // =================================================

    function cacheDOM() {

        ownerPanel =
            document.getElementById(
                "ownerPanel"
            );

        closeOwnerPanel =
            document.getElementById(
                "closeOwnerPanel"
            );

        ownerAvatar =
            document.getElementById(
                "ownerAvatar"
            );

        ownerName =
            document.getElementById(
                "ownerName"
            );

        ownerRole =
            document.getElementById(
                "ownerRole"
            );

        ownerStatus =
            document.getElementById(
                "ownerStatus"
            );

        messagesDiv =
            document.getElementById(
                "messages"
            );

        messageInput =
            document.getElementById(
                "messageInput"
            );

        sendBtn =
            document.getElementById(
                "sendBtn"
            );

        usersList =
            document.getElementById(
                "usersList"
            );

        emojiBtn =
            document.getElementById(
                "emojiBtn"
            );

        emojiPicker =
            document.getElementById(
                "emojiPicker"
            );

        typingIndicator =
            document.getElementById(
                "typingIndicator"
            );

        statusButton =
            document.getElementById(
                "statusButton"
            );

        statusMenu =
            document.getElementById(
                "statusMenu"
            );

        mobileProfileCard =
            document.getElementById(
                "mobileProfileCard"
            );

        mobileProfileOverlay =
            document.getElementById(
                "mobileProfileOverlay"
            );

        mobileProfileClose =
            document.getElementById(
                "mobileProfileClose"
            );

        mobileProfileAvatar =
            document.getElementById(
                "mobileProfileAvatar"
            );

        mobileProfileName =
            document.getElementById(
                "mobileProfileName"
            );

        mobileProfileStatus =
            document.getElementById(
                "mobileProfileStatus"
            );

        mobileProfileRole =
            document.getElementById(
                "mobileProfileRole"
            );

        mobileModerationTools =
            document.getElementById(
                "mobileModerationTools"
            );

        console.log(
            "🔎 DOM:",
            {
                messages:
                    !!messagesDiv,

                input:
                    !!messageInput,

                send:
                    !!sendBtn,

                users:
                    !!usersList,

                status:
                    !!statusButton
            }
        );
    }

    // =================================================
    // SECURITY
    // =================================================

    function setSafeImage(
        img,
        url
    ) {

        if (!img) return;

        const fallback =
            "/images/default-avatar.png";

        img.src =
            fallback;

        if (
            typeof url === "string" &&
            (
                /^https?:\/\//i.test(url) ||
                url.startsWith("/")
            )
        ) {

            img.src =
                url;
        }

        img.onerror =
            function () {

                img.src =
                    fallback;

            };
    }

    // =================================================
    // ROLE
    // =================================================

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

        return (
            currentUserRole ===
            "owner"
        );
    }

    function isAdmin() {

        return (
            currentUserRole ===
            "owner" ||
            currentUserRole ===
            "admin"
        );
    }

    // =================================================
    // START
    // =================================================

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
        } = await client.auth.getUser();
            // =========================================
            // AUTH
            // =========================================

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
                    "⚠️ No logged-in user"
                );

                window.location.href =
                    "index.html";

                return;
            }

            window.currentUser =
                currentUser;

            console.log(
                "✅ User:",
                currentUser.id
            );

            // =========================================
            // PROFILE
            // =========================================

            const {
    data: profile,
    error: profileError
} =
    await client
        .from("profiles")
                    .select(
                        `
                        id,
                        display_name,
                        avatar_url,
                        role,
                        status,
                        banned,
                        ban_reason
                        `
                    )
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

            // =========================================
            // BAN
            // =========================================

            if (
                profile.banned === true
            ) {

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

            // =========================================
            // PRESENCE
            // =========================================

            try {

                await updateOnlinePresence();

            } catch (error) {

                console.warn(
                    "Presence unavailable:",
                    error
                );
            }

            // =========================================
            // CHAT
            // =========================================

            await loadMessages();

            // =========================================
            // OPTIONAL FEATURES
            // =========================================

            try {

                await loadOnlineUsers();

            } catch (error) {

                console.warn(
                    "Online users unavailable:",
                    error
                );
            }

            try {

                await loadTypingUsers();

            } catch (error) {

                console.warn(
                    "Typing unavailable:",
                    error
                );
            }

            // =========================================
            // REALTIME
            // =========================================

            enableRealtime();

            enableTypingRealtime();

            enableChatEvents();

            // =========================================
            // UI
            // =========================================

            setupUI();

            uiReady =
                true;

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
    // CHAT ERROR
    // =================================================

    function showChatError(
        message
    ) {

        if (!messagesDiv) return;

        messagesDiv.innerHTML = "";

        const box =
            document.createElement(
                "div"
            );

        box.className =
            "system-message";

        box.style.padding =
            "20px";

        box.style.color =
            "#ff6b9d";

        box.textContent =
            "⚠️ " + message;

        messagesDiv.appendChild(
            box
        );
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
        ) return;

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
        ) return;

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
                "Messages could not be loaded: " +
                error.message
            );

            return;
        }

        messagesDiv.innerHTML =
            "";

        renderedMessageIds.clear();

        if (
            !messages ||
            messages.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "chat-empty";

            empty.innerHTML =
                "💬 No messages yet.<br>Be the first to say hello!";

            messagesDiv.appendChild(
                empty
            );

            return;
        }

        const userIds =
            [
                ...new Set(
                    messages
                        .map(
                            msg =>
                                msg.user_id
                        )
                        .filter(Boolean)
                )
            ];

        let profiles =
            [];

        if (
            userIds.length
        ) {

            const {
                data,
                error:
                    profileError
            } =
                await db
                    .from("profiles")
                    .select(
                        `
                        id,
                        display_name,
                        avatar_url,
                        role
                        `
                    )
                    .in(
                        "id",
                        userIds
                    );

            if (
                profileError
            ) {

                console.warn(
                    "Profile lookup failed:",
                    profileError
                );

            } else {

                profiles =
                    data || [];
            }
        }

        messages.forEach(
            msg => {

                msg.profiles =
                    profiles.find(
                        profile =>
                            profile.id ===
                            msg.user_id
                    ) || null;

                showMessage(
                    msg
                );
            }
        );

        scrollBottom();
    }

    // =================================================
    // SHOW MESSAGE
    // =================================================

    function showMessage(
        msg
    ) {

        if (
            !messagesDiv ||
            !msg
        ) return;

        if (
            msg.id &&
            renderedMessageIds.has(
                msg.id
            )
        ) {

            return;
        }

        if (msg.id) {

            renderedMessageIds.add(
                msg.id
            );
        }

        const profile =
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

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "chat-message";

        // =============================================
        // CLICK
        // =============================================

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

                if (!msg.user_id)
                    return;

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

        // =============================================
        // ROW
        // =============================================

        const row =
            document.createElement(
                "div"
            );

        row.style.display =
            "flex";

        row.style.gap =
            "12px";

        row.style.alignItems =
            "flex-start";

        // =============================================
        // AVATAR
        // =============================================

        const img =
            document.createElement(
                "img"
            );

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

        // =============================================
        // CONTENT
        // =============================================

        const content =
            document.createElement(
                "div"
            );

        content.style.flex =
            "1";

        const userLine =
            document.createElement(
                "div"
            );

        userLine.className =
            "chat-user";

        userLine.textContent =
            name + " ";

        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            "role-badge";

        badge.textContent =
            roleBadge(
                role
            );

        userLine.appendChild(
            badge
        );

        const text =
            document.createElement(
                "div"
            );

        text.className =
            "chat-text";

        text.textContent =
            msg.message ||
            "";

        const time =
            document.createElement(
                "div"
            );

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

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "delete-btn";

            button.textContent =
                "🗑️ Delete";

            button.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    deleteMessage(
                        msg.id
                    );
                }
            );

            content.appendChild(
                button
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
        ) return;

        const text =
            messageInput.value.trim();

        if (!text)
            return;

        if (
            text.length >
            2000
        ) {

            alert(
                "Message is too long. Maximum 2000 characters."
            );

            return;
        }

        if (sendBtn)
            sendBtn.disabled =
                true;

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
                    "❌ SEND ERROR:",
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

            if (sendBtn)
                sendBtn.disabled =
                    false;

            messageInput.focus();
        }
    }

    window.sendMessage =
        sendMessage;

    // =================================================
    // DELETE MESSAGE
    // =================================================

    async function deleteMessage(
        id
    ) {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !id
        ) return;

        if (
            !confirm(
                "Delete this message?"
            )
        ) return;

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

    window.deleteMessage =
        deleteMessage;

    // =================================================
    // REALTIME CHAT
    // =================================================

    function enableRealtime() {

        const db =
            getClient();

        if (!db)
            return;

        if (
            chatChannel
        ) {

            db.removeChannel(
                chatChannel
            );
        }

        chatChannel =
            db
                .channel(
                    "wildstyle-chat-main"
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

                        console.log(
                            "📨 New message",
                            payload.new
                        );

                        const {
                            data:
                                profile
                        } =
                            await db
                                .from("profiles")
                                .select(
                                    `
                                    display_name,
                                    avatar_url,
                                    role
                                    `
                                )
                                .eq(
                                    "id",
                                    payload.new.user_id
                                )
                                .maybeSingle();

                        showMessage({
                            ...payload.new,
                            profiles:
                                profile ||
                                null
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
                    function () {

                        loadMessages();
                    }
                )
                .subscribe(
                    status => {

                        console.log(
                            "📡 CHAT REALTIME:",
                            status
                        );
                    }
                );
    }

    // =================================================
    // SCROLL
    // =================================================

    function scrollBottom() {

        if (!messagesDiv)
            return;

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
        ) return;

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
                                new Date()
                                    .toISOString()
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

            const {
                error
            } =
                await db
                    .from("typing_users")
                    .delete()
                    .eq(
                        "user_id",
                        currentUser.id
                    );

            if (error) {

                console.warn(
                    "Typing delete:",
                    error
                );
            }
        }
    }

    async function loadTypingUsers() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !typingIndicator
        ) return;

        const {
            data,
            error
        } =
            await db
                .from("typing_users")
                .select(
                    `
                    user_id,
                    is_typing,
                    profiles (
                        display_name
                    )
                    `
                )
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
                    user.profiles
                        ?.display_name ||
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

        const db =
            getClient();

        if (!db)
            return;

        if (
            typingChannel
        ) {

            db.removeChannel(
                typingChannel
            );
        }

        typingChannel =
            db
                .channel(
                    "wildstyle-typing-main"
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

        if (!db)
            return;

        if (
            eventsChannel
        ) {

            db.removeChannel(
                eventsChannel
            );
        }

        eventsChannel =
            db
                .channel(
                    "wildstyle-events-main"
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

                        if (!messagesDiv)
                            return;

                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "system-message";

                        div.textContent =
                            payload.new
                                ?.message ||
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
        ) return;

        const {
            data,
            error
        } =
            await db
                .from("online_users")
                .select(
                    `
                    user_id,
                    last_seen,
                    profiles (
                        display_name,
                        avatar_url,
                        status,
                        role
                    )
                    `
                );

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

        (data || [])
            .forEach(
                user => {

                    const lastSeen =
                        new Date(
                            user.last_seen
                        ).getTime();

                    const age =
                        (
                            now -
                            lastSeen
                        ) / 1000;

                    if (
                        age >
                        60
                    ) return;

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
                            profile.status ||
                            "Online"
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
        ) return;

        const {
            data,
            error
        } =
            await db
                .from("profiles")
                .select(
                    `
                    id,
                    display_name,
                    avatar_url,
                    role,
                    status
                    `
                )
                .eq(
                    "id",
                    userId
                )
                .maybeSingle();

        if (error) {

            console.error(
                "Mobile profile:",
                error
            );

            return;
        }

        if (!data)
            return;

        selectedUser =
            data;

        setSafeImage(
            mobileProfileAvatar,
            data.avatar_url
        );

        if (
            mobileProfileName
        ) {

            mobileProfileName.textContent =
                data.display_name ||
                "Member";
        }

        if (
            mobileProfileStatus
        ) {

            const status =
                data.status ||
                "Online";

            mobileProfileStatus.textContent =
                statusIcon(
                    status
                ) +
                status;
        }

        if (
            mobileProfileRole
        ) {

            mobileProfileRole.textContent =
                roleBadge(
                    data.role
                );
        }

        if (
            mobileModerationTools
        ) {

            mobileModerationTools.style.display =
                isOwner()
                    ? "block"
                    : "none";
        }

        const overlay =
            document.getElementById(
                "mobileProfileOverlay"
            );

        if (overlay) {

            overlay.classList.add(
                "show"
            );
        }

        if (
            mobileProfileCard
        ) {

            mobileProfileCard.classList.add(
                "open"
            );
        }
    }

    window.openMobileProfile =
        openMobileProfile;

    function closeMobileProfile() {

        if (
            mobileProfileCard
        ) {

            mobileProfileCard.classList.remove(
                "open"
            );
        }

        if (
            mobileProfileOverlay
        ) {

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
        ) return;

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
        ) return;

        const {
            data,
            error
        } =
            await db
                .from("profiles")
                .select(
                    `
                    id,
                    display_name,
                    avatar_url,
                    role,
                    status,
                    banned,
                    ban_reason
                    `
                )
                .eq(
                    "id",
                    userId
                )
                .maybeSingle();

        if (error) {

            console.error(
                "Owner panel:",
                error
            );

            return;
        }

        if (!data)
            return;

        selectedUser =
            data;

        setSafeImage(
            ownerAvatar,
            data.avatar_url
        );

        if (ownerName)
            ownerName.textContent =
                data.display_name ||
                "Unknown";

        if (ownerRole)
            ownerRole.textContent =
                "Role: " +
                (
                    data.role ||
                    "member"
                );

        if (ownerStatus)
            ownerStatus.textContent =
                "Status: " +
                (
                    data.status ||
                    "Online"
                );

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
    // ROLES
    // =================================================

    async function setRole(
        role
    ) {

        const db =
            getClient();

        if (
            !db ||
            !isOwner()
        ) {

            alert(
                "Only the owner can change roles."
            );

            return;
        }

        if (
            !selectedUser?.id
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
            !selectedUser?.id
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
        ) return;

        const reason =
            prompt(
                "Reason for banning this user?"
            );

        if (
            reason ===
            null
        ) return;

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

        await db
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

    window.banUser =
        banUser;

    // =================================================
    // DELETE USER MESSAGES
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
            !selectedUser?.id
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
        ) return;

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
        ) return;

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

        if (!statusButton)
            return;

        const labels = {
            Online:
                "🟢 Online",

            Away:
                "🟡 Away",

            Busy:
                "🔴 Busy",

            "Be Right Back":
                "🟠 Be Right Back",

            Invisible:
                "⚫ Invisible"
        };

        statusButton.textContent =
            labels[status] ||
            labels.Online;
    }

    // =================================================
    // PRIVATE MESSAGES
    // =================================================

    async function openPrivateChat(
        userId,
        name,
        avatar
    ) {

        if (
            !currentUser ||
            !userId
        ) return;

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

        if (!overlay)
            return;

        const nameEl =
            document.getElementById(
                "privateChatName"
            );

        const avatarEl =
            document.getElementById(
                "privateChatAvatar"
            );

        if (nameEl)
            nameEl.textContent =
                privateChatUser.name;

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

    async function loadPrivateMessages() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) return;

        const box =
            document.getElementById(
                "privateChatMessages"
            );

        if (!box)
            return;

        const {
            data,
            error
        } =
            await db
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
                "Private messages:",
                error
            );

            box.textContent =
                "Unable to load private messages.";

            return;
        }

        box.innerHTML =
            "";

        if (
            !data?.length
        ) {

            box.textContent =
                "💜 No private messages yet.";

            return;
        }

        data.forEach(
            showPrivateMessage
        );

        scrollPrivateMessages();
    }

    function showPrivateMessage(
        msg
    ) {

        const box =
            document.getElementById(
                "privateChatMessages"
            );

        if (
            !box ||
            !msg
        ) return;

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            msg.sender_id ===
            currentUser.id
                ? "private-message mine"
                : "private-message received";

        const bubble =
            document.createElement(
                "div"
            );

        bubble.className =
            "private-message-bubble";

        bubble.textContent =
            msg.message ||
            "";

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

    async function sendPrivateMessage() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) return;

        const input =
            document.getElementById(
                "privateChatInput"
            );

        if (!input)
            return;

        const text =
            input.value.trim();

        if (!text)
            return;

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
                "Private send:",
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

    function enablePrivateRealtime() {

        const db =
            getClient();

        if (
            !db ||
            !currentUser ||
            !privateChatUser
        ) return;

        if (
            privateChatChannel
        ) {

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
                    payload => {

                        const msg =
                            payload.new;

                        const belongs =
                            (
                                msg.sender_id ===
                                privateChatUser.id &&
                                msg.recipient_id ===
                                currentUser.id
                            );

                        if (
                            !belongs
                        ) return;

                        showPrivateMessage(
                            msg
                        );

                        scrollPrivateMessages();
                    }
                )
                .subscribe();
    }

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
            privateChatChannel &&
            db
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

        if (!box)
            return;

        box.scrollTop =
            box.scrollHeight;
    }

    // =================================================
    // UI
    // =================================================

    function setupUI() {

        // =============================================
        // SEND
        // =============================================

        if (sendBtn) {

            sendBtn.addEventListener(
                "click",
                sendMessage
            );
        }

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

                    if (db)
                        await db.auth.signOut();

                    window.location.href =
                        "index.html";
                }
            );
        }

        // =============================================
        // OWNER CLOSE
        // =============================================

        if (
            closeOwnerPanel
        ) {

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
        // OWNER ROLES
        // =============================================

        const roleButtons = [

            [
                "btnMakeDJ",
                "dj"
            ],

            [
                "btnMakeAdmin",
                "admin"
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
            function (
                [id, role]
            ) {

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
        // DELETE
        // =============================================

        const deleteBtn =
            document.getElementById(
                "btnDeleteMessages"
            );

        if (deleteBtn) {

            deleteBtn.addEventListener(
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

        if (
            mobileProfileClose
        ) {

            mobileProfileClose.addEventListener(
                "click",
                closeMobileProfile
            );
        }

        if (
            mobileProfileOverlay
        ) {

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
        // PRIVATE CHAT
        // =============================================

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
        // PRIVATE MESSAGE BUTTONS
        // =============================================

        const desktopPrivate =
            document.getElementById(
                "desktopPrivateMessageBtn"
            );

        if (desktopPrivate) {

            desktopPrivate.addEventListener(
                "click",
                function () {

                    if (
                        selectedUser
                    ) {

                        openPrivateChat(
                            selectedUser.id,
                            selectedUser.display_name,
                            selectedUser.avatar_url
                        );
                    }
                }
            );
        }

        const mobilePrivate =
            document.getElementById(
                "mobilePrivateMessageBtn"
            );

        if (mobilePrivate) {

            mobilePrivate.addEventListener(
                "click",
                function () {

                    if (
                        selectedUser
                    ) {

                        openPrivateChat(
                            selectedUser.id,
                            selectedUser.display_name,
                            selectedUser.avatar_url
                        );
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

            // Your HTML currently contains the emojis
            // as plain text rather than individual spans.
            // Make each emoji clickable.

            const emojiText =
                emojiPicker.textContent.trim();

            emojiPicker.innerHTML =
                "";

            Array.from(
                emojiText
            ).forEach(
                function (emoji) {

                    const span =
                        document.createElement(
                            "span"
                        );

                    span.textContent =
                        emoji;

                    span.style.cursor =
                        "pointer";

                    span.addEventListener(
                        "click",
                        function () {

                            if (
                                messageInput
                            ) {

                                messageInput.value +=
                                    emoji;

                                messageInput.focus();
                            }
                        }
                    );

                    emojiPicker.appendChild(
                        span
                    );
                }
            );
        }
    }

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
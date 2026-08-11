// =====================================================
// Wildstyle Community Authentication
// =====================================================

console.log("Wildstyle auth.js loaded");


// =====================================================
// RESTORE APP SESSION
// =====================================================

async function restoreAppSession() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const isApp =
        params.get("app") === "1";

    const accessToken =
        params.get("access_token");

    const refreshToken =
        params.get("refresh_token");


    // ================================================
    // APP SESSION RECEIVED
    // ================================================

    if (
        isApp &&
        accessToken &&
        refreshToken
    ) {

        console.log(
            "App session tokens received"
        );

        const {
            data,
            error
        } = await client.auth.setSession({

            access_token:
                accessToken,

            refresh_token:
                refreshToken

        });

        if (error) {

            console.error(
                "Could not restore app session:",
                error
            );

            alert(
                "APP LOGIN ERROR\n\n" +
                error.message
            );

            return false;
        }

        if (data.session) {

            console.log(
                "APP SESSION RESTORED"
            );

            // ========================================
            // REMOVE TOKENS FROM ADDRESS BAR
            // ========================================

            window.history.replaceState(
                {},
                document.title,
                "lobby.html"
            );

            return true;
        }
    }


    // ================================================
    // NORMAL SESSION CHECK
    // ================================================

    const {
        data,
        error
    } = await client.auth.getSession();

    if (error) {

        console.error(
            "Session check error:",
            error
        );

        return false;
    }

    if (data.session) {

        console.log(
            "Existing Supabase session found"
        );

        return true;
    }

    return false;
}


// =====================================================
// START AUTH CHECK
// =====================================================

(async function () {

    try {

        const authenticated =
            await restoreAppSession();

        console.log(
            "Authenticated:",
            authenticated
        );

        if (!authenticated) {

            console.warn(
                "No authenticated session"
            );

            window.location.href =
                "index.html";

            return;
        }

        console.log(
            "Wildstyle Community authentication OK"
        );

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        alert(
            "AUTH ERROR\n\n" +
            error.message
        );

    }

})();


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    try {

        const {
            data: { user }
        } = await client.auth.getUser();

        if (user) {

            await client
                .from("online_users")
                .delete()
                .eq(
                    "user_id",
                    user.id
                );

            await client
                .from("chat_events")
                .insert([{
                    message:
                        "👋 " +
                        user.email +
                        " left the chat"
                }]);
        }

        await client.auth.signOut();

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.href =
            "index.html";
    }
}

window.logout = logout;
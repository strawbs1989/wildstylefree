// =====================================================
// Wildstyle Community Authentication
// =====================================================

console.log("Wildstyle auth.js loaded");


// =====================================================
// RESTORE APP / BROWSER SESSION
// =====================================================

async function restoreAppSession() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const accessToken =
        params.get("access_token");

    const refreshToken =
        params.get("refresh_token");


    // =================================================
    // APP SESSION
    // =================================================

    if (accessToken && refreshToken) {

        console.log(
            "Wildstyle App: restoring Supabase session..."
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
                "App session restore failed:",
                error
            );

            throw error;
        }

        if (!data?.session) {

            throw new Error(
                "Supabase did not return a session."
            );
        }

        console.log(
            "Wildstyle App: Supabase session restored."
        );

        // Remove the tokens from the address bar
        window.history.replaceState(
            {},
            document.title,
            "lobby.html"
        );

        return data.session;
    }


    // =================================================
    // NORMAL BROWSER SESSION
    // =================================================

    const {
        data,
        error
    } = await client.auth.getSession();

    if (error) {
        throw error;
    }

    if (!data?.session) {

        throw new Error(
            "No authenticated Supabase session."
        );
    }

    console.log(
        "Wildstyle Browser: Supabase session found."
    );

    return data.session;
}


// =====================================================
// THIS IS THE IMPORTANT PART
// CHAT.JS WILL WAIT FOR THIS
// =====================================================

window.wildstyleAuthReady =
    restoreAppSession();


// =====================================================
// HANDLE AUTH RESULT
// =====================================================

window.wildstyleAuthReady
.then(function(session) {

    console.log(
        "Wildstyle authentication READY:",
        session.user.email
    );

})
.catch(function(error) {

    console.error(
        "Wildstyle authentication failed:",
        error
    );

    // Only redirect after the authentication
    // attempt has completely finished.

    window.location.href =
        "index.html";

});


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
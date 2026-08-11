// =====================================================
// Wildstyle Community Authentication
// =====================================================

console.log("WILDSTYLE AUTH.JS LOADED");

// =====================================================
// CHECK LOGIN
// =====================================================

(async function checkLogin() {

    try {

        console.log("Checking Supabase session...");

        // Give Supabase/WebView a moment to restore
        // the persisted session.
        await new Promise(resolve => setTimeout(resolve, 500));

        const {
            data,
            error
        } = await client.auth.getSession();

        if (error) {

            console.error(
                "Supabase getSession error:",
                error
            );

            alert(
                "SUPABASE SESSION ERROR\n\n" +
                error.message
            );

            return;
        }

        const session = data?.session;

        console.log(
            "Supabase session:",
            session ? "FOUND" : "NOT FOUND"
        );

        // =================================================
        // SESSION FOUND
        // =================================================

        if (session) {

            console.log(
                "Wildstyle user authenticated:",
                session.user.email
            );

            return;
        }

        // =================================================
        // NO SESSION
        // =================================================

        console.warn(
            "No Supabase session found."
        );

        // -------------------------------------------------
        // APP TEST
        // -------------------------------------------------

        const isApp =
            /WebView|wv|; wv\)/i.test(
                navigator.userAgent
            );

        if (isApp) {

            alert(
                "APP TEST: NO SUPABASE SESSION"
            );

            return;
        }

        // =================================================
        // NORMAL BROWSER
        // =================================================

        window.location.href = "index.html";

    } catch (error) {

        console.error(
            "AUTH CHECK ERROR:",
            error
        );

        alert(
            "AUTH CHECK ERROR\n\n" +
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
                .eq("user_id", user.id);

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
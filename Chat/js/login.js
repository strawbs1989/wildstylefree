// =====================================================
// Wildstyle Community Login
// =====================================================

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }

    const { data, error } =
        await client.auth.signInWithPassword({

            email,
            password

        });

    if (error) {

        message.textContent =
            error.message;

        return;
    }

    // ================================================
    // LOGIN SUCCESSFUL
    // ================================================

    const session = data.session;

    if (!session) {

        message.textContent =
            "Login succeeded but no session was returned.";

        return;
    }

    message.style.color = "#00ff99";
    message.textContent =
        "Login successful...";

    // ================================================
    // DETECT MIT APP INVENTOR WEBVIEW
    // ================================================

    const userAgent =
        navigator.userAgent || "";

    const isApp =
        /wv|WebView|; wv\)/i.test(userAgent);

    // ================================================
    // APP
    // ================================================

    if (isApp) {

        const accessToken =
            encodeURIComponent(
                session.access_token
            );

        const refreshToken =
            encodeURIComponent(
                session.refresh_token
            );

        window.location.href =
            "lobby.html?app=1" +
            "&access_token=" +
            accessToken +
            "&refresh_token=" +
            refreshToken;

        return;
    }

    // ================================================
    // NORMAL BROWSER
    // ================================================

    setTimeout(() => {

        window.location.href =
            "lobby.html";

    }, 500);

});
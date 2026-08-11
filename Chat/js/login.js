// =====================================================
// Wildstyle Community Login
// =====================================================

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        message.textContent = "Please enter your email and password.";
        return;
    }

    // Disable login button while processing
    const loginButton = loginForm.querySelector("button[type='submit']");

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }

    try {

        // ==========================================
        // SIGN IN
        // ==========================================

        const { data, error } =
            await client.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        // ==========================================
        // CONFIRM SESSION EXISTS
        // ==========================================

        const {
            data: sessionData,
            error: sessionError
        } = await client.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData || !sessionData.session) {

            message.style.color = "#ff4444";
            message.textContent =
                "Login succeeded, but the session could not be saved.";

            console.error(
                "NO SESSION AFTER LOGIN",
                sessionData
            );

            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = "Login";
            }

            return;
        }

        // ==========================================
        // SESSION CONFIRMED
        // ==========================================

        console.log(
            "Wildstyle login session confirmed",
            sessionData.session.user.id
        );

        message.style.color = "#00ff99";
        message.textContent = "Login successful...";

        // Give Supabase a moment to finish its
        // persistence operation before navigation.
        await new Promise(resolve => setTimeout(resolve, 300));

        // ==========================================
        // GO TO CHAT
        // ==========================================

        window.location.replace("lobby.html");

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        message.style.color = "#ff4444";
        message.textContent =
            error.message || "Login failed.";

        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }

    }

});
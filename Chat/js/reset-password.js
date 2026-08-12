// =====================================================
// Wildstyle Community - Reset Password
// =====================================================

console.log("Wildstyle reset-password.js loaded");

const resetForm = document.getElementById("resetForm");
const message = document.getElementById("message");

let recoveryReady = false;


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(text, color = "") {

    message.textContent = text;
    message.style.color = color;

}


// =====================================================
// RESTORE PASSWORD RECOVERY SESSION
// =====================================================

async function restoreRecoverySession() {

    console.log("Checking password recovery session...");

    try {

        // -------------------------------------------------
        // SUPABASE PASSWORD RESET LINKS USING HASH TOKENS
        // -------------------------------------------------

        const hash =
            window.location.hash.substring(1);

        const hashParams =
            new URLSearchParams(hash);

        const accessToken =
            hashParams.get("access_token");

        const refreshToken =
            hashParams.get("refresh_token");

        const type =
            hashParams.get("type");


        if (
            accessToken &&
            refreshToken
        ) {

            console.log(
                "Recovery tokens found in URL"
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
                    "Recovery session error:",
                    error
                );

                showMessage(
                    "Password reset link is invalid or expired.",
                    "#ff5555"
                );

                return false;
            }


            if (data.session) {

                console.log(
                    "PASSWORD RECOVERY SESSION RESTORED"
                );

                recoveryReady = true;


                // Remove tokens from address bar
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );


                showMessage(
                    "You can now choose your new password.",
                    "#00ff99"
                );

                return true;
            }
        }


        // -------------------------------------------------
        // PKCE STYLE RESET LINK
        // -------------------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );

        const code =
            params.get("code");


        if (code) {

            console.log(
                "Recovery code found in URL"
            );


            const {
                data,
                error
            } =
                await client.auth.exchangeCodeForSession(
                    code
                );


            if (error) {

                console.error(
                    "Recovery code error:",
                    error
                );

                showMessage(
                    "Password reset link is invalid or expired.",
                    "#ff5555"
                );

                return false;
            }


            if (data.session) {

                console.log(
                    "PASSWORD RECOVERY SESSION RESTORED"
                );

                recoveryReady = true;


                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );


                showMessage(
                    "You can now choose your new password.",
                    "#00ff99"
                );

                return true;
            }
        }


        // -------------------------------------------------
        // CHECK EXISTING SESSION
        // -------------------------------------------------

        const {
            data,
            error
        } = await client.auth.getSession();


        if (error) {

            console.error(
                "Session check error:",
                error
            );

            showMessage(
                "Unable to check password reset session.",
                "#ff5555"
            );

            return false;
        }


        if (data.session) {

            console.log(
                "Existing recovery session found"
            );

            recoveryReady = true;

            showMessage(
                "You can now choose your new password.",
                "#00ff99"
            );

            return true;
        }


        // -------------------------------------------------
        // NO SESSION
        // -------------------------------------------------

        console.warn(
            "No password recovery session found"
        );

        showMessage(
            "Password reset link is missing or has expired.",
            "#ff5555"
        );

        return false;

    } catch (error) {

        console.error(
            "Recovery error:",
            error
        );

        showMessage(
            "Password reset session could not be restored.",
            "#ff5555"
        );

        return false;
    }
}


// =====================================================
// CHANGE PASSWORD
// =====================================================

resetForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        if (!recoveryReady) {

            showMessage(
                "Auth session missing! Please use the latest reset email link.",
                "#ff5555"
            );

            return;
        }


        const password =
            document
                .getElementById("password")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        // -------------------------------------------------
        // VALIDATE PASSWORD
        // -------------------------------------------------

        if (!password || !confirmPassword) {

            showMessage(
                "Please enter your new password.",
                "#ff5555"
            );

            return;
        }


        if (password.length < 6) {

            showMessage(
                "Password must be at least 6 characters.",
                "#ff5555"
            );

            return;
        }


        if (password !== confirmPassword) {

            showMessage(
                "Passwords do not match.",
                "#ff5555"
            );

            return;
        }


        // -------------------------------------------------
        // UPDATE PASSWORD
        // -------------------------------------------------

        showMessage(
            "Changing password...",
            ""
        );


        const {
            error
        } = await client.auth.updateUser({

            password: password

        });


        if (error) {

            console.error(
                "Password update error:",
                error
            );

            showMessage(
                error.message,
                "#ff5555"
            );

            return;
        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        console.log(
            "PASSWORD UPDATED SUCCESSFULLY"
        );


        showMessage(
            "Password changed successfully! Redirecting to login...",
            "#00ff99"
        );


        resetForm.reset();


        setTimeout(
            async function () {

                await client.auth.signOut();

                window.location.href =
                    "index.html";

            },
            2000
        );

    }
);


// =====================================================
// START
// =====================================================

restoreRecoverySession();
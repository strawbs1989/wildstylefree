// =====================================================
// Wildstyle Community - Forgot Password
// =====================================================

console.log("Wildstyle forgot password loaded");


const forgotForm =
    document.getElementById("forgotForm");

const message =
    document.getElementById("message");


forgotForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();

        message.textContent = "";
        message.style.color = "";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        if (!email) {

            message.textContent =
                "Please enter your email address.";

            return;
        }


        // =================================================
        // SEND PASSWORD RESET EMAIL
        // =================================================

        message.textContent =
            "Sending reset link...";


        const {
            error
        } =
            await client.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        window.location.origin +
                        "/Chat/reset-password.html"
                }
            );


        if (error) {

            console.error(
                "Password reset error:",
                error
            );

            message.style.color =
                "#ff5555";

            message.textContent =
                error.message;

            return;
        }


        // =================================================
        // SUCCESS
        // =================================================

        message.style.color =
            "#00ff99";

        message.textContent =
            "Reset link sent! Check your email.";


        forgotForm.reset();

    }
);
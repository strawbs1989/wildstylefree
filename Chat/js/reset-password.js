// =====================================================
// Wildstyle Community - Reset Password
// =====================================================

console.log(
    "Wildstyle reset password loaded"
);


const resetForm =
    document.getElementById("resetForm");

const message =
    document.getElementById("message");


resetForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();


        const password =
            document
                .getElementById("password")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;


        message.textContent = "";


        // =================================================
        // CHECK PASSWORDS
        // =================================================

        if (password !== confirmPassword) {

            message.style.color =
                "#ff5555";

            message.textContent =
                "The passwords do not match.";

            return;
        }


        if (password.length < 6) {

            message.style.color =
                "#ff5555";

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        // =================================================
        // UPDATE PASSWORD
        // =================================================

        message.style.color = "";

        message.textContent =
            "Updating password...";


        const {
            error
        } =
            await client.auth.updateUser({

                password: password

            });


        if (error) {

            console.error(
                "Password update error:",
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
            "Password changed successfully!";


        setTimeout(
            function () {

                window.location.href =
                    "index.html";

            },
            2000
        );

    }
);
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

    const { data, error } = await client.auth.signInWithPassword({

        email,
        password

    });

    if (error) {

        message.textContent = error.message;
        return;

    }

    message.style.color = "#00ff99";
    message.textContent = "Login successful...";

    setTimeout(() => {

        window.location.href = "lobby.html";

    }, 1000);

});

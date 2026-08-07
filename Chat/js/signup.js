async function signup() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await client.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: "https://wildstyle.vip/Chat/lobby.html"
        }
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("Account created! Check your email.");
}
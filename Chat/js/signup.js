async function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await client.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    alert("Account created! Check your email.");
}

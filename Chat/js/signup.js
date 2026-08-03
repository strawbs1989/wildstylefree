async function signup() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const result = await client.auth.signUp({
        email,
        password
    });

    alert(JSON.stringify(result, null, 2));

}

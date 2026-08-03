async function signup() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const { data, error } = await client.auth.signUp({
            email,
            password
        });

        if (error) {
            alert(error.message);
            console.error(error);
            return;
        }

        alert("SUCCESS\n\n" + JSON.stringify(data, null, 2));

    } catch (err) {
        alert("ERROR\n\n" + (err.message || JSON.stringify(err)));
        console.error(err);
    }
}

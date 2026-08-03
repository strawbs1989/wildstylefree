async function signup() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const { data, error } = await supabase.auth.signUp({

            email: email,
            password: password

        });

        if (error) {

            alert(error.message);
            return;

        }

        alert("Success! Check your email to verify your account.");

        window.location.href = "index.html";

    } catch (err) {

        alert(err.message);

    }

}

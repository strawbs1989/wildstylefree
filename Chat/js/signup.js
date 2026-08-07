async function signup() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: "https://wildstyle.vip/Chat/lobby.html"
        }
    });

    if (error) {
        alert(error.message);
        console.error(error);
        return;
    }

    // Create profile automatically
    if (data.user) {

        const { error: profileError } = await client
            .from("profiles")
            .insert([{
                id: data.user.id,
                email: data.user.email,
                display_name: email.split("@")[0],
                role: "member",
                status: "Online",
                avatar_url: "/images/default-avatar.png"
            }]);

        if (profileError) {
            console.error(profileError);
        }

    }

    alert("Account created! Check your email.");

}
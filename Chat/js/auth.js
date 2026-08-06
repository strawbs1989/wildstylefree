// ==========================================
// CHECK LOGIN
// ==========================================

(async () => {

    const {
        data: { session }
    } = await client.auth.getSession();

    if (!session) {

        window.location.href = "index.html";
        return;

    }

})();


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    const {
        data: { user }
    } = await client.auth.getUser();

    if (user) {

        await client
            .from("online_users")
            .delete()
            .eq("user_id", user.id);

        await client
            .from("chat_events")
            .insert([{
                message: "👋 " + user.email + " left the chat"
            }]);

    }

    await client.auth.signOut();

    window.location.href = "index.html";

}

window.logout = logout;
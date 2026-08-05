// Check if user is logged in
(async () => {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "index.html";
        return;
    }

})();

// Logout
async function logout() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (user) {

        await supabase
            .from("online_users")
            .delete()
            .eq("user_id", user.id);

    }
    await supabase
.from("chat_events")
.insert([{
    message: "👋 " + user.email + " left the chat"
}]);

    await supabase.auth.signOut();

    window.location.href = "index.html";

}

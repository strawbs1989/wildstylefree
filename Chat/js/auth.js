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

    await supabase.auth.signOut();

    window.location.href = "index.html";

}

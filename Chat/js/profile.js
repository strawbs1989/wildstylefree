// =======================================
// Wildstyle Community Profile
// =======================================

const displayName = document.getElementById("displayName");
const avatar = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");
const saveBtn = document.getElementById("saveBtn");

let currentUser;

// Load profile
(async function () {

    const { data: { user } } = await client.auth.getUser();

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    currentUser = user;

    const { data } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (data) {
        document.getElementById("status").value =
    data.status || "Online";

        displayName.value = data.display_name || "";

        if (data.avatar_url) {

            avatarPreview.src = data.avatar_url;

        }

    }

})();

// Preview image
avatar.addEventListener("change", () => {

    const file = avatar.files[0];

    if (!file) return;

    avatarPreview.src = URL.createObjectURL(file);

});

// Save profile
saveBtn.addEventListener("click", async () => {

    let avatarUrl = avatarPreview.src;

    const file = avatar.files[0];

    // Upload avatar if selected
    if (file) {

        const extension = file.name.split(".").pop();

        const fileName = currentUser.id + "." + extension;

        const { error } = await client.storage

            .from("avatars")

            .upload(fileName, file, {

                upsert: true

            });

        if (error) {

            alert(error.message);
            return;

        }

        const { data } = client.storage

            .from("avatars")

            .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;

    }

    // Update profile
    const { error } = await client

        .from("profiles")

        .update({

    display_name: displayName.value,

    avatar_url: avatarUrl,

    status: document.getElementById("status").value

})

        .eq("id", currentUser.id);

    if (error) {

        alert(error.message);
        return;

    }

    alert("Profile updated!");

});

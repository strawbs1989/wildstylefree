// =======================================
// Wildstyle Community Profile
// =======================================

const displayName =
    document.getElementById("displayName");

const avatar =
    document.getElementById("avatar");

const avatarPreview =
    document.getElementById("avatarPreview");

const saveBtn =
    document.getElementById("saveBtn");

const statusInput =
    document.getElementById("status");

let currentUser = null;
let viewedUserId = null;
let isOwnProfile = true;


// =======================================
// LOAD PROFILE
// =======================================

(async function () {

    const {
        data: { user },
        error: authError
    } = await client.auth.getUser();


    if (authError || !user) {

        window.location.href = "index.html";

        return;
    }


    currentUser = user;


    // ===================================
    // CHECK URL FOR PROFILE ID
    // ===================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedId =
        params.get("id");


    /*
       If there is no ?id=
       show the logged-in user's profile.

       If there is ?id=
       show that member's profile.
    */

    viewedUserId =
        requestedId || currentUser.id;


    isOwnProfile =
        viewedUserId === currentUser.id;


    console.log(
        "Viewing profile:",
        viewedUserId
    );

    console.log(
        "Own profile:",
        isOwnProfile
    );


    // ===================================
    // LOAD PROFILE FROM SUPABASE
    // ===================================

    const {
        data,
        error
    } = await client

        .from("profiles")

        .select("*")

        .eq(
            "id",
            viewedUserId
        )

        .single();


    if (error) {

        console.error(
            "Profile load error:",
            error
        );

        alert(
            "Could not load this profile."
        );

        return;
    }


    if (!data) {

        alert(
            "Profile not found."
        );

        return;
    }


    // ===================================
    // DISPLAY PROFILE
    // ===================================

    if (displayName) {

        displayName.value =
            data.display_name || "Member";

    }


    if (statusInput) {

        statusInput.value =
            data.status || "Online";

    }


    if (data.avatar_url &&
        avatarPreview) {

        avatarPreview.src =
            data.avatar_url;

    }


    // ===================================
    // OTHER USER = VIEW ONLY
    // ===================================

    if (!isOwnProfile) {

        setupViewOnlyProfile(data);

    }


})();


// =======================================
// VIEW-ONLY PROFILE
// =======================================

function setupViewOnlyProfile(profile) {

    console.log(
        "Setting profile to view-only mode"
    );


    // -----------------------------------
    // Disable editing
    // -----------------------------------

    if (displayName) {

        displayName.disabled = true;

        displayName.readOnly = true;

    }


    if (statusInput) {

        statusInput.disabled = true;

    }


    if (avatar) {

        avatar.disabled = true;

    }


    // -----------------------------------
    // Hide Save button
    // -----------------------------------

    if (saveBtn) {

        saveBtn.style.display = "none";

    }


    // -----------------------------------
    // Add VIEW PROFILE heading
    // -----------------------------------

    const heading =
        document.querySelector(
            "h1, h2"
        );


    if (heading) {

        heading.textContent =
            "👤 Member Profile";

    }


    // -----------------------------------
    // Show role
    // -----------------------------------

    let roleElement =
        document.getElementById(
            "profileRole"
        );


    if (!roleElement) {

        roleElement =
            document.createElement(
                "div"
            );

        roleElement.id =
            "profileRole";

        roleElement.style.marginTop =
            "15px";

        roleElement.style.fontWeight =
            "700";

        roleElement.style.fontSize =
            "16px";

        /*
           Put role underneath the
           status field.
        */

        if (statusInput &&
            statusInput.parentElement) {

            statusInput
                .parentElement
                .appendChild(
                    roleElement
                );

        } else if (displayName &&
                   displayName.parentElement) {

            displayName
                .parentElement
                .appendChild(
                    roleElement
                );

        }

    }


    const role =
        profile.role || "member";


    const roleNames = {

        owner: "👑 Owner",

        admin: "🛡️ Admin",

        dj: "🎧 DJ",

        vip: "⭐ VIP",

        member: "👤 Member"

    };


    roleElement.textContent =
        "Role: " +
        (
            roleNames[role] ||
            "👤 Member"
        );


    // -----------------------------------
    // Add back button
    // -----------------------------------

    let backButton =
        document.getElementById(
            "profileBackBtn"
        );


    if (!backButton) {

        backButton =
            document.createElement(
                "button"
            );

        backButton.id =
            "profileBackBtn";

        backButton.type =
            "button";

        backButton.textContent =
            "← Back to Community Chat";


        backButton.style.display =
            "block";

        backButton.style.width =
            "100%";

        backButton.style.marginTop =
            "20px";

        backButton.style.padding =
            "14px 18px";

        backButton.style.border =
            "none";

        backButton.style.borderRadius =
            "14px";

        backButton.style.background =
            "linear-gradient(135deg,#7c3aed,#9333ea)";

        backButton.style.color =
            "#ffffff";

        backButton.style.fontSize =
            "16px";

        backButton.style.fontWeight =
            "700";

        backButton.style.cursor =
            "pointer";


        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "lobby.html";

            }
        );


        const container =
            saveBtn?.parentElement ||
            displayName?.parentElement;


        if (container) {

            container.appendChild(
                backButton
            );

        }

    }

}


// =======================================
// PREVIEW IMAGE
// =======================================

if (avatar) {

    avatar.addEventListener(
        "change",
        () => {

            const file =
                avatar.files[0];


            if (!file) return;


            if (avatarPreview) {

                avatarPreview.src =
                    URL.createObjectURL(
                        file
                    );

            }

        }
    );

}


// =======================================
// SAVE PROFILE
// =======================================

if (saveBtn) {

    saveBtn.addEventListener(
        "click",
        async () => {

            /*
               Extra safety:

               NEVER allow this function
               to update another user's
               profile.
            */

            if (!currentUser ||
                !isOwnProfile) {

                alert(
                    "You cannot edit another member's profile."
                );

                return;
            }


            let avatarUrl =
                avatarPreview?.src || "";


            const file =
                avatar?.files?.[0];


            // ---------------------------
            // Upload avatar
            // ---------------------------

            if (file) {

                const extension =
                    file.name
                        .split(".")
                        .pop();


                const fileName =
                    currentUser.id +
                    "." +
                    extension;


                const {
                    error
                } = await client.storage

                    .from("avatars")

                    .upload(
                        fileName,
                        file,
                        {
                            upsert: true
                        }
                    );


                if (error) {

                    alert(
                        error.message
                    );

                    console.error(
                        error
                    );

                    return;
                }


                const {
                    data
                } = client.storage

                    .from("avatars")

                    .getPublicUrl(
                        fileName
                    );


                avatarUrl =
                    data.publicUrl;

            }


            // ---------------------------
            // Update own profile
            // ---------------------------

            const {
                error
            } = await client

                .from("profiles")

                .update({

                    display_name:
                        displayName.value,

                    avatar_url:
                        avatarUrl,

                    status:
                        statusInput.value

                })

                .eq(
                    "id",
                    currentUser.id
                );


            if (error) {

                alert(
                    error.message
                );

                console.error(
                    error
                );

                return;
            }


            alert(
                "Profile updated!"
            );

        }
    );

}
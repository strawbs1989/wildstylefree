const API_URL = "https://script.google.com/macros/s/AKfycbyWFHpE9pO2Bc-PjLTumzuKmBrwbRKZWHu1vVrxdJQxF_uyO32WMLCsXeXLJuCpuwI/exec";

/* Load latest approved spotlight */

async function loadSpotlight() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        document.getElementById("spotlightName").textContent = data.listener;
        document.getElementById("spotlightReason").textContent = data.reason;

        document.getElementById("spotlightBy").textContent =
            data.nominatedBy
                ? "Nominated by " + data.nominatedBy
                : "";

    } catch (err) {

        console.error(err);

    }

}

/* Submit nomination */

document.getElementById("submitNomination").addEventListener("click", async () => {

    const listener =
        document.getElementById("nomineeName").value.trim();

    const reason =
        document.getElementById("nomineeReason").value.trim();

    const nominatedBy =
        document.getElementById("nominatedBy").value.trim() || "Anonymous";

    if (!listener || !reason) {

        alert("Please complete all required fields.");

        return;

    }

    try {

        await fetch(API_URL, {

            method: "POST",

            headers: {

                "Content-Type": "text/plain;charset=utf-8"

            },

            body: JSON.stringify({

                listener,
                reason,
                nominatedBy

            })

        });

        alert("🎉 Thank you! Your nomination has been submitted for review.");

        document.getElementById("nomineeName").value = "";
        document.getElementById("nomineeReason").value = "";
        document.getElementById("nominatedBy").value = "";

    } catch (err) {

        console.error(err);

        alert("Unable to submit nomination.");

    }

});

loadSpotlight();

/* Refresh every 30 seconds */

setInterval(loadSpotlight, 30000);
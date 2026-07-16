const API_URL = "https://script.google.com/macros/s/AKfycbwSCx9q3m-S7yVK35ivdhZcq3L8KPqDQXso8Ut0Ip7RricdQvMeTG3t30nDTA20KDY/exec";

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

    const listener = document.getElementById("nomineeName").value.trim();
    const reason = document.getElementById("nomineeReason").value.trim();
    const nominatedBy = document.getElementById("nominatedBy").value.trim() || "Anonymous";

    if (!listener || !reason) {
        alert("Please complete all required fields.");
        return;
    }

    const form = new URLSearchParams();
    form.append("listener", listener);
    form.append("reason", reason);
    form.append("nominatedBy", nominatedBy);

    try {

        const response = await fetch(API_URL, {
            method: "POST",
            body: form
        });

        const text = await response.text();
        console.log(text);

        alert("🎉 Thank you! Your nomination has been submitted.");

        document.getElementById("nomineeName").value = "";
        document.getElementById("nomineeReason").value = "";
        document.getElementById("nominatedBy").value = "";

    } catch (err) {
        console.error(err);
        alert("Submission failed.");
    }

});
loadSpotlight();

/* Refresh every 30 seconds */

setInterval(loadSpotlight, 30000);
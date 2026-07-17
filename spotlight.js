const API_URL = "const API_URL = "https://script.google.com/macros/s/AKfycbzE54N_JaeEvGO6A1Q0t2VI1oAY1_FpTnMiyO-qabzL0op1QS4p4nF4tdKh2OalWw/exec";

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

loadSpotlight();

/* Refresh every 30 seconds */

setInterval(loadSpotlight, 30000);

window.addEventListener("message", function (event) {

    if (event.data === "submitted") {

        alert("🎉 Thank you! Your nomination has been submitted.");

        document.getElementById("nominationForm").reset();

    }

});
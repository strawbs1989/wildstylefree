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

loadSpotlight();

/* Refresh every 30 seconds */

setInterval(loadSpotlight, 30000);
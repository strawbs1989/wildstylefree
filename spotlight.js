const submitBtn = document.getElementById("submitNomination");

submitBtn.addEventListener("click", () => {

    const nominee =
        document.getElementById("nomineeName").value.trim();

    const reason =
        document.getElementById("nomineeReason").value.trim();

    const by =
        document.getElementById("nominatedBy").value.trim() || "Anonymous";

    if (!nominee || !reason) {
        alert("Please enter a listener name and reason.");
        return;
    }

    document.getElementById("spotlightName").textContent = nominee;

    document.getElementById("spotlightReason").textContent = reason;

    document.getElementById("spotlightBy").textContent =
        "Nominated by " + by;

    document.getElementById("nomineeName").value = "";
    document.getElementById("nomineeReason").value = "";
    document.getElementById("nominatedBy").value = "";

});
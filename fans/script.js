console.log("✅ script.js is running");

console.log("SCRIPT.JS IS RUNNING");

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("shoutoutForm");
  if (!form) {
    console.log("Form not found");
    return;
  }

  console.log("Form found, attaching listener");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("Form submitted");
  });
});



/* Load Shoutouts */
async function loadShoutouts() {
  const sheetId = "1wib6kC8WqtqQ4x8VhEYMNSMR5ArbB_HMG4ac9nM4hbQ";
  const url = `https://opensheet.elk.sh/${sheetId}/shoutouts`;

  const wall = document.querySelector(".shoutout-wall");
  if (!wall) return;

  const shoutouts = await fetch(url).then(r => r.json());

  wall.innerHTML = "";

  shoutouts.reverse().forEach(s => {
    const div = document.createElement("div");
    div.className = "shoutout glass";
    div.innerHTML = `
      <strong>${s.name}</strong><br>
      ${s.message}
    `;
    wall.appendChild(div);
  });
}

if (document.querySelector(".shoutout-wall")) {
  loadShoutouts();
}

/* Shoutout Form */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("shoutoutForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();

    const payload = { name, message };

    await fetch("https://script.google.com/macros/s/AKfycbzIb9JKD2ySALMmtFzXru372nSQhpuI3XJq6034jZL3nCqomvvLRVzL06zgRoGbCwk/exec", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    document.getElementById("successMessage").style.display = "block";
    form.reset();
  });
});

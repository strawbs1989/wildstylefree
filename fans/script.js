/* Load Shoutouts */

async function loadShoutouts() {
  const sheetId = "1wib6kC8WqtqQ4x8VhEYMNSMR5ArbB_HMG4ac9nM4hbQ";
  const url = `https://opensheet.elk.sh/${sheetId}/shoutouts`;

  const shoutouts = await fetch(url).then(r => r.json());
  const wall = document.querySelector(".shoutout-wall");

  if (!wall) return; // prevent crash

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

document.getElementById("shoutoutForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  const payload = { name, message };

  await fetch("https://script.google.com/macros/s/AKfycbw6_N7VJFsOJAuzlTKgpuHLCsR2aJ1iAZAOghP09UeGMepvCyE6G0STLCNQbHzrAQE/exec", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" }
  });

  document.getElementById("successMessage").style.display = "block";
  this.reset();
});

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

    await fetch("https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjpoQCAr-Z_iNriYNklR7QD3N0AxH4NQx1chzpbTM4uS0_nLp72CXpW7tz8JFMDlZYZe7rYgWK8_lP4L9Gdt6BXQKPWd32PwF4VGuzIf046u2wnwqjtzGlrIEHOR1N8PQJD1hhnxQgDukC9miTylefF2c1bWcjflezeGnX3LBduCFla9tT2R8sDRW0UF1ykWDcmYgve-p_hPS1-nTr_w0eiVHoFeNrmty5gFOivHJANQHOnDUIw9KaLifpXJfBrLDQLE-mgmG4dYEsWFDgKazv4VyTVgQ&lib=MBAZJIjA9__nHr0MQ5yrqTuaMJ5Q-zlzu", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    document.getElementById("successMessage").style.display = "block";
    form.reset();
  });
});

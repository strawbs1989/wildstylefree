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

    const formData = new URLSearchParams();
formData.append("name", name);
formData.append("message", message);

await fetch("https://script.google.com/macros/s/AKfycbxmecjaERyDs41eEpk39m4LemMSu3KIWohiasENGidQ30XjFPeyU9Uxm33exHInreU/exec", {
  method: "POST",
  body: formData
});


    document.getElementById("successMessage").style.display = "block";
    form.reset();
  });
});

/* Feed */

async function loadShoutouts() {
  const res = await fetch("https://wildstyle.vip/fans/");
  const shoutouts = await res.json();

  const list = document.getElementById("shoutoutsList");
  list.innerHTML = "";

  shoutouts.reverse().forEach(s => {
    const item = document.createElement("article");
    item.className = "shoutout";

    item.innerHTML = `
      <div class="shoutout-avatar"></div>
      <div class="shoutout-body">
        <div class="shoutout-user">@${s.name}</div>
        <div class="shoutout-text">${s.message}</div>
        <div class="shoutout-meta">Text · just now</div>
      </div>
      <div class="shoutout-reactions">
        <span>🔥 0</span>
      </div>
    `;

    list.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", loadShoutouts);


/* Upload Moments */ 

document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("imageUpload").click();
});

/* AppScript */

document.getElementById("imageUpload").addEventListener("change", function () {
  const file = this.files[0];
  const reader = new FileReader();

  reader.onload = async function () {
    const base64 = reader.result.split(",")[1];

    const formData = new URLSearchParams();
    formData.append("file", base64);
    formData.append("filename", file.name);

    const res = await fetch("https://script.google.com/macros/s/AKfycbz58u8ZQSASTlS4i-KSQzCnXOYz9084hSqhv-vqk152lGmD2AvyOwDhz1gl-8ghBwkW/exec", {
      method: "POST",
      body: formData
    });

    const imageUrl = await res.text();
    addImageToGallery(imageUrl);
  };

  reader.readAsDataURL(file);
});



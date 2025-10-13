const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzDtgWjFCODgajdvOacEk7c3b7Ik15iezKSenDERQJ6H1YCsM22oQojQphtE-xNcfDX/exec"; // replace with your URL

async function fetchShoutouts() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    const list = document.getElementById("shoutoutList");
    list.innerHTML = "";

    data.reverse().forEach(item => {
      const div = document.createElement("div");
      div.className = "shoutout";
      div.innerHTML = `
        <p>${item.message}</p>
        <span>— ${item.name || "Anonymous"}${item.location ? " (" + item.location + ")" : ""}</span>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("shoutoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();
  const message = document.getElementById("message").value.trim();
  if (!message) return;

  await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ name, location, message }),
    headers: { "Content-Type": "application/json" },
  });

  document.getElementById("shoutoutForm").reset();
  fetchShoutouts(); // refresh list immediately
});

fetchShoutouts();
setInterval(fetchShoutouts, 10000); // refresh every 10s

const SHOUTOUTS_API = "https://script.google.com/macros/s/AKfycbzDtgWjFCODgajdvOacEk7c3b7Ik15iezKSenDERQJ6H1YCsM22oQojQphtE-xNcfDX/exec";

async function updateTicker() {
  try {
    const res = await fetch(SHOUTOUTS_API);
    const data = await res.json();

    // Keep only last 10 shoutouts
    const latest = data.slice(-10);
    const text = latest
      .map(item => `🎵 ${item.name || "Anonymous"}: ${item.message}`)
      .join("  •  ");

    const ticker = document.getElementById("tickerContent");
    ticker.innerText = text;
  } catch (err) {
    console.error("Ticker error:", err);
  }
}

updateTicker();
setInterval(updateTicker, 20000); // refresh every 20 seconds
// Who's Listening (auto from CSV)
async function fetchWhoListening() {
  try {
    const res = await fetch("/test1/real_time_sessions.csv");
    const csvText = await res.text();

    const rows = csvText.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const countryIdx = headers.indexOf("country");
    const cityIdx = headers.indexOf("city");
    const countIdx = headers.indexOf("active_session_count");

    let total = 0;
    const locations = {};

    dataRows.forEach(r => {
      const country = r[countryIdx];
      const city = r[cityIdx];
      const count = parseInt(r[countIdx] || "0", 10);
      total += count;

      const key = `${country} (${city})`;
      locations[key] = (locations[key] || 0) + count;
    });

    const box = document.getElementById("whosListening");
if (!box) return; // stops the script if the element isn't found
box.textContent = "..." // existing code


    const top = Object.entries(locations)
      .sort((a,b) => b[1] - a[1])
      .slice(0,5);

    const ul = document.getElementById("listenerLocations");
    ul.innerHTML = "";
    top.forEach(([loc, count]) => {
      const li = document.createElement("li");
      li.textContent = `${loc} — ${count}`;
      ul.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading Who's Listening CSV:", err);
  }
}
fetchWhoListening();
setInterval(fetchWhoListening, 60000);

// Accessibility: stop audio when navigating away
window.addEventListener('pagehide', () => {
  audio.pause();
  if (playBtn) playBtn.textContent = 'Play';
});
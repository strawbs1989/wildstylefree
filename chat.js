async function updateLiveListeners() {
  try {
    const response = await fetch("realtime.csv?" + Date.now());
    const text = await response.text();

    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");

    const activeIndex = headers.indexOf("active_session_count");

    let total = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      total += Number(cols[activeIndex]) || 0;
    }

    document.getElementById("live-listener-value").textContent = total;
  } catch (err) {
    console.error(err);
    document.getElementById("live-listener-value").textContent = "--";
  }
}

updateLiveListeners();
setInterval(updateLiveListeners, 30000);
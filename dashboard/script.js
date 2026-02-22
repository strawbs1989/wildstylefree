const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const wave = document.getElementById("wave");
const djQueue = document.getElementById("djQueue");

let mediaRecorder, audioChunks = [], recordedBlob;
let recordingTimeout;
let userCountry = "Detecting...";

// Get user country
async function getCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    userCountry = data.country_name || "Unknown Country";
  } catch {
    userCountry = "Unknown Country";
  }
}
getCountry();

// Start/stop recording
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") startRecording();
  else stopRecording();
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
    statusText.textContent = `Recording complete ✔ (${userCountry})`;
    addToQueue(recordedBlob, userCountry);
  };

  mediaRecorder.start();
  recordBtn.classList.add("recording");
  statusText.textContent = "Recording... (5 sec max)";
  let progress = 0;

  recordingTimeout = setInterval(() => {
    progress += 20;
    wave.style.width = progress + "%";
    if (progress >= 100) stopRecording();
  }, 500);

  setTimeout(stopRecording, 5000);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  clearInterval(recordingTimeout);
  recordBtn.classList.remove("recording");
}

// Add recording to DJ queue
function addToQueue(blob, country) {
  const item = document.createElement("div");
  item.classList.add("queue-item", "new");

  const info = document.createElement("div");
  info.classList.add("queue-info");
  info.textContent = `🎤 Listener from ${country}`;

  const btns = document.createElement("div");
  btns.classList.add("queue-buttons");

  const preview = document.createElement("button");
  preview.classList.add("preview-btn");
  preview.textContent = "▶ Preview";
  preview.onclick = () => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  };

  const play = document.createElement("button");
  play.classList.add("play-btn");
  play.textContent = "🔴 On Air";
  play.onclick = () => item.style.background = "#ff2d2d";

  const del = document.createElement("button");
  del.classList.add("delete-btn");
  del.textContent = "❌ Delete";
  del.onclick = () => item.remove();

  btns.append(preview, play, del);
  item.append(info, btns);

  djQueue.prepend(item);

  // Remove new highlight after 2s
  setTimeout(() => item.classList.remove("new"), 2000);
}
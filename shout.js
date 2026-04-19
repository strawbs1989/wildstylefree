/* -------------------------
   SHOUT
------------------------- */
const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const wave = document.getElementById("wave");
const previewBtn = document.querySelector(".preview");
const deleteBtn = document.querySelector(".delete");
const sendBtn = document.querySelector(".send");

let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let recordingTimeout;
let userCountry = "Unknown Country";

// 🌍 GET COUNTRY
async function getCountry() {
  const countryEl = document.getElementById("listenerCountry");

  try {
    const res = await fetch("https://ipwho.is/");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Validate API response
    if (!data.success) {
      throw new Error(data.message || "API returned error");
    }
    
    userCountry = data.country || "Unknown Country";

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: " + userCountry;
    }
  } catch (err) {
    console.warn("Country lookup failed:", err);

    if (countryEl) {
      countryEl.textContent = "🌍 Listener from: Unknown Country";
    }
  }
}
getCountry();

// 🎤 START RECORDING
if (recordBtn && statusText && wave) {
  recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      startRecording();
    } else {
      stopRecording();
    }
  });
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
    if (statusText) {
      statusText.textContent = `Recording complete ✔ (${userCountry})`;
    }
  };

  mediaRecorder.start();

  if (recordBtn) recordBtn.classList.add("recording");
  if (statusText) statusText.textContent = "Recording... (5 sec max)";

  let progress = 0;
  recordingTimeout = setInterval(() => {
    progress += 10;
    if (wave) wave.style.width = progress + "%";
    if (progress >= 100) stopRecording();
  }, 500);

  setTimeout(stopRecording, 5000);
}
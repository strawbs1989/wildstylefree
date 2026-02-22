const recordBtn = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const wave = document.getElementById("wave");
const previewBtn = document.querySelector(".preview");
const deleteBtn = document.querySelector(".delete");

let mediaRecorder;
let audioChunks = [];
let recordedBlob;
let recordingTimeout;
let userCountry = "Detecting...";


// 🌍 GET COUNTRY
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


// 🎤 START RECORDING
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(audioChunks, { type: "audio/webm" });
    statusText.textContent = `Recording complete ✔ (${userCountry})`;
  };

  mediaRecorder.start();
  recordBtn.classList.add("recording");
  statusText.textContent = "Recording... (5 sec max)";

  // fake waveform animation
  let progress = 0;
  recordingTimeout = setInterval(() => {
    progress += 10;
    wave.style.width = progress + "%";
    if (progress >= 100) stopRecording();
  }, 500);

  // auto stop after 5 sec
  setTimeout(stopRecording, 5000);
}


// 🛑 STOP RECORDING
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearInterval(recordingTimeout);
  recordBtn.classList.remove("recording");
}


// ▶ PREVIEW
previewBtn.addEventListener("click", () => {
  if (!recordedBlob) return alert("No recording yet!");

  const audioURL = URL.createObjectURL(recordedBlob);
  const audio = new Audio(audioURL);
  audio.play();
});


// ❌ DELETE
deleteBtn.addEventListener("click", () => {
  recordedBlob = null;
  wave.style.width = "0%";
  statusText.textContent = "Recording deleted";
});

/*----------------
Mobile navigate
------------------*/
const burger = document.getElementById("burger");
const mobileNav = document.getElementById("mobileNav");
const backdrop = document.getElementById("navBackdrop");

burger.addEventListener("click", () => {
  mobileNav.classList.toggle("active");
  backdrop.classList.toggle("active");
});

backdrop.addEventListener("click", () => {
  mobileNav.classList.remove("active");
  backdrop.classList.remove("active");
});
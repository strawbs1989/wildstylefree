const audio = new Audio("https://streaming.live365.com/a50378");
audio.crossOrigin = "anonymous";

document.getElementById("playBtn").onclick = () => {
  audio.play();
  streamStatus.textContent = "Live";
};

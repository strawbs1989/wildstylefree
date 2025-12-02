let camera = document.getElementById("camera");
let preview = document.getElementById("preview");
let captured = null;

// Start camera
navigator.mediaDevices.getUserMedia({ video:true })
  .then(stream => camera.srcObject = stream);

// Take photo
function takePhoto(){
  let canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext("2d").drawImage(camera,0,0);
  captured = canvas.toDataURL("image/jpeg").split(",")[1];
  preview.src = "data:image/jpeg;base64," + captured;
  preview.style.display = "block";
}

// Upload photo
function uploadPhoto(){
  if(!captured) return alert("Take a photo first!");

  fetch("https://script.google.com/macros/s/AKfycbwD919EtgveXbqScu1LWeFOMEYHjjKMUmZDYvcpmSDMgT0VYvWEIdW_SIpIpH1_qBk/exec", {
    method:"POST",
    body:JSON.stringify({ image: captured }),
    headers:{ "Content-Type":"application/json" }
  })
  .then(res => res.json())
  .then(() => {
    alert("Uploaded!");
    preview.style.display="none";
  });
}
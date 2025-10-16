// === Song Request Widget ===
Const btn = document.getElementById(‘requestBtn’);
Const popup = document.getElementById(‘requestPopup’);
Const form = document.getElementById(‘requestForm’);
Const statusBox = document.getElementById(‘reqStatus’);

Btn.addEventListener(‘click’, ()=> popup.classList.toggle(‘active’));

Form.addEventListener(‘submit’, async (e)=>{
  e.preventDefault();
  statusBox.textContent = “Sending...”;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    await fetch(“https://script.google.com/macros/s/AKfycbyoAZ_BA9pmiPycdiI1xfrOTf7UG5lYaw7P50Y_E5TJ_2uxFd7H6_5GnRADTDPieVg/exec”, {
      method:”POST”,
      body:JSON.stringify(data),
      headers:{“Content-Type”:”application/json”}
    });
    statusBox.textContent = “✅ Request sent!”;
    form.reset();
    setTimeout(()=> popup.classList.remove(‘active’), 1500);
  } catch(err){
    Console.error(err);
    statusBox.textContent = “❌ Error sending request.”;
  }
});
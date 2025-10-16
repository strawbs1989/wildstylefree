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
    await fetch(“YOUR_GOOGLE_SCRIPT_URL”, {
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
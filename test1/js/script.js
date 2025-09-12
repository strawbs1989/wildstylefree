document.getElementById('modeToggle').addEventListener('change', function() {
  const body = document.body;
  const logo = document.getElementById('logo');
  if (this.checked) {
    body.classList.add('christmas');
    logo.src = 'assets/logo_christmas.png';
  } else {
    body.classList.remove('christmas');
    logo.src = 'assets/logo.png';
  }
});

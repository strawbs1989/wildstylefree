(function () {
  // Manual override:
  // localStorage.setItem("wsTheme", "theme-xmas");
  // localStorage.removeItem("wsTheme");

  const saved = localStorage.getItem("wsTheme");
  const html = document.documentElement;

  const apply = (cls) => {
    html.classList.remove("theme-xmas","theme-halloween","theme-summer","theme-newyear");
    if (cls) html.classList.add(cls);
  };

  if (saved) {
    apply(saved);
    return;
  }

  // Auto theme by month (UK time safe enough for this)
  const m = new Date().getMonth() + 1;

// 🎄 December
if (m === 12) apply("theme-xmas");

// 🎃 October
else if (m === 10) apply("theme-halloween");

// 🐣 Easter (March & April)
else if (m === 3 || m === 4) apply("theme-easter");

// 🎇 January
else if (m === 1) apply("theme-newyear");

// ☀️ Summer Festival
else if (m >= 6 && m <= 8) apply("theme-summer"); 
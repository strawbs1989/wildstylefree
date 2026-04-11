(function () {
  const html = document.documentElement;
  const body = document.body;

  function removeOldThemes() {
    html.classList.remove(
      "theme-xmas",
      "theme-halloween",
      "theme-summer",
      "theme-newyear",
      "theme-easter",
      "theme-valentines"
    );
  }

  function removeOldBanner() {
    const oldBanner = document.querySelector(".season-banner");
    if (oldBanner) oldBanner.remove();
  }

function addBanner(text) {
  if (!body) return;

  removeOldBanner();

  const banner = document.createElement("div");
  banner.className = "season-banner";
  banner.textContent = text;

  const nowOnBar = document.querySelector(".now-on-stage, .now-on-bar");
  const hero = document.querySelector(".hero");

  if (nowOnBar) {
    nowOnBar.insertAdjacentElement("afterend", banner);
  } else if (hero) {
    hero.prepend(banner);
  } else {
    body.prepend(banner);
  }
} 


  function applyTheme(cls, text) {
    removeOldThemes();
    if (cls) {
      html.classList.add(cls);
      addBanner(text);
    }
  }

  const m = new Date().getMonth() + 1;

  if (m === 12) applyTheme("theme-xmas", "🎄 Christmas at Wildstyle Radio");
  else if (m === 10) applyTheme("theme-halloween", "🎃 Halloween Vibes Live on Wildstyle");
  else if (m === 3 || m === 4) applyTheme("theme-easter", "🐣 Easter Vibes on Wildstyle Radio");
  else if (m === 2) applyTheme("theme-valentines", "❤️ Valentine’s Month on Wildstyle");
  else if (m === 1) applyTheme("theme-newyear", "🎆 New Year Energy on Wildstyle");
  else if (m >= 6 && m <= 8) applyTheme("theme-summer", "☀️ Summer Festival Season at Wildstyle");
})(); 

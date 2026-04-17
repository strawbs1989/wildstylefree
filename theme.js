(function () {
  const html = document.documentElement;
  const body = document.body;

  function removeOldThemes() {
    html.classList.remove(
      "theme-xmas",
      "theme-halloween",
      "theme-newyear",
      "theme-easter",
      "theme-valentines",
      "theme-autism",
      "theme-mothersday",
      "theme-fathersday"
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
    removeOldBanner();

    if (cls && text) {
      html.classList.add(cls);
      addBanner(text);
    }
  }

  function isBetween(month, day, startMonth, startDay, endMonth, endDay) {
    const current = month * 100 + day;
    const start = startMonth * 100 + startDay;
    const end = endMonth * 100 + endDay;
    return current >= start && current <= end;
  }

  function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function getUKMothersDay(year) {
    const easter = getEasterDate(year);
    const mothersDay = new Date(easter);
    mothersDay.setDate(easter.getDate() - 21); // 3 weeks before Easter Sunday
    return mothersDay;
  }

  function getFathersDay(year) {
    const juneFirst = new Date(year, 5, 1); // June 1
    const dayOfWeek = juneFirst.getDay(); // 0=Sun
    const firstSundayOffset = (7 - dayOfWeek) % 7;
    const firstSunday = 1 + firstSundayOffset;
    const thirdSunday = firstSunday + 14;
    return new Date(year, 5, thirdSunday);
  }

  function sameDate(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const todayOnly = new Date(year, now.getMonth(), day);

  removeOldThemes();
  removeOldBanner();

  // New Year: 31 Dec - 3 Jan
  if (
    isBetween(month, day, 12, 31, 12, 31) ||
    isBetween(month, day, 1, 1, 1, 3)
  ) {
    applyTheme("theme-newyear", "🎆 New Year Energy on Wildstyle");
    return;
  }

  // Valentine's: 10 Feb - 15 Feb
  if (isBetween(month, day, 2, 10, 2, 15)) {
    applyTheme("theme-valentines", "❤️ Valentine’s Vibes on Wildstyle");
    return;
  }

  // World Autism Awareness Day: 2 April
  if (month === 4 && day === 2) {
    applyTheme("theme-autism", "🧩 World Autism Awareness Day");
    return;
  }

  // Mother's Day (UK / Mothering Sunday): exact day only
  const mothersDay = getUKMothersDay(year);
  if (sameDate(todayOnly, mothersDay)) {
    applyTheme("theme-mothersday", "💐 Happy Mother’s Day from Wildstyle");
    return;
  }

  // Easter: Good Friday to Easter Monday
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  if (todayOnly >= goodFriday && todayOnly <= easterMonday) {
    applyTheme("theme-easter", "🐣 Easter Vibes on Wildstyle Radio");
    return;
  }

  // Father's Day: exact day only
  const fathersDay = getFathersDay(year);
  if (sameDate(todayOnly, fathersDay)) {
    applyTheme("theme-fathersday", "👔 Happy Father’s Day from Wildstyle");
    return;
  }

  // Halloween: 25 Oct - 31 Oct
  if (isBetween(month, day, 10, 25, 10, 31)) {
    applyTheme("theme-halloween", "🎃 Halloween Vibes Live on Wildstyle");
    return;
  }

  // Christmas: 1 Dec - 26 Dec
  if (isBetween(month, day, 12, 1, 12, 26)) {
    applyTheme("theme-xmas", "🎄 Christmas at Wildstyle Radio");
    return;
  }

  // Nothing special: no theme, no banner
})();
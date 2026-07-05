/*==================================================
  WILDSTYLE HEADER v4
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const mount = document.getElementById("header");

    if (!mount) return;

    mount.innerHTML = `

<header class="ws-header">

    <div class="ws-left">

        <button
            class="ws-burger"
            id="wsBurger"
            aria-label="Open Menu"
            aria-expanded="false">

            ☰

        </button>

        <a href="/index.html" class="ws-logo">

            <img
                src="/images/logo.png"
                alt="Wildstyle Radio Logo"
                class="ws-logo-image">

            <div class="ws-logo-text">

                <strong>Wildstyle Radio</strong>

                <span>Underground Music Community</span>

            </div>

        </a>

    </div>

    <nav class="ws-nav">

        <a href="/index.html">Home</a>

        <a href="/djs.html">DJs</a>

        <a href="/artists.html">Artists</a>

        <a href="/schedule.html">Schedule</a>

        <a href="/chat.html">Community</a>

        <a href="/map.html">Listener Map</a>

        <a href="/shop.html">Shop</a>

    </nav>

    <div class="header-actions">

        <a
            href="https://streaming.live365.com/a50378"
            target="_blank"
            class="ws-live">

            <span class="dot"></span>

            Listen Live

        </a>

    </div>

</header>

<div class="ws-overlay" id="wsOverlay"></div>

<aside class="ws-mobile" id="wsMobile">

    <div class="ws-mobile-top">

        <div class="ws-brand">

            <img
                src="/images/logo.png"
                class="ws-brand-logo"
                alt="Wildstyle Radio">

            <div class="ws-brand-text">

                <strong>Wildstyle Radio</strong>

                <span>Underground Music Community</span>

            </div>

        </div>

        <button
            id="wsClose"
            aria-label="Close Menu">

            ✕

        </button>

    </div>

    <nav class="ws-mobile-links">

        <a href="/index.html">🏠 Home</a>

        <a href="/djs.html">🎙 DJs</a>

        <a href="/artists.html">🎧 Artists</a>

        <a href="/schedule.html">📅 Schedule</a>

        <a href="/chat.html">💬 Community</a>

        <a href="/map.html">🗺 Listener Map</a>

        <a href="/tsandcs.html">Terms</a>

    </nav>

    <div class="ws-social">

        <h4>FOLLOW WILDSTYLE</h4>

        <a href="https://facebook.com/wildstyleuk" target="_blank">
            🌐 Facebook
        </a>

        <a href="#">
            📷 Instagram
        </a>

        <a href="#">
            🎵 TikTok
        </a>

    </div>

    <div class="ws-mobile-footer">

        <a
            href="https://streaming.live365.com/a50378"
            target="_blank"
            class="ws-live mobile">

            <span class="dot"></span>

            Listen Live

        </a>

    </div>

</aside>

`;

    const burger = document.getElementById("wsBurger");
    const mobile = document.getElementById("wsMobile");
    const overlay = document.getElementById("wsOverlay");
    const close = document.getElementById("wsClose");

    function openMenu() {

        mobile.classList.add("open");
        overlay.classList.add("show");

        burger.setAttribute("aria-expanded", "true");

        document.body.style.overflow = "hidden";

    }

    function closeMenu() {

        mobile.classList.remove("open");
        overlay.classList.remove("show");

        burger.setAttribute("aria-expanded", "false");

        document.body.style.overflow = "";

    }

    burger.addEventListener("click", openMenu);

    close.addEventListener("click", closeMenu);

    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            closeMenu();

        }

    });

    document.querySelectorAll(".ws-mobile-links a")
        .forEach(link => {

            link.addEventListener("click", closeMenu);

        });

    const page =
        window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".ws-nav a, .ws-mobile-links a")
        .forEach(link => {

            if (link.getAttribute("href").endsWith(page)) {

                link.classList.add("active");

            }

        });

});
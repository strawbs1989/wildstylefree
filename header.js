/*==================================================
  WILDSTYLE HEADER v3
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

const mount = document.getElementById("site-header");

if(!mount) return;

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
                alt="Wildstyle Radio">

            <span>

                Wildstyle Radio

            </span>

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

    <a
        href="https://streaming.live365.com/a50378"
        target="_blank"
        class="ws-live">

        <span></span>

        Listen Live

    </a>

</header>

<div
    class="ws-overlay"
    id="wsOverlay">

</div>

<aside
    class="ws-mobile"
    id="wsMobile">

    <div class="ws-mobile-top">

        <strong>

            Wildstyle

        </strong>

        <button
            id="wsClose">

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

        <a href="/shop.html">🛍 Shop</a>

    </nav>

    <div class="ws-social">

        <a
        href="https://facebook.com/wildstyleuk"
        target="_blank">

            Facebook

        </a>

        <a href="#">

            Instagram

        </a>

        <a href="#">

            TikTok

        </a>

    </div>

    <a
        href="https://streaming.live365.com/a50378"
        target="_blank"
        class="ws-live mobile">

        <span></span>

        Listen Live

    </a>

</aside>

`;

const burger=document.getElementById("wsBurger");
const menu=document.getElementById("wsMobile");
const overlay=document.getElementById("wsOverlay");
const close=document.getElementById("wsClose");

function openMenu(){

    menu.classList.add("open");
    overlay.classList.add("show");

    burger.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow="hidden";

}

function closeMenu(){

    menu.classList.remove("open");
    overlay.classList.remove("show");

    burger.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow="";

}

burger.addEventListener("click",openMenu);

close.addEventListener("click",closeMenu);

overlay.addEventListener("click",closeMenu);

document.addEventListener("keydown",e=>{

    if(e.key==="Escape"){

        closeMenu();

    }

});

document
.querySelectorAll(".ws-mobile-links a")
.forEach(link=>{

    link.addEventListener(
        "click",
        closeMenu
    );

});

/*=================================
ACTIVE PAGE
=================================*/

const page=
window.location.pathname
.split("/")
.pop()||"index.html";

document
.querySelectorAll(
".ws-nav a,.ws-mobile-links a"
)
.forEach(link=>{

    const href=
    link.getAttribute("href");

    if(!href) return;

    if(href.endsWith(page)){

        link.classList.add("active");

    }

});

});
/*==================================================
WILDSTYLE SHARED HEADER
header.js
==================================================*/

document.addEventListener("DOMContentLoaded", () => {


const burger = document.getElementById("burger");
const nav = document.getElementById("mobileNav");
const backdrop = document.getElementById("navBackdrop");
const closeBtn = document.getElementById("navClose");

if (burger && nav && backdrop && closeBtn) {

    burger.onclick = () => {

        nav.classList.add("open");
        backdrop.classList.add("show");

    };

    closeBtn.onclick = () => {

        nav.classList.remove("open");
        backdrop.classList.remove("show");

    };

    backdrop.onclick = () => {

        nav.classList.remove("open");
        backdrop.classList.remove("show");

    };

}

closeBtn.onclick = closeMenu;
backdrop.onclick = closeMenu;

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeMenu();

    }

});

    /*==========================================
    OPEN MENU
    ==========================================*/

    function openMenu() {

        mobileNav.classList.add("open");
        navBackdrop.classList.add("show");

        burger.setAttribute("aria-expanded", "true");

        document.body.style.overflow = "hidden";

    }

    /*==========================================
    CLOSE MENU
    ==========================================*/

    function closeMenu() {

        mobileNav.classList.remove("open");
        navBackdrop.classList.remove("show");

        burger.setAttribute("aria-expanded", "false");

        document.body.style.overflow = "";

    }

    /*==========================================
    EVENTS
    ==========================================*/

    if (burger) {

        burger.addEventListener("click", openMenu);

    }

    if (navClose) {

        navClose.addEventListener("click", closeMenu);

    }

    if (navBackdrop) {

        navBackdrop.addEventListener("click", closeMenu);

    }

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            closeMenu();

        }

    });

    /*==========================================
    CLOSE AFTER CLICKING A LINK
    ==========================================*/

    document.querySelectorAll(".mobile-nav a").forEach(link => {

        link.addEventListener("click", closeMenu);

    });

    /*==========================================
    ACTIVE PAGE HIGHLIGHT
    ==========================================*/

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".desktop-nav a, .mobile-links a").forEach(link => {

        const href = link.getAttribute("href");

        if (!href) return;

        const page = href.split("/").pop();

        if (page === currentPage) {

            link.classList.add("active");

        }

    });

});
/*==================================================
WILDSTYLE SHARED HEADER
header.js
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const burger = document.getElementById("burger");
    const mobileNav = document.getElementById("mobileNav");
    const navBackdrop = document.getElementById("navBackdrop");
    const navClose = document.getElementById("navClose");

    /*==========================================
      Make sure header exists
    ==========================================*/

    if (!burger || !mobileNav || !navBackdrop || !navClose) {
        console.warn("Header not found.");
        return;
    }

    /*==========================================
      Open Menu
    ==========================================*/

    function openMenu() {

        mobileNav.classList.add("open");
        navBackdrop.classList.add("show");

        burger.setAttribute("aria-expanded", "true");

        document.body.style.overflow = "hidden";

    }

    /*==========================================
      Close Menu
    ==========================================*/

    function closeMenu() {

        mobileNav.classList.remove("open");
        navBackdrop.classList.remove("show");

        burger.setAttribute("aria-expanded", "false");

        document.body.style.overflow = "";

    }

    /*==========================================
      Button Events
    ==========================================*/

    burger.addEventListener("click", openMenu);

    navClose.addEventListener("click", closeMenu);

    navBackdrop.addEventListener("click", closeMenu);

    /*==========================================
      Close on ESC
    ==========================================*/

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            closeMenu();

        }

    });

    /*==========================================
      Close after clicking a menu link
    ==========================================*/

    document.querySelectorAll(".mobile-nav a").forEach(link => {

        link.addEventListener("click", closeMenu);

    });

    /*==========================================
      Active Page
    ==========================================*/

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".desktop-nav a, .mobile-links a")
        .forEach(link => {

            const href = link.getAttribute("href");

            if (!href) return;

            const page = href.split("/").pop();

            if (page === currentPage) {

                link.classList.add("active");

            }

        });

});
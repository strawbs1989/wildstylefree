/*=====================
BURGER
==================== */

<!-- const burger = document.getElementById("burger");
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

}); -->
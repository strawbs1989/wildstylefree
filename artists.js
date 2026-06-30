/*=====================
BURGER
==================== */

const burger = document.getElementById("burger");
const nav = document.getElementById("mobileNav");
const backdrop = document.getElementById("navBackdrop");
const closeBtn = document.getElementById("navClose");

burger.onclick = () => {

    nav.classList.add("open");
    backdrop.classList.add("show");

};

function closeMenu(){

    nav.classList.remove("open");
    backdrop.classList.remove("show");

}

closeBtn.onclick = closeMenu;
backdrop.onclick = closeMenu;

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeMenu();

    }

});
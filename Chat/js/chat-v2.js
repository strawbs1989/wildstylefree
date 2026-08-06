
----------------
DOM
----------------
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser = null;

------------------
START-UP 
------------------
(async function init(){

    const {
        data:{ user }
    } = await client.auth.getUser();

    if(!user){

        window.location.href="index.html";
        return;

    }

    currentUser = user;

    await loadMessages();

    enableRealtime();

})();

--------------------
Load Messages
--------------------
async function loadMessages(){

    const { data, error } = await client

        .from("messages")

        .select(`
            *,
            profiles(
                display_name,
                avatar_url
            )
        `)

        .order("created_at",{ascending:true});

    if(error){

        console.error(error);
        return;

    }

    messagesDiv.innerHTML="";

    data.forEach(renderMessage);

    scrollBottom();

}

-----------------
Render Message
----------------
function renderMessage(message){

    const card=document.createElement("div");

    card.className="chat-message";

    const avatar=
        message.profiles?.avatar_url ||
        "/images/default-avatar.png";

    const name=
        message.profiles?.display_name ||
        "Member";

    const time=new Date(message.created_at)

        .toLocaleTimeString([],{

            hour:"2-digit",

            minute:"2-digit"

        });

    card.innerHTML=`

<div style="display:flex;gap:12px;">

<img
src="${avatar}"
style="
width:48px;
height:48px;
border-radius:50%;
object-fit:cover;
">

<div>

<div class="chat-user">

${escapeHTML(name)}

</div>

<div class="chat-text">

${escapeHTML(message.message)}

</div>

<div class="chat-time">

${time}

</div>

</div>

</div>

`;

    messagesDiv.appendChild(card);

}
/*Send Message*/
async function sendMessage(){

    const text=messageInput.value.trim();

    if(!text) return;

    const { error }=await client

        .from("messages")

        .insert([{

            user_id:currentUser.id,

            message:text

        }]);

    if(error){

        alert(error.message);

        return;

    }

    messageInput.value="";

}
/*Real Time*/
function enableRealtime(){

    client

        .channel("messages")

        .on(

            "postgres_changes",

            {

                event:"INSERT",

                schema:"public",

                table:"messages"

            },

            async(payload)=>{

                const { data }=await client

                    .from("profiles")

                    .select("display_name,avatar_url")

                    .eq("id",payload.new.user_id)

                    .single();

                payload.new.profiles=data;

                renderMessage(payload.new);

                scrollBottom();

            }

        )

        .subscribe();

}
/*Helpers*/
function scrollBottom(){

    messagesDiv.scrollTop=

        messagesDiv.scrollHeight;

}

function escapeHTML(text){

    const div=document.createElement("div");

    div.textContent=text;

    return div.innerHTML;

}
/*Events*/
sendBtn.addEventListener(

    "click",

    sendMessage

);

messageInput.addEventListener(

    "keydown",

    e=>{

        if(e.key==="Enter"){

            e.preventDefault();

            sendMessage();

        }

    }

);
// Logout button
document
    .getElementById("logoutBtn")
    .addEventListener("click", logout);
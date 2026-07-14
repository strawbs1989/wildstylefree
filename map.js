/*==================================================
  WILDSTYLE RADIO
  PROFESSIONAL LISTENER MAP
  PART 6A
==================================================*/

const WORKER_URL = "https://wildstyle-geo.jayaubs89.workers.dev";

const REFRESH_INTERVAL = 30000;

const countryPositions = {

    // North America
    "Canada": { x:18.5, y:18.5 },
    "United States": { x:20.5, y:30.5 },
    "Mexico": { x:21.5, y:42.5 },
    "Puerto Rico": { x:30.0, y:43.5 },

    // South America
    "Brazil": { x:31.5, y:60.5 },
    "Argentina": { x:30.0, y:79.0 },
    "Trinidad and Tobago": { x:31.5, y:48.5 },

    // Europe
    "Iceland": { x:41.5, y:11.5 },
    "Ireland": { x:44.8, y:24.0 },
    "United Kingdom": { x:46.8, y:23.0 },
    "Spain": { x:45.5, y:33.0 },
    "France": { x:48.0, y:29.0 },
    "Germany": { x:50.5, y:25.5 },
    "Netherlands": { x:49.2, y:24.0 },
    "Belgium": { x:48.6, y:25.0 },
    "Switzerland": { x:50.0, y:29.0 },
    "Italy": { x:51.8, y:34.0 },
    "Norway": { x:50.5, y:13.5 },
    "Sweden": { x:54.0, y:16.5 },
    "Finland": { x:57.5, y:15.5 },

    // Africa
    "Nigeria": { x:50.5, y:48.0 },
    "Kenya": { x:58.5, y:56.0 },
    "South Africa": { x:54.5, y:79.0 },

    // Asia
    "India": { x:61.0, y:50.0 },
    "Malaysia": { x:69.5, y:60.0 },

    // Oceania
    "Australia": { x:82.5, y:72.5 },
    "New Zealand": { x:91.5, y:81.0 }

};

const previousData = new Map();

let refreshTimer = null;

const UI = {

    map:null,

    countryList:null,

    activityFeed:null,

    total:null,

    countries:null,

    topCountry:null,

    updated:null

};

function cacheElements(){

    UI.map = document.getElementById("mapWrap");

    UI.countryList = document.getElementById("countryList");

    UI.activityFeed = document.getElementById("activityFeed");

    UI.total = document.getElementById("totalListenersBadge");

    UI.countries = document.getElementById("countryCountBadge");

    UI.topCountry = document.getElementById("topCountryName");

    UI.updated = document.getElementById("lastUpdated");

}

function formatNumber(value){

    return new Intl.NumberFormat().format(value || 0);

}

function formatTime(date){

    return date.toLocaleTimeString([],{

        hour:"2-digit",

        minute:"2-digit"

    });

}

function bubbleSize(count){

    if(count >= 2000) return 46;

    if(count >= 1000) return 40;

    if(count >= 500) return 34;

    if(count >= 250) return 28;

    if(count >= 100) return 24;

    if(count >= 50) return 20;

    if(count >= 10) return 16;

    return 12;

}

async function fetchListenerData(){

    const response = await fetch(

        WORKER_URL + "?t=" + Date.now(),

        {

            cache:"no-store"

        }

    );

    if(!response.ok){

        throw new Error("Unable to load listener data.");

    }

    return await response.json();

}

/*==================================================
  PART 6B
  MAP RENDERING ENGINE
==================================================*/

function clearMarkers(){

    UI.map
        .querySelectorAll(".listener-dot")
        .forEach(dot => dot.remove());

}

function updateDashboard(data){

    if(!Array.isArray(data)) return;

    const totalListeners = data.reduce(
        (total,item)=>total + (item.count || 0),
        0
    );

    const countryCount = data.length;

    const topCountry = data[0] || null;

    if(UI.total){
        UI.total.textContent = formatNumber(totalListeners);
    }

    if(UI.countries){
        UI.countries.textContent = formatNumber(countryCount);
    }

    if(UI.topCountry){
        UI.topCountry.textContent = topCountry
            ? topCountry.country
            : "No Data";
    }

    if(UI.updated){
        UI.updated.textContent = formatTime(new Date());
    }

}
    

    

function drawMarkers(data){

    if(!UI.map) return;

    UI.map
        .querySelectorAll(".listener-dot")
        .forEach(dot=>dot.remove());

    data.forEach(item=>{

        const pos = countryPositions[item.country];

        if(!pos) return;

        const marker = document.createElement("div");

        marker.className = "listener-dot";

        if(
            previousData.has(item.country) &&
            item.count > previousData.get(item.country)
        ){

            marker.classList.add("listener-dot-new");

        }

        const size = bubbleSize(item.count);

        marker.style.width = size + "px";
        marker.style.height = size + "px";

        marker.style.left = pos.x + "%";
        marker.style.top = pos.y + "%";

        marker.setAttribute(
            "data-label",
            `${item.country}\n${formatNumber(item.count)} listeners`
        );

        UI.map.appendChild(marker);

    });

}

function updateCountryList(data){

    UI.countryList.innerHTML="";

    data
        .slice(0,10)
        .forEach(item=>{

            const row =
                document.createElement("div");

            row.className="country-row";

            row.innerHTML=`

<div>

<b>${item.country}</b><br>

<small>

${formatNumber(item.count)} listeners

</small>

</div>

<span class="badge">

${formatNumber(item.count)}

</span>

`;

            UI.countryList.appendChild(row);

        });

}

function updateActivity(data){

    if(!UI.activityFeed) return;

    UI.activityFeed.innerHTML = "";

    data
        .slice(0,8)
        .forEach(item=>{

            const previous =
                previousData.get(item.country) || 0;

            const difference =
                item.count - previous;

            const card =
                document.createElement("div");

            card.className = "feed-item";

            let status = "No change";
            let css = "";

            if(difference > 0){

                status =
                    "+" + difference + " new listener" +
                    (difference > 1 ? "s" : "");

                css = "trend-up";

            }else if(difference < 0){

                status =
                    Math.abs(difference) +
                    " listener left";

                css = "trend-down";

            }

            card.innerHTML = `

<div class="feed-left">

<strong>

${item.country}

</strong>

<small class="${css}">

${status}

</small>

</div>

<span>

${formatNumber(item.count)}

</span>

`;

            UI.activityFeed.appendChild(card);

        });

}

function rememberCounts(data){

    previousData.clear();

    data.forEach(item=>{

        previousData.set(
            item.country,
            item.count
        );

    });

}

/*==================================================
  PART 6C
  APPLICATION ENGINE
==================================================*/

async function refreshDashboard(){

    try{

        const data = await fetchListenerData();

        if(!Array.isArray(data)){

            throw new Error("Invalid listener data.");

        }

        data.sort((a,b)=>b.count-a.count);

        updateDashboard(data);

        drawMarkers(data);

        updateCountryList(data);

        updateActivity(data);

        rememberCounts(data);

    }
    catch(err){

        console.error(
            "Dashboard refresh failed:",
            err
        );

    }

}


/*==================================================
  PART 7
  LIVE VISITOR REGISTRATION
==================================================*/

async function registerVisitor(){

    try{

        const response = await fetch(

            WORKER_URL + "/country",

            {
                cache:"no-store"
            }

        );

        if(!response.ok){

            throw new Error(
                "Country lookup failed."
            );

        }

        const data = await response.json();

        if(!data.country){

            throw new Error(
                "No country returned."
            );

        }

        const register = await fetch(

            WORKER_URL,

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    country:data.country

                })

            }

        );

        if(!register.ok){

            throw new Error(
                "Visitor registration failed."
            );

        }

        console.log(
            "Visitor registered:",
            data.country
        );

    }
    catch(err){

        console.error(err);

    }

}

/*==================================================
  SMART REFRESH
==================================================*/

async function updateEverything(){

    await registerVisitor();

    await refreshDashboard();

}

/*==================================================
  START APPLICATION
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    async ()=>{

        cacheElements();

        await updateEverything();

        if(refreshTimer){

            clearInterval(refreshTimer);

        }

        refreshTimer = setInterval(

            updateEverything,

            REFRESH_INTERVAL

        );

    }

);
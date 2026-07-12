/*==================================================
  WILDSTYLE RADIO
  PROFESSIONAL LISTENER MAP
  PART 6A
==================================================*/

const WORKER_URL = "https://wildstyle-geo.jayaubs89.workers.dev";

const REFRESH_INTERVAL = 30000;

const countryPositions = {

    "United Kingdom": { x:46.5, y:26.5 },
    "Ireland": { x:44.8, y:27.0 },
    "France": { x:47.2, y:30.5 },
    "Germany": { x:50.0, y:27.8 },
    "Spain": { x:45.0, y:35.0 },
    "Italy": { x:50.5, y:34.2 },
    "Netherlands": { x:48.2, y:26.8 },
    "Belgium": { x:47.7, y:28.5 },

    "Norway": { x:50.5, y:15.5 },
    "Sweden": { x:54.8, y:18.5 },
    "Finland": { x:58.0, y:17.5 },

    "United States": { x:20.0, y:31.5 },
    "Canada": { x:18.5, y:18.5 },
    "Mexico": { x:18.8, y:41.5 },

    "Brazil": { x:31.0, y:60.0 },
    "Argentina": { x:30.5, y:79.0 },

    "Nigeria": { x:50.0, y:48.5 },
    "Kenya": { x:58.5, y:55.5 },
    "South Africa": { x:55.0, y:78.0 },

    "India": { x:66.0, y:41.0 },
    "Malaysia": { x:72.5, y:52.8 },

    "Australia": { x:85.8, y:74.5 },

    "Puerto Rico": { x:28.8, y:44.2 },
    "Trinidad and Tobago": { x:29.5, y:47.2 }

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

    if(count >= 1000) return 42;

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

    const total = data.reduce(
        (sum,item)=>sum + (item.count || 0),
        0
    );

    UI.total.textContent = formatNumber(total);

    UI.countries.textContent = data.length;

    if(data.length){

        UI.topCountry.textContent = data[0].country;

    }else{

        UI.topCountry.textContent = "No Data";

    }

    UI.updated.textContent =
        formatTime(new Date());

}

function drawMarkers(data){

    clearMarkers();

    data.forEach(item=>{

        const pos =
            countryPositions[item.country];

        if(!pos) return;

        const dot =
            document.createElement("div");

        dot.className="listener-dot";

        if(
            previousData.has(item.country) &&
            item.count >
            previousData.get(item.country)
        ){

            dot.classList.add(
                "listener-dot-new"
            );

        }

        const size =
            bubbleSize(item.count);

        dot.style.width=size+"px";

        dot.style.height=size+"px";

        dot.style.left=pos.x+"%";

        dot.style.top=pos.y+"%";

        dot.dataset.label=
            item.country +
            " • " +
            formatNumber(item.count) +
            " listeners";

        UI.map.appendChild(dot);

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

    UI.activityFeed.innerHTML="";

    data
        .slice(0,8)
        .forEach(item=>{

            const old =
                previousData.get(item.country) || 0;

            const diff =
                item.count-old;

            const feed =
                document.createElement("div");

            feed.className="feed-item";

            feed.innerHTML=`

<strong>

${item.country}

</strong>

<span>

${
diff>0
?
"+"+diff+" new listener(s)"
:
"Live audience"

}

</span>

`;

            UI.activityFeed.appendChild(feed);

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

            throw new Error(
                "Invalid listener data."
            );

        }

        data.sort(
            (a,b)=>b.count-a.count
        );

        updateDashboard(data);

        drawMarkers(data);

        updateCountryList(data);

        updateActivity(data);

        rememberCounts(data);

    }catch(err){

        console.error(err);

        UI.activityFeed.innerHTML=`

<div class="feed-item">

<strong>

Unable to load listener data

</strong>

<span>

Please try again shortly.

</span>

</div>

`;

    }

}

function startRefresh(){

    if(refreshTimer){

        clearInterval(refreshTimer);

    }

    refreshTimer = setInterval(

        refreshDashboard,

        REFRESH_INTERVAL

    );

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
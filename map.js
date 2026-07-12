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
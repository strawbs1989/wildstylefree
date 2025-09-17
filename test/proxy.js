
/* proxy.js
   Simple Node proxy to fetch metadata from a configured URL.
   Usage: set LIVE365_STATUS_URL env var, then run:
     npm install express node-fetch cheerio
     LIVE365_STATUS_URL="..." node proxy.js
*/
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;
const STATUS_URL = process.env.LIVE365_STATUS_URL || '';

app.get('/nowplaying', async (req, res) => {
  if(!STATUS_URL) return res.json({ title:null, artist:null, fallback:'Live on Wildstyle Radio' });
  try{
    const r = await fetch(STATUS_URL, { timeout:7000 });
    const txt = await r.text();
    try{ const j = JSON.parse(txt); return res.json({ title: j.title || j.current_song || null, artist: j.artist || null }); }catch(e){}
    try{ const $ = cheerio.load(txt); const title = $('[class*="now"]').first().text().trim() || $('[id*="now"]').first().text().trim(); if(title) return res.json({ title, artist:null }); }catch(e){}
    return res.json({ title:null, artist:null, fallback:'Live on Wildstyle Radio' });
  }catch(e){ return res.json({ title:null, artist:null, fallback:'Live on Wildstyle Radio' }); }
});

app.use(express.static('.'));
app.listen(PORT, ()=>console.log('proxy running on', PORT));

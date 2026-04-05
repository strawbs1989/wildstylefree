import { parseCSV } from './utils.js';

export async function loadRequestsTicker(els) {
  if (!els.requestTickerText || !els.requestTickerClone) return;

  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTN3Wl2Tq0brZrYyKWkN-Dz1Ze4bjq3-S0iIL1O5Zo3CsT1S463y2surOifH4CLB2zHQHoR9paj0Mdk/pub?gid=0&single=true&output=csv';

  try {
    const res = await fetch(url + '&t=' + Date.now());
    const csv = await res.text();
    const rows = csv.trim().split('\n');
    rows.shift();

    const items = rows.map(row => {
      const cols = parseCSV(row);
      const name = cols[1] || 'Listener';
      const song = cols[2] || 'Unknown Song';
      const artist = cols[3] || 'Unknown Artist';
      return `${name} requested ${song} - ${artist}`;
    }).filter(Boolean).slice(-10);

    const text = items.length ? items.join(' • ') : 'No requests yet — be the first!';
    els.requestTickerText.textContent = text;
    els.requestTickerClone.textContent = text;
  } catch {
    els.requestTickerText.textContent = 'Requests unavailable right now.';
    els.requestTickerClone.textContent = els.requestTickerText.textContent;
  }
} 

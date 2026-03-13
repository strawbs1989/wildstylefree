const ENDPOINT = "https://script.google.com/macros/s/AKfycbzY_Dfz29waq2ZuwTAqk3p3ogqrbLld650dsBELZ6EDHP6oJQoBV81NzowDA66-OqTU/exec" // <-- paste your /exec URL here
const REFRESH_MS = 15000; // 15 seconds
const MAX_LEN = 120;

const mount = document.getElementById("wildstyle-rollcall");

mount.innerHTML = `
  <div class="ws-rollcall-wrap">
    <div class="ws-rollcall-top">
      <div class="ws-rollcall-title">
        <h2>💬 Wildstyle Roll Call</h2>
        <p>Not a chat — one-line shouts only. Wipes daily.</p>
      </div>
      <div class="ws-rollcall-pills">
        <span class="ws-pill"><span class="ws-liveDot"></span> LIVE vibe</span>
        <span class="ws-pill">Max ${MAX_LEN} chars</span>
        <span class="ws-pill">No usernames • No replies</span>
      </div>
    </div>

    <div class="ws-card">
      <div class="ws-card-head">
        <div>
          <h3>Who’s locked in right now?</h3>
          <div class="ws-sub">Drop a quick shout — it shows up for everyone.</div>
        </div>
        <div class="ws-chip">🕛 <strong>Auto-wipes daily</strong></div>
      </div>

      <div class="ws-list" id="wsShoutList"></div>

      <div class="ws-form">
        <form id="wsShoutForm" autocomplete="off">
          <div class="ws-row">
            <input id="wsShoutInput" type="text" maxlength="${MAX_LEN}" placeholder='e.g. "Locked in from Cornwall 🔊"' />
            <button type="submit">Post shout</button>
          </div>
          <div class="ws-helper">
            <div id="wsCharLeft">${MAX_LEN} left</div>
            <div id="wsStatus"></div>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const listEl = document.getElementById("wsShoutList");
const formEl = document.getElementById("wsShoutForm");
const inputEl = document.getElementById("wsShoutInput");
const charLeftEl = document.getElementById("wsCharLeft");
const statusEl = document.getElementById("wsStatus");

function escapeHTML(s){
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString(undefined, { weekday:"short", hour:"2-digit", minute:"2-digit" });
  }catch(e){
    return "";
  }
}

function setStatus(msg){
  statusEl.textContent = msg || "";
}

async function loadShouts(){
  try{
    const res = await fetch(ENDPOINT, { method: "GET" });
    const data = await res.json();

    if(!data.ok) throw new Error("API_NOT_OK");

    const items = Array.isArray(data.items) ? data.items : [];

    if(items.length === 0){
      listEl.innerHTML = `
        <div class="ws-shout">
          <div class="ws-badge">✨</div>
          <div class="ws-msg">
            <p class="ws-text"><b>No shouts yet.</b> Be the first to check in!</p>
            <div class="ws-meta"><span>Keep it short & friendly</span></div>
          </div>
        </div>`;
      return;
    }

    listEl.innerHTML = items.map(s => `
      <div class="ws-shout">
        <div class="ws-badge">💬</div>
        <div class="ws-msg">
          <p class="ws-text">${escapeHTML(s.text)}</p>
          <div class="ws-meta">
            <span>${formatTime(s.ts)}</span>
            <span>•</span>
            <span>Wildstyle Roll Call</span>
          </div>
        </div>
      </div>
    `).join("");

    setStatus("");
  }catch(err){
    setStatus("⚠️ Couldn’t load shouts.");
  }
}

async function postShout(text){
  const clean = (text || "").trim().replace(/\s+/g, " ");
  if(!clean) return setStatus("Type a shout first 🙂");
  if(clean.length > MAX_LEN) return setStatus(`Too long (max ${MAX_LEN}).`);

  try{
    setStatus("Posting...");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || "POST_FAILED");

    inputEl.value = "";
    updateCharLeft();
    setStatus("Posted ✅");
    await loadShouts();
    setTimeout(()=>setStatus(""), 1200);
  }catch(err){
    setStatus("⚠️ Couldn’t post. Try again.");
  }
}

function updateCharLeft(){
  const left = MAX_LEN - (inputEl.value || "").length;
  charLeftEl.textContent = `${left} left`;
}

formEl.addEventListener("submit", (e)=>{
  e.preventDefault();
  postShout(inputEl.value);
});

inputEl.addEventListener("input", updateCharLeft);

// Init
updateCharLeft();
loadShouts();
setInterval(loadShouts, REFRESH_MS);

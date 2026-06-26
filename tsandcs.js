// tsandcs.js - Dynamic Layout & Theme Engine for Wildstyle Radio Rules
document.addEventListener("DOMContentLoaded", () => {
  const rulesData = [
    { id: "01", title: "General Conduct", text: "All DJs, presenters, and team members must behave respectfully and professionally at all times. Turning up on time is a <strong>MUST</strong>. Absolutely zero discrimination, hate speech, or toxic behavior will be tolerated." },
    { id: "02", title: "Broadcast Guidelines", text: "Shows must start and end precisely on time to ensure smooth handovers. Explicit content must be clearly marked. No promotion of illegal activities or misinformation." },
    { id: "03", title: "Music & Content", text: "We are fully licensed to play signed and unsigned tracks. Actively support upcoming artists, keep your music selection varied, and never distribute or download copyrighted tracks illegally." },
    { id: "04", title: "Technical Duties", text: "Test your audio levels, bitrates, and hardware setup before going live. Do not alter core stream settings. Always keep a backup local playlist ready in case connection drops." },
    { id: "05", title: "Promotion & Branding", text: "Always utilize current official Wildstyle assets. Drop regular station liners and link back to the hub. Management approval is strictly required before promoting external brands or merchandise." },
    { id: "06", title: "Schedule & Cover", text: "Commit strictly to your assigned time slots. Provide at least 24 hours notice in the crew channels if you need show coverage. No sudden ghosting or unannounced absences." },
    { id: "07", title: "Crew & Fan Interaction", text: "Treat listeners with patience and respect across all chat interactions. Keep room banter light and engaging. Never share confidential personal information or internal management issues publicly." },
    { id: "08", title: "Management Rights", text: "Station management reserves the full right to monitor broadcasts, audit logs, and remove contributors from rotation if any of these regulations are continuously ignored." }
  ];

  const gridContainer = document.getElementById("rules-dynamic-grid");
  if (!gridContainer) return;

  gridContainer.innerHTML = rulesData.map(rule => `
    <div class="mini-card post">
      <h4 style="color: #ff2a6d; font-weight: 800; margin-bottom: 12px;">
        <span style="color: var(--muted); font-size: 0.95rem; font-weight: 400; margin-right: 6px;">${rule.id}.</span>
        ${rule.title}
      </h4>
      <p style="font-size: 0.95rem; color: #e6dcfb; line-height: 1.6; margin: 0;">${rule.text}</p>
    </div>
  `).join('');
});

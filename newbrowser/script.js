function switchTab(event, tabId) {
  // Deactivate all tabs and contents
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Activate the clicked tab and corresponding content
  event.target.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

let tabCounter = 1;

function addNewTab() {
  tabCounter++;
  const tabId = `tab${tabCounter}`;

  // Create new tab button
  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.textContent = `Tab ${tabCounter}`;
  newTab.setAttribute('onclick', `switchTab(event, '${tabId}')`);

  // Insert before the "➕ New Tab" button
  const newTabBtn = document.querySelector('.new-tab-btn');
  document.getElementById('tabs').insertBefore(newTab, newTabBtn);

  // Create corresponding tab content
  const newContent = document.createElement('div');
  newContent.className = 'tab-content';
  newContent.id = tabId;
  newContent.innerHTML = `<h2>New Tab ${tabCounter}</h2><p>This is tab number ${tabCounter}.</p>`;

  document.getElementById('tabContents').appendChild(newContent);

  // Auto switch to the new tab
  switchTab({ target: newTab }, tabId);
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
}

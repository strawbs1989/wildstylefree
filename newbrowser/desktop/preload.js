const { ipcRenderer } = require('electron');
window.electronAPI = {
  createTab: (url) => ipcRenderer.send('create-tab', url)
};

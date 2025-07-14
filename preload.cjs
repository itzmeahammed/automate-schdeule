const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getItem: (key) => ipcRenderer.invoke('storage-get', key),
  setItem: (key, value) => ipcRenderer.invoke('storage-set', key, value),
}); 
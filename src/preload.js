const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    closeWindow: () => ipcRenderer.send('window-close'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    setRatio: (ratio) => ipcRenderer.send('window-set-ratio', ratio)
});

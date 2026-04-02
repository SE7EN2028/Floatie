const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    closeWindow: () => ipcRenderer.send('window-close'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    setRatio: (ratio) => ipcRenderer.send('window-set-ratio', ratio),
    moveWindow: (dx, dy) => ipcRenderer.send('window-move', dx, dy),
    getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
    saveBookmarks: (bookmarks) => ipcRenderer.send('save-bookmarks', bookmarks)
});

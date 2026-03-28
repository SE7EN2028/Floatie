const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('floatieAPI', {
  platform: process.platform,
});

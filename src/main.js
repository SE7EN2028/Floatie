const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'AudioServiceSandbox');

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 225,
    minWidth: 320,
    minHeight: 180,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: true,
    icon: path.join(__dirname, '..', 'assets', 'floatielogo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: true,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  let currentRatio = 0;
  
  ipcMain.on('window-close', () => win.close());
  
  ipcMain.on('window-maximize', () => {
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
      win.setAspectRatio(currentRatio); 
    } else {
      win.setAspectRatio(0); 
      win.maximize();
    }
  });
  
  ipcMain.on('window-set-ratio', (e, ratio) => {
    currentRatio = ratio;
    // Only apply the aspect ratio physically if we aren't currently maximized
    if (win && !win.isMaximized()) {
      win.setAspectRatio(ratio);
    }
  });
  
  ipcMain.on('window-move', (e, x, y) => {
    if (win) {
      win.setPosition(Math.round(x), Math.round(y));
    }
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '..', 'assets', 'floatielogo.png'));
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

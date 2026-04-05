const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
let win;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'AudioServiceSandbox');

function createWindow() {
  win = new BrowserWindow({
    width: 387,
    height: 220,
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
  let isAnimating = false;
  let isExpanded = false;

  ipcMain.on('window-close', () => win.close());

  let savedBounds = null;

  ipcMain.removeAllListeners('window-maximize');
  ipcMain.on('window-maximize', () => {
    if (!win) return;
    const { screen } = require('electron');

    if (isExpanded) {
      isExpanded = false;
      if (savedBounds) win.setBounds(savedBounds);
      win.setAspectRatio(currentRatio);
    } else {
      savedBounds = win.getBounds();
      isExpanded = true;
      win.setAspectRatio(0);
      const { x, y, width, height } = screen.getDisplayNearestPoint(savedBounds).workArea;
      win.setBounds({ x, y, width, height });
    }
  });

  ipcMain.on('window-set-ratio', (e, ratio) => {
    currentRatio = ratio;
    if (win && !win.isMaximized()) {
      win.setAspectRatio(ratio);
    }
  });

  ipcMain.on('window-move', (e, x, y) => {
    if (win) {
      win.setPosition(Math.round(x), Math.round(y));
    }
  });

  const userDataPath = app.getPath('userData');
  const bookmarksFile = path.join(userDataPath, 'bookmarks.json');

  ipcMain.removeHandler('get-bookmarks');
  ipcMain.handle('get-bookmarks', () => {
    try {
      if (fs.existsSync(bookmarksFile)) {
        return JSON.parse(fs.readFileSync(bookmarksFile, 'utf-8'));
      }
    } catch (e) { }
    return [];
  });

  ipcMain.removeAllListeners('save-bookmarks');
  ipcMain.on('save-bookmarks', (e, bookmarks) => {
    try {
      fs.writeFileSync(bookmarksFile, JSON.stringify(bookmarks));
    } catch (e) { }
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '..', 'assets', 'floatielogo.png'));
  }

  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.update({ added: ElectronBlocker.parse('@@||youtube.com^$document') });
    blocker.enableBlockingInSession(session.defaultSession);
  });

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

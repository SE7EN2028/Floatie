const { app, BrowserWindow, ipcMain, screen } = require('electron');
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
  let isExpanded = false;
  let pipBounds = null;

  ipcMain.on('window-close', () => win.close());

  ipcMain.on('window-maximize', () => {
    if (!win) return;

    if (isExpanded) {

      isExpanded = false;
      win.setAspectRatio(0);
      if (pipBounds) {
        win.setBounds(pipBounds, false);
      }
      setTimeout(() => {
        if (win && !isExpanded) {
          win.setAspectRatio(currentRatio);
        }
      }, 100);
    } else {
      pipBounds = win.getBounds();
      isExpanded = true;
      win.setAspectRatio(0);
      const display = screen.getDisplayNearestPoint({ x: pipBounds.x, y: pipBounds.y });
      win.setBounds(display.workArea, false);
    }
  });

  ipcMain.on('window-set-ratio', (e, ratio) => {
    currentRatio = ratio;
    if (win && !isExpanded) {
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

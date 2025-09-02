const { app, BrowserWindow, nativeImage, ipcMain } = require('electron');
const path = require('path');

const pushToGitHub = require('./gitUtil');

function createWindow() {
  const iconPath = path.join(__dirname, 'assets/otto.png');
  const icon = nativeImage.createFromPath(iconPath);
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    icon, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (process.platform === 'linux') {
    app.dock?.setIcon(icon); 
  }
  win.maximize();
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle('push-to-github', async (event, { path, message, content }) => {
  return pushToGitHub(path, message, content);
});

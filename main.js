const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');

function createWindow() {
  const iconPath = path.join(__dirname, 'assets/otto.png');
  const icon = nativeImage.createFromPath(iconPath);

  const win = new BrowserWindow({
    width: 800,
    height: 800,
    icon, 
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js')
    }
  });

  if (process.platform === 'linux') {
    app.dock?.setIcon(icon); 
  }

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
});

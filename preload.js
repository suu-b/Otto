const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pushToGitHub: (path, message, content) =>
    ipcRenderer.invoke('push-to-github', { path, message, content })
});

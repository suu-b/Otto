const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pushToGitHub: (path, message, content) => {
    return ipcRenderer.invoke('push-to-github', { path, message, content });
  },
  updateOnGitHub: (path, message, content) => {
    return ipcRenderer.invoke('update-on-github', { path, message, content });
  },
  readFileFromGitHub: (path) => {
    return ipcRenderer.invoke('read-from-github', { path });
  }
});

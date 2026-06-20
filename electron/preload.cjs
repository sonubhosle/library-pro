const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipc: {
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
        on: (channel, func) => {
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },
        send: (channel, data) => ipcRenderer.send(channel, data),
    },
    platform: process.platform,
});

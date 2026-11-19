// Funciones que la app web puede usar en la versión de escritorio
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  onCloseRequest: cb => ipcRenderer.on("close-request", () => cb()),
  confirmClose: () => ipcRenderer.send("confirm-close"),
  writeBackup: (name, data) => ipcRenderer.invoke("write-backup", name, data),
  backupDir: () => ipcRenderer.invoke("backup-dir"),
});

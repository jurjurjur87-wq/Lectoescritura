// Envoltorio de escritorio (Guadalinex / Windows).
// - Abre la app a pantalla completa.
// - Los datos se guardan en la carpeta del usuario (~/.config/Lectoescritura en Linux),
//   a salvo de que alguien borre el historial del navegador.
// - Cerrar la ventana pasa por la app: si el aula está bloqueada, pide el PIN de un docente.
// - Copias automáticas diarias en Documentos/Lectoescritura/copias (se guardan las 15 últimas).
const { app, BrowserWindow, Menu, globalShortcut, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

let win = null;
let allowClose = false;
const backupDir = () => path.join(app.getPath("documents"), "Lectoescritura", "copias");

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    backgroundColor: "#FBF7F0",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js") },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
  win.on("close", e => {
    if (allowClose) return;
    e.preventDefault();
    win.webContents.send("close-request");
  });
  globalShortcut.register("F11", () => win && win.setFullScreen(!win.isFullScreen()));
  globalShortcut.register("CommandOrControl+Q", () => win && win.close());
}

ipcMain.on("confirm-close", () => { allowClose = true; app.quit(); });
ipcMain.handle("backup-dir", () => backupDir());
ipcMain.handle("write-backup", (_e, name, data) => {
  try {
    const dir = backupDir();
    fs.mkdirSync(dir, { recursive: true });
    const safe = String(name).replace(/[^\w.\-]/g, "_");
    fs.writeFileSync(path.join(dir, safe), data, "utf8");
    const files = fs.readdirSync(dir).filter(f => f.startsWith("lectoescritura-auto-")).sort();
    while (files.length > 15) fs.unlinkSync(path.join(dir, files.shift()));
    return { ok: true, path: dir };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

app.whenReady().then(() => {
  // Permitir el micrófono para que el docente grabe audios
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === "media"));
  createWindow();
});
app.on("window-all-closed", () => app.quit());

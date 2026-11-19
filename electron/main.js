// Envoltorio de escritorio (Guadalinex / Windows).
// Abre la app a pantalla completa. Los datos se guardan en la carpeta del usuario
// (~/.config/Lectoescritura en Linux), a salvo de que alguien borre el historial del navegador.
const { app, BrowserWindow, Menu, globalShortcut } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    backgroundColor: "#FFF8EC",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
  // F11 alterna pantalla completa; Ctrl+Q cierra
  globalShortcut.register("F11", () => win.setFullScreen(!win.isFullScreen()));
  globalShortcut.register("CommandOrControl+Q", () => app.quit());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

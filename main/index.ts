import { app, BrowserWindow } from "electron";
import started from "electron-squirrel-startup";
import { setupWindows } from "./wins";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  // 初始化并创建应用窗口
  setupWindows();

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      // 重新创建应用窗口
      setupWindows();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

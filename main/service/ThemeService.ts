import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import { logManager } from "./LogService";
import { IPC_EVENTS } from "@common/constants";

class ThemeService {
  private static _instance: ThemeService;
  private _isDark: boolean = nativeTheme.shouldUseDarkColors;

  constructor() {
    const themeMode = "dark";
    if (themeMode) {
      nativeTheme.themeSource = themeMode;
      this._isDark = nativeTheme.shouldUseDarkColors;
    }
    this._setupIpcEvent();

    logManager.info(`初始主题: ${this._isDark ? "暗色模式" : "亮色模式"}`);
  }

  private _setupIpcEvent() {
    ipcMain.handle(IPC_EVENTS.SET_THEME_MODE, (_e, mode: ThemeMode) => {
      nativeTheme.themeSource = mode;
      return nativeTheme.shouldUseDarkColors;
    });
    ipcMain.handle(IPC_EVENTS.GET_THEME_MODE, () => {
      return nativeTheme.themeSource;
    });
    ipcMain.handle(IPC_EVENTS.IS_DARK_THEME, () => {
      return nativeTheme.shouldUseDarkColors;
    });
    // 监听系统主题的变化，并将最新的主题状态同步到所有打开的渲染进程窗口中
    nativeTheme.on("updated", () => {
      this._isDark = nativeTheme.shouldUseDarkColors;
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send(IPC_EVENTS.THEME_MODE_UPDATED, this._isDark);
      });
    });
  }

  // 单例模式
  public static getInstance() {
    if (!this._instance) {
      this._instance = new ThemeService();
    }
    return this._instance;
  }

  public get themeMode() {
    return nativeTheme.themeSource;
  }

  public get isDark() {
    return this._isDark;
  }
}

export const themeService = ThemeService.getInstance();
export default themeService;

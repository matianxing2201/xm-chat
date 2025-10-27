import type { WindowNames } from "@common/types";

import { IPC_EVENTS } from "@common/constants";
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  IpcMainInvokeEvent,
  type IpcMainEvent,
} from "electron";
import { debounce } from "@common/utils";

import logManager from "./LogService";
import themeManage from "./ThemeService";

import path from "node:path";

interface WindowState {
  instance: BrowserWindow | void;
  isHidden: boolean;
  onCreate: ((window: BrowserWindow) => void)[];
  onClosed: ((window: BrowserWindow) => void)[];
}

interface SizeOptions {
  width: number; // 窗口宽度
  height: number; // 窗口高度
  maxWidth?: number; // 窗口最大宽度，可选
  maxHeight?: number; // 窗口最大高度，可选
  minWidth?: number; // 窗口最小宽度，可选
  minHeight?: number; // 窗口最小高度，可选
}

const SHARED_WINDOW_OPTIONS = {
  titleBarStyle: "hidden",
  frame: false,
  title: "XM-Chat",
  darkTheme: themeManage.isDark,
  backgroundColor: themeManage.isDark ? "#2C2C2C" : "#ffffff",
  trafficLightPosition: { x: -15, y: -15 }, // 调整三个按钮位置（可选）
  webPreferences: {
    nodeIntegration: false, // 禁用 Node.js 集成，提高安全性
    contextIsolation: true, // 启用上下文隔离，防止渲染进程访问主进程 API
    sandbox: true, // 启用沙箱模式，进一步增强安全性
    backgroundThrottling: false,
    preload: path.join(__dirname, "preload.js"),
  },
} as BrowserWindowConstructorOptions;

class WindowService {
  private static _instance: WindowService;

  private _winStates: Record<WindowNames | string, WindowState> = {
    main: { instance: void 0, isHidden: false, onCreate: [], onClosed: [] },
  };

  /**
   * WindowService构造函数
   * 私有化构造函数确保单例模式，只能通过getInstance获取实例
   * 在构造函数中初始化IPC事件监听器
   */
  private constructor() {
    this._setupIpcEvents();
    logManager.info("windowsService 初始化成功");
  }

  /**
   * 设置IPC事件监听器
   * 注册窗口控制相关事件处理函数，包括关闭、最小化、最大化等操作
   * 这些事件由渲染进程通过IPC发送过来
   */
  private _setupIpcEvents() {
    const handleCloseWindow = (e: IpcMainEvent) => {
      this.close(BrowserWindow.fromWebContents(e.sender));
    };
    const handleMinimizeWindow = (e: IpcMainEvent) => {
      BrowserWindow.fromWebContents(e.sender)?.minimize();
    };
    const handleMaximizeWindow = (e: IpcMainEvent) => {
      this.toggleMax(BrowserWindow.fromWebContents(e.sender));
    };
    const handleIsWindowMaximized = (e: IpcMainInvokeEvent) => {
      return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false;
    };

    ipcMain.on(IPC_EVENTS.CLOSE_WINDOW, handleCloseWindow);
    ipcMain.on(IPC_EVENTS.MINIMIZE_WINDOW, handleMinimizeWindow);
    ipcMain.on(IPC_EVENTS.MAXIMIZE_WINDOW, handleMaximizeWindow);
    ipcMain.handle(IPC_EVENTS.IS_WINDOW_MAXIMIZED, handleIsWindowMaximized);
  }

  /**
   * 获取WindowService单例实例
   * 使用懒加载模式，只有在首次调用时才创建实例
   *
   * @returns WindowService的单例实例
   */
  public static getInstance(): WindowService {
    if (!this._instance) {
      this._instance = new WindowService();
    }
    return this._instance;
  }

  /**
   * 创建新窗口的核心方法
   * 根据提供的窗口名称和尺寸配置创建一个新的浏览器窗口
   *
   * @param name - 窗口名称，用于标识窗口类型
   * @param size - 窗口尺寸配置对象，包含宽度、高度等属性
   * @returns 创建的BrowserWindow实例
   */
  public create(name: WindowNames, size: SizeOptions) {
    const window = new BrowserWindow({
      ...SHARED_WINDOW_OPTIONS,
      ...size,
    });

    // 设置窗口生命周期事件并加载窗口模板
    this._setupWinLifecycle(window, name)._loadWindowTemplate(window, name);

    // 触发窗口加载事件
    this._winStates[name].onCreate.forEach((callback) => callback(window));
    window.webContents.openDevTools();
    return window;
  }

  /**
   * 设置窗口生命周期事件监听器
   * 监听窗口的关闭、调整大小等事件，处理相应逻辑
   *
   * @param window - 要设置生命周期的窗口实例
   * @param _name - 窗口名称
   * @returns 当前WindowService实例，支持链式调用
   */
  private _setupWinLifecycle(window: BrowserWindow, _name: WindowNames) {
    const updateWinStatus = debounce(
      () =>
        !window?.isDestroyed() &&
        window?.webContents?.send(
          IPC_EVENTS.MAXIMIZE_WINDOW + "back",
          window?.isMaximized()
        ),
      80
    );
    // 监听窗口关闭事件
    window.once("closed", () => {
      window?.destroy();
      window?.removeListener("resize", updateWinStatus);
      logManager.info(`窗口: ${name} 关闭`);
    });
    // 监听窗口调整大小事件
    window.on("resize", updateWinStatus);
    // this._loadWindowTemplate(win, name);
    return this;
  }

  /**
   * 加载窗口模板内容
   * 根据运行环境（开发/生产）加载相应的页面内容
   * 开发环境下从开发服务器加载，生产环境下从本地文件加载
   *
   * @param window - 要加载内容的窗口实例
   * @param name - 窗口名称，决定加载哪个HTML文件
   */
  private _loadWindowTemplate(window: BrowserWindow, name: WindowNames) {
    // 检查是否存在开发服务器 URL，若存在则表示处于开发环境
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return window.loadURL(
        `${MAIN_WINDOW_VITE_DEV_SERVER_URL}${"/html/" + (name === "main" ? "" : name)}`
      );
    }
    window.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/html/${name === "main" ? "index" : name}.html`
      )
    );
  }

  /**
   * 关闭指定窗口
   * 安全地关闭窗口，会先检查窗口是否存在
   *
   * @param target - 要关闭的窗口实例
   */
  public close(target: BrowserWindow | void | null) {
    if (!target) return;
    target?.close();
  }

  /**
   * 切换窗口最大化状态
   * 如果窗口已最大化则取消最大化，否则最大化窗口
   *
   * @param target - 要切换最大化的窗口实例
   */
  public toggleMax(target: BrowserWindow | void | null) {
    if (!target) return;
    target.isMaximized() ? target.unmaximize() : target.maximize();
  }

  public onWindowCreate(
    name: WindowNames,
    callback: (window: BrowserWindow) => void
  ) {
    this._winStates[name].onCreate.push(callback);
  }

  public onWindowClosed(
    name: WindowNames,
    callback: (window: BrowserWindow) => void
  ) {
    this._winStates[name].onClosed.push(callback);
  }
}

export const windowManager = WindowService.getInstance();

export default windowManager;

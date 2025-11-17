import type { WindowNames } from "@common/types";

import { IPC_EVENTS, WINDOW_NAMES } from "@common/constants";
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  WebContentsView,
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
    setting: { instance: void 0, isHidden: false, onCreate: [], onClosed: [] },
    dialog: { instance: void 0, isHidden: false, onCreate: [], onClosed: [] },
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

  private _isReallyClose(windowName: WindowNames | void) {
    if (windowName === WINDOW_NAMES.MAIN) return true;
    if (windowName === WINDOW_NAMES.SETTING) return false;

    return true;
  }

  /**
   * 设置IPC事件监听器
   * 注册窗口控制相关事件处理函数，包括关闭、最小化、最大化等操作
   * 这些事件由渲染进程通过IPC发送过来
   */
  private _setupIpcEvents() {
    const handleCloseWindow = (e: IpcMainEvent) => {
      const target = BrowserWindow.fromWebContents(e.sender);

      // 获取窗口名称
      const winName = this.getName(target);

      // 判断窗口真正关闭还是仅隐藏 并调用
      this.close(target, this._isReallyClose(winName));
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
  public create(
    name: WindowNames,
    size: SizeOptions,
    moreOpts?: BrowserWindowConstructorOptions
  ) {
    if (this.get(name)) return;

    const isHiddenWin = this._isHiddenWin(name);

    let window = this._createWinInstance(name, { ...size, ...moreOpts });

    !isHiddenWin &&
      this._setupWinLifecycle(window, name)._loadWindowTemplate(window, name);

    this._listenWinReady({
      win: window,
      isHiddenWin,
      size,
    });

    if (!isHiddenWin) {
      this._winStates[name].instance = window;
      this._winStates[name].onCreate.forEach((callback) => callback(window));
    }

    if (isHiddenWin) {
      this._winStates[name].isHidden = false;
      logManager.info(`Hidden window show: ${name}`);
    }

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
  private _setupWinLifecycle(window: BrowserWindow, name: WindowNames) {
    const updateWinStatus = debounce(() => !window?.isDestroyed()
      && window?.webContents?.send(IPC_EVENTS.MAXIMIZE_WINDOW + 'back', window?.isMaximized()), 80);
    window.once('closed', () => {
      this._winStates[name].onClosed.forEach(callback => callback(window));
      window?.destroy();
      window?.removeListener('resize', updateWinStatus);
      this._winStates[name].instance = void 0;
      this._winStates[name].isHidden = false;
      logManager.info(`Window closed: ${name}`);
    });
    window.on('resize', updateWinStatus)
    return this;
  }

  private _listenWinReady(params: {
    win: BrowserWindow;
    isHiddenWin: boolean;
    size: SizeOptions;
  }) {
    const onReady = () => {
      params.win?.once("show", () =>
        setTimeout(() => this._applySizeConstraints(params.win, params.size), 2)
      );

      params.win?.show();
    };

    if (!params.isHiddenWin) {
      const loadingHandler = this._addLoadingView(params.win, params.size);
      loadingHandler?.(onReady);
    } else {
      onReady();
    }
  }

  private _addLoadingView(window: BrowserWindow, size: SizeOptions) {
    let loadingView: WebContentsView | void = new WebContentsView();
    let rendererIsReady = false;

    window.contentView?.addChildView(loadingView);
    loadingView.setBounds({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    });
    loadingView.webContents.loadFile(path.join(__dirname, "loading.html"));

    const onRendererIsReady = (e: IpcMainEvent) => {
      if (e.sender !== window?.webContents || rendererIsReady) return;
      rendererIsReady = true;
      window.contentView.removeChildView(loadingView as WebContentsView);
      ipcMain.removeListener(IPC_EVENTS.RENDERER_IS_READY, onRendererIsReady);
      loadingView = void 0;
    };

    ipcMain.on(IPC_EVENTS.RENDERER_IS_READY, onRendererIsReady);

    return (cb: () => void) =>
      loadingView?.webContents.once("dom-ready", () => {
        loadingView?.webContents.insertCSS(`body {
          background-color: ${themeManage.isDark ? "#2C2C2C" : "#FFFFFF"} !important; 
          --stop-color-start: ${themeManage.isDark ? "#A0A0A0" : "#7F7F7F"} !important;
          --stop-color-end: ${themeManage.isDark ? "#A0A0A0" : "#7F7F7F"} !important;
      }`);
        cb();
      });
  }

  private _applySizeConstraints(win: BrowserWindow, size: SizeOptions) {
    if (size.maxHeight && size.maxWidth) {
      win.setMaximumSize(size.maxWidth, size.maxHeight);
    }
    if (size.minHeight && size.minWidth) {
      win.setMinimumSize(size.minWidth, size.minHeight);
    }
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

  private _handleCloseWindowState(target: BrowserWindow, really: Boolean) {
    const name = this.getName(target) as WindowNames;

    if (name) {
      if (!really) this._winStates[name].isHidden = true;
      else this._winStates[name].instance = void 0;
    }

    setTimeout(() => {
      target[really ? "close" : "hide"]?.();
      this._checkAndCloseAllWinodws();
    }, 210);
  }

  private _checkAndCloseAllWinodws() {
    if (
      !this._winStates[WINDOW_NAMES.MAIN].instance ||
      this._winStates[WINDOW_NAMES.MAIN].instance?.isDestroyed()
    )
      return Object.values(this._winStates).forEach((win) =>
        win?.instance?.close()
      );

    const minimizeToTray = false; // todo : 从配置中读取
    if (!minimizeToTray && !this.get(WINDOW_NAMES.MAIN)?.isVisible())
      return Object.values(this._winStates).forEach(
        (win) => !win?.instance?.isVisible() && win?.instance?.close()
      );
  }

  private _isHiddenWin(name: WindowNames) {
    return this._winStates[name] && this._winStates[name].isHidden;
  }

  private _createWinInstance(
    name: WindowNames,
    opts?: BrowserWindowConstructorOptions
  ) {
    return this._isHiddenWin(name)
      ? (this._winStates[name].instance as BrowserWindow)
      : new BrowserWindow({
          ...SHARED_WINDOW_OPTIONS,
          ...opts,
        });
  }

  /**
   * 关闭指定窗口
   * 安全地关闭窗口，会先检查窗口是否存在
   *
   * @param target - 要关闭的窗口实例
   */
  public close(target: BrowserWindow | void | null, really: Boolean = true) {
    if (!target) return;

    const name = this.getName(target);
    logManager.info(`Close window: ${name}, really: ${really}`);
    this._handleCloseWindowState(target, really);
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

  public getName(target: BrowserWindow | void | null): WindowNames | void {
    if (!target) return;
    for (const [name, win] of Object.entries(this._winStates) as [
      WindowNames,
      { instance: BrowserWindow | void } | void,
    ][]) {
      if (win?.instance === target) return name;
    }
  }

  public get(name: WindowNames) {
    if (this._winStates[name].isHidden) return void 0;
    return this._winStates[name].instance;
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

export enum IPC_EVENTS {
  CLOSE_WINDOW = "close-window",
  MINIMIZE_WINDOW = "minimize-window",
  MAXIMIZE_WINDOW = "maximize-window",
  IS_WINDOW_MAXIMIZED = "is-window-maximized",
  SET_THEME_MODE = "set-theme-mode",
  GET_THEME_MODE = "get-theme-mode",
  IS_DARK_THEME = "is-dark-theme",
  SHOW_CONTEXT_MENU = "show-context-menu",

  LOG_DEBUG = "log-debug",
  LOG_INFO = "log-info",
  LOG_WARN = "log-warn",
  LOG_ERROR = "log-error",

  // main to renderer
  THEME_MODE_UPDATED = "theme-mode-updated",
}

export enum WINDOW_NAMES {
  MAIN = "main",
  SETTING = "setting",
  DIALOG = "dialog",
}

export const MAIN_WIN_SIZE = {
  width: 1024,
  height: 800,
  minWidth: 1024,
  minHeight: 800,
} as const;

export interface Conversation {
  id: number;
  title: string;
  selectedModel: string;
  createdAt: number;
  updatedAt: number;
  providerId: number;
  pinned: boolean;
  type?: "divider" | "conversation";
}

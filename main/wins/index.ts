import { setupMainWindow } from "./main";
import { setupDialogWindow } from "./dialog";

/**
 * 应用窗口初始化入口函数
 *
 * 该函数是整个 Electron 应用的窗口管理系统入口点，
 * 负责初始化和创建应用所需的所有窗口。
 * 目前仅创建主窗口，但可以通过扩展支持多窗口应用。
 */
export function setupWindows() {
  // 初始化主窗口
  setupMainWindow();

  // 初始化对话弹窗
  setupDialogWindow();
}

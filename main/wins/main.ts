import { WINDOW_NAMES, MAIN_WIN_SIZE } from "@common/constants";

import { windowManager } from "../service/WindowService";

/**
 * 主窗口初始化函数
 *
 * 该函数负责创建应用的主窗口，使用预定义的窗口名称和尺寸配置。
 * 通过调用 WindowManager 服务的实际创建方法来完成窗口的创建过程。
 *
 * @see WINDOW_NAMES.MAIN - 主窗口的标识名称
 * @see MAIN_WIN_SIZE - 主窗口的尺寸配置
 * @see windowManager.create - 实际创建窗口的方法
 */
export function setupMainWindow() {
  // 调用 WindowManager 服务创建主窗口
  // 参数1: 窗口名称，用于标识窗口类型
  // 参数2: 窗口尺寸配置，包含宽高和最小宽高等属性
  windowManager.create(WINDOW_NAMES.MAIN, MAIN_WIN_SIZE);
}

import type { BrowserWindow } from "electron";
import {
  WINDOW_NAMES,
  MAIN_WIN_SIZE,
  IPC_EVENTS,
  MENU_IDS,
  CONVERSATION_ITEM_MENU_IDS,
  CONVERSATION_LIST_MENU_IDS,
} from "@common/constants";

import { windowManager } from "../service/WindowService";
import { menuManager } from "../service/MenuService";
import { logManager } from "../service/LogService";

const registerMenus = (window: BrowserWindow) => {
  const conversationItemMenuItemClick = (id: string) => {
    logManager.logUserOperation(
      `${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_ITEM}-${id}`
    );
    window.webContents.send(
      `${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_ITEM}`,
      id
    );
  };

  menuManager.register(MENU_IDS.CONVERSATION_ITEM, [
    {
      id: CONVERSATION_ITEM_MENU_IDS.PIN,
      label: "menu.conversation.pinConversation",
      click: () =>
        conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.PIN),
    },
    {
      id: CONVERSATION_ITEM_MENU_IDS.RENAME,
      label: "menu.conversation.renameConversation",
      click: () =>
        conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.RENAME),
    },
    {
      id: CONVERSATION_ITEM_MENU_IDS.DEL,
      label: "menu.conversation.delConversation",
      click: () =>
        conversationItemMenuItemClick(CONVERSATION_ITEM_MENU_IDS.DEL),
    },
  ]);

  const conversationListMenuItemClick = (id: string) => {
    logManager.logUserOperation(
      `${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_LIST}-${id}`
    );
    window.webContents.send(
      `${IPC_EVENTS.SHOW_CONTEXT_MENU}:${MENU_IDS.CONVERSATION_LIST}`,
      id
    );
  };

  menuManager.register(MENU_IDS.CONVERSATION_LIST, [
    {
      id: CONVERSATION_LIST_MENU_IDS.NEW_CONVERSATION,
      label: "menu.conversation.newConversation",
      click: () =>
        conversationListMenuItemClick(
          CONVERSATION_LIST_MENU_IDS.NEW_CONVERSATION
        ),
    },
    { type: "separator" },
    {
      id: CONVERSATION_LIST_MENU_IDS.SORT_BY,
      label: "menu.conversation.sortBy",
      submenu: [
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_BY_CREATE_TIME,
          label: "menu.conversation.sortByCreateTime",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_BY_CREATE_TIME
            ),
        },
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_BY_UPDATE_TIME,
          label: "menu.conversation.sortByUpdateTime",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_BY_UPDATE_TIME
            ),
        },
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_BY_NAME,
          label: "menu.conversation.sortByName",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_BY_NAME
            ),
        },
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_BY_MODEL,
          label: "menu.conversation.sortByModel",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_BY_MODEL
            ),
        },
        { type: "separator" },
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_ASCENDING,
          label: "menu.conversation.sortAscending",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_ASCENDING
            ),
        },
        {
          id: CONVERSATION_LIST_MENU_IDS.SORT_DESCENDING,
          label: "menu.conversation.sortDescending",
          type: "radio",
          checked: false,
          click: () =>
            conversationListMenuItemClick(
              CONVERSATION_LIST_MENU_IDS.SORT_DESCENDING
            ),
        },
      ],
    },
    {
      id: CONVERSATION_LIST_MENU_IDS.BATCH_OPERATIONS,
      label: "menu.conversation.batchOperations",
      click: () =>
        conversationListMenuItemClick(
          CONVERSATION_LIST_MENU_IDS.BATCH_OPERATIONS
        ),
    },
  ]);
};

/**
 * 主窗口初始化函数
 *
 * 该函数负责创建应用的主窗口，使用预定义的窗口名称和尺寸配置。
 * 通过调用 WindowManager 服务的实际创建方法来完成窗口的创建过程。
 */
export function setupMainWindow() {
  windowManager.onWindowCreate(WINDOW_NAMES.MAIN, (mainWindow) => {
    registerMenus(mainWindow);
  });

  // 调用 WindowManager 服务创建主窗口
  // 参数1: 窗口名称，用于标识窗口类型
  // 参数2: 窗口尺寸配置，包含宽高和最小宽高等属性
  windowManager.create(WINDOW_NAMES.MAIN, MAIN_WIN_SIZE);
}

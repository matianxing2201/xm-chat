import { ipcMain, Menu, type MenuItemConstructorOptions } from "electron";
import { IPC_EVENTS } from "@common/constants";
import { cloneDeep } from "@common/utils";
import logManager from "./LogService";

let t = (val: string | undefined) => val;

class MenuService {
  private static _instance: MenuService;
  private _menuTemplate: Map<string, MenuItemConstructorOptions[]> = new Map();
  private _currentMenu?: Menu = void 0;

  private constructor() {
    this._setupIpcListener(); // 初始化 Menu 监听
    this._setupLanguageChangeListener(); // 初始化 语言 监听
    logManager.info("MenuService 初始化成功");
  }

  private _setupIpcListener() {
    // 监听菜单
    ipcMain.handle(
      IPC_EVENTS.SHOW_CONTEXT_MENU,
      (_, menuId, dynamicOptions?: string) =>
        new Promise((resolve) =>
          this.showMenu(menuId, () => resolve(true), dynamicOptions)
        )
    );
  }

  private _setupLanguageChangeListener() {
    //  :todo
  }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new MenuService();
    }
    return this._instance;
  }

  /**
   * 注册一个菜单模板
   * @param menuId 菜单的唯一标识符
   * @param template 菜单项配置数组
   */
  public register(menuId: string, template: MenuItemConstructorOptions[]) {
    this._menuTemplate.set(menuId, template);
    return menuId;
  }

  /**
   * 显示指定的上下文菜单
   * @param menuId 要显示的菜单 ID
   * @param onClose 菜单关闭后的回调函数
   * @param dynamicOptions 动态配置选项的 JSON 字符串
   */
  public showMenu(
    menuId: string,
    onClose?: () => void,
    dynamicOptions?: string
  ) {
    if (!this._currentMenu) return;

    const template = cloneDeep(this._menuTemplate.get(menuId));
    if (!template) {
      logManager.warn(`Menu ${menuId} 未找到.`);
      onClose?.();
      return;
    }

    let _dynamicOptions: Array<
      Partial<MenuItemConstructorOptions> & { id: string }
    > = [];
    try {
      _dynamicOptions = Array.isArray(dynamicOptions)
        ? dynamicOptions
        : JSON.parse(dynamicOptions ?? "[]");
    } catch (error) {
      logManager.error(`加载动态 ${menuId} 失败: ${error}`);
    }

    /**
     *  翻译菜单项
     * @param item
     * @returns
     */
    const translationItem = (
      item: MenuItemConstructorOptions
    ): MenuItemConstructorOptions => {
      // 递归处理子菜单
      if (item.submenu) {
        return {
          ...item,
          label: t(item?.label) ?? void 0,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (item: MenuItemConstructorOptions) => translationItem(item)
          ),
        };
      }
      return {
        ...item,
        label: t(item?.label) ?? void 0,
      };
    };

    const localizedTemplate = template.map((item) => {
      // 如果没有动态选项，直接进行翻译
      if (!Array.isArray(_dynamicOptions) || !_dynamicOptions.length) {
        return translationItem(item);
      }
      // 查找是否有匹配当前项 ID 的动态选项
      const dynamicItem = _dynamicOptions.find((_item) => _item.id === item.id);

      if (dynamicItem) {
        const mergedItem = { ...item, ...dynamicItem };
        return translationItem(mergedItem);
      }

      if (item.submenu) {
        return translationItem({
          ...item,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (__item: MenuItemConstructorOptions) => {
              const dynamicItem = _dynamicOptions.find(
                (_item) => _item.id === __item.id
              );
              return { ...__item, ...dynamicItem };
            }
          ),
        });
      }

      return translationItem(item);
    });

    // 创建 菜单 模板
    const menu = Menu.buildFromTemplate(localizedTemplate);

    this._currentMenu = menu;

    // 显示菜单
    menu.popup({
      callback: () => {
        this._currentMenu = void 0;
        onClose?.();
      },
    });
  }

  public destroyMenu(menuId: string) {
    this._menuTemplate.delete(menuId);
  }

  public destroyed() {
    this._menuTemplate.clear();
    this._currentMenu = void 0;
  }
}

export const menuManager = MenuService.getInstance();
export default menuManager;

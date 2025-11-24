import type { OpenAISetting } from "./types";
import { encode, decode } from "js-base64";

/**
 * 防抖函数
 * @param fn 需要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn 需要执行的函数
 * @param interval 间隔时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

export function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cloneDeep(item)) as T;
  }

  const clone = Object.assign({}, obj);
  for (const key in clone) {
    if (Object.prototype.hasOwnProperty.call(clone, key)) {
      clone[key] = cloneDeep(clone[key]);
    }
  }
  return clone;
}

export function simpleCloneDeep<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("simpleCloneDeep failed:", error);
    return obj;
  }
}
/**
 * 将OpenAI设置对象序列化为base64编码的字符串
 * @param setting OpenAI设置对象，包含baseURL和apiKey等配置
 * @returns base64编码后的设置字符串，如果序列化失败则返回空字符串
 */
export function stringifyOpenAISetting(setting: OpenAISetting) {
  try {
    return encode(JSON.stringify(setting));
  } catch (error) {
    console.error("stringifyOpenAISetting failed:", error);
    return "";
  }
}

/**
 * 将base64编码的字符串解析为OpenAI设置对象
 * @param setting base64编码的设置字符串
 * @returns 解析后的OpenAI设置对象，如果解析失败则返回空对象
 */
export function parseOpenAISetting(setting: string): OpenAISetting {
  try {
    return JSON.parse(decode(setting));
  } catch (error) {
    console.error("parseOpenAISetting failed:", error);
    return {} as OpenAISetting;
  }
}

/**
 * 根据指定键对数组进行去重
 * @template T - 数组元素的类型，必须是对象类型
 * @param arr 需要去重的数组
 * @param key 用于判断重复的键名
 * @returns 去重后的新数组，保留每个键值对应的第一个出现的元素
 */
export function uniqueByKey<T extends Record<string, any>>(
  arr: T[],
  key: keyof T
): T[] {
  const seen = new Map<any, boolean>();
  return arr.filter((item) => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.set(keyValue, true);
    return true;
  });
}

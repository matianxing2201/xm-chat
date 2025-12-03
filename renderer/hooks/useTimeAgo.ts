import { formatTimeAgo } from "@vueuse/core";

/**
 * 判断两个日期是否在同一周
 * @param data1 日期1
 * @param data2 日期2
 * @returns     是否在同一周
 */
function isSameCalenderWeek(data1: Date, data2: Date): boolean {
  const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    const day = start.getDay(); // 0 周日 1 周一 2 周二 3 周三 4 周四 5 周五 6 周六

    // 周日 减去 6 天 周一
    // 其他天 减去 1 天 周一
    const diff = start.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(start.setDate(diff));
  };

  const getStartOfWeek1 = getStartOfWeek(data1);
  const getStartOfWeek2 = getStartOfWeek(data2);
  return getStartOfWeek1.toDateString() === getStartOfWeek2.toDateString();
}

/**
 * 格式化时间为 HH:MM
 * @param date 日期
 * @returns 格式化后的时间
 */
function formatTimeOny(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * 获取星期几
 * @param date 日期
 * @param t 翻译函数
 * @returns 星期几
 */
function getWeekDay(date: Date, t: any): string {
  const weekDays = [
    t("timeAgo.weekday.sun"),
    t("timeAgo.weekday.mon"),
    t("timeAgo.weekday.tue"),
    t("timeAgo.weekday.wed"),
    t("timeAgo.weekday.thu"),
    t("timeAgo.weekday.fri"),
    t("timeAgo.weekday.sat"),
  ];
  return weekDays[date.getDay()];
}

/**
 * 格式化月日
 * @param date 日期
 * @param locale 语言
 * @returns 格式化后的月日
 */
function formatMonthDay(date: Date, locale: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (locale === "en") {
    return `${month}/${day}`;
  } else {
    return `${month}月${day}日`;
  }
}

/**
 * 格式化一年以上日期时间
 * @param date 日期
 * @param locale 语言
 * @returns 格式化后的日期时间
 */
function formatFullDateTime(date: Date, locale: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (locale === "en") {
    // 英文格式: MM/DD/YYYY HH:MM
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  } else {
    // 中文格式: YYYY年MM月DD日 HH:MM
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
}

function formatTimeAgoCore(
  targetDate: Date,
  now: Date,
  t: any,
  locale: string
): string {
  const diff = now.getTime() - targetDate.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);

  const isSameDay = targetDate.toDateString() === now.toDateString();

  const isSameWeek = isSameCalenderWeek(targetDate, now);

  const isSameYear = targetDate.getFullYear() === now.getFullYear();

  // 一小时前
  if (hours < 1) {
    if (minutes < 5) {
      return t("timeAgo.justNow");
    }
    return t("timeAgo.minutes", { count: minutes });
  }

  // 一小时到24小时前
  else if (isSameDay) {
    return formatTimeOny(targetDate);
  }

  // 24小时到7天前
  else if (isSameWeek) {
    return `${getWeekDay(targetDate, t)} ${formatTimeOny(targetDate)}`;
  }

  // 一周到一年以内 同年
  else if (!isSameYear && !isSameWeek && isSameYear) {
    return `${formatMonthDay(targetDate, locale)} ${formatTimeOny(targetDate)}`;
  }

  // 一年以上
  else {
    return formatFullDateTime(targetDate, locale);
  }
}

export function useBatchTimeAgo() {
  const { t, locale } = useI18n();
  const now = ref(new Date());
  const timer = ref<number | null>(null);
  const updateInterval = 1000 * 60; // 每分钟更新一次

  const setupTimer = () => {
    if (!timer.value) {
      timer.value = window.setInterval(() => {
        now.value = new Date();
      }, updateInterval);
    }
  };

  const clearTimer = () => {
    if (timer.value) {
      window.clearInterval(timer.value);
      timer.value = null;
    }
  };

  const formatTimeAgo = (timestamp: number | Date): string => {
    const targetDate =
      timestamp instanceof Date ? timestamp : new Date(timestamp);
    return formatTimeAgoCore(targetDate, now.value, t, locale.value);
  };

  setupTimer();

  onUnmounted(() => {
    clearTimer();
  });

  return {
    formatTimeAgo,
    clearTimer,
  };
}

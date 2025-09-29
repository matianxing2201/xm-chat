import { createI18n, type I18nOptions } from "vue-i18n";

// 同步导入语言包
import zh from "@locales/zh.json";
import en from "@locales/en.json";

const options: I18nOptions = {
  locale: "zh",
  fallbackLocale: "zh",
  messages: {
    zh,
    en,
  },
};

const i18n = createI18n(options);

export default i18n;
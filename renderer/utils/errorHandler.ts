import type { Plugin } from "vue";
import logger from "./logger";

export const errorHandler: Plugin = function (app) {
  app.config.errorHandler = (err, instance, info) => {
    logger.error("Vue error:", err, instance, info);
  };

  window.onerror = (message, source, lineno, colno, error) => {
    logger.error("Window error:", message, source, lineno, colno, error);
  };

  window.onunhandledrejection = (event) => {
    logger.error("Unhandled Promise Rejection:", event);
    console.log("Promise 对象:", event.reason);
  };
};

export default errorHandler;

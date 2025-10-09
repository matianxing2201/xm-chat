import "./index.css";
import i18n from "./i18n";
import App from "./App.vue";
import errorHandler from "./utils/errorHandler";

createApp(App).use(i18n).use(errorHandler).mount("#app");

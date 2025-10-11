import "./styles/index.css";
import i18n from "./i18n";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import errorHandler from "./utils/errorHandler";

const pinia = createPinia();

createApp(App).use(i18n).use(router).use(pinia).use(errorHandler).mount("#app");

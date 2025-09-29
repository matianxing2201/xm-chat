import "./index.css";
import { createApp } from "vue";
import i18n from "./i18n";
import App from "../renderer/App.vue";

createApp(App).use(i18n).mount("#app");

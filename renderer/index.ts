import { createApp, type Plugin } from "vue";
import "./styles/index.css";
import i18n from "./i18n";
import { createPinia } from "pinia";
import App from "./App.vue";
import { createRouter, createMemoryHistory } from "vue-router";
import errorHandler from "./utils/errorHandler";

import TitleBar from "./components/TitleBar.vue";
import DragRegion from "./components/DragRegion.vue";

import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("vue", xml);

// 全局注册组件
const components: Plugin = function (app) {
  app.component("TitleBar", TitleBar);
  app.component("DragRegion", DragRegion);
};

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: "/",
      component: () => import("./views/index.vue"),
      children: [
        {
          path: "/",
          redirect: "conversation",
        },
        {
          name: "conversation",
          path: "conversation/:id?",
          component: () => import("./views/conversation.vue"),
        },
      ],
    },
  ],
});

const pinia = createPinia();

createApp(App)
  .use(i18n)
  .use(router)
  .use(components)
  .use(pinia)
  .use(errorHandler)
  .mount("#app");

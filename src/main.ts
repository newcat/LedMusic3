import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

import { BaklavaVuePlugin } from "@baklavajs/plugin-renderer-vue";
import "@baklavajs/plugin-renderer-vue/dist/styles.css";
Vue.use(BaklavaVuePlugin);

// @ts-ignore
import splitPane from "vue-splitpane";
Vue.component("SplitPane", splitPane);

import "./styles/all.scss";
import vuetify from "./plugins/vuetify";

import { wasmInterop } from "./wasmInterop";
wasmInterop.init();

new (Vue as any)({
    vuetify,
    render: (h: any) => h(App),
}).$mount("#app");

import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

import { BaklavaVuePlugin } from "@baklavajs/plugin-renderer-vue";
import "@baklavajs/plugin-renderer-vue/dist/styles.css";
Vue.use(BaklavaVuePlugin);

import "./styles/all.scss";

(async () => {

    const { memory } = await import("../pkg/index_bg");
    const m = await import("../pkg/index");

    m.greet();
    const carr = m.ColorArray.new(16);
    const cptr = carr.colors();
    const cdata = new Float32Array(memory.buffer, cptr, carr.length * 3);
    cdata.forEach((v, i) => {
        cdata[i] = Math.random();
    });
    carr.log();

})();

new Vue({
    render: (h) => h(App),
}).$mount("#app");

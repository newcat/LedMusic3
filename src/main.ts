import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

import { BaklavaVuePlugin } from "@baklavajs/plugin-renderer-vue";
import "@baklavajs/plugin-renderer-vue/dist/styles.css";
Vue.use(BaklavaVuePlugin);

import "./styles/all.scss";

function mix(c1: number[], c2: number[], resultArray: number[]) {
    for (let i = 0; i < resultArray.length; i++) {
        resultArray[i] = (c1[i] + c2[i]) / 2.0;
    }
}

(async () => {

    await new Promise((res) => setTimeout(res, 5000));
    console.log("Starting tests");

    const { memory } = await import("../pkg/index_bg");
    const m = await import("../pkg/index");

    const bigIterations = 5;
    const smallIterations = 100000;
    const arrSize = 1024;

    function getCarr(init: boolean) {
        const carr = m.ColorArray.new(arrSize);
        const cptr = carr.colors();
        const cdata = new Float32Array(memory.buffer, cptr, carr.length * 3);
        if (init) {
            cdata.forEach((v, i) => {
                cdata[i] = Math.random();
            });
        }
        return carr;
    }

    function getJsCarr() {
        const carr = [];
        for (let i = 0; i < arrSize * 3; i++) {
            carr[i] = Math.random();
        }
        return carr;
    }

    const carr1 = getCarr(true);
    const carr2 = getCarr(true);
    const carr3 = getCarr(false);

    for (let a = 0; a < bigIterations; a++) {
        const start = performance.now();
        for (let i = 0; i < smallIterations; i++) {
            m.mix(carr1, carr2, carr3);
        }
        const end = performance.now();
        console.log("Rust", end - start);
    }

    const jsCarr1 = getJsCarr();
    const jsCarr2 = getJsCarr();
    const jsCarr3 = getJsCarr();

    for (let a = 0; a < bigIterations; a++) {
        const start = performance.now();
        for (let i = 0; i < smallIterations; i++) {
            mix(jsCarr1, jsCarr2, jsCarr3);
        }
        const end = performance.now();
        console.log("JS", end - start);
    }


})();

new Vue({
    render: (h) => h(App),
}).$mount("#app");

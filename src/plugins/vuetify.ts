import "@/styles/variables.scss";
import Vue from "vue";
// @ts-ignore
import Vuetify from "vuetify/lib";

const vuetify = new Vuetify({
    icons: {
        iconfont: "md",
    },
    theme: {
        dark: true,
        themes: {
            dark: {
                primary: "#1eb980",
                secondary: "#045d56",
                accent: "#ffcf44",
            },
        },
    },
});

Vue.use(Vuetify);

export default vuetify;

import Vue from "vue";
// @ts-ignore
import Vuetify from "vuetify/lib";

// @ts-ignore
import colors from "vuetify/lib/util/colors";

const vuetify = new Vuetify({
    icons: {
        iconfont: "md"
    },
    theme: {
        dark: true,
        themes: {
            /*dark: {
                primary: "#6666ff",
                secondary: "#535e7a",
                accent: "#37e89c",
            }*/
            light: {
                primary: colors.purple,
                secondary: colors.grey.darken1,
                accent: colors.shades.black,
                error: colors.red.accent3,
            },
            dark: {
                primary: colors.blue.lighten3,
                secondary: colors.purple
            }
        }
    }
});

Vue.use(Vuetify);

export default vuetify;

import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";

import PreviewOption from "./PreviewOption.vue";
import ColorOption from "./ColorOption.vue";

export function registerOptions(vp: ViewPlugin) {
    vp.registerOption("PreviewOption", PreviewOption);
    vp.registerOption("ColorOption", ColorOption);
}

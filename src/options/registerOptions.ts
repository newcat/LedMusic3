import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";

import PreviewOption from "./PreviewOption.vue";

export function registerOptions(vp: ViewPlugin) {
    vp.registerOption("PreviewOption", PreviewOption);
}

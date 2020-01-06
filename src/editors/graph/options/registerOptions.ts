import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";

import ColorOption from "./ColorOption.vue";
import PreviewOption from "./PreviewOption.vue";
import SpectrumOption from "./SpectrumOption.vue";

export function registerOptions(vp: ViewPlugin) {
    vp.registerOption("ColorOption", ColorOption);
    vp.registerOption("PreviewOption", PreviewOption);
    vp.registerOption("SpectrumOption", SpectrumOption);
}

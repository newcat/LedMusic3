import { NodeBuilder } from "@baklavajs/core";

export default new NodeBuilder("DotNode")
    .addInputInterface("Center Position", "NumberOption", 0, { type: "number" })
    .addInputInterface("Alpha", "NumberOption", 1, { type: "number" })
    .addInputInterface("Color", "ColorOption", () => [0, 0, 0], { type: "color_single" })
    .addInputInterface("Glow", "NumberOption", 0, { type: "number" })
    .addInputInterface("Symmetric", "CheckboxOption", false, { type: "boolean" })
    .addOption("Glow Type", "SelectOption", () => (
        { selected: "Linear", items: ["Linear", "Exponential", "Gaussian"] }))
    .addOutputInterface("Colors", { type: "color_array" })
    .build();

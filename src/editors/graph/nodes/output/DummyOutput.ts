import { NodeBuilder } from "@baklavajs/core";
import chroma from "chroma-js";

export const DummyOutput = new NodeBuilder("DummyOutput")
    .addInputInterface("Colors", undefined, () => [chroma("black")], { type: "color_array" })
    .addOption("Preview", "PreviewOption", () => [chroma("black")])
    .onCalculate((n) => {
        n.setOptionValue("Preview", n.getInterface("Colors").value);
    })
    .build();


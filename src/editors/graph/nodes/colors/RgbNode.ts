import { Node } from "@baklavajs/core";
import chroma from "chroma-js";

export class RgbNode extends Node {

    public type = "RgbNode";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("R", "SliderOption", 0, { type: "number", min: 0, max: 1 });
        this.addInputInterface("G", "SliderOption", 0, { type: "number", min: 0, max: 1 });
        this.addInputInterface("B", "SliderOption", 0, { type: "number", min: 0, max: 1 });
        this.addOption("Preview", "PreviewOption", [chroma("black")]);
        this.addOutputInterface("Color", { type: "color_single" });
    }

    public calculate() {
        const r = this.getInterface("R").value * 255;
        const g = this.getInterface("G").value * 255;
        const b = this.getInterface("B").value * 255;
        const c = chroma(r, g, b, "rgb");
        this.setOptionValue("Preview", [c]);
        this.getInterface("Color").value = c;
    }

}

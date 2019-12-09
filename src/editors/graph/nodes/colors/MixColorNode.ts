import { Node } from "@baklavajs/core";
import chroma, { Color } from "chroma-js";

export class MixColorNode extends Node {

    public type = "MixColorNode";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Color 1", undefined, () => [chroma("black")], { type: "color_array" });
        this.addInputInterface("Color 2", undefined, () => [chroma("black")], { type: "color_array" });
        this.addInputInterface("Factor", "SliderOption", 0.5, { type: "number", min: 0, max: 1 });
        this.addOption("Color Space", "SelectOption", { selected: "RGB", items: ["RGB", "HSL", "LAB", "LCH", "LRGB"] });
        this.addOutputInterface("Output", { type: "color_array" });
    }

    public calculate() {

        const colorsA: Color[] = this.getInterface("Color 1").value;
        const colorsB: Color[] = this.getInterface("Color 2").value;
        const factor: number = this.getInterface("Factor").value;
        const cspace = this.getOptionValue("Color Space").toLowerCase();

        const length = Math.max(colorsA.length, colorsB.length);
        const result: Color[] = new Array(length);

        for (let i = 0; i < length; i++) {
            const a = length < colorsA.length ? colorsA[i] : colorsA[colorsA.length - 1];
            const b = length < colorsB.length ? colorsB[i] : colorsB[colorsB.length - 1];
            result[i] = chroma.mix(a, b, factor, cspace);
        }

        this.getInterface("Output").value = result;

    }

}
import { Node } from "@baklavajs/core";
import chroma, { Color } from "chroma-js";

export class BlendColorNode extends Node {

    public type = "BlendColorNode";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Color 1", undefined, () => [chroma("black")], { type: "color_array" });
        this.addInputInterface("Color 2", undefined, () => [chroma("black")], { type: "color_array" });
        this.addOption("Mode", "SelectOption", "Multiply", undefined,
            { items: ["Multiply", "Darken", "Lighten", "Screen", "Overlay", "Burn", "Dodge"] });
        this.addOutputInterface("Output", { type: "color_array" });
    }

    public calculate() {

        const colorsA: Color[] = this.getInterface("Color 1").value;
        const colorsB: Color[] = this.getInterface("Color 2").value;
        const mode = this.getOptionValue("Mode").toLowerCase();

        const length = Math.max(colorsA.length, colorsB.length);
        const result: Color[] = new Array(length);

        for (let i = 0; i < length; i++) {
            const a = length < colorsA.length ? colorsA[i] : colorsA[colorsA.length - 1];
            const b = length < colorsB.length ? colorsB[i] : colorsB[colorsB.length - 1];
            result[i] = chroma.blend(a, b, mode);
        }

        this.getInterface("Output").value = result;

    }

}

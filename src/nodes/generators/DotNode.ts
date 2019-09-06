import { Node } from "@baklavajs/core";
import chroma, { Color } from "chroma-js";

export class DotNode extends Node {

    public type = "DotNode";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Center Position", "SliderOption", 0, { type: "number", min: 0, max: 1 });
        this.addInputInterface("Alpha", "SliderOption", 1, { type: "number", min: 0, max: 1 });
        this.addInputInterface("Color", "ColorOption", chroma("lightblue"), { type: "color_single" });
        this.addInputInterface("Glow", "NumberOption", 0, { type: "number" });
        this.addInputInterface("Symmetric", "CheckboxOption", false, { type: "boolean" });
        this.addOption("Glow Type", "SelectOption",
            { selected: "Linear", items: ["Linear", "Exponential", "Gaussian"] });
        this.addOutputInterface("Colors", { type: "color_array" });
    }

    public calculate() {

        const resolution = 1024; // TODO

        const centerPosition = this.clamp(this.getInterface("Center Position").value, 0, 1);
        const alpha = this.clamp(this.getInterface("Alpha").value, 0, 1);
        const glow = Math.max(0, this.getInterface("Glow").value);
        const color: Color = this.getInterface("Color").value;
        const symmetric: boolean = this.getInterface("Symmetric").value;

        const result: Color[] = new Array(resolution);

        let intensity;
        switch (this.getOptionValue("Glow Type").selected) {
            case "Exponential":
                intensity = this.exponentialIntensity;
                break;
            case "Gaussian":
                intensity = this.gaussianIntensity;
                break;
            default:
            case "Linear":
                intensity = this.linearIntensity;
                break;
        }

        for (let i = 0; i < resolution; i++) {
            const position = i / resolution;
            const luminance = this.clamp(alpha * intensity(centerPosition, position, glow) * color.get("hsv.v"), 0, 1);
            result[i] = color.set("hsv.v", luminance);
        }

        if (symmetric) {
            const reverseColors: Color[] = new Array(resolution);
            for (let i = 0; i < resolution; i++) {
                reverseColors[resolution - i - 1] = result[i];
            }
            for (let i = 0; i < resolution; i++) {
                result[i] = chroma.blend(result[i], reverseColors[i], "lighten");
            }
        }

        this.getInterface("Colors").value = result;

    }

    private clamp(v: number, min: number, max: number) {
        return Math.min(max, Math.max(min, v));
    }

    private linearIntensity(center: number, position: number, width: number): number {
        if (width === 0) { return 0; }
        const distance = Math.abs(position - center);
        return 1 - distance / width;
    }

    private exponentialIntensity(center: number, position: number, pBase: number): number {
        const distance = Math.abs(position - center);
        return Math.pow(pBase, distance);
    }

    private gaussianIntensity(center: number, position: number, stdDeviation: number): number {
        return Math.exp(-((position - center) * (position - center)) /
            (2 * stdDeviation * stdDeviation)) / (stdDeviation * Math.sqrt(2 * Math.PI));
    }

}

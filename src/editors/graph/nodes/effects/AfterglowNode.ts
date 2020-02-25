import { Node } from "@baklavajs/core";
import { Color, mix, blend } from "../../colors";

const resolution = 60; // TODO

export class AfterglowNode extends Node {

    public type = "AfterglowNode";
    public name = this.type;

    private buffer!: Color[];

    public constructor() {
        super();
        this.addInputInterface("Input", undefined, [[0, 0, 0]], { type: "color_array" });
        this.addInputInterface("Strength", "NumberOption", 0.05, { type: "number" });
        this.addOutputInterface("Output", { type: "color_array" });
        this.initializeBuffer();
    }

    public calculate() {

        const input: Color[] = this.getInterface("Input").value;
        const strength: number = this.getInterface("Strength").value;

        const result = [];
        for (let i = 0; i < resolution; i++) {
            const a = i < input.length ? input[i] : ([0, 0, 0] as Color);
            const b = i < this.buffer.length ? this.buffer[i] : ([0, 0, 0] as Color);
            this.buffer[i] = mix(b, a, strength);
            result[i] = blend(this.buffer[i], a, "lighten");
        }

        this.getInterface("Output").value = result;

    }

    private clamp(v: number, min: number, max: number) {
        if (!Number.isFinite(v)) { return 0; }
        return Math.min(max, Math.max(min, v));
    }

    private initializeBuffer() {
        this.buffer = [];
        for (let i = 0; i < resolution; i++) {
            this.buffer.push([0, 0, 0]);
        }
    }

}

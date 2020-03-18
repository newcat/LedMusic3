import { Node } from "@baklavajs/core";
import { Color, mix, blend } from "../../colors";
import { globalState } from "@/entities/globalState";
import { observe } from "@nx-js/observer-util";

const THRESHOLD = 4;

export class AfterglowNode extends Node {

    public type = "Afterglow";
    public name = this.type;

    private buffer!: Color[];

    public constructor() {
        super();
        this.addInputInterface("Input", undefined, [[0, 0, 0]], { type: "color_array" });
        this.addInputInterface("Strength", "NumberOption", 0.75, { type: "number" });
        this.addOutputInterface("Output", { type: "color_array" });
        observe(() => { this.initializeBuffer(globalState.resolution); });
    }

    public calculate() {

        const input: Color[] = this.getInterface("Input").value;
        const strength: number = this.getInterface("Strength").value;
        const resolution = globalState.resolution;

        const result = [];
        for (let i = 0; i < resolution; i++) {
            const a = i < input.length ? input[i] : ([0, 0, 0] as Color);
            let b = i < this.buffer.length ? this.buffer[i] : ([0, 0, 0] as Color);
            b = mix(b, [0, 0, 0], 1 - strength);
            const c = blend(b, a, "lighten");
            this.buffer[i] = Math.max(...c) < THRESHOLD ? a : c;
            result[i] = c;
        }

        this.getInterface("Output").value = result;

    }

    private initializeBuffer(resolution: number) {
        this.buffer = [];
        for (let i = 0; i < resolution; i++) {
            this.buffer.push([0, 0, 0]);
        }
    }

}

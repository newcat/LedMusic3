import { Node } from "@baklavajs/core";
import { TICKS_PER_BEAT } from "@/constants";
import globalState from "@/entities/globalState";

export class LfoNode extends Node {

    public type = "LfoNode";
    public name = this.type;

    private rates = [
        { text: "1/8 Beat", value: TICKS_PER_BEAT / 8 },
        { text: "1/6 Beat", value: TICKS_PER_BEAT / 6 },
        { text: "1/4 Beat", value: TICKS_PER_BEAT / 4 },
        { text: "1/3 Beat", value: TICKS_PER_BEAT / 3 },
        { text: "1/2 Beat", value: TICKS_PER_BEAT / 2 },
        { text: "1 Beat", value: TICKS_PER_BEAT },
        { text: "2 Beats", value: 2 * TICKS_PER_BEAT },
        { text: "4 Beats", value: 4 * TICKS_PER_BEAT },
        { text: "8 Beats", value: 8 * TICKS_PER_BEAT },
    ];

    private shapes = [ "Sine", "Triangle", "Sawtooth", "Square" ];

    private functions: Record<string, (x: number) => number> = {
        Sine: (x: number) => Math.sin(Math.PI * 2 * x),
        Triangle: (x: number) => 4 * (x - 0.5 * Math.floor(2 * x + 0.5)) * Math.pow(-1, Math.floor(2 * x + 0.5)),
        Sawtooth: (x: number) => 2 * x - 1,
        Square: (x: number) => x < 0.5 ? -1 : 1
    };

    public constructor() {
        super();
        this.addInputInterface("Min", "NumberOption", 0, { type: "number" });
        this.addInputInterface("Max", "NumberOption", 1, { type: "number" });
        this.addInputInterface("Invert", "CheckboxOption", false, { type: "boolean" });
        this.addOption("Rate", "SelectOption", "1/2 Beat", undefined, { items: this.rates.map((r) => r.text) });
        this.addOption("Shape", "SelectOption", "Sine", undefined, { items: this.shapes });
        this.addOutputInterface("Value", { type: "number" });
    }

    public calculate() {

        const min = this.getInterface("Min").value;
        const max = this.getInterface("Max").value;
        const invert = this.getInterface("Invert").value;

        const rate = this.rates.find((r) => r.text === this.getOptionValue("Rate"))?.value ?? 1;
        const shape = this.getOptionValue("Shape");

        const f = this.functions[shape] ?? ((v: number) => v);
        const x = (globalState.position % rate) / rate;
        const rawValue = invert ? -f(x) : f(x);
        const value = min + (rawValue + 1) * 0.5 * (max - min);
        this.getInterface("Value").value = value;

    }

}

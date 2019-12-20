import { Node } from "@baklavajs/core";
import { globalProcessor } from "@/processing";

export class PeakNode extends Node {

    public type = "PeakNode";
    public name = this.type;

    public constructor() {
        super();
        this.addOutputInterface("Peak", { type: "number" });
    }

    public calculate() {
        const data = new Float32Array(256);
        globalProcessor.audioProcessor.analyserNode.getFloatTimeDomainData(data);
        let max = data[0];
        for (const d of data) { if (d > max) { max = d; } }
        this.getInterface("Output").value = max;
    }

}

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
        const data = new Uint8Array(globalProcessor.audioProcessor.analyserNode.fftSize);
        globalProcessor.audioProcessor.analyserNode.getByteTimeDomainData(data);
        let max = data[0];
        for (const d of data) { if (d > max) { max = d; } }
        this.getInterface("Peak").value = Math.min(1, Math.max(0, (max - 128) / 128));
    }

}

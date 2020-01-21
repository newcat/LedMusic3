import { Node } from "@baklavajs/core";
import { globalProcessor } from "@/processing";

export class PeakNode extends Node {

    public type = "PeakNode";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Min Decibels", "NumberOption", -60, { type: "number", min: -200, max: 0 });
        this.addInputInterface("Max Decibels", "NumberOption", 0, { type: "number", min: -200, max: 0 });
        this.addOption("Peak", "PeakOption", 0);
        this.addOutputInterface("Peak", { type: "number" });
    }

    public calculate() {
        const data = new Float32Array(globalProcessor.audioProcessor.analyserNode.fftSize);
        globalProcessor.audioProcessor.analyserNode.getFloatTimeDomainData(data);

        const sampleSize = Math.max(data.length, (globalProcessor.audioProcessor.audioContext.sampleRate / 1000) * 30);
        let sum = 0;
        for (let i = data.length - sampleSize; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / (sampleSize / 2));
        const db = 20 * Math.log10(rms);

        const minDb = this.getInterface("Min Decibels").value;
        const maxDb = this.getInterface("Max Decibels").value;
        const v = Math.min(1, Math.max(0, (db - minDb) / (maxDb - minDb)));

        this.setOptionValue("Peak", v);
        this.getInterface("Peak").value = v;
    }

}

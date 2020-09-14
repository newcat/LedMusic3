import { Node } from "@baklavajs/core";
import { Color, mix, blend, darken } from "../../colors";
import { ICalculationData } from "../../types";
import { wasmInterop } from "@/wasmInterop";

interface IParticle {
    currentLifetime: number;
    totalLifetime: number;
    position: number;
    glow: number;
    startVelocity: number;
    endVelocity: number;
    color: Color;
    startColor: Color;
    endColor: Color;
}

export class ParticleNode extends Node {
    public type = "Particle";
    public name = this.type;

    private particles: IParticle[] = [];
    private particlesToSpawn = 0.0;
    private wasmParticleNode = new wasmInterop.wasmModule.ParticleNode();
    private calcSum = 0;
    private calcIt = 0;

    constructor() {
        super();

        this.addInputInterface("Emit", "CheckboxOption", true, { type: "boolean" });
        this.addInputInterface("Rate", "NumberOption", 10, { type: "number" });
        this.addInputInterface("Start Velocity", "NumberOption", 0.3, { type: "number" });
        this.addInputInterface("End Velocity", "NumberOption", 0.05, { type: "number" });
        this.addInputInterface("Randomness", "NumberOption", 0.01, { type: "number" });
        this.addInputInterface("Glow", "NumberOption", 0.05, { type: "number" });
        this.addInputInterface("Emitter Position", "SliderOption", 0.5, { type: "number", min: 0, max: 1 });
        this.addInputInterface("Symmetric", "CheckboxOption", true, { type: "boolean" });
        this.addInputInterface("Lifetime", "NumberOption", 1, { type: "number" });
        this.addInputInterface("Start Color", "ColorOption", [173, 216, 230], { type: "color_single" });
        this.addInputInterface("End Color", "ColorOption", [0, 0, 0], { type: "color_single" });

        this.addOutputInterface("Output", { type: "color_array" });
    }

    public calculate(data: ICalculationData) {
        const start = performance.now();
        // this.calculateJs(data);
        this.calculateWasm(data);
        this.calcSum += performance.now() - start;
        this.calcIt++;
        if (this.calcIt >= 100) {
            console.log("Took ", this.calcSum / this.calcIt);
            this.calcSum = 0;
            this.calcIt = 0;
        }
        // ~4ms JS, ~0.17ms Rust with opt-level=4 and lto=true
    }

    public calculateWasm(data: ICalculationData) {
        const { fps, resolution } = data;
        const emit = this.getInterface("Emit").value;
        const rate = this.getInterface("Rate").value;
        const randomness = this.getInterface("Randomness").value;
        const glow = this.getInterface("Glow").value;
        const startVelocity = this.getInterface("Start Velocity").value;
        const endVelocity = this.getInterface("End Velocity").value;
        const emitterPosition = this.getInterface("Emitter Position").value;
        const symmetric = this.getInterface("Symmetric").value;
        const lifetimeInFrames = this.getInterface("Lifetime").value;
        const startColor = this.getInterface("Start Color").value;
        const endColor = this.getInterface("End Color").value;
        const calculationData = new wasmInterop.wasmModule.CalculationData(
            fps,
            resolution,
            emit,
            rate,
            startVelocity,
            endVelocity,
            randomness,
            glow,
            emitterPosition,
            symmetric,
            lifetimeInFrames,
            startColor,
            endColor
        );
        this.wasmParticleNode.calculate(calculationData);
        calculationData.free();

        const flattenedOutputBuffer = this.wasmParticleNode.get_output_buffer();
        const output = [];
        for (let i = 0; i < flattenedOutputBuffer.length; i += 3) {
            output.push([flattenedOutputBuffer[i], flattenedOutputBuffer[i + 1], flattenedOutputBuffer[i + 2]]);
        }
        this.getInterface("Output").value = output;
    }

    public calculateJs(data: ICalculationData) {
        const { fps, resolution } = data;

        this.particles.forEach((p) => p.currentLifetime++);
        this.particles = this.particles.filter(
            (p) => p.currentLifetime < p.totalLifetime && p.position >= 0 && p.position <= 1
        );
        this.particles.forEach((p) => {
            const lifeProgress = p.currentLifetime / p.totalLifetime;
            p.color = mix(p.startColor, p.endColor, lifeProgress);
            p.position += p.startVelocity + (p.endVelocity - p.startVelocity) * lifeProgress;
        });

        if (this.getInterface("Emit").value) {
            const rate = this.getInterface("Rate").value / fps;
            const randomness = this.getInterface("Randomness").value / fps;
            const glow = this.getInterface("Glow").value;
            let startVelocity = this.getInterface("Start Velocity").value / fps;
            let endVelocity = this.getInterface("End Velocity").value / fps;
            const emitterPosition = this.getInterface("Emitter Position").value;
            const symmetric = this.getInterface("Symmetric").value;
            const lifetimeInFrames = this.getInterface("Lifetime").value * fps;
            const startColor = this.getInterface("Start Color").value;
            const endColor = this.getInterface("End Color").value;

            startVelocity += (2 * Math.random() - 1) * randomness;
            endVelocity += (2 * Math.random() - 1) * randomness;

            this.particlesToSpawn += rate;
            while (this.particlesToSpawn > 1) {
                const p: IParticle = {
                    totalLifetime: lifetimeInFrames,
                    currentLifetime: 0,
                    position: emitterPosition,
                    glow,
                    startVelocity,
                    endVelocity,
                    color: startColor,
                    startColor,
                    endColor,
                };
                this.particles.push(p);
                if (symmetric) {
                    const p2 = { ...p, startVelocity: -startVelocity, endVelocity: -endVelocity };
                    this.particles.push(p2);
                }
                this.particlesToSpawn--;
            }
        }

        const output = new Array<Color>(resolution);
        for (let i = 0; i < output.length; i++) {
            output[i] = [0, 0, 0];
        }

        this.particles.forEach((p) => {
            const start = this.clamp(Math.floor((p.position - p.glow) * resolution), 0, output.length - 1);
            const end = this.clamp(Math.ceil((p.position + p.glow) * resolution), 0, output.length - 1);
            for (let i = start; i <= end; i++) {
                const pos = i / resolution;
                const intensity = this.clamp(this.linearIntensity(p.position, pos, p.glow), 0, 1);
                const color = blend(darken(p.color, 1 - intensity), output[i], "overlay");
                output[i] = color;
            }
        });

        this.getInterface("Output").value = output;
    }

    private linearIntensity(center: number, position: number, width: number): number {
        if (width === 0) {
            return 0;
        }
        const distance = Math.abs(position - center);
        return 1 - distance / width;
    }

    private clamp(v: number, min: number, max: number) {
        if (!Number.isFinite(v)) {
            return 0;
        }
        return Math.min(max, Math.max(min, v));
    }
}

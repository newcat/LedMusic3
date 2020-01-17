import { Node } from "@baklavajs/core";
import chroma, { Color } from "chroma-js";
import globalState from "@/entities/globalState";

interface IParticle {
    currentLifetime: number;
    totalLifetime: number;
    position: number;
    startVelocity: number;
    endVelocity: number;
    color: Color;
    startColor: Color;
    endColor: Color;
}

export class ParticleNode extends Node {

    public type = "ParticleNode";
    public name = this.type;

    private particles: IParticle[] = [];
    private particlesToSpawn = 0.0;

    constructor() {
        super();

        this.addInputInterface("Emit", "CheckboxOption", false, { type: "boolean" });
        this.addInputInterface("Rate", "NumberOption", 10, { type: "number" });
        this.addInputInterface("Start Velocity", "NumberOption", 0.1, { type: "number" });
        this.addInputInterface("End Velocity", "NumberOption", 0.05, { type: "number" });
        this.addInputInterface("Emitter Position", "SliderOption", 0.5, { type: "number", min: 0, max: 1 });
        this.addInputInterface("Symmetric", "CheckboxOption", true, { type: "boolean" });
        this.addInputInterface("Lifetime", "NumberOption", 30, { type: "number" });
        this.addInputInterface("Start Color", "ColorOption", chroma("red"), { type: "color_single" });
        this.addInputInterface("End Color", "ColorOption", chroma("blue"), { type: "color_single" });

        this.addOutputInterface("Output", { type: "color_array" });

    }

    public calculate() {

        const resolution = 60; // TODO

        this.particles.forEach((p) => p.currentLifetime++);
        this.particles = this.particles.filter((p) =>
            p.currentLifetime < p.totalLifetime && p.position >= 0 && p.position <= 1);
        this.particles.forEach((p) => {
            const lifeProgress = p.currentLifetime / p.totalLifetime;
            p.color = chroma.mix(p.startColor, p.endColor, lifeProgress);
            p.position += p.startVelocity + (p.endVelocity - p.startVelocity) * lifeProgress;
        });

        if (this.getInterface("Emit").value) {

            const fps = globalState.fps;
            const rate = this.getInterface("Rate").value / fps;
            const startVelocity = this.getInterface("Start Velocity").value / fps;
            const endVelocity = this.getInterface("End Velocity").value / fps;
            const emitterPosition = this.getInterface("Emitter Position").value;
            const symmetric = this.getInterface("Symmetric").value;
            const lifetimeInFrames = this.getInterface("Lifetime").value * fps;
            const startColor = this.getInterface("Start Color").value;
            const endColor = this.getInterface("End Color").value;

            this.particlesToSpawn += rate;
            while (this.particlesToSpawn > 1) {
                const p = {
                    totalLifetime: lifetimeInFrames,
                    currentLifetime: 0,
                    position: emitterPosition,
                    startVelocity,
                    endVelocity,
                    color: startColor,
                    startColor,
                    endColor
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
        for (let i = 0; i < output.length; i++) { output[i] = chroma("black"); }
        this.particles.forEach((p) => {
            const left = Math.floor(p.position * resolution);
            const right = left + 1;

            // position: 22.8, left: 22, right: 23 ->
            if (left >= 0 && left < resolution) {
                output[left] = chroma.blend(p.color.darken(p.position * resolution - left), output[left], "overlay");
            }

            if (right >= 0 && right < resolution) {
                output[right] = chroma.blend(p.color.darken(right - p.position * resolution), output[right], "overlay");
            }
        });

        this.getInterface("Output").value = output;

    }

}

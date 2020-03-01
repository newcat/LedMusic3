import { Node } from "@baklavajs/core";
import { globalState } from "@/entities/globalState";
import { Color, mix, blend, darken } from "../../colors";

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

        this.addInputInterface("Emit", "CheckboxOption", true, { type: "boolean" });
        this.addInputInterface("Rate", "NumberOption", 10, { type: "number" });
        this.addInputInterface("Start Velocity", "NumberOption", 0.3, { type: "number" });
        this.addInputInterface("End Velocity", "NumberOption", 0.05, { type: "number" });
        this.addInputInterface("Randomness", "NumberOption", 0.01, { type: "number" });
        this.addInputInterface("Emitter Position", "SliderOption", 0.5, { type: "number", min: 0, max: 1 });
        this.addInputInterface("Symmetric", "CheckboxOption", true, { type: "boolean" });
        this.addInputInterface("Lifetime", "NumberOption", 1, { type: "number" });
        this.addInputInterface("Start Color", "ColorOption", [173, 216, 230], { type: "color_single" });
        this.addInputInterface("End Color", "ColorOption", [0, 0, 0], { type: "color_single" });

        this.addOutputInterface("Output", { type: "color_array" });

    }

    public calculate() {

        const resolution = 60; // TODO

        this.particles.forEach((p) => p.currentLifetime++);
        this.particles = this.particles.filter((p) =>
            p.currentLifetime < p.totalLifetime && p.position >= 0 && p.position <= 1);
        this.particles.forEach((p) => {
            const lifeProgress = p.currentLifetime / p.totalLifetime;
            p.color = mix(p.startColor, p.endColor, lifeProgress);
            p.position += p.startVelocity + (p.endVelocity - p.startVelocity) * lifeProgress;
        });

        if (this.getInterface("Emit").value) {

            const fps = globalState.fps;
            const rate = this.getInterface("Rate").value / fps;
            const randomness = this.getInterface("Randomness").value / fps;
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
        for (let i = 0; i < output.length; i++) { output[i] = [0, 0, 0]; }
        this.particles.forEach((p) => {
            const left = Math.floor(p.position * resolution);
            const right = left + 1;

            // position: 22.8, left: 22, right: 23 ->
            if (left >= 0 && left < resolution) {
                output[left] = blend(darken(p.color, p.position * resolution - left), output[left], "overlay");
            }

            if (right >= 0 && right < resolution) {
                output[right] = blend(darken(p.color, right - p.position * resolution), output[right], "overlay");
            }
        });

        this.getInterface("Output").value = output;

    }

}

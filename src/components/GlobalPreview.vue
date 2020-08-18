<template>
    <div ref="wrapper" style="width: 100%; height: 30px;">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Application, Graphics } from "pixi.js";
import { AdvancedBloomFilter } from "@pixi/filter-advanced-bloom";
import { globalProcessor } from "../processing";
import { Color } from "@/editors/graph/colors";

@Component
export default class PreviewOption extends Vue {
    private canvas?: HTMLCanvasElement;
    private app?: Application;
    private graphics?: Graphics;

    public mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.app = new Application({
            view: this.canvas,
            resizeTo: this.$refs.wrapper as HTMLElement,
            antialias: true,
        });
        this.graphics = new Graphics();
        this.graphics.filters = [
            new AdvancedBloomFilter({
                threshold: 0,
                bloomScale: 2,
            }),
        ];
        this.app.stage.addChild(this.graphics);
        globalProcessor.events.globalPreviewUpdated.subscribe(this, () => this.draw());
    }

    public draw() {
        if (!this.canvas || !this.app || !this.graphics) {
            return;
        }

        const value = globalProcessor.globalPreview;
        const screenWidth = this.app.renderer.screen.width;
        const screenHeight = this.app.renderer.screen.height;
        const total = value.length;
        const ledRadius = Math.min(5, (0.5 * screenWidth) / total);

        this.graphics.clear();
        this.graphics.beginFill(0).drawRect(0, 0, screenWidth, screenHeight).endFill();

        for (let i = 0; i < total; i++) {
            const position = i / total;
            this.graphics
                .beginFill(this.getHexValueOfColor(value[i]))
                .drawCircle(position * screenWidth, screenHeight / 2, ledRadius)
                .endFill();
        }
    }

    public destroyed() {
        if (this.app) {
            this.app.destroy();
        }
    }

    private getHexValueOfColor(c: Color) {
        return c[0] * 2 ** 16 + c[1] * 2 ** 8 + c[2];
    }
}
</script>

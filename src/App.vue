<template>
<div style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
    <baklava-editor :plugin="viewPlugin"></baklava-editor>
    <div style="height: 50vh;" ref="wrapper"></div>
    <div>
        <button @click="loadAudio">Load Audio</button>
        <button @click="playPause">Play/Pause</button>
    </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import chroma from "chroma-js";

import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { InterfaceTypePlugin } from "@baklavajs/plugin-interface-types";
import { OptionPlugin, NumberOption } from "@baklavajs/plugin-options-vue";
import { Engine } from "@baklavajs/plugin-engine";

import { registerNodes } from "@/nodes/registerNodes";
import { registerOptions } from "@/options/registerOptions";
import GlobalProperties from "@/GlobalProperties";

import { createTimeline, Editor as LokumEditor, Track, Item } from "lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { MusicProcessor } from "./processing/musicProcessor";

@Component
export default class App extends Vue {

    public editor = new Editor();
    public viewPlugin = new ViewPlugin();
    public intfTypePlugin = new InterfaceTypePlugin();
    public enginePlugin = new Engine(false);

    public lokumEditor = new LokumEditor();
    private mp = new MusicProcessor();
    private waveformTexture: Texture|null = null;
    private musicItem: Item|null = null;
    private playIndicatorGraphics = new Graphics();
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

    public created() {

        this.editor.use(this.enginePlugin);
        this.editor.use(this.viewPlugin);
        this.editor.use(this.intfTypePlugin);
        this.editor.use(new OptionPlugin());

        registerNodes(this.editor);
        registerOptions(this.viewPlugin);

        this.intfTypePlugin.addType("boolean", "darkcyan");
        this.intfTypePlugin.addType("color_single", "gold");
        this.intfTypePlugin.addType("color_array", "coral");
        this.intfTypePlugin.addType("number", "gray");
        this.intfTypePlugin.addType("positions", "lightblue");

        this.intfTypePlugin.addConversion("number", "boolean");
        this.intfTypePlugin.addConversion("number", "color_single", (v) => chroma(v, v, v));
        this.intfTypePlugin.addConversion("number", "color_array", (v) => [chroma(v, v, v)]);
        this.intfTypePlugin.addConversion("boolean", "number");

        setInterval(() => {
            this.enginePlugin.calculate();
        }, 1000 / GlobalProperties.fps);

    }

    public async mounted() {
        const { root, timeline } = await createTimeline(this.lokumEditor as any, this.$refs.wrapper as HTMLElement);
        const t = new Track("Music");
        t.removable = false;
        this.lokumEditor.addTrack(t);
        this.fpsText.position.set(10, 10);
        root.app.stage.addChild(this.fpsText);
        root.app.ticker.add(() => {
            this.fpsText.text = root.app.ticker.elapsedMS.toFixed(2);
            this.mp.updatePosition();
            const x = root.positionCalculator.getX(this.mp.position) + timeline.props.trackHeaderWidth;
            if (x < timeline.props.trackHeaderWidth) {
                this.playIndicatorGraphics.visible = false;
            } else {
                this.playIndicatorGraphics.visible = true;
                this.playIndicatorGraphics.x = x;
            }
        });
        root.eventManager.events.renderItem.subscribe(this, ({ item, graphics, width, height }) => {
            this.renderWaveformItem(item, graphics, width, height);
        });
        root.eventManager.events.resize.subscribe(this, ({ height }) => {
            this.createPlayIndicator(height);
        });
        root.app.stage.addChild(this.playIndicatorGraphics);
        root.positionCalculator.unitWidth = 2;
        root.positionCalculator.markerSpace = 24;
        root.positionCalculator.markerMajorMultiplier = 24 * 4;
        this.createPlayIndicator(root.app.renderer.screen.height);
    }

    public async loadAudio() {
        const response = await fetch("beat.mp3");
        const buff = await response.arrayBuffer();
        const auBuff = await this.mp.decodeArrayBuffer(buff);
        this.mp.load(auBuff);
        this.mp.volume = 0.1;
        this.waveformTexture = this.getWaveformTexture();
        this.musicItem = new Item(0, this.mp.secondsToUnits(this.mp.duration), { type: "music" });
        this.musicItem.resizable = false;
        this.lokumEditor.tracks[0].items.push(this.musicItem);
    }

    public playPause() {
        if (this.mp.isPlaying) {
            this.mp.pause();
        } else {
            this.mp.play();
        }
    }

    private getWaveformTexture() {
        const peaks = this.mp.getPeaks(30);
        const canvas = document.createElement("canvas");
        canvas.width = peaks.length;
        canvas.height = 300;
        const ctx = canvas.getContext("2d")!;
        const center = 300 / 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, center);
        peaks.forEach((p, i) => {
            const pxOffCenter = (300 / 2) * (p / 255);
            ctx.lineTo(i, center - pxOffCenter);
        });
        for (let i = peaks.length - 1; i >= 0; i--) {
            const pxOffCenter = (300 / 2) * (peaks[i] / 255);
            ctx.lineTo(i, center + pxOffCenter);
        }
        ctx.closePath();
        ctx.fill();
        return Texture.from(canvas);
    }

    private createPlayIndicator(height: number) {
        this.playIndicatorGraphics.clear();
        this.playIndicatorGraphics
            .beginFill(0xFFFF00)
            .moveTo(-4, 0)
            .lineTo(0, 6)
            .lineTo(4, 0)
            .closePath()
            .endFill()
            .lineStyle(1, 0xFFFF00)
            .moveTo(0, 0)
            .lineTo(0, height);
    }

    private renderWaveformItem(item: Item, graphics: Graphics, width: number, height: number) {
        if (this.waveformTexture && item.data && item.data.type === "music") {
            let sprite: Sprite;
            if (graphics.children.length === 0) {
                sprite = new Sprite(this.waveformTexture);
                graphics.addChild(sprite);
            } else {
                sprite = graphics.children[0] as Sprite;
            }
            sprite.width = width;
            sprite.height = height;
        }
    }

}
</script>

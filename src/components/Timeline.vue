<template>
<div style="height: 50vh;" ref="wrapper"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { createTimeline, Editor as LokumEditor, Track, Item } from "lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { AudioProcessor } from "../processing/audioProcessor";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

@Component
export default class Timeline extends Vue {

    public lokumEditor = new LokumEditor();
    /*private mp = new AudioTrackProcessor();*/
    private mp = {} as any;
    private waveformParts: IWaveformPart[]|null = null;
    private musicItem: Item|null = null;
    private playIndicatorGraphics = new Graphics();
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

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
        timeline.header.graphics.interactive = true;
        root.eventManager.events.pointerdown.subscribe(timeline.header.graphics, (ev) => {
            const x = ev.data.global.x as number;
            let unit = root.positionCalculator.getUnit(x - timeline.props.trackHeaderWidth);
            if (unit < 0) { unit = 0; }
            this.mp.position = unit;
        });
        root.eventManager.events.keydown.subscribe(this, (ev) => {
            if (ev.key === " ") {
                this.playPause();
            }
        });
        root.app.stage.addChild(this.playIndicatorGraphics);
        root.positionCalculator.unitWidth = 2;
        root.positionCalculator.markerSpace = 24;
        root.positionCalculator.markerMajorMultiplier = 24 * 4;
        this.createPlayIndicator(root.app.renderer.screen.height);
    }

    public async loadAudio(ev: any) {
        const f = ev.target.files[0] as File;
        const reader = new FileReader();
        const buff = await new Promise<ArrayBuffer>((res) => {
            reader.onload = (e) => res(e.target!.result as ArrayBuffer);
            reader.readAsArrayBuffer(f);
        });
        const auBuff = await this.mp.decodeArrayBuffer(buff);
        this.mp.load(auBuff);
        this.mp.volume = 0.1;
        this.waveformParts = this.getWaveformSprites();
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

    private getWaveformSprites() {
        const peaks = this.mp.getPeaks(70);
        const sprites: IWaveformPart[] = [];
        for (let i = 0; i < peaks.length; i += 1024) {
            const end = Math.min(i + 1024, peaks.length);
            sprites.push({
                start: i,
                end,
                sprite: new Sprite(this.createPartWaveformTexture(peaks, i, end))
            });
        }
        return sprites;
    }

    private createPartWaveformTexture(peaks: Uint8Array, start: number, end: number) {
        const canvas = document.createElement("canvas");
        canvas.width = end - start;
        canvas.height = 300;
        const ctx = canvas.getContext("2d")!;
        const center = 300 / 2;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(0, center);
        for (let i = start; i < end; i++) {
            const pxOffCenter = (300 / 2) * (peaks[i] / 255);
            ctx.lineTo(i - start, center - pxOffCenter);
        }
        for (let i = end - 1; i >= start; i--) {
            const pxOffCenter = (300 / 2) * (peaks[i] / 255);
            ctx.lineTo(i - start, center + pxOffCenter);
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
        if (this.waveformParts && item.data && item.data.type === "music") {
            if (graphics.children.length === 0) {
                this.waveformParts.forEach((p) => graphics.addChild(p.sprite));
            }
            const totalLength = this.waveformParts[this.waveformParts.length - 1].end;
            const factor = width / totalLength;
            this.waveformParts.forEach((p) => {
                p.sprite.x = p.start * factor;
                p.sprite.width = (p.end - p.start) * factor;
                p.sprite.height = height;
            });
        }
    }

}
</script>
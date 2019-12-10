<template>
<div style="height: 100%;" ref="wrapper"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { createTimeline, Editor as LokumEditor, Track, Item } from "@/lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { AudioProcessor } from "../../processing/audioProcessor";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

@Component
export default class Timeline extends Vue {

    public lokumEditor = new LokumEditor();
    /*private mp = new AudioTrackProcessor();*/
    // private mp = {} as any;
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
            // this.mp.updatePosition();
            // const x = root.positionCalculator.getX(this.mp.position) + timeline.props.trackHeaderWidth;
            const x = 100;
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
            // this.mp.position = unit;
        });
        root.eventManager.events.keydown.subscribe(this, (ev) => {
            if (ev.key === " ") {
                // TODO: this.playPause();
            }
        });
        root.app.stage.addChild(this.playIndicatorGraphics);
        root.positionCalculator.unitWidth = 2;
        root.positionCalculator.markerSpace = 24;
        root.positionCalculator.markerMajorMultiplier = 24 * 4;
        this.createPlayIndicator(root.app.renderer.screen.height);
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
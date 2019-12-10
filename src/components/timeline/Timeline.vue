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
    }

}
</script>
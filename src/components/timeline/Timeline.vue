<template>
<div style="height: 100%;" ref="wrapper" @drop="drop" @dragover="$event.preventDefault()"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { createTimeline, Editor as LokumEditor, Track, Item } from "@/lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { AudioProcessor } from "../../processing/audioProcessor";
import globalState from "../../entities/globalState";
import renderWaveform from "./renderWaveform";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

@Component
export default class Timeline extends Vue {

    public lokumEditor = new LokumEditor();
    private playIndicatorGraphics = new Graphics();
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

    private musicTrack = new Track("Music");

    public async mounted() {

        const { root, timeline } = await createTimeline(this.lokumEditor as any, this.$refs.wrapper as HTMLElement);

        this.musicTrack.removable = false;
        this.lokumEditor.addTrack(this.musicTrack);

        this.fpsText.position.set(10, 10);
        root.app.stage.addChild(this.fpsText);

        root.app.ticker.add(() => {
            this.fpsText.text = root.app.ticker.elapsedMS.toFixed(2);
            // this.mp.updatePosition();
            // const x = root.positionCalculator.getX(this.mp.position) + timeline.props.trackHeaderWidth;
        });

        timeline.header.graphics.interactive = true;
        root.eventBus.events.pointerdown.subscribe(timeline.header.graphics, (ev) => {
            const x = ev.data.global.x as number;
            let unit = root.positionCalculator.getUnit(x - timeline.props.trackHeaderWidth);
            if (unit < 0) { unit = 0; }
            // this.mp.position = unit;
        });

        root.eventBus.events.keydown.subscribe(this, (ev) => {
            if (ev.key === " ") {
                // TODO: this.playPause();
            }
        });

        root.eventBus.events.renderItem.subscribe(this, ({ item, graphics, width, height }) => {
            renderWaveform(item, graphics, width, height);
        });

        root.app.stage.addChild(this.playIndicatorGraphics);
        root.positionCalculator.unitWidth = 2;
        root.positionCalculator.markerSpace = 24;
        root.positionCalculator.markerMajorMultiplier = 24 * 4;
        (window as any).$data = timeline;
    }

    public drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.find((i) => i.id === id);
        if (libraryItem) {
            const item = new Item(this.musicTrack.id, 0, 100, { libraryItem });
            // item.resizable = false;
            this.lokumEditor.addItem(item);
        }
    }

}
</script>
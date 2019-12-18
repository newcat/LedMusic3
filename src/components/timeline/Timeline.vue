<template>
<div style="height: 100%;" ref="wrapper" @drop="drop" @dragover="$event.preventDefault()"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { createTimeline, Editor, Track, Item } from "@/lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { AudioProcessor } from "../../processing/audioProcessor";
import globalState from "../../entities/globalState";
import renderWaveform from "./renderWaveform";
import { AudioFile } from "../../entities/library";
import { TICKS_PER_BEAT } from "../../constants";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

enum LabelMode {
    BEATS,
    BARS
}

@Component
export default class Timeline extends Vue {

    public editor = new Editor();

    private playIndicatorGraphics = new Graphics();
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

    private musicTrack = new Track("Music");

    private labelMode: LabelMode = LabelMode.BEATS;

    public async mounted() {

        const { root, timeline } = await createTimeline(this.editor as any, this.$refs.wrapper as HTMLElement);

        this.musicTrack.removable = false;
        this.editor.addTrack(this.musicTrack);

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

        root.positionCalculator.unitWidth = 0.5;
        root.positionCalculator.markerSpace = TICKS_PER_BEAT * 4;
        root.positionCalculator.markerMajorMultiplier = 4;
        this.editor.labelFunction = (u) => (u / (TICKS_PER_BEAT * 16)).toString();
        root.positionCalculator.events.zoomed.subscribe(this, () => {
            const pc = root.positionCalculator;
            if (pc.unitWidth < 0.25) {
                pc.markerSpace = TICKS_PER_BEAT * 16;
                pc.markerMajorMultiplier = 1;
            } else {
                pc.markerSpace = TICKS_PER_BEAT * 4;
                pc.markerMajorMultiplier = 4;
            }
        });

        (window as any).$data = timeline;
    }

    public drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.find((i) => i.id === id);
        if (!libraryItem) { return; }

        let item: Item|undefined;
        switch (libraryItem.type) {
            case "audioFile":
                item = this.addMusicItem(libraryItem as AudioFile);
                break;
        }

        if (item) {
            this.editor.addItem(item);
        }
    }

    private addMusicItem(libraryItem: AudioFile): Item|undefined {
        if (libraryItem.loading) { return; }
        const length = libraryItem.audioBuffer!.duration * (globalState.bpm / 60) * TICKS_PER_BEAT;
        const item = new Item(this.musicTrack.id, 0, length, { libraryItem });
        item.resizable = false;
        return item;
    }

}
</script>
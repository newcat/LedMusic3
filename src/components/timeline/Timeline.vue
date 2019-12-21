<template lang="pug">
v-card.d-flex.flex-column
    .d-flex.px-3.align-items-center.elevation-4(style="height:48px")
        v-btn(text, @click="() => editor.addTrack()") Add Track
    .flex-grow-1(ref="wrapper" @drop="drop" @dragover="$event.preventDefault()")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { createTimeline, Drawable, Track, Item } from "@/lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { TICKS_PER_BEAT } from "@/constants";
import { LokumEditor } from "@/editors/timeline";
import globalState from "@/entities/globalState";
import { AudioFile, LibraryItemType, GraphLibraryItem } from "@/entities/library";
import { AudioProcessor, TimelineProcessor, globalProcessor } from "@/processing";
import renderWaveform from "./renderWaveform";
import { PositionIndicator } from "./positionIndicator";

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

    public editor = globalState.timeline;

    private positionIndicator!: PositionIndicator;
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

    private labelMode: LabelMode = LabelMode.BEATS;

    public async mounted() {

        const { root, timeline } = await createTimeline(this.editor, this.$refs.wrapper as HTMLElement);

        this.fpsText.position.set(10, 10);
        root.app.stage.addChild(this.fpsText);

        this.positionIndicator = Drawable.createView(root, PositionIndicator, { position: 0, trackHeaderWidth: timeline.props.trackHeaderWidth });
        root.app.stage.addChild(this.positionIndicator.graphics);

        root.app.ticker.add(() => {
            this.positionIndicator.tick();
            this.fpsText.text = root.app.ticker.elapsedMS.toFixed(2);
        });

        globalProcessor.events.positionChanged.subscribe(this, (position) => {
            this.positionIndicator.props.position = position;
        });

        timeline.header.graphics.interactive = true;
        root.eventBus.events.pointerdown.subscribe(timeline.header.graphics, (ev) => {
            const x = ev.data.global.x as number;
            let unit = root.positionCalculator.getUnit(x - timeline.props.trackHeaderWidth);
            if (unit < 0) { unit = 0; }
            globalProcessor.position = unit;
        });

        root.eventBus.events.keydown.subscribe(this, (ev) => {
            if (ev.key === " ") {
                if (globalProcessor.isPlaying) {
                    globalProcessor.pause();
                } else {
                    globalProcessor.play();
                }
            }
        });

        root.eventBus.events.renderItem.subscribe(this, ({ item, graphics, width, height }) => {
            renderWaveform(item, graphics, width, height);
        });

        root.positionCalculator.unitWidth = 2.5;
        root.positionCalculator.markerSpace = TICKS_PER_BEAT * 4;
        root.positionCalculator.markerMajorMultiplier = 4;
        root.positionCalculator.events.zoomed.subscribe(this, () => {
            const pc = root.positionCalculator;
            if (pc.unitWidth < 0.25) {
                pc.markerSpace = TICKS_PER_BEAT * 16;
                pc.markerMajorMultiplier = 1;
            } else if (pc.unitWidth > 2) {
                pc.markerSpace = TICKS_PER_BEAT;
                pc.markerMajorMultiplier = 4;
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
            case LibraryItemType.AUDIO_FILE:
                item = this.addMusicItem(libraryItem as AudioFile);
                break;
            case LibraryItemType.GRAPH:
                item = this.addGraphItem(libraryItem as GraphLibraryItem);
                break;
        }

        if (item) {
            this.editor.addItem(item);
        }
    }

    private addMusicItem(libraryItem: AudioFile): Item|undefined {
        if (libraryItem.loading) { return; }
        const length = libraryItem.audioBuffer!.duration * (globalState.bpm / 60) * TICKS_PER_BEAT;

        // find a free track, if no one exists, create a new one
        let track = this.editor.tracks.find((t) => {
            const trackItems = this.editor.items.filter((i) => i.trackId === t.id);
            return !trackItems.some((i) => i.start < length);
        });
        if (!track) { track = this.editor.addTrack(); }

        const item = new Item(track.id, 0, length, { libraryItem });
        item.resizable = false;
        return item;
    }

    private addGraphItem(libraryItem: GraphLibraryItem): Item {
        const length = TICKS_PER_BEAT * 4;

        // find a free track, if no one exists, create a new one
        let track = this.editor.tracks.find((t) => {
            const trackItems = this.editor.items.filter((i) => i.trackId === t.id);
            return !trackItems.some((i) => i.start < length);
        });
        if (!track) { track = this.editor.addTrack(); }

        const item = new Item(track.id, 0, length, { libraryItem });
        return item;
    }

}
</script>
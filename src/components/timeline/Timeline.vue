<template lang="pug">
.fill-height
    .d-flex.px-3.align-items-center(style="height:48px")
        v-btn(text, @click="() => editor.addDefaultTrack()") Add Track
        v-divider.mx-4(vertical)
        v-slider(:value="volume * 100", @input="setVolume", :min="0", :max="100", prepend-icon="volume_up", dense, style="max-width: 10em;", hide-details)
        v-divider.mx-4(vertical)
        v-select(:value="snapUnits", @input="setSnap", :items="snapItems", style="max-width: 12em;", dense, flat, solo, hide-details, prepend-icon="straighten")
        v-divider.mx-4(vertical)
        v-text-field(:value="bpm", @input="setBpm", label="BPM", style="max-width: 6em;", dense, flat, solo, hide-details, prepend-icon="speed")
    div#wrapper(ref="wrapper" @drop="drop" @dragover="$event.preventDefault()")
</template>

<script lang="ts">
import { Component, Watch, Vue } from "vue-property-decorator";
import throttle from "lodash/throttle";
import { observe } from "@nx-js/observer-util";
import { PluginOptionsVue } from "baklavajs";
import { Text, TextStyle, Sprite } from "pixi.js";

import { View, Drawable, Item } from "@/lokumjs";
import { TICKS_PER_BEAT } from "@/constants";
import { globalState } from "@/entities/globalState";
import { AudioFile, LibraryItemType, GraphLibraryItem, AutomationClip, LibraryItem } from "@/entities/library";
import { globalProcessor } from "@/processing";
import { ItemContainer } from "./itemContainer";
import { PositionIndicator } from "./positionIndicator";
import customColors from "@/colors";
import CSelect from "@/components/elements/Select.vue";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

enum LabelMode {
    BEATS,
    BARS,
}

@Component({
    components: { CSlider: PluginOptionsVue.SliderOption, CSelect },
})
export default class Timeline extends Vue {
    public snapItems = [
        { text: "Disabled", value: "1" },
        { text: "1/8 Beat", value: (TICKS_PER_BEAT / 8).toString() },
        { text: "1/6 Beat", value: (TICKS_PER_BEAT / 6).toString() },
        { text: "1/4 Beat", value: (TICKS_PER_BEAT / 4).toString() },
        { text: "1/3 Beat", value: (TICKS_PER_BEAT / 3).toString() },
        { text: "1/2 Beat", value: (TICKS_PER_BEAT / 2).toString() },
        { text: "1 Beat", value: TICKS_PER_BEAT.toString() },
        { text: "2 Beats", value: (2 * TICKS_PER_BEAT).toString() },
        { text: "4 Beats", value: (4 * TICKS_PER_BEAT).toString() },
        { text: "8 Beats", value: (8 * TICKS_PER_BEAT).toString() },
    ];

    private positionIndicator!: PositionIndicator;
    private fpsText = new Text("FPS", new TextStyle({ fontSize: 10, fill: 0xffffff }));

    private labelMode: LabelMode = LabelMode.BEATS;
    private resizeObserver!: ResizeObserver;

    private viewInstance: View = null as any;

    private globalState = globalState;

    public get editor() {
        return this.globalState.timeline;
    }

    public get volume() {
        return this.globalState.volume;
    }

    public get snapUnits() {
        return this.editor.snapUnits.toString();
    }

    public get bpm() {
        return globalState.bpm.toString();
    }

    public async mounted() {
        this.resizeObserver = new ResizeObserver(throttle(() => this.onResize(), 200));
        this.resizeObserver.observe(this.$refs.wrapper as Element);
        this.initializeView();
    }

    @Watch("editor")
    public async initializeView() {
        if (this.viewInstance) {
            this.viewInstance.unmount();
        }

        const view = await View.mount(this.editor, this.$refs.wrapper as HTMLElement);
        this.viewInstance = view;

        this.fpsText.position.set(10, 10);
        view.app.stage.addChild(this.fpsText);

        this.positionIndicator = Drawable.createView(view, PositionIndicator, {
            position: 0,
            trackHeaderWidth: view.timelineDrawable.props.trackHeaderWidth,
        });
        view.app.stage.addChild(this.positionIndicator.graphics);

        view.app.ticker.add(() => {
            this.positionIndicator.tick();
            this.fpsText.text = view.app.ticker.elapsedMS.toFixed(2);
        });

        observe(() => {
            this.positionIndicator.props.position = globalState.position;
        });

        view.timelineDrawable.header.graphics.interactive = true;
        view.eventBus.events.pointerdown.subscribe(view.timelineDrawable.header.graphics, (ev) => {
            const x = ev.data.global.x as number;
            let unit = view.positionCalculator.getUnit(x - view.timelineDrawable.props.trackHeaderWidth);
            if (unit < 0) {
                unit = 0;
            }
            globalState.setPositionByUser(unit);
        });

        view.eventBus.events.keydown.subscribe(this, (ev) => {
            if (ev.key === " ") {
                if (globalState.isPlaying) {
                    globalProcessor.pause();
                } else {
                    globalProcessor.play();
                }
            }
        });

        view.positionCalculator.unitWidth = 2.5;
        view.positionCalculator.events.zoomed.subscribe(this, () => this.updateMarkerSpacing());
        this.updateMarkerSpacing();

        view.colors = { ...view.colors, ...customColors };
        view.itemDrawableFunction = () => ItemContainer;

        (window as any).$data = view;
    }

    public onResize() {
        if (this.viewInstance) {
            this.viewInstance.app.resize();
        }
    }

    public drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.getItemById(id);
        if (!libraryItem) {
            return;
        }

        let item: Item | undefined;
        switch (libraryItem.type) {
            case LibraryItemType.AUDIO_FILE:
                item = this.addMusicItem(libraryItem as AudioFile);
                break;
            case LibraryItemType.GRAPH:
                item = this.addGraphItem(libraryItem as GraphLibraryItem);
                break;
            case LibraryItemType.AUTOMATION_CLIP:
                item = this.addAutomationItem(libraryItem as AutomationClip);
                break;
        }

        if (item) {
            const x = ev.clientX - this.viewInstance.timelineDrawable.props.trackHeaderWidth;
            const unit = this.editor.snap(this.viewInstance.positionCalculator.getUnit(x));
            item.move(unit, unit + (item.end - item.start));

            // find a free track, if no one exists, create a new one
            const isOverlapping = (i1: Item, i2: Item) => Math.max(i1.start, i2.start) <= Math.min(i1.end, i2.end);
            let track = this.editor.tracks.find((t) => {
                const trackItems = this.editor.items.filter((i) => i.trackId === t.id);
                return !trackItems.some((i) => isOverlapping(i, item!));
            });
            if (!track) {
                track = this.editor.addDefaultTrack();
            }

            item.trackId = track.id;
            this.editor.addItem(item);
        }
    }

    public setVolume(v: number) {
        globalState.volume = Math.max(0, Math.min(1, v / 100));
    }

    public setBpm(v: string) {
        globalState.bpm = parseInt(v, 10);
    }

    public setSnap(value: string) {
        this.editor.snapUnits = parseInt(value, 10);
    }

    private addMusicItem(libraryItem: AudioFile): Item | undefined {
        if (libraryItem.loading) {
            return;
        }
        const length = libraryItem.audioBuffer!.duration * (globalState.bpm / 60) * TICKS_PER_BEAT;
        const item = this.createItem(length, libraryItem);
        item.resizable = false;
        return item;
    }

    private addGraphItem(libraryItem: GraphLibraryItem): Item {
        const length = TICKS_PER_BEAT * 4;
        return this.createItem(length, libraryItem);
    }

    private addAutomationItem(libraryItem: AutomationClip): Item {
        const length = libraryItem.points.reduce((p, c) => Math.max(p, c.unit), 0);
        return this.createItem(length, libraryItem);
    }

    private createItem(length: number, libraryItem: LibraryItem) {
        // set the track id to "" temporarily, we will determine the track later
        const item = new Item("", 0, length, { libraryItem });
        return item;
    }

    private updateMarkerSpacing() {
        const pc = this.viewInstance.positionCalculator;
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
    }
}
</script>

<style scoped>
#wrapper {
    height: calc(100% - 48px);
    overflow: hidden;
}
</style>

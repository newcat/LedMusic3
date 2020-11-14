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
    #wrapper(@drop="drop", @dragover="$event.preventDefault()")
        timeline-base(:snap="parseInt(snapUnits)")
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

import { TICKS_PER_BEAT } from "@/constants";
import { globalState } from "@/globalState";
import type { AudioLibraryItem } from "@/audio";
import type { GraphLibraryItem } from "@/graph";
import type { AutomationLibraryItem } from "@/automation";
import { LibraryItemType, LibraryItem } from "@/library";
import { Item } from "./model/item";
import TimelineBase from "./components/Timeline.vue";
import { PatternLibraryItem } from "@/pattern";

enum LabelMode {
    BEATS,
    BARS,
}

@Component({
    components: { TimelineBase },
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

    private labelMode: LabelMode = LabelMode.BEATS;

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

    public drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.getItemById(id);
        if (!libraryItem) {
            return;
        }

        let item: Item | undefined;
        switch (libraryItem.type) {
            case LibraryItemType.AUDIO:
                item = this.addMusicItem(libraryItem as AudioLibraryItem);
                break;
            case LibraryItemType.GRAPH:
                item = this.addGraphItem(libraryItem as GraphLibraryItem);
                break;
            case LibraryItemType.AUTOMATION:
                item = this.addAutomationItem(libraryItem as AutomationLibraryItem);
                break;
            case LibraryItemType.PATTERN:
                item = this.addPatternItem(libraryItem as PatternLibraryItem);
                break;
        }

        if (item) {
            // const x = ev.clientX;
            // TODO: const unit = this.editor.snap(this.viewInstance.positionCalculator.getUnit(x));
            const unit = 0;
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

    private addMusicItem(libraryItem: AudioLibraryItem): Item | undefined {
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

    private addAutomationItem(libraryItem: AutomationLibraryItem): Item {
        const length = libraryItem.points.reduce((p, c) => Math.max(p, c.unit), 0);
        return this.createItem(length, libraryItem);
    }

    private addPatternItem(libraryItem: PatternLibraryItem): Item {
        const length = libraryItem.notes.reduce((p, c) => Math.max(p, c.end), 0);
        return this.createItem(length, libraryItem);
    }

    private createItem(length: number, libraryItem: LibraryItem) {
        // set the track id to "" temporarily, we will determine the track later
        const item = new Item(libraryItem, "", 0, length);
        return item;
    }
}
</script>

<style scoped>
#wrapper {
    height: calc(100% - 48px);
    overflow: hidden;
}
</style>

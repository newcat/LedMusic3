<template lang="pug">
.timeline(
    :class="{ 'disable-child-pointer-events': isDragging }",
    tabindex="-1",
    @mousedown="mousedown",
    @mouseup="mouseup"
    @keydown="keydown"
    @keyup="keyup"
    @wheel="wheel")

    .__content(:style="contentStyles")

        position-marker(:unitWidth="unitWidth", :headerWidth="headerWidth")

        .__header-row(@click="onHeaderClick")
            .__container
                marker-label(v-for="m in markers", :key="m.unit", :marker="m")

        track-view(
            v-for="t in tracks",
            :key="t.id",
            :editor="editor",
            :track="t",
            :unitWidth="unitWidth",
            @mouseenter="onTrackMouseenter(t)",
            @mouseleave="onTrackMouseleave()",
            @mousemove="onTrackMouseMove",
            @drag-start="onDragStart",
            @dragover.native="$event.preventDefault()",
            @drop.native.capture="drop(t, $event)")
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { ItemArea, IMarker } from "../types";
import { TimelineEditor, Item, Track, IItemState } from "../model";
import { globalState } from "@/globalState";
import { TICKS_PER_BEAT } from "@/constants";
import { LibraryItem, LibraryItemType } from "@/library";
import { AudioLibraryItem } from "@/audio";
import { GraphLibraryItem } from "@/graph";
import { AutomationLibraryItem } from "@/automation";
import { PatternLibraryItem } from "@/pattern";
import { normalizeMouseWheel, snap } from "@/utils";

import MarkerLabel from "./MarkerLabel.vue";
import PositionMarker from "./PositionMarker.vue";
import TrackView from "./Track.vue";

import "../styles/all.scss";

@Component({
    components: { MarkerLabel, PositionMarker, TrackView },
})
export default class Timeline extends Vue {
    unitWidth = 1.5;
    headerWidth = 200;
    lastItemEnd = 0;

    unwatchFn!: () => void;

    ctrlPressed = false;
    isDragging = false;
    dragArea: ItemArea | "" = "";
    dragItem: Item | null = null;
    dragStartPosition = { x: 0, y: 0 };
    dragStartTrack: Track | null = null;
    dragStartStates: Array<{ item: IItemState; trackIndex: number }> = [];
    hoveredTrack: Track | null = null;

    get editor(): TimelineEditor {
        return globalState.timeline;
    }

    get contentStyles() {
        const baseBgSize = this.markerSpacing.space * this.unitWidth;
        return {
            width: `${(this.lastItemEnd + globalState.snapUnits) * this.unitWidth + this.headerWidth}px`,
            backgroundSize: `${4 * baseBgSize}px ${4 * baseBgSize}px, ${baseBgSize}px ${baseBgSize}px`,
        };
    }

    get disableItemPointerEvents() {
        return this.isDragging;
    }

    get tracks() {
        return this.editor?.tracks ?? [];
    }

    get markerSpacing(): { space: number; majorMultiplier: number } {
        if (this.unitWidth < 0.25) {
            return { space: TICKS_PER_BEAT * 16, majorMultiplier: 1 };
        } else if (this.unitWidth > 2) {
            return { space: TICKS_PER_BEAT, majorMultiplier: 4 };
        } else {
            return { space: TICKS_PER_BEAT * 4, majorMultiplier: 4 };
        }
    }

    get markers(): IMarker[] {
        if (this.unitWidth <= 0) {
            return [];
        }
        const markers: IMarker[] = [];
        for (let unit = 0; unit < this.lastItemEnd + globalState.snapUnits; unit += this.markerSpacing.space) {
            const x = this.unitToPixel(unit);
            const nthMarker = Math.floor(unit / this.markerSpacing.space);
            if (nthMarker % this.markerSpacing.majorMultiplier === 0) {
                markers.push({ type: "major", unit, position: x });
            } else {
                markers.push({ type: "minor", unit, position: x });
            }
        }
        return markers;
    }

    mounted() {
        this.unwatchFn = this.$watch(
            () => {
                return this.editor.items.map((i) => i.end);
            },
            () => this.updateLastNoteEnd()
        );
    }

    beforeDestroy() {
        this.unwatchFn();
    }

    unselectAllItems() {
        this.editor.items.forEach((i) => {
            i.selected = false;
        });
    }

    @Watch("dragItem")
    updateLastNoteEnd() {
        const newLastItemEnd = this.editor.items.reduce((p, i) => Math.max(p, i.end), 0);
        if (this.dragItem && newLastItemEnd < this.lastItemEnd) {
            // do nothing because shrinking the content while dragging results in strange behaviour
            return;
        }
        this.lastItemEnd = newLastItemEnd;
    }

    mousedown(ev: MouseEvent) {
        const target = ev.target as HTMLElement | null;
        if (target && !this.isSelfOrIsChildOf(target, ".timeline-item")) {
            this.unselectAllItems();
        }
        this.isDragging = true;
        this.dragStartPosition = { x: ev.clientX, y: ev.clientY };
    }

    mouseup() {
        this.isDragging = false;
        this.dragItem = null;
    }

    keydown(ev: KeyboardEvent) {
        ev.preventDefault();
        if (ev.key === "Delete") {
            const itemsToDelete = this.editor.items.filter((i) => i.selected);
            itemsToDelete.forEach((i) => this.editor.removeItem(i));
        } else if (ev.key === " ") {
            globalState.isPlaying = !globalState.isPlaying;
        } else if (ev.key === "Control") {
            this.ctrlPressed = true;
        }
    }

    keyup(ev: KeyboardEvent) {
        ev.preventDefault();
        if (ev.key === "Control") {
            this.ctrlPressed = false;
        }
    }

    onTrackMouseMove(ev: MouseEvent) {
        const x = ev.clientX;
        const diffUnits = Math.floor((x - this.dragStartPosition.x) / this.unitWidth);
        if (this.isDragging && this.dragItem) {
            if (this.dragArea === "leftHandle" || this.dragArea === "rightHandle") {
                this.dragStartStates.forEach((state) => {
                    const newStart = this.dragArea === "leftHandle" ? snap(state.item.start + diffUnits) : state.item.start;
                    const newEnd = this.dragArea === "rightHandle" ? snap(state.item.end + diffUnits) : state.item.end;
                    const item = this.editor.items.find((i) => i.id === state.item.id);
                    if (item) {
                        item.move(newStart, newEnd);
                    }
                });
            } else if (this.dragArea === "center") {
                let diffTracks = 0;
                if (this.dragStartTrack && this.hoveredTrack) {
                    const startTrackIndex = this.editor.tracks.indexOf(this.dragStartTrack);
                    const endTrackIndex = this.editor.tracks.indexOf(this.hoveredTrack);
                    if (startTrackIndex >= 0 && endTrackIndex >= 0) {
                        diffTracks = endTrackIndex - startTrackIndex;
                    }
                }

                // check if some items would be dragged outside of the track bounds
                this.dragStartStates.forEach((state) => {
                    const trackIndex = state.trackIndex;
                    const newTrackIndex = trackIndex + diffTracks;
                    if (newTrackIndex < 0) {
                        diffTracks = -trackIndex;
                    } else if (newTrackIndex >= this.editor.tracks.length) {
                        diffTracks = this.editor.tracks.length - trackIndex;
                    }
                });

                this.dragStartStates.forEach((state) => {
                    const item = this.editor.items.find((j) => j.id === state.item.id)!;
                    const newTrackIndex = state.trackIndex + diffTracks;
                    const newTrack = this.editor.tracks[newTrackIndex];
                    const newStart = snap(state.item.start + diffUnits);
                    const newEnd = newStart + (state.item.end - state.item.start);
                    item.trackId = newTrack.id;
                    item.move(newStart, newEnd);
                });
            }
        }
    }

    onDragStart(draggedItem: Item, dragArea: ItemArea) {
        if (!this.ctrlPressed) {
            this.unselectAllItems();
        }
        draggedItem.selected = true;
        this.dragItem = draggedItem;
        this.dragArea = dragArea;
        this.dragStartTrack = this.hoveredTrack;
        this.isDragging = true;
        this.dragStartStates = this.editor.items
            .filter((i) => i.selected)
            .map((i) => ({
                item: i.save(),
                trackIndex: this.editor.tracks.findIndex((t) => t.id === i.trackId),
            }));
    }

    onTrackMouseenter(track: Track): void {
        this.hoveredTrack = track;
    }

    onTrackMouseleave(): void {
        this.hoveredTrack = null;
    }

    public drop(track: Track, ev: DragEvent) {
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
            const x = ev.offsetX;
            const unit = snap(this.pixelToUnit(x));
            item.move(unit, unit + (item.end - item.start));

            const isOverlapping = (i1: Item, i2: Item) => Math.max(i1.start, i2.start) <= Math.min(i1.end, i2.end);

            // check, whether the track is free
            let chosenTrack: Track | undefined;
            const trackItems = this.editor.items.filter((i) => i.trackId === track.id);
            if (!trackItems.some((i) => isOverlapping(i, item!))) {
                chosenTrack = track;
            }

            // if unsuccessful, find a free track
            if (!chosenTrack) {
                chosenTrack = this.editor.tracks.find((t) => {
                    const trackItems = this.editor.items.filter((i) => i.trackId === t.id);
                    return !trackItems.some((i) => isOverlapping(i, item!));
                });
            }

            // if no free track was found, create a new one
            if (!chosenTrack) {
                chosenTrack = this.editor.addDefaultTrack();
            }

            item.trackId = chosenTrack.id;
            this.editor.addItem(item);
        }
    }

    onHeaderClick(ev: MouseEvent): void {
        const tick = this.pixelToUnit(ev.offsetX);
        globalState.setPositionByUser(tick);
    }

    wheel(ev: WheelEvent) {
        const amount = normalizeMouseWheel(ev);
        const unit = this.pixelToUnit(ev.offsetX); // the unit which is currently hovered
        this.unitWidth *= 1 - amount / 1500;
        // scroll so that the unit stays at the same place visually
        this.$el.scrollBy(this.unitToPixel(unit) - ev.offsetX, 0);
    }

    unitToPixel(unit: number): number {
        return unit * this.unitWidth;
    }

    pixelToUnit(pixel: number): number {
        return Math.floor(pixel / this.unitWidth);
    }

    isSelfOrIsChildOf(el: HTMLElement, selector: string) {
        if (el.matches(selector)) {
            return true;
        }
        while (!el.matches(".timeline") && !!el.parentElement) {
            if (el.matches(selector)) {
                return true;
            }
            el = el.parentElement;
        }
        return false;
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

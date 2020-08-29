<template lang="pug">
.timeline(
    :class="{ 'disable-child-pointer-events': isDragging }",
    tabindex="-1",
    @mousedown="mousedown",
    @mouseup="mouseup"
    @keydown="keydown")

    .__content(:style="contentStyles",)

        .__header-row
            .__container
                marker-label(v-for="m in markers", :key="m.unit", :marker="m")

        .__row(v-for="t in tracks", :key="t.id")
            .__header
                div {{ t.name }}

            .__item-container(
                @mouseenter="onTrackMouseenter(t)",
                @mouseleave="onTrackMouseleave()"
                @mousemove="onRowMouseMove")

                timeline-item(
                    v-for="item in getItemsForTrack(t)",
                    :key="item.id", :item="item",
                    :unitWidth="unitWidth",
                    @drag-start="onDragStart")
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import { ItemArea, IMarker } from "../types";
import { Editor, Item, Track, IItemState } from "../model";
import { globalState } from "@/entities/globalState";
import { TICKS_PER_BEAT } from "@/constants";

import TimelineItem from "./TimelineItem.vue";
import MarkerLabel from "./MarkerLabel.vue";

import "../styles/all.scss";
import { globalProcessor } from "@/processing";

@Component({
    components: { TimelineItem, MarkerLabel },
})
export default class Timeline extends Vue {
    unitWidth = 1.5;
    headerWidth = 50;
    lastItemEnd = 0;

    isDragging = false;
    dragArea: ItemArea | "" = "";
    dragItem: Item | null = null;
    dragStartPosition = { x: 0, y: 0 };
    dragStartTrack?: Track;
    dragStartStates: Array<{ item: IItemState; trackIndex: number }> = [];
    hoveredTrack: Track | null = null;

    @Prop({ type: Number, required: true })
    snap!: number;

    get editor(): Editor {
        return globalState.timeline;
    }

    get contentStyles() {
        return {
            width: `${(this.lastItemEnd + this.snap) * this.unitWidth + this.headerWidth}px`,
            backgroundSize: `${this.markerSpacing.space * this.unitWidth}px ${
                this.markerSpacing.space * this.unitWidth
            }px`,
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
        for (let unit = 0; unit < this.lastItemEnd; unit += this.markerSpacing.space) {
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

    getItemsForTrack(track: Track) {
        return this.editor ? this.editor.items.filter((i) => i.trackId === track.id) : [];
    }

    unselectAllItems() {
        this.editor.items.forEach((i) => {
            i.selected = false;
        });
    }

    @Watch("editor.items", { deep: true })
    @Watch("draggedItem")
    @Watch("resizedItem")
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
            if (globalState.isPlaying) {
                globalProcessor.pause();
            } else {
                globalProcessor.play();
            }
        }
    }

    onRowMouseMove(ev: MouseEvent) {
        const x = ev.clientX;
        const diffUnits = Math.floor((x - this.dragStartPosition.x) / this.unitWidth);
        if (this.isDragging && this.dragItem) {
            if (this.dragArea === "leftHandle" || this.dragArea === "rightHandle") {
                this.dragStartStates.forEach((state) => {
                    const newStart =
                        this.dragArea === "leftHandle"
                            ? this.performSnap(state.item.start + diffUnits)
                            : state.item.start;
                    const newEnd =
                        this.dragArea === "rightHandle" ? this.performSnap(state.item.end + diffUnits) : state.item.end;
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

                // validate all items
                // TODO: Dont validate items one after another!
                let valid = true;
                this.dragStartStates.forEach((state) => {
                    const item = this.editor.items.find((j) => j.id === state.item.id)!;
                    const newTrackIndex = state.trackIndex + diffTracks;
                    const newTrack = this.editor.tracks[newTrackIndex];
                    if (!this.editor.validateItem()) {
                        valid = false;
                    }
                });

                if (valid) {
                    this.dragStartStates.forEach((state) => {
                        const item = this.editor.items.find((j) => j.id === state.item.id)!;
                        const newTrackIndex = state.trackIndex + diffTracks;
                        const newTrack = this.editor.tracks[newTrackIndex];
                        const newStart = this.performSnap(state.item.start + diffUnits);
                        const newEnd = newStart + (state.item.end - state.item.start);
                        item.trackId = newTrack.id;
                        item.move(newStart, newEnd);
                    });
                }
            }
        }
    }

    onDragStart(draggedItem: Item, dragArea: ItemArea) {
        draggedItem.selected = true;
        this.dragItem = draggedItem;
        this.dragArea = dragArea;
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

    performSnap(unit: number): number {
        const mod = unit % this.snap;
        return mod <= this.snap / 2 ? unit - mod : unit + this.snap - mod;
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
}
</script>

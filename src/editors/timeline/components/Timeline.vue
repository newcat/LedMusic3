<template lang="pug">
.timeline
    .__content(
        tabindex="-1"
        :style="contentStyles",
        @mousedown="mousedown",
        @mouseup="mouseup"
        @keydown="keydown")

        .__row(v-for="i in 128", :key="i", :data-row-value="i")
            .__header
                div {{ i }}

            .__item-container(
                @mouseenter="onRowMouseenter(i, $event)",
                @mousemove="onRowMouseMove",
                @mousedown.self="createNote(i, $event)")

                timeline-item(
                    v-for="n, ni in getNotesForTrack(i)",
                    :key="ni", :note="n",,
                    :unitWidth="unitWidth",
                    :style="{ pointerEvents: disableItemPointerEvents ? 'none' : undefined }",
                    @drag-start="onDragStart")
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ItemArea } from "../types";
import { Editor, Item, Track, IItemState } from "../model";
import TimelineItem from "./TimelineItem.vue";

@Component({
    components: { TimelineItem },
})
export default class Timeline extends Vue {
    unitWidth = 1.5;
    headerWidth = 50;
    snap = 96;
    lastItemEnd = 0;

    @Prop()
    editor!: Editor;

    isDragging = false;
    dragArea: ItemArea | "" = "";
    dragItem?: Item;
    dragStartPosition = { x: 0, y: 0 };
    dragStartTrack?: Track;
    dragStartStates: Array<{ item: IItemState; trackIndex: number }> = [];

    get contentStyles() {
        return {
            width: `${(this.lastItemEnd + this.snap) * this.unitWidth + this.headerWidth}px`,
            backgroundSize: `${this.snap * this.unitWidth}px ${this.snap * this.unitWidth}px`,
        };
    }

    get disableItemPointerEvents() {
        return this.isDragging;
    }

    getItemsForTrack(trackId: string) {
        return this.editor.items.filter((i) => i.trackId === trackId);
    }

    unselectAllItems() {
        this.editor.items.forEach((i) => {
            i.selected = false;
        });
    }

    @Watch("editor.items", { deep: true, immediate: true })
    @Watch("draggedItem")
    @Watch("resizedItem")
    updateLastNoteEnd() {
        const newLastItemEnd = this.editor.items.reduce((p, i) => Math.max(p, i.end), 0);
        if (newLastItemEnd < this.lastItemEnd && (this.draggedItem || this.resizedItem)) {
            // do nothing because shrinking the content while dragging results in strange behaviour
            return;
        }
        this.lastItemEnd = newLastItemEnd;
    }

    mousedown(ev: MouseEvent) {
        const target = ev.target as HTMLElement | null;
        if (target && !target.matches(".note")) {
            this.unselectAllItems();
        }
        this.isDragging = true;
        this.dragStartPosition = [ev.clientX, ev.clientY];
    }

    mouseup() {
        this.isDragging = false;
    }

    keydown(ev: KeyboardEvent) {
        if (ev.key === "Delete") {
            const itemsToDelete = this.editor.items.filter((i) => i.selected);
            itemsToDelete.forEach((i) => this.editor.removeItem(i));
        }
    }

    onTrackMouseenter(trackId: string, ev: MouseEvent) {
        if (this.isDragging && this.dragItem && this.dragArea === "center" && this.dragItem.trackId !== trackId) {
            this.dragItem.trackId = trackId;
        }
    }

    onRowMouseMove(ev: MouseEvent) {
        const x = ev.clientX;
        if (this.isDragging && this.dragItem) {
            if (this.dragArea === "leftHandle" || this.dragArea === "rightHandle") {
                const unit = this.viewInstance.positionCalculator.getUnit(x - this.props.trackHeaderWidth);
                const newStart = this.dragArea === "leftHandle" ? unit : this.dragItem.start;
                const newEnd = this.dragArea === "rightHandle" ? unit : this.dragItem.end;
                if (this.props.editor.validateItem()) {
                    this.dragItem.move(newStart, newEnd);
                }
            } else if (this.dragArea === "center") {
                const diffUnits = Math.floor((x - this.dragStartPosition.x) / this.unitWidth);
                let diffTracks = 0;
                const hoveredTrack = this.findTrackByPoint(ev.data.global);
                if (this.dragStartTrack && hoveredTrack) {
                    const startTrackIndex = this.props.editor.tracks.indexOf(this.dragStartTrack);
                    const endTrackIndex = this.props.editor.tracks.indexOf(hoveredTrack);
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
                    } else if (newTrackIndex >= this.props.editor.tracks.length) {
                        diffTracks = this.props.editor.tracks.length - trackIndex;
                    }
                });

                // validate all items
                // TODO: Dont validate items one after another!
                let valid = true;
                this.dragStartStates.forEach((state) => {
                    const item = this.props.editor.items.find((j) => j.id === state.item.id)!;
                    const newTrackIndex = state.trackIndex + diffTracks;
                    const newTrack = this.props.editor.tracks[newTrackIndex];
                    if (!this.props.editor.validateItem()) {
                        valid = false;
                    }
                });

                if (valid) {
                    this.dragStartStates.forEach((state) => {
                        const item = this.props.editor.items.find((j) => j.id === state.item.id)!;
                        const newTrackIndex = state.trackIndex + diffTracks;
                        const newTrack = this.props.editor.tracks[newTrackIndex];
                        item.trackId = newTrack.id;
                        item.move(state.item.start + diffUnits, state.item.end + diffUnits);
                    });
                }
            }
        }
    }

    onDragStart(draggedItem: Item, dragArea: ItemArea) {
        this.unselectAllItems();
        this.dragItem = draggedItem;
        this.dragArea = dragArea;
    }

    performSnap(unit: number) {
        const mod = unit % this.snap;
        return mod <= this.snap / 2 ? unit - mod : unit + this.snap - mod;
    }

    unitToPixel(unit: number) {}

    pixelToUnit(pixel: number) {}
}
</script>

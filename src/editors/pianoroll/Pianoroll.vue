<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title Piano Roll
    .pianoroll
        .__content(
            tabindex="-1"
            :style="contentStyles",
            @mousedown="mousedown",
            @mouseup="mouseup"
            @keydown="keydown")

            .__row(v-for="i in 128", :key="i", :data-row-value="i")
                .__header
                    div {{ i }}

                .__note_container(
                    @mouseenter="onRowMouseenter(i, $event)",
                    @mousemove="onRowMouseMove",
                    @mousedown.self="createNote(i, $event)")

                    c-note(
                        v-for="n, ni in getNotesForTrack(i)",
                        :key="ni", :note="n",,
                        :tickWidth="tickWidth",
                        :style="{ pointerEvents: disableNotePointerEvents ? 'none' : undefined }",
                        @dragStart="onDragStart",
                        @resizeStart="onResizeStart")
                    
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { INote } from "./types";
import CNote from "./Note.vue";

@Component({
    components: { CNote }
})
export default class Pianoroll extends Vue {

    tickWidth = 1.5;
    headerWidth = 50;
    snap = 96;
    lastNoteEnd = 0;

    draggedNote: INote|null = null;
    dragOffset: number = 0;

    resizedNote: INote|null = null;
    resizeOffset: number = 0;

    notes: INote[] = [
        { value: 5, start: 0, end: 384, selected: false },
        { value: 3, start: 0, end: 47, selected: false },
        { value: 3, start: 96, end: 96 + 47, selected: true },
        { value: 3, start: 2 * 96, end: 2 * 96 + 47, selected: false },
        { value: 3, start: 7 * 96, end: 12 * 96 + 47, selected: false },
    ];

    get contentStyles() {
        return {
            width: `${(this.lastNoteEnd + this.snap) * this.tickWidth + this.headerWidth }px`,
            backgroundSize: `${this.snap * this.tickWidth}px ${this.snap * this.tickWidth}px`
        };
    }

    get disableNotePointerEvents() {
        return !!this.draggedNote || !!this.resizedNote;
    }

    getNotesForTrack(track: number) {
        return this.notes.filter((n) => n.value === track);
    }

    unselectAllNotes() {
        this.notes.forEach((n) => { n.selected = false; });
    }

    @Watch("notes", { deep: true, immediate: true })
    @Watch("draggedNote")
    @Watch("resizedNote")
    updateLastNoteEnd() {
        const newLastNoteEnd = this.notes.reduce((p, n) => Math.max(p, n.end), 0);
        if (newLastNoteEnd < this.lastNoteEnd && (this.draggedNote || this.resizedNote)) {
            // do nothing because shrinking the content while dragging results in strange behaviour
            return;
        }
        this.lastNoteEnd = newLastNoteEnd;
    }

    mousedown(ev: MouseEvent) {
        const target = ev.target as HTMLElement|null;
        if (target && !target.matches(".note")) {
            this.notes.forEach((n) => { n.selected = false; });
        }
    }

    mouseup() {
        this.draggedNote = null;
        this.resizedNote = null;
    }

    keydown(ev: KeyboardEvent) {
        if (ev.key === "Delete") {
            const noteIndicesToDelete = this.notes
                .map((v, i) => v.selected ? i : -1)
                .filter((i) => i >= 0);
            noteIndicesToDelete.reverse();
            noteIndicesToDelete.forEach((i) => this.notes.splice(i, 1));
        }
    }

    onRowMouseenter(rowValue: number, ev: MouseEvent) {
        if (this.draggedNote && this.draggedNote.value !== rowValue) {
            this.draggedNote.value = rowValue;
        }
    }

    onRowMouseMove(ev: MouseEvent) {
        if (this.draggedNote) {
            const newStart = this.performSnap((ev.offsetX - this.dragOffset) / this.tickWidth);
            const newEnd = newStart + (this.draggedNote.end - this.draggedNote.start);
            if (newStart >= 0) {
                this.draggedNote.start = newStart;
                this.draggedNote.end = newEnd;
            }
        } else if (this.resizedNote) {
            const newEnd = this.performSnap((ev.offsetX) / this.tickWidth);
            if (newEnd > this.resizedNote.start) {
                this.resizedNote.end = newEnd;
            }
        }
    }

    onDragStart(draggedNote: INote, dragOffset: number) {
        this.unselectAllNotes();
        this.draggedNote = draggedNote;
        this.dragOffset = dragOffset;
        this.draggedNote.selected = true;
    }

    onResizeStart(resizedNote: INote, resizeOffset: number) {
        this.unselectAllNotes();
        this.resizedNote = resizedNote;
        this.resizeOffset = resizeOffset;
        this.resizedNote.selected = true;
    }

    createNote(value: number, ev: MouseEvent) {
        if (this.notes.every((n) => !n.selected)) {
            let start = ev.offsetX / this.tickWidth;
            start = start - (start % this.snap);
            this.notes.push({
                start,
                end: start + this.snap,
                value,
                selected: false
            });
        }
    }

    performSnap(tick: number) {
        const mod = tick % this.snap;
        return mod <= (this.snap / 2) ? tick - mod : tick + this.snap - mod;
    }

}
</script>

<style lang="scss">
.pianoroll {
    overflow-y: scroll;
    width: 100%;

    $rowHeight: 30px;
    $headerWidth: 50px;

    .__content {
        position: relative;
        background-image: linear-gradient(90deg, #504f5c 1px, transparent 1px);
        background-position: ($headerWidth - 1px) -1px;
        background-repeat: repeat;
        min-width: 100%;

        &:focus {
            outline: none;
        }
    }

    .__row {
        height: $rowHeight;
        border-bottom: 1px solid #504f5c;
        display: flex;
        z-index: 20;

        .__header {
            position: sticky;
            left: 0;
            min-width: $headerWidth;
            max-width: $headerWidth;
            height: 100%;
            background-color: #33333d;
            color: #bbb;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }

        .__note_container {
            position: relative;
            width: 100%;
            height: 100%;
        }

    }

}
</style>
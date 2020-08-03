<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title Piano Roll
    .pianoroll(@mousedown="mousedown")
        .__content(:style="contentStyles")
            .__row(v-for="i in 128", :key="i")
                .__header
                    div {{ i }}
                .__note_container
                    c-note(v-for="n, ni in getItemsForTrack(i)", :key="ni", :note="n", :tickWidth="tickWidth")
                    
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { INote } from "./types";
import CNote from "./Note.vue";

@Component({
    components: { CNote }
})
export default class Pianoroll extends Vue {

    tickWidth = 1;
    headerWidth = 50;
    snap = 96;

    notes: INote[] = [
        { value: 5, start: 0, end: 384, selected: false },
        { value: 3, start: 0, end: 47, selected: false },
        { value: 3, start: 96, end: 96 + 47, selected: true },
        { value: 3, start: 2 * 96, end: 2 * 96 + 47, selected: false },
        { value: 3, start: 7 * 96, end: 12 * 96 + 47, selected: false },
    ];

    get contentStyles() {
        const lastNoteEnd = this.notes.reduce((p, n) => Math.max(p, n.end), 0);
        return {
            width: `${(lastNoteEnd + this.snap) * this.tickWidth + this.headerWidth }px`,
            backgroundSize: `${this.snap * this.tickWidth}px ${this.snap * this.tickWidth}px`
        };
    }

    getItemsForTrack(track: number) {
        return this.notes.filter((n) => n.value === track);
    }

    mousedown(ev: MouseEvent) {
        const target = ev.target as HTMLElement|null;
        if (target && !target.matches(".note")) {
            this.notes.forEach((n) => { n.selected = false; });
        }
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
            width: 1000px;
            height: 100%;
        }

    }

}
</style>
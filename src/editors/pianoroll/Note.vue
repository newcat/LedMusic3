<template lang="pug">
.note(:class="{ '--selected': note.selected }", :style="styles", @mousedown="mousedown")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { INote } from "./types";

@Component
export default class Pianoroll extends Vue {

    @Prop()
    note!: INote;

    @Prop()
    tickWidth!: number;

    get styles() {
        return {
            left: `${this.note.start * this.tickWidth}px`,
            width: `${(this.note.end - this.note.start) * this.tickWidth}px`
        };
    }

    mousedown(ev: MouseEvent) {
        this.note.selected = true;
    }

}
</script>

<style lang="scss">
.note {
    position: absolute;
    height: calc(100% - 2px);
    top: 1px;
    background-color: #888;
    border-radius: 3px;

    &.--selected {
        border: 2px solid #1eb980;
    }
}
</style>
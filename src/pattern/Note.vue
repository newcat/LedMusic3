<template lang="pug">
.note(:class="{ '--selected': note.selected }", :style="styles", @mousedown.self="dragStart")
    .__resizeHandle(@mousedown.self="resizeStart")
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
            transform: `translateX(${this.note.start * this.tickWidth}px)`,
            width: `${(this.note.end - this.note.start) * this.tickWidth}px`,
        };
    }

    dragStart(ev: MouseEvent) {
        this.$emit("drag-start", this.note, ev.offsetX);
    }

    resizeStart(ev: MouseEvent) {
        this.$emit("resize-start", this.note, ev.offsetX);
    }
}
</script>

<style lang="scss">
.note {
    position: absolute;
    height: calc(100% - 2px);
    top: 1px;
    background-color: #1eb980;
    border: 1px solid lighten(#1eb980, 20%);
    border-radius: 3px;
    transition: border 0.1s;

    &:hover {
        border-color: #fff;
    }

    &.--selected {
        border: 2px solid #fff;
    }

    .__resizeHandle {
        position: absolute;
        right: 0;
        width: 8px;
        height: 100%;
        cursor: col-resize;
    }
}
</style>

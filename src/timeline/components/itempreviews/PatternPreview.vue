<template lang="pug">
svg.pattern-preview(:viewBox="viewBox", preserveAspectRatio="none")
    template(v-for="n, i in notes")
        line(
            stroke="white",
            :x1="n.start",
            :x2="n.end"
            :y1="n.value"
            :y2="n.value")
</template>

<script lang="ts">
import type { PatternLibraryItem } from "@/pattern";

import { Component, Vue, Prop } from "vue-property-decorator";
import { Item } from "../../model";

@Component
export default class PatternPreview extends Vue {
    @Prop({ type: Object, required: true })
    item!: Item;

    @Prop({ type: Number, required: true })
    unitWidth!: number;

    resizeObserver: ResizeObserver | null = null;

    get libraryItem() {
        return this.item.libraryItem as PatternLibraryItem;
    }

    get notes() {
        return this.libraryItem.notes;
    }

    get viewBox() {
        const minNoteValue = this.notes.reduce((p, c) => Math.min(p, c.value), 128);
        const maxNoteValue = this.notes.reduce((p, c) => Math.max(p, c.value), 0);
        const height = Math.max(maxNoteValue - minNoteValue + 4, 1);
        const width = this.item.end - this.item.start;
        return `0 ${minNoteValue - 2} ${width} ${height}`;
    }
}
</script>

<style lang="scss" scoped>
.pattern-preview {
    width: 100%;
    height: 100%;
}
</style>

<template lang="pug">
.timeline-item(:class="{ '--selected': note.selected }", :style="styles", @mousedown.self="dragStart")
    .__resizeHandle
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Item } from "../model/item";

@Component
export default class Pianoroll extends Vue {
    @Prop()
    item!: Item;

    @Prop()
    unitWidth!: number;

    get styles() {
        return {
            transform: `translateX(${this.item.start * this.unitWidth}px)`,
            width: `${(this.item.end - this.item.start) * this.unitWidth}px`,
        };
    }

    dragStart(ev: MouseEvent) {
        this.$emit("drag-start", this.item, ev.offsetX);
    }
}
</script>

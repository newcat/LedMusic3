<template lang="pug">
.timeline-item(:class="{ '--selected': item.selected }", :style="styles", @mousedown.self="dragStart")
    .timeline-item__header(:title="name")
        .timeline-item__header-text {{ name }}
    .__resizeHandle
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Item } from "../model/item";

@Component
export default class TimelineItem extends Vue {
    @Prop()
    item!: Item;

    @Prop()
    unitWidth!: number;

    get name() {
        return this.item.data?.libraryItem?.name ?? "";
    }

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

<template lang="pug">
.timeline-item(:class="{ '--selected': item.selected }", :style="styles", @mousedown.self="dragStart")
    .timeline-item__header(:title="name")
        .timeline-item__header-text {{ name }}
    .__resizeHandle
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Item } from "../model/item";
import { ItemArea } from "../types";

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

    @Watch("item.selected")
    cs() {
        console.log(this.item.selected);
    }

    dragStart() {
        this.$emit("drag-start", this.item, "center" as ItemArea);
    }
}
</script>

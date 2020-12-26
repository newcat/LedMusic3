<template lang="pug">
.timeline-item(:class="{ '--selected': item.selected }", :style="styles", @mousedown.self="dragStart('center')")
    .timeline-item__header(:title="name", @mousedown="dragStart('center')")
        .timeline-item__header-text {{ name }}
    .__drag-handle.--left(v-show="item.resizable && item.selected", @mousedown="dragStart('leftHandle')")
    .__drag-handle.--right(v-show="item.resizable && item.selected", @mousedown="dragStart('rightHandle')")
    .preview-container(v-if="previewComponent", @mousedown="dragStart('center')")
        component(:is="previewComponent", :item="item", :unitWidth="unitWidth")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Item } from "../model/item";
import { ItemArea } from "../types";
import { LibraryItemType } from "@/library";

import { VueConstructor } from "vue";
import AudioPreview from "@/audio/AudioPreview.vue";
import AutomationPreview from "@/automation/AutomationPreview.vue";
import PatternPreview from "@/pattern/PatternPreview.vue";

const ITEM_COMPONENT_MAPPING: Record<LibraryItemType, VueConstructor | null> = {
    [LibraryItemType.AUDIO]: AudioPreview,
    [LibraryItemType.GRAPH]: null,
    [LibraryItemType.AUTOMATION]: AutomationPreview,
    [LibraryItemType.PATTERN]: PatternPreview,
    [LibraryItemType.OUTPUT]: null,
};

@Component
export default class TimelineItem extends Vue {
    @Prop()
    item!: Item;

    @Prop()
    unitWidth!: number;

    get name() {
        return this.item.libraryItem.name ?? "";
    }

    get styles() {
        return {
            transform: `translateX(${this.item.start * this.unitWidth}px)`,
            width: `${(this.item.end - this.item.start) * this.unitWidth}px`,
        };
    }

    get previewComponent() {
        return ITEM_COMPONENT_MAPPING[this.item.libraryItem.type];
    }

    dragStart(area: ItemArea) {
        this.$emit("drag-start", this.item, area);
    }
}
</script>

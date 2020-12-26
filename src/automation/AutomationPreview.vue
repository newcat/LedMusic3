<template lang="pug">
svg.automation-clip
    template(v-for="p, i in points")
        template(v-if="i > 0")
            template(v-if="p.type === 'linear'")
                line(
                    :key="p.id"
                    :x1="getXCoordinate(points[i - 1].unit)",
                    :x2="getXCoordinate(p.unit)",
                    :y1="getYCoordinate(points[i - 1].value)",
                    :y2="getYCoordinate(p.value)")
            template(v-else-if="p.type === 'step'")
                line(
                    :key="p.id + '-1'"
                    :x1="getXCoordinate(points[i - 1].unit)",
                    :x2="getXCoordinate(p.unit)",
                    :y1="getYCoordinate(points[i - 1].value)",
                    :y2="getYCoordinate(points[i - 1].value)")
                line(
                    :key="p.id + '-2'"
                    :x1="getXCoordinate(p.unit)",
                    :x2="getXCoordinate(p.unit)",
                    :y1="getYCoordinate(points[i - 1].value)",
                    :y2="getYCoordinate(p.value)")
</template>

<script lang="ts">
import type { AutomationLibraryItem } from "./automation.libraryItem";

import { Component, Vue, Prop } from "vue-property-decorator";
import { Item } from "@/timeline";

@Component
export default class Automation extends Vue {
    @Prop({ type: Object, required: true })
    item!: Item;

    @Prop({ type: Number, required: true })
    unitWidth!: number;

    height = 50;
    resizeObserver: ResizeObserver | null = null;

    get libraryItem() {
        return this.item.libraryItem as AutomationLibraryItem;
    }

    get points() {
        return this.libraryItem.points;
    }

    mounted() {
        this.resizeObserver = new ResizeObserver(() => {
            this.height = this.$el.clientHeight;
        });
        this.resizeObserver.observe(this.$el);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    getXCoordinate(unit: number) {
        return unit * this.unitWidth;
    }

    getYCoordinate(value: number) {
        return (1 - value) * this.height;
    }
}
</script>

<style lang="scss" scoped>
.automation-clip {
    width: 100%;
    height: 100%;
    & line {
        stroke: white;
        fill: white;
    }
}
</style>

<template lang="pug">
div.automation-editor
    svg(
        ref="svg",
        :style="{ width: `${width}px` }"
        @mouseup="mouseup",
        @mousemove="mousemove",
        @mouseleave="mouseup"
        @dblclick="dblclick"
        @wheel="wheel")

        // --- grid lines ---

        // border
        line.border(:x1="getXCoordinate(0)", :x2="horizontalLineWidth", :y1="getYCoordinate(0)", :y2="getYCoordinate(0)")
        line.border(:x1="getXCoordinate(0)", :x2="getXCoordinate(0)", :y1="getYCoordinate(0)", :y2="getYCoordinate(1)")

        // horizontal
        line.h-grid-line(v-for="i in 5", :key="i", :x1="getXCoordinate(0)", :x2="horizontalLineWidth", :y1="getYCoordinate(i / 5)", :y2="getYCoordinate(i / 5)")

        // --- lines ---
        template(v-for="p, i in points")
            template(v-if="i > 0")
                template(v-if="p.type === 'linear'")
                    line(
                        :key="p.id + '-line'"
                        :x1="getXCoordinate(points[i - 1].unit)",
                        :x2="getXCoordinate(p.unit)",
                        :y1="getYCoordinate(points[i - 1].value)",
                        :y2="getYCoordinate(p.value)")
                template(v-else-if="p.type === 'step'")
                    line(
                        :key="p.id + '-line-1'"
                        :x1="getXCoordinate(points[i - 1].unit)",
                        :x2="getXCoordinate(p.unit)",
                        :y1="getYCoordinate(points[i - 1].value)",
                        :y2="getYCoordinate(points[i - 1].value)")
                    line(
                        :key="p.id + '-line-2'"
                        :x1="getXCoordinate(p.unit)",
                        :x2="getXCoordinate(p.unit)",
                        :y1="getYCoordinate(points[i - 1].value)",
                        :y2="getYCoordinate(p.value)")

        // --- points ---
        circle(
            v-for="p, i in points"
            @mousedown="mousedown(p.id)"
            :key="p.id + '-point'"
            :class="{ '--dragged': draggedPoint === p }"
            :cx="getXCoordinate(p.unit)",
            :cy="getYCoordinate(p.value)",
            r="5")
</template>

<script lang="ts">
import { TICKS_PER_BEAT } from "@/constants";
import { clamp, normalizeMouseWheel } from "@/utils";
import { AutomationLibraryItem, IAutomationPoint } from "./automation.libraryItem";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component
export default class AutomationEditor extends Vue {
    @Prop()
    automationClip!: AutomationLibraryItem;

    padding = 20;
    height = 200;
    unitWidth = 1;
    lastPointUnit = 0;

    resizeObserver: ResizeObserver | null = null;
    scrollTicker: ReturnType<typeof setTimeout> | null = null;
    scrollAmount = 0;

    draggedPoint: IAutomationPoint | null = null;

    get points() {
        return this.automationClip.points;
    }

    get width() {
        return this.getXCoordinate(this.lastPointUnit + 4 * TICKS_PER_BEAT);
    }

    get horizontalLineWidth() {
        let elWidth = 0;
        if (this.$el) {
            elWidth = this.$el.clientWidth;
        }
        return Math.max(this.width, elWidth) - this.padding;
    }

    @Watch("draggedPoint.unit")
    updateLastPointUnit() {
        const newLastPointUnit = this.points[this.points.length - 1].unit;
        if (this.draggedPoint && newLastPointUnit < this.lastPointUnit) {
            // do nothing because shrinking the content while dragging results in strange behaviour
            return;
        }
        this.lastPointUnit = newLastPointUnit;
    }

    mounted() {
        this.resizeObserver = new ResizeObserver(() => {
            this.height = (this.$refs.svg as Element).clientHeight;
        });
        this.resizeObserver.observe(this.$refs.svg as Element);
        this.scrollTicker = setInterval(() => this.scrollTick(), 100);
        this.updateLastPointUnit();
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
        if (this.scrollTicker) {
            clearInterval(this.scrollTicker);
            this.scrollTicker = null;
        }
    }

    getXCoordinate(unit: number) {
        return unit * this.unitWidth + this.padding;
    }

    getUnit(xCoordinate: number) {
        return Math.max(Math.round((xCoordinate - this.padding) / this.unitWidth), 0);
    }

    getYCoordinate(value: number) {
        return (1 - value) * (this.height - 2 * this.padding) + this.padding;
    }

    getValue(yCoordinate: number) {
        return clamp((-yCoordinate + this.padding) / (this.height - 2 * this.padding) + 1, 0, 1);
    }

    mousedown(id: string) {
        this.draggedPoint = this.points.find((p) => p.id === id) ?? null;
    }

    mouseup() {
        this.draggedPoint = null;
    }

    mousemove(ev: MouseEvent) {
        if (this.draggedPoint) {
            if (this.draggedPoint !== this.points[0]) {
                this.draggedPoint.unit = this.getUnit(ev.offsetX);
            }
            this.draggedPoint.value = this.getValue(ev.offsetY);
            this.automationClip.sortPoints();
        }
        this.updateScrollAmount(ev);
    }

    updateScrollAmount(ev: MouseEvent) {
        const offset = ev.offsetX - this.$el.scrollLeft;
        if (offset > this.$el.clientWidth - 15) {
            this.scrollAmount = 30;
        } else if (offset > this.$el.clientWidth - 25) {
            this.scrollAmount = 10;
        } else if (offset < 15) {
            this.scrollAmount = -30;
        } else if (offset < 25) {
            this.scrollAmount = -10;
        } else {
            this.scrollAmount = 0;
        }
    }

    scrollTick() {
        if (this.draggedPoint && this.scrollAmount) {
            this.$el.scrollBy(this.scrollAmount, 0);
        }
    }

    dblclick(ev: MouseEvent) {
        this.automationClip.addPoint(this.getUnit(ev.offsetX), this.getValue(ev.offsetY));
    }

    wheel(ev: WheelEvent) {
        const amount = normalizeMouseWheel(ev);
        const unit = this.getUnit(ev.offsetX); // the unit which is currently hovered
        this.unitWidth *= 1 - amount / 1500;
        // scroll so that the unit stays at the same place visually
        this.$el.scrollBy(this.getXCoordinate(unit) - ev.offsetX, 0);
    }
}
</script>

<style lang="scss" scoped>
.automation-editor {
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

svg {
    min-width: 100%;
    height: 100%;

    & line {
        stroke: white;
    }

    & circle {
        stroke: darkgray;
        fill: darkgray;
        z-index: 4;
        transition: fill 0.2s linear, stroke 0.2s linear;
    }
    & circle:hover,
    & circle.--dragged {
        stroke: white;
        fill: white;
    }
}

.border {
    stroke: #fffc;
}

.h-grid-line {
    stroke: #fff5;
}
</style>

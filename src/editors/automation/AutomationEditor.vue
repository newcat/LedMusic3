<template lang="pug">
div.automation-editor
    svg(@mouseup="mouseup", @mousemove="mousemove", @dblclick="dblclick")
        template(v-for="p, i in points")
            circle(
                @mousedown="mousedown(p.id)"
                :key="p.id + '-point'"
                :cx="getXCoordinate(p.unit)",
                :cy="getYCoordinate(p.value)",
                r="5")
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
</template>

<script lang="ts">
import { AutomationClip, IAutomationPoint } from "@/entities/library";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class AutomationEditor extends Vue {
    @Prop()
    automationClip!: AutomationClip;

    height = 200;
    unitWidth = 1;

    resizeObserver: ResizeObserver | null = null;

    draggedPoint: IAutomationPoint | null = null;

    get points() {
        return this.automationClip.points;
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

    getUnit(xCoordinate: number) {
        return Math.floor(xCoordinate / this.unitWidth);
    }

    getYCoordinate(value: number) {
        return (1 - value) * this.height;
    }

    getValue(yCoordinate: number) {
        return -yCoordinate / this.height + 1;
    }

    mousedown(id: string) {
        this.draggedPoint = this.points.find((p) => p.id === id) ?? null;
    }

    mouseup() {
        this.draggedPoint = null;
    }

    mousemove(ev: MouseEvent) {
        if (this.draggedPoint) {
            this.draggedPoint.unit = this.getUnit(ev.offsetX);
            this.draggedPoint.value = this.getValue(ev.offsetY);
            this.automationClip.sortPoints();
        }
    }

    dblclick(ev: MouseEvent) {
        this.automationClip.addPoint(this.getUnit(ev.offsetX), this.getValue(ev.offsetY));
    }
}
</script>

<style lang="scss" scoped>
.automation-editor {
    margin: 10px;
    width: 100%;
    height: 100%;
}

svg {
    width: 100%;
    height: 100%;
    & line,
    & circle {
        stroke: white;
        fill: white;
    }
}
</style>

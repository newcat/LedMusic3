<template lang="pug">
svg.automation-editor
    template(v-for="p, i in points")
        circle(
            :key="p.id + '-point'"
            :cx="getXCoordinate(p.unit)",
            :cy="getYCoordinate(p.value)",
            r="3")
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
import { AutomationClip } from "@/entities/library";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class AutomationEditor extends Vue {
    @Prop()
    automationClip!: AutomationClip;

    height = 200;
    unitWidth = 1;

    resizeObserver: ResizeObserver | null = null;

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

    getYCoordinate(value: number) {
        return (1 - value) * this.height;
    }
}
</script>

<style lang="scss" scoped>
.automation-editor {
    width: 100%;
    height: 100%;
    & line,
    & circle {
        stroke: white;
        fill: white;
    }
}
</style>

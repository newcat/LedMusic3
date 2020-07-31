<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title Piano Roll
    .pianoroll(@mousedown="mousedown")
        .__content(:style="contentStyles")
            .__row(v-for="i in 128", :key="i")
                .__header
                    div {{ i }}
                .__row_content
                    .__item(v-for="item in getItemsForTrack(i)", :style="{ left: `${item.start * tickWidth}px`, width: `${(item.end - item.start) * tickWidth}px` }")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

interface IItem {
    value: number;
    start: number;
    end: number;
}

@Component
export default class Pianoroll extends Vue {

    tickWidth = 1;
    headerWidth = 50;
    snap = 96;

    items: IItem[] = [
        { value: 5, start: 0, end: 384 },
        { value: 3, start: 0, end: 47 },
        { value: 3, start: 96, end: 96 + 47 },
        { value: 3, start: 2 * 96, end: 2 * 96 + 47 },
        { value: 3, start: 7 * 96, end: 12 * 96 + 47 },
    ];

    get contentStyles() {
        const lastItemEnd = this.items.reduce((p, i) => Math.max(p, i.end), 0);
        return {
            width: `${(lastItemEnd + this.snap) * this.tickWidth + this.headerWidth }px`,
            backgroundSize: `${this.snap * this.tickWidth}px ${this.snap * this.tickWidth}px`
        };
    }

    getItemsForTrack(track: number) {
        return this.items.filter((i) => i.value === track);
    }

    mousedown(ev: MouseEvent) {
        if (ev.button === 0) {
            this.tickWidth += 0.1;
        } else {
            this.tickWidth -= 0.1;
        }
    }

}
</script>

<style lang="scss">
.pianoroll {
    overflow-y: scroll;
    width: 100%;

    $rowHeight: 30px;
    $headerWidth: 50px;

    .__content {
        position: relative;
        background-image: linear-gradient(90deg, #504f5c 1px, transparent 1px);
        background-position: ($headerWidth - 1px) -1px;
        background-repeat: repeat;
    }

    .__row {
        height: $rowHeight;
        border-bottom: 1px solid #504f5c;
        display: flex;
        z-index: 20;

        .__header {
            position: sticky;
            left: 0;
            min-width: $headerWidth;
            max-width: $headerWidth;
            height: 100%;
            background-color: #33333d;
            color: #bbb;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }

        .__row_content {
            position: relative;
            width: 1000px;
            height: 100%;

            .__item {
                position: absolute;
                height: calc(100% - 2px);
                top: 1px;
                background-color: #888;
                border-radius: 3px;
            }

        }

    }

    .__marker {
        position: absolute;
        top: 0;
        width: 1px;
        height: 100%;
        background-color: #504f5c;
    }

}
</style>
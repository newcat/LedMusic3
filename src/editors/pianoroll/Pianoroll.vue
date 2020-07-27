<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title Piano Roll
    .pianoroll
        .__row(v-for="i in 128", :key="i")
            .__header
                div {{ i }}
            .__content
                .__item(v-for="item in getItemsForTrack(i)", :style="{ left: `${item.start}px`, width: `${item.end - item.start}px` }")
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

    items: IItem[] = [
        { value: 5, start: 0, end: 384 },
        { value: 3, start: 0, end: 47 },
        { value: 3, start: 96, end: 96 + 47 },
        { value: 3, start: 2 * 96, end: 2 * 96 + 47 },
    ];

    getItemsForTrack(track: number) {
        return this.items.filter((i) => i.value === track);
    }

}
</script>

<style lang="scss">
.pianoroll {
    overflow-y: scroll;
    width: 100%;

    $rowHeight: 30px;
    $headerWidth: 50px;

    .__row {
        height: $rowHeight;
        border-bottom: 1px solid #504f5c;
        display: flex;

        .__header {
            position: sticky;
            left: 0;
            width: $headerWidth;
            height: 100%;
            background-color: #33333d;
            color: #bbb;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .__content {
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

}
</style>
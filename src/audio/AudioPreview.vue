<template lang="pug">
.audio-file
    template(v-if="libraryItem.waveform")
        img.waveform-part(
            v-for="p in libraryItem.waveform.parts"
            :key="`${p.start}-${p.end}`"
            :style="getImageStyles(p)"
            :src="p.url")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { AudioLibraryItem, IWaveformPart } from "./audio.libraryItem";
import WaveformWorker from "./workerInstance";
import { Item } from "@/timeline";

@Component
export default class Audio extends Vue {
    @Prop({ type: Object, required: true })
    item!: Item;

    @Prop({ type: Number, required: true })
    unitWidth!: number;

    get libraryItem() {
        return this.item.libraryItem as AudioLibraryItem;
    }

    getImageStyles(part: IWaveformPart) {
        return {
            left: `${100 * (part.start / this.libraryItem.waveform!.count)}%`,
            width: `${100 * ((part.end - part.start) / this.libraryItem.waveform!.count)}%`,
        };
    }
}
</script>

<style scoped>
.audio-file {
    width: 100%;
    height: 100%;
    position: relative;
}

.waveform-part {
    position: absolute;
    top: 0;
    height: 100%;
    image-rendering: pixelated;
}
</style>

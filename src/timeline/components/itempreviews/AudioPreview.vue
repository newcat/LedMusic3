<template lang="pug">
.audio-file
    canvas(ref="canvas")
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import * as Comlink from "comlink";
import { v4 as uuidv4 } from "uuid";
import { AudioLibraryItem } from "@/audio";
import WaveformWorker from "@/audio/workerInstance";
import { Item } from "../../model";

@Component
export default class Audio extends Vue {
    @Prop({ type: Object, required: true })
    item!: Item;

    @Prop({ type: Number, required: true })
    unitWidth!: number;

    isDrawing = false;
    drawAfterFinish = false;
    resizeObserver: ResizeObserver | null = null;

    get libraryItem() {
        return this.item.libraryItem as AudioLibraryItem;
    }

    async mounted() {
        this.resizeObserver = new ResizeObserver(() => {
            const canvasEl = this.$refs.canvas as HTMLCanvasElement;
            canvasEl.width = this.$el.clientWidth;
            canvasEl.height = this.$el.clientHeight;
            this.drawWaveform();
        });
        this.resizeObserver.observe(this.$el);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    @Watch("libraryItem.loading")
    @Watch("unitWidth")
    async drawWaveform() {
        if (this.isDrawing) {
            this.drawAfterFinish = true;
            return;
        }
        if (this.libraryItem.loading) {
            return;
        }
        this.isDrawing = true;
        const canvasEl = this.$refs.canvas as HTMLCanvasElement;
        const bmp = await WaveformWorker.drawWaveform(
            this.libraryItem.id,
            canvasEl.width,
            canvasEl.height,
            this.item.start,
            this.item.end,
            this.unitWidth
        );
        console.log(bmp.width, bmp.height);
        const ctx = canvasEl.getContext("2d")!;
        ctx.drawImage(bmp, 0, 0);
        // This does not work for some reason although I expect it to be more performant
        // const ctx = canvasEl.getContext("bitmaprenderer")!;
        // ctx.transferFromImageBitmap(bmp);
        this.isDrawing = false;
        if (this.drawAfterFinish) {
            this.drawAfterFinish = false;
            this.drawWaveform();
        }
    }
}
</script>

<style scoped>
.audio-file {
    width: 100%;
    height: 100%;
}
</style>
